import prexit from 'prexit'
import psql from './server/database/postgreSQL'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-tap-highlight', content: 'no' },
        {
          'http-equiv': 'Cache-Control',
          'content': 'no-cache, no-store, must-revalidate',
        },
        {
          'http-equiv': 'Pragma',
          'content': 'no-cache',
        },
        {
          'http-equiv': 'Expires',
          'content': '0',
        },
      ],
    },
  },
  build: {
  },
  eslint: {
  },
  hooks: {
    close: (_nuxt) => {
      console.log('Nuxt is closing!')
    },
    ready: (_nuxt) => {
      console.log('Nuxt is ready!')
      prexit(async () => {
        // 真的需要这么做吗？
        await psql.end({ timeout: 5 })
        await _nuxt.close()
        console.log('prexit: Nuxt is closing!')
      })
    },
  },
  modules: [
    'nuxt-lodash',
    '@nuxtjs/eslint-module',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    'nuxt-quasar-ui',
  ],
  lodash: {
    prefix: 'lodash',
    prefixSkip: ['is', 'string'],
    upperAfterPrefix: true,
    alias: [],
  },
  pinia: {
    autoImports: ['defineStore', ['defineStore', 'definePiniaStore']],
  },
  piniaPersistedstate: {
    // debug: process.env.NODE_ENV === 'development',
    cookieOptions: {
      sameSite: 'strict',
    },
  },
  quasar: {
    lang: 'zh-CN',
    plugins: [
      'AppFullscreen',
      'Cookies',
      'Dialog',
      'Loading',
      'LoadingBar',
      'LocalStorage',
      'Notify',
    ],
    iconSet: 'material-icons',
    extras: {
      fontIcons: ['material-icons'],
      svgIcons: ['material-icons'],
    },
    config: {
    },
  },
  vite: {
    clearScreen: false,
    // build: {
    //   sourcemap: true,
    //   minify: false,
    // },
  },
  typescript: {
    shim: false,
  },
  devtools: { enabled: true },
})
