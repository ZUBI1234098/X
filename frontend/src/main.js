import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'
import '@/assets/nexcrm.css'
import VueI18n from 'vue-i18n'
import App from './App.vue'
import router from './router'

// Import locale files
import en from './locales/en.json'
import de from './locales/de.json'
import ru from './locales/ru.json'

Vue.use(Vuetify)
Vue.use(VueI18n)

// Configure i18n
const i18n = new VueI18n({
  locale: 'en', // default locale
  fallbackLocale: 'en', // fallback locale
  messages: {
    en,
    de,
    ru
  }
})

// Initialize locale from localStorage if present
try {
  const savedLang = localStorage.getItem('selectedLanguage')
  if (savedLang && ['en', 'de', 'ru'].includes(savedLang)) {
    i18n.locale = savedLang
  }
} catch (e) {
  // ignore storage errors
}

const darkTheme = typeof localStorage !== 'undefined' && localStorage.getItem('settingsDarkTheme') === 'true'
const vuetify = new Vuetify({
  theme: { dark: darkTheme },
  icons: {
    iconfont: 'mdi'
  }
})

new Vue({
  router,
  vuetify,
  i18n,
  render: h => h(App)
}).$mount('#app')