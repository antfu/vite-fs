import { resolve, dirname } from 'path'
import { promises as fs } from 'fs'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import _debug from 'debug'
import LRU from 'lru-cache'
import bodyParser from 'body-parser'
import { PREFIX, SUFFIX } from './constants'
import { generateBuild, generateDev } from './gen'

const debug = _debug('vite-fs:resolve')

export function ViteFS(): Plugin {
  let config: ResolvedConfig
  let server: ViteDevServer | undefined

  const watched: string[] = []
  const fileCache = new LRU<string, string>(50)
  const skipped = new Set<string>()

  const readFile = async(path: string) => {
    if (fileCache.has(path))
      return fileCache.get(path)

    const content = await fs.readFile(path, 'utf-8')
    fileCache.set(path, content)
    return content
  }

  return {
    name: 'vite-fs',
    enforce: 'pre',
    configResolved(_config) {
      config = _config
    },
    configureServer(_server) {
      server = _server

      server.middlewares.use(bodyParser.json())
      server.middlewares.use(
        '/@vite-fs/upload',
        (req, res, next) => {
          if (req.method !== 'POST')
            return next()
          // @ts-expect-error
          const { path, content } = req.body
          debug('upload:', path)
          skipped.add(path)
          const isJSON = path.endsWith('.json')
          fs.writeFile(path, isJSON ? JSON.stringify(content, null, 2) : content, 'utf-8')
          res.statusCode = 200
          res.end()
        },
      )
    },
    resolveId(id, importer) {
      if (id.startsWith(PREFIX) || !id.endsWith(SUFFIX) || !importer)
        return null
      return PREFIX + resolve(dirname(importer), id)
    },
    async load(id) {
      if (!id.startsWith(PREFIX) || !id.endsWith(SUFFIX))
        return null

      const path = id.slice(PREFIX.length, -SUFFIX.length)
      const isJSON = path.endsWith('.json')
      debug(path)

      if (config.command === 'build') {
        return {
          code: generateBuild(await readFile(path), isJSON),
          map: '',
        }
      }

      if (server && !watched.includes(path)) {
        watched.push(path)
        server.watcher.add(path)
        server.watcher.on('change', async(_path) => {
          if (_path !== path)
            return
          if (skipped.has(path)) {
            skipped.delete(path)
            return
          }

          debug(`changed: ${path}`)
          fileCache.del(path)
          const content = await readFile(path)
          server!.ws.send({
            type: 'custom',
            event: 'vite-fs-update',
            data: {
              path,
              content: isJSON
                ? JSON.parse(content!)
                : content,
            },
          })
        })
      }

      return {
        code: generateDev(path, await readFile(path), isJSON),
        map: '',
      }
    },
  }
}

export default ViteFS
