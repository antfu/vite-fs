# Vite FS

{WIP} Reactive FileSystem for Vite accessable in the client side

[![NPM version](https://img.shields.io/npm/v/vite-fs?color=a1b858)](https://www.npmjs.com/package/vite-fs)

## Usage

Suffix `.ref` to path you'd like to import, for example

```ts
import data from '../data.json.ref'
// the type of `data` will be `Ref<any>`
// `data` will bind to `data.json` magically on dev

data.value.x = 10
// `data.json` will be updated
```

Changes of the file will reflect to the `ref` as well.

When importing `.json` files, it will do the parse/stringify automatically. When importing with other file formats, a plain `Ref<string>` with UTF-8 encoding will be returned.

## Install

```bash
npm i -D vite-fs
```

```js
// vite.config.js
import Vue from '@vitejs/plugin-vue'
import ViteFS from 'vite-fs'

export default {
  plugins: [
    Vue(),
    ViteFS()
  ]
}
```

```ts
// shim-fs.d.ts
import { ref } from 'vue'

declare module '*.json.ref' {
  const content: Ref<any>
  export default content
}

declare module '*.ref' {
  const content: Ref<string>
  export default content
}
```

## Sponsors

This project is part of my <a href='https://github.com/antfu-sponsors'>Sponsor Program</a>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
