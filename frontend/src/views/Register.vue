<template>
  <div class="nexcrm-root nc-auth-page">
    <div class="nc-auth-bg">
      <div class="nc-orb nc-o1" />
      <div class="nc-orb nc-o2" />
      <div class="nc-dots" />
    </div>
    <div class="nc-auth-card nc-card nc-gcard nc-fu">
      <div class="nc-auth-header">
        <h1 class="nc-auth-title">Create your account</h1>
        <p class="nc-auth-sub">Start managing your business today</p>
      </div>
      <div class="nc-auth-form">
        <div class="nc-field">
          <label class="nc-label">Full name</label>
          <input v-model="displayName" class="nc-input" placeholder="Alex Morgan" />
        </div>
        <div class="nc-field">
          <label class="nc-label">Email address</label>
          <input v-model="email" type="email" class="nc-input" placeholder="alex@company.com" />
        </div>
        <div class="nc-field">
          <label class="nc-label">Password</label>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="nc-input"
            placeholder="••••••••••••••••"
            @keyup.enter="submit"
          />
        </div>
        <div v-if="error" class="nc-err">{{ error }}</div>
        <div v-if="successMessage" class="nc-err" style="color: #4ade80; border-color: rgba(34,197,94,.2); background: rgba(34,197,94,.1);">
          {{ successMessage }}
          <router-link :to="verifyRoute" class="nc-auth-link">Ввести код и войти</router-link>
        </div>
        <button
          v-if="!successMessage"
          type="button"
          class="nc-btn nc-btn-p nc-auth-submit"
          :disabled="loading"
          @click="submit"
        >
          <span v-if="loading" class="nc-spin" />
          <span>{{ loading ? 'Creating workspace...' : 'Create account & workspace' }}</span>
        </button>
      </div>
      <p class="nc-auth-switch">
        Already have an account?
        <router-link to="/login" class="nc-auth-link">Sign in</router-link>
      </p>
      <div class="nc-auth-back">
        <router-link to="/" class="nc-back-link">&#8592; Back to home</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'Register',
  data() {
    return {
      displayName: '',
      email: '',
      password: '',
      showPassword: false,
      loading: false,
      error: '',
      successMessage: '',
      registeredEmail: ''
    }
  },
  computed: {
    verifyRoute() {
      return this.registeredEmail ? { path: '/verify-email', query: { email: this.registeredEmail } } : '/verify-email'
    }
  },
  methods: {
    async submit() {
      this.error = ''
      if (!this.displayName || !this.displayName.trim()) {
        this.error = 'Enter your name'
        return
      }
      if (!this.email) {
        this.error = 'Enter your email'
        return
      }
      if (!this.password || this.password.length < 6) {
        this.error = 'Password min 6 characters'
        return
      }
      this.loading = true
      const name = (this.displayName && this.displayName.trim()) || this.email.trim().split('@')[0] || 'User'
      const payload = {
        email: this.email.trim(),
        password: this.password,
        accountType: 'individual',
        displayName: name,
        companyName: null,
        inn: null
      }
      try {
        const { data } = await api.post('/auth/register', payload, { headers: { 'Content-Type': 'application/json' } })
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
.nc-auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.nc-auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.nc-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.nc-o1 {
  width: 500px;
  height: 500px;
  top: -200px;
  left: -200px;
  background: radial-gradient(circle, #8739f9, transparent);
}

.nc-o2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  right: -100px;
  background: radial-gradient(circle, #6366f1, transparent);
}

.nc-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(135, 57, 249, 0.12) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}

.nc-auth-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  position: relative;
  z-index: 1;
}

.nc-auth-header {
  text-align: center;
  margin-bottom: 36px;
}

.nc-auth-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.nc-auth-sub {
  color: var(--nc-tx2);
  font-size: 15px;
  margin: 0;
}

.nc-auth-form .nc-field {
  margin-bottom: 18px;
}

.nc-auth-submit {
  width: 100%;
  justify-content: center;
  font-size: 16px;
  padding: 16px;
  margin-top: 8px;
}

.nc-auth-switch {
  text-align: center;
  margin-top: 24px;
  color: var(--nc-tx2);
  font-size: 14px;
}

.nc-auth-link {
  color: var(--nc-p);
  font-weight: 600;
  margin-left: 4px;
}

.nc-auth-back {
  text-align: center;
  margin-top: 16px;
}

.nc-back-link {
  color: var(--nc-tx2);
  font-size: 13px;
  text-decoration: none;
}

.nc-back-link:hover {
  color: var(--nc-tx);
}
</style>
