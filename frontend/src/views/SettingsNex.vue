<template>
  <div class="nexcrm-root nc-main">
    <p class="nc-page-title">Settings</p>
    <p class="nc-page-sub">Manage your workspace</p>
    <div class="nc-settings-grid">
      <div class="nc-card nc-gcard nc-settings-card">
        <h3 class="nc-settings-h3">Profile</h3>
        <div class="nc-field">
          <label class="nc-label">Full name</label>
          <input :value="cu.name" class="nc-input" readonly />
        </div>
        <div class="nc-field">
          <label class="nc-label">Email</label>
          <input :value="cu.email" class="nc-input" readonly />
        </div>
        <button type="button" class="nc-btn nc-btn-p nc-btn-sm">Save changes</button>
      </div>
      <div class="nc-card nc-gcard nc-settings-card">
        <h3 class="nc-settings-h3">Workspace</h3>
        <div class="nc-field">
          <label class="nc-label">Workspace name</label>
          <input :value="workspaceName" class="nc-input" readonly />
        </div>
        <div class="nc-field">
          <label class="nc-label">Plan</label>
          <input value="CRM PRO — $39/mo" class="nc-input" readonly />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser } from '@/services/api'

export default {
  name: 'SettingsNex',
  data() {
    return {
      me: null
    }
  },
  computed: {
    cu() {
      const u = this.me || getAuthUser()
      return {
        name: (u && (u.displayName || u.name || (u.email && u.email.split('@')[0]))) || '',
        email: (u && u.email) || ''
      }
    },
    workspaceName() {
      const n = this.cu.name
      return n ? n + "'s CRM" : 'My CRM'
    }
  },
  async mounted() {
    try {
      const { data } = await api.get('/me')
      if (data && data.user) this.me = data.user
    } catch (_) {}
  }
}
</script>

<style scoped>
.nc-main { padding: 32px; min-height: 100%; }
.nc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.nc-page-sub { color: var(--nc-tx2); font-size: 14px; margin-bottom: 28px; }
.nc-settings-grid { max-width: 600px; display: grid; gap: 20px; }
.nc-settings-card { padding: 28px; }
.nc-settings-h3 { font-size: 17px; font-weight: 700; margin-bottom: 20px; }
.nc-field { margin-bottom: 18px; }
.nc-btn-sm { padding: 10px 20px; font-size: 14px; }
</style>
