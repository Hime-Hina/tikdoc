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
  modules: [
    '@nuxtjs/eslint-module',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    'nuxt-quasar-ui',
  ],
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
