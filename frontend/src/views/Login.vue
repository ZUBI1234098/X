<template>
  <div class="login-page">
    <div class="login-bg-pattern"></div>
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-card-accent"></div>
        <div class="login-card-inner">
          <div class="login-header">
            <div class="login-logo">
              <v-icon size="40" color="white">mdi-shield-account</v-icon>
            </div>
            <h1 class="login-title">Вход</h1>
            <p class="login-subtitle">
              Сотрудники: войдите по email и паролю, которые выдал руководитель. Откроется общий аккаунт компании.
            </p>
          </div>

          <div class="login-info-block">
            <v-icon small color="#a302d4">mdi-information-outline</v-icon>
            <span>Данные для входа выдаются владельцем компании. После входа вы получите доступ к общим данным: клиенты, товары, заказы и отчёты.</span>
          </div>

          <v-form ref="form" v-model="valid" class="login-form">
            <div class="form-group">
              <label class="input-label">Email</label>
              <v-text-field
                v-model="email"
                type="email"
                placeholder="anushervoni027@gmail.com"
                :rules="[rules.required, rules.email]"
                outlined
                dense
                hide-details="auto"
                class="login-input"
                prepend-inner-icon="mdi-email-outline"
                background-color="#f8fafc"
              />
            </div>
            <div class="form-group">
              <label class="input-label">Пароль</label>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="•••••••••••••••••"
                :rules="[rules.required]"
                outlined
                dense
                hide-details="auto"
                class="login-input"
                prepend-inner-icon="mdi-lock-outline"
                :append-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append="showPassword = !showPassword"
                background-color="#f8fafc"
              />
            </div>

            <v-alert v-if="error" type="error" dense class="login-error" border="left">
              {{ error }}
            </v-alert>

            <v-btn
              block
              x-large
              rounded
              class="login-btn"
              :loading="loading"
              :disabled="!valid"
              @click="submit"
            >
              <v-icon left>mdi-login</v-icon>
              Войти
            </v-btn>
          </v-form>

          <div class="login-divider">
            <span>или</span>
          </div>

          <p class="login-register-text">
            Нет аккаунта?
            <router-link to="/register" class="register-link">Зарегистрироваться</router-link>
          </p>
          <p class="login-register-hint">
            Регистрация для руководителей: создайте компанию и пригласите сотрудников.
          </p>
        </div>
      </div>

      <div class="login-footer-info">
        <div class="footer-item">
          <v-icon small>mdi-shield-check</v-icon>
          <span>Безопасное соединение</span>
        </div>
        <div class="footer-item">
          <v-icon small>mdi-account-group</v-icon>
          <span>Общий аккаунт компании</span>
        </div>
        <div class="footer-item">
          <v-icon small>mdi-email-check</v-icon>
          <span>Доступ по выданным данным</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { setAuthToken, setAuthUser, clearPreviousUserData } from '@/services/api'

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      valid: false,
      loading: false,
      error: '',
      rules: {
        required: (v) => !!v || 'Обязательное поле',
        email: (v) => !v || /.+@.+\..+/.test(v) || 'Некорректный email'
      }
    }
  },
  methods: {
    async submit() {
      if (!this.$refs.form.validate()) return
      this.error = ''
      this.loading = true
      try {
        const { data } = await api.post('/auth/login', {
          email: this.email.trim(),
          password: this.password.trim()
        })
        setAuthToken(data.token)
        setAuthUser(data.user)
        clearPreviousUserData()
        this.$router.replace('/home')
      } catch (err) {
        this.error = (err.response && err.response.data && err.response.data.error) || 'Ошибка входа'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(163, 2, 212, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(91, 33, 182, 0.04) 0%, transparent 60%);
  pointer-events: none;
}

.login-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
}

.login-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 10px 20px -5px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(163, 2, 212, 0.08);
  overflow: hidden;
}

.login-card-accent {
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
}

.login-card-inner {
  padding: 32px 28px 28px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(163, 2, 212, 0.35);
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
  margin: 0;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

.login-info-block {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 1px solid rgba(163, 2, 212, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 13px;
  color: #374151;
  line-height: 1.45;
}

.login-info-block .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 18px;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.login-input >>> .v-input__slot {
  background-color: #f8fafc !important;
}

.login-input >>> .v-input__slot fieldset {
  border-color: #e2e8f0;
  border-radius: 12px;
}

.login-input >>> .v-input__slot fieldset:hover {
  border-color: #c4b5fd;
}

.login-input >>> .v-input__slot fieldset.v-input--is-focused {
  border-color: #a302d4 !important;
  border-width: 2px !important;
}

.login-input >>> .v-input__prepend-inner .v-icon {
  color: #64748b;
}

.login-error {
  margin-bottom: 16px;
  border-left: 4px solid #dc2626 !important;
}

.login-btn {
  background: linear-gradient(135deg, #a302d4, #7c3aed) !important;
  color: white !important;
  text-transform: none;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 14px rgba(163, 2, 212, 0.4);
  margin-top: 8px;
}

.login-btn:hover {
  box-shadow: 0 6px 20px rgba(163, 2, 212, 0.5);
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0 16px;
  color: #94a3b8;
  font-size: 13px;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.login-register-text {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin: 0 0 6px;
}

.register-link {
  color: #a302d4;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.register-link:hover {
  color: #7c3aed;
  text-decoration: underline;
}

.login-register-hint {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.login-footer-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px 28px;
  margin-top: 24px;
  padding: 16px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.footer-item .v-icon {
  color: #a302d4;
}

@media (max-width: 480px) {
  .login-card-inner {
    padding: 24px 20px 20px;
  }
  .login-title {
    font-size: 22px;
  }
  .login-footer-info {
    flex-direction: column;
    align-items: center;
  }
}
</style>
