<template>
  <div class="language-switcher">
    <v-menu offset-y :z-index="10000">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          class="language-btn"
          icon
          color="primary"
        >
          <v-icon size="20">mdi-earth</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(language, code) in languages"
          :key="code"
          @click="changeLanguage(code)"
          :class="{ 'active': currentLocale === code }"
        >
          <v-list-item-icon>
            <v-icon v-if="currentLocale === code" color="primary">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ language }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'LanguageSwitcher',
  emits: ['language-changed'],
  data() {
    return {}
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
    languages() {
      // Re-compute labels on locale change
      return {
        en: this.$t('language.english'),
        de: this.$t('language.german'),
        ru: this.$t('language.russian')
      }
    }
  },
  methods: {
    changeLanguage(locale) {
      this.$i18n.locale = locale
      // Сохраняем выбранный язык в localStorage
      localStorage.setItem('selectedLanguage', locale)
      // Эмитируем событие изменения языка
      this.$emit('language-changed', locale)
    },
    getCurrentLanguageName() {
      return this.languages[this.currentLocale] || this.languages.en
    }
  },
  mounted() {
    // Загружаем сохраненный язык при инициализации
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (savedLanguage && this.languages[savedLanguage]) {
      this.$i18n.locale = savedLanguage
    }
  }
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 9999;
}

.language-btn {
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.active {
  background-color: rgba(163, 2, 212, 0.1);
}

.v-list-item {
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 4px;
}

.v-list-item:hover {
  background-color: rgba(163, 2, 212, 0.05);
}

.v-list-item.active {
  background-color: rgba(163, 2, 212, 0.1);
  color: #a302d4;
}

/* Обеспечиваем отображение меню поверх всех элементов */
.language-switcher >>> .v-menu__content {
  z-index: 10000 !important;
}

.language-switcher >>> .v-overlay {
  z-index: 9999 !important;
}
</style>
