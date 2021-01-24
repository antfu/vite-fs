import { defineComponent, Ref } from 'vue'

declare module '*.vue' {
  const Component: ReturnType<typeof defineComponent>
  export default Component
}

declare module '*.json.ref' {
  const content: Ref<any>
  export default content
}

declare module '*.ref' {
  const content: Ref<string>
  export default content
}
