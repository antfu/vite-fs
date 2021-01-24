export function generateDev(path: string, content = '', throttle = 1000) {
  return `
import { ref } from 'vue'
import { ignorableWatch, useThrottleFn } from '@vueuse/core'

const PATH = ${JSON.stringify(path)}
const content = ref(${JSON.stringify(content)})

let controller = null

async function send() {
  if (controller)
    controller.abort()
  controller = new AbortController()

  try {
    await fetch('/@vite-fs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: PATH,
        content: content.value,
      }),
      signal: controller.signal,
    })
  }
  catch (e) {}
}

const { ignoreUpdates } = ignorableWatch(content, useThrottleFn(send, ${throttle}))

if (import.meta.hot) {
  import.meta.hot.on('vite-fs-update', (data) => {
    if (data.path === PATH) {
      ignoreUpdates(() => {
        content.value = data.content
      })
    }
  })
}

export default content
`
}

export function generateBuild(content = '') {
  return `import { ref } from 'vue'
export default ref(${JSON.stringify(content)})`
}
