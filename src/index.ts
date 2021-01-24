import { resolve } from 'path'
import { promises as fs } from 'fs'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import _debug from 'debug'
import LRU from 'lru-cache'
import bodyParser from 'body-parser'
import { PACKAGE_NAME_PREFIX, SUFFIX } from './constants'
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
          fs.writeFile(path, content, 'utf-8')
          res.statusCode = 200
          res.end()
        },
      )
    },
    resolveId(id) {
      if (id.startsWith(PACKAGE_NAME_PREFIX)) {
        if (!id.endsWith(SUFFIX))
          return id + SUFFIX
        else
          return id
      }
    },
    async load(id) {
      if (!id.startsWith(PACKAGE_NAME_PREFIX) || !id.endsWith(SUFFIX))
        return null

      const path = resolve(config.root, id.slice(PACKAGE_NAME_PREFIX.length, -SUFFIX.length))

      if (config.command === 'build')
        return generateBuild(await readFile(path))

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
          server!.ws.send({
            type: 'custom',
            event: 'vite-fs-update',
            data: {
              path,
              content: await readFile(path),
            },
          })
        })
      }

      return generateDev(path, await readFile(path))
    },
  }
}

export default ViteFS
