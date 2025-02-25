// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    ssr: false,
    devtools: { enabled: true },
    typescript: {
        tsConfig: {
            compilerOptions: {
                moduleResolution: 'bundler',
            },
        },
    },
    pinia: {
        autoImports: ['defineStore'],
    },
    experimental: {
        emitRouteChunkError: 'automatic',
        sharedPrerenderData: true,
        typedPages: true,
    },
    runtimeConfig: {
        public: {
            appUrl: process.env.APP_URL ?? 'http://dashboard.lnfederation.test:3700',
            apiUrl: process.env.API_URL ?? 'https://apitest.lnfederation.com',
            description: 'LNF Events is a part of World Shipping Alliance is an independent worldwide network for all freight forwarders.',
            keywords:
                'World Shipping Alliance, freight forwarders network, global logistics, OTI/NVOCC operations, logistics community, logistics excellence, logistics network, dependable connections, global freight services, freight agents, logistics journey, event, wsa',
        },
    },
    build: {
        transpile: ['@vuepic/vue-datepicker'],
    },
    nitro: {
        routeRules: {
            '/backend/**': {
                proxy: `${process.env.API_URL ?? 'https://apitest.lnfederation.com'}/**`,
            },
            '/get-geoip/**': {
                proxy: `http://ip-api.com/json/**`,
            },
        },
        compressPublicAssets: true,
    },
    css: ['@/assets/css/main.scss'],
    modules: ['nuxt-lodash', '@pinia/nuxt', 'nuxt-icon', '@nuxtjs/eslint-module', '@nuxtjs/color-mode', '@nuxt/image', 'nuxt-swiper', 'nuxt-headlessui', '@morev/vue-transitions/nuxt', '@unlok-co/nuxt-stripe', 'nuxt-tiptap-editor'],
    image: {
        inject: true,
        quality: 65,
        format: ['webp'],
        screens: {
            xs: 320,
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
            xxl: 1536,
        },
    },
    imports: {
        dirs: ['./stores'],
    },
    app: {
        buildAssetsDir: '/lnf-dashboard/',
        rootId: '__wsadashboard',
        head: {
            title: 'LNF Dashboard',
            charset: 'utf-8',
            viewport: 'width=device-width, initial-scale=1',
            htmlAttrs: {
                lang: 'en',
                dir: 'ltr',
            },
        },
        pageTransition: { name: 'page', mode: 'out-in' },
    },
    headlessui: {
        prefix: 'Headless',
    },
    postcss: {
        plugins: {
            'postcss-import': {},
            'postcss-advanced-variables': {},
            'tailwindcss/nesting': {},
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    colorMode: {
        preference: 'light', // default value of $colorMode.preference
        fallback: 'light', // fallback value if not system preference found
        hid: 'lnf-dashboard-app-color-mode-script',
        globalName: '__LNF_DASHBOARD_COLOR_MODE__',
        componentName: 'ColorScheme',
        classPrefix: '',
        classSuffix: '',
        storageKey: 'lnf-dashboard-color-mode',
    },
    tiptap: {
        prefix: 'Tiptap',
    },
    compatibilityDate: '2024-08-07',
});
