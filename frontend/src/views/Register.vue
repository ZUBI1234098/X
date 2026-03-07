<template>
  <div class="register-page">
    <v-card class="register-card" max-width="480" elevation="8">
      <v-card-title class="headline">Регистрация</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-radio-group v-model="accountType" :rules="[rules.required]" row class="mt-0">
            <v-radio label="Физическое лицо" value="individual" />
            <v-radio label="Бизнес" value="business" />
          </v-radio-group>

          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            :rules="[rules.required, rules.email]"
            outlined
            dense
            prepend-inner-icon="mdi-email"
          />
          <v-text-field
            v-model="password"
            label="Пароль"
            :type="showPassword ? 'text' : 'password'"
            :rules="[rules.required, rules.minLength]"
            outlined
            dense
            prepend-inner-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPassword = !showPassword"
          />

          <template v-if="accountType === 'individual'">
            <v-text-field
              v-model="displayName"
              label="Имя (ФИО)"
              :rules="[rules.required]"
              outlined
              dense
              prepend-inner-icon="mdi-account"
              placeholder="Иван Иванов"
            />
          </template>
          <template v-else>
            <v-text-field
              v-model="displayName"
              label="Название компании"
              :rules="[rules.required]"
              outlined
              dense
              prepend-inner-icon="mdi-domain"
              placeholder="ООО Ромашка"
            />
            <v-text-field
              v-model="inn"
              label="ИНН (необязательно)"
              outlined
              dense
              prepend-inner-icon="mdi-numeric"
              placeholder="1234567890"
            />
          </template>

          <v-alert v-if="error" type="error" dense class="mt-2">{{ error }}</v-alert>
          <v-alert v-if="successMessage" type="success" dense class="mt-2">
            {{ successMessage }}
            <br />
            <router-link :to="verifyRoute">Ввести код и войти</router-link>
          </v-alert>
          <v-btn
            v-if="!successMessage"
            block
            color="primary"
            class="mt-4"
            :loading="loading"
            :disabled="!valid"
            @click="submit"
          >
            Зарегистрироваться
          </v-btn>
          <p class="text-center mt-4">
            Уже есть аккаунт?
            <router-link to="/login">Войти</router-link>
          </p>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'Register',
  data() {
    return {
      accountType: 'individual',
      email: '',
      password: '',
      displayName: '',
      companyName: '',
      inn: '',
      showPassword: false,
      valid: false,
      loading: false,
      error: '',
      successMessage: '',
      registeredEmail: '',
      rules: {
        required: (v) => !!v || 'Обязательное поле',
        email: (v) => !v || /.+@.+\..+/.test(v) || 'Некорректный email',
        minLength: (v) => !v || (v && v.length >= 6) || 'Минимум 6 символов'
      }
    }
  },
  computed: {
    verifyRoute() {
      return this.registeredEmail ? { path: '/verify-email', query: { email: this.registeredEmail } } : '/verify-email'
    }
  },
  watch: {
    accountType(v) {
      if (v === 'business') this.companyName = this.displayName
      else this.companyName = ''
    },
    displayName(v) {
      if (this.accountType === 'business') this.companyName = v
    }
  },
  methods: {
    async submit() {
      if (!this.$refs.form.validate()) return
      this.error = ''
      this.loading = true
      const displayName = (this.displayName && this.displayName.trim()) || this.email.trim().split('@')[0] || 'User'
      const payload = {
        email: this.email.trim(),
        password: this.password,
        accountType: this.accountType,
        displayName,
        companyName: this.accountType === 'business' ? (this.companyName || this.displayName || this.email).trim() || null : null,
        inn: this.accountType === 'business' ? (this.inn && this.inn.trim()) || null : null
      }
      try {
        const { data } = await api.post('/auth/register', payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        this.successMessage = data.message || 'На вашу почту отправлен код. Введите его на странице подтверждения.'
        this.registeredEmail = data.email || this.email.trim()
        this.error = ''
      } catch (err) {
        this.error = (err.response && err.response.data && err.response.data.error) || 'Ошибка регистрации'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.register-card {
  padding: 8px;
}
</style>
