<template>
  <div class="nexcrm-root nc-auth-page">
    <div class="nc-auth-bg">
      <div class="nc-orb nc-o1" />
      <div class="nc-orb nc-o2" />
      <div class="nc-dots" />
    </div>
    <div class="nc-auth-card nc-card nc-gcard nc-fu">
      <div class="nc-auth-header">
        <h1 class="nc-auth-title">Welcome back</h1>
        <p class="nc-auth-sub">Sign in to your CRM workspace</p>
      </div>
      <div class="nc-auth-form">
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
        <button
          type="button"
          class="nc-btn nc-btn-p nc-auth-submit"
          :disabled="loading"
          @click="submit"
        >
          <span v-if="loading" class="nc-spin" />
          <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
        </button>
      </div>
      <p class="nc-auth-switch">
        No account?
        <router-link to="/register" class="nc-auth-link">Create one free</router-link>
      </p>
      <div class="nc-auth-back">
        <router-link to="/" class="nc-back-link">&#8592; Back to home</router-link>
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
      loading: false,
      error: ''
    }
  },
  methods: {
    async submit() {
      this.error = ''
      if (!this.email || !this.password) {
        this.error = 'Enter your email and password'
        return
      }
      if (this.password.length < 6) {
        this.error = 'Password min 6 characters'
        return
      }
      this.loading = true
      try {
        const { data } = await api.post('/auth/login', {
          email: this.email.trim(),
          password: this.password.trim()
        })
        setAuthToken(data.token)
        setAuthUser(data.user)
        clearPreviousUserData()
        const redirect = this.$route.query.redirect || '/home'
        this.$router.replace(redirect)
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
