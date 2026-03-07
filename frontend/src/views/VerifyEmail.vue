<template>
  <div class="verify-page">
    <v-card class="verify-card" max-width="440" elevation="8">
      <v-card-title class="headline">{{ $t('auth.verifyTitle') || 'Подтверждение email' }}</v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="mt-3">Проверка кода...</p>
        </div>
        <v-alert v-else-if="error" type="error" class="mt-2">{{ error }}</v-alert>
        <div v-else-if="success" class="text-center py-4">
          <v-icon color="success" size="64">mdi-check-circle</v-icon>
          <h2 class="mt-3 success-title">Ваш аккаунт активирован!</h2>
          <p class="mt-2 grey--text">Перенаправление на главную страницу...</p>
        </div>
        <div v-else class="verify-form">
          <p class="mb-3 grey--text text--darken-1">
            Введите email и код из письма, который мы отправили после регистрации.
          </p>
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            hide-details
            class="mb-2"
            prepend-inner-icon="mdi-email"
          />
          <v-text-field
            v-model="code"
            label="Код из письма"
            placeholder="123456"
            outlined
            dense
            hide-details
            class="mb-3"
            maxlength="6"
            counter="6"
            prepend-inner-icon="mdi-numeric"
            @keyup.enter="submit"
          />
          <v-btn block color="primary" :loading="loading" :disabled="!email.trim() || !code.trim()" @click="submit">
            Войти в аккаунт
          </v-btn>
        </div>
        <p class="text-center mt-4">
          <router-link to="/login">Вход</router-link>
          &nbsp;|&nbsp;
          <router-link to="/register">Регистрация</router-link>
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import api, { setAuthToken, setAuthUser, clearPreviousUserData } from '@/services/api'

export default {
  name: 'VerifyEmail',
  data() {
    return {
      email: '',
      code: '',
      loading: false,
      error: '',
      success: false
    }
  },
  mounted() {
    const email = this.$route.query.email
    if (email) this.email = typeof email === 'string' ? email : (email[0] || '')
  },
  methods: {
    async submit() {
      const email = this.email.trim().toLowerCase()
      const code = this.code.trim().replace(/\s/g, '')
      if (!email || !code) return
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/verify-email', { email, code })
        setAuthToken(data.token)
        setAuthUser(data.user)
        clearPreviousUserData()
        this.success = true
        setTimeout(() => this.$router.replace('/home'), 2000)
      } catch (err) {
        this.error = (err.response && err.response.data && err.response.data.error) || 'Неверный код или истёк срок. Введите код из письма или зарегистрируйтесь снова.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.verify-card {
  padding: 8px;
}
.success-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2e7d32;
}
</style>
