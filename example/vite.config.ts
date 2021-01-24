import { UserConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteFS from 'vite-fs'

const config: UserConfig = {
  plugins: [
    Vue(),
    ViteFS(),
  ],
}

export default config
