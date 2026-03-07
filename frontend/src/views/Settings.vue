<template>
  <div class="main-content">
    <div class="settings-block">
      <v-card flat>
        <v-card-title style="display: flex; align-items: center; gap: 16px;">
          <v-btn icon @click="goBack" class="back-btn" color="#a302d4">
            <v-icon size="24">mdi-arrow-left</v-icon>
          </v-btn>
          <span class="page-title">Настройки</span>
        </v-card-title>

        <v-card-text class="settings-content">
          <!-- Общие настройки -->
          <div class="settings-section">
            <h3 class="section-title">Общие настройки</h3>
            <v-list dense class="section-list">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-subtitle class="label">Язык интерфейса</v-list-item-subtitle>
                  <v-radio-group v-model="language" row dense hide-details class="mt-1" @change="saveLanguage">
                    <v-radio label="English" value="en" />
                    <v-radio label="Deutsch" value="de" />
                    <v-radio label="Русский" value="ru" />
                  </v-radio-group>
                </v-list-item-content>
              </v-list-item>
              <v-divider />
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-subtitle class="label">Тема</v-list-item-subtitle>
                  <v-radio-group v-model="darkTheme" row dense hide-details class="mt-1" @change="saveTheme">
                    <v-radio label="Светлая" :value="false" />
                    <v-radio label="Тёмная" :value="true" />
                  </v-radio-group>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>

          <!-- Аккаунт -->
          <div class="settings-section">
            <h3 class="section-title">Аккаунт</h3>
            <v-simple-table dense class="info-table">
              <tbody>
                <tr>
                  <td class="grey--text label-cell">Email</td>
                  <td>{{ authUser && authUser.email }}</td>
                </tr>
                <tr>
                  <td class="grey--text label-cell">Имя</td>
                  <td>{{ authUser && authUser.displayName }}</td>
                </tr>
                <tr>
                  <td class="grey--text label-cell">Тип</td>
                  <td>{{ accountTypeLabel }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser, setAuthUser } from '@/services/api'

export default {
  name: 'Settings',
  data() {
    return {
      language: (typeof localStorage !== 'undefined' && localStorage.getItem('selectedLanguage')) || 'ru',
      darkTheme: (typeof localStorage !== 'undefined' && localStorage.getItem('settingsDarkTheme') === 'true') || false,
      currentUser: null
    }
  },
  computed: {
    authUser() {
      return this.currentUser || getAuthUser()
    },
    accountTypeLabel() {
      if (!this.authUser) return ''
      return this.authUser.accountType === 'business' ? 'Бизнес' : 'Физическое лицо'
    }
  },
  async mounted() {
    const savedLang = localStorage.getItem('selectedLanguage')
    if (savedLang) this.language = savedLang
    const savedDark = localStorage.getItem('settingsDarkTheme')
    if (savedDark !== null) this.darkTheme = savedDark === 'true'
    if (this.$vuetify) this.$vuetify.theme.dark = this.darkTheme
    try {
      const { data } = await api.get('/me')
      if (data && data.user) {
        this.currentUser = data.user
        setAuthUser(data.user)
      }
    } catch (_) {}
  },
  methods: {
    saveLanguage() {
      this.$i18n.locale = this.language
      localStorage.setItem('selectedLanguage', this.language)
      window.dispatchEvent(new CustomEvent('language-changed', { detail: { locale: this.language } }))
    },
    saveTheme() {
      if (this.$vuetify) this.$vuetify.theme.dark = this.darkTheme
      localStorage.setItem('settingsDarkTheme', this.darkTheme ? 'true' : 'false')
    },
    goBack() {
      this.$router.push('/home')
    }
  }
}
</script>

<style scoped>
.main-content {
  min-height: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  background: #faf9fb;
}
.settings-block {
  margin-top: 40px;
  margin-left: 40px;
  margin-right: 40px;
  width: 1660px;
  max-width: calc(100% - 80px);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.settings-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}
.settings-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}
.back-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}
.back-btn:hover {
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}
.page-title {
  font-size: 34px;
  color: #000;
  font-weight: bold;
}
.settings-content {
  padding-top: 8px !important;
}
.settings-section {
  margin-bottom: 32px;
}
.settings-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}
.label {
  font-weight: 500;
  color: #475569;
}
.section-list {
  background: transparent !important;
}
.info-table {
  max-width: 480px;
}
.info-table .label-cell {
  width: 140px;
}
@media (max-width: 1200px) {
  .settings-block {
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
    max-width: none;
  }
}
</style>
