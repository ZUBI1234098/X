<template>
  <aside class="nc-sidebar">
    <div class="nc-sidebar-logo">NexCRM</div>
    <p class="nc-sidebar-menu-label">Menu</p>
    <router-link
      v-for="item in nav"
      :key="item.id"
      :to="item.path"
      class="nc-nitem"
      :class="{ act: isActive(item.path) }"
    >
      <span class="nc-nitem-icon" v-html="item.icon" />
      {{ item.label }}
    </router-link>
    <div class="nc-sidebar-footer">
      <div class="nc-user-block">
        <div class="nc-user-av">{{ (cu.name || 'U').charAt(0).toUpperCase() }}</div>
        <div>
          <p class="nc-user-name">{{ cu.name || 'User' }}</p>
          <p class="nc-user-role">Admin</p>
        </div>
      </div>
      <button type="button" class="nc-signout" @click="doLogout">Sign out</button>
    </div>
  </aside>
</template>

<script>
import { getAuthUser, logout } from '@/services/api'

const IC = {
  db: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  pr: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  or: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  cu: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  em: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  an: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  se: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A9 9 0 0 0 12 3a9 9 0 1 0 0 18 9 9 0 0 0 7.07-16.07z"/></svg>'
}

export default {
  name: 'Seidbar',
  data() {
    return {
      nav: [
        { id: 'dashboard', label: 'Dashboard', path: '/home', icon: IC.db },
        { id: 'products', label: 'Products', path: '/product', icon: IC.pr },
        { id: 'orders', label: 'Orders', path: '/orders', icon: IC.or },
        { id: 'customers', label: 'Customers', path: '/customer', icon: IC.cu },
        { id: 'employees', label: 'Employees', path: '/team', icon: IC.em },
        { id: 'analytics', label: 'Analytics', path: '/analytics', icon: IC.an },
        { id: 'settings', label: 'Settings', path: '/settings', icon: IC.se }
      ]
    }
  },
  computed: {
    cu() {
      const u = getAuthUser()
      return {
        name: (u && (u.displayName || u.name || (u.email && u.email.split('@')[0]))) || '',
        email: (u && u.email) || ''
      }
    }
  },
  methods: {
    isActive(path) {
      const p = this.$route.path
      if (path === '/home') return p === '/home'
      return p.startsWith(path)
    },
    doLogout() {
      logout()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.nc-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--nc-bg2, #12121a);
  border-right: 1px solid var(--nc-br, rgba(135, 57, 249, 0.2));
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 200;
}

.nc-sidebar-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 32px;
  padding-left: 8px;
  color: #fff;
}

.nc-sidebar-menu-label {
  color: var(--nc-tx2, #9ca3af);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding-left: 8px;
  margin-bottom: 8px;
}

.nc-nitem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 2px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
  background: transparent;
  color: var(--nc-tx2, #9ca3af);
  text-decoration: none;
}

.nc-nitem:hover {
  background: rgba(135, 57, 249, 0.1);
  color: #fff;
}

.nc-nitem.act {
  background: var(--nc-p, #8739f9);
  color: #fff;
}

.nc-nitem-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nc-nitem-icon >>> svg {
  display: block;
}

.nc-sidebar-footer {
  border-top: 1px solid var(--nc-br, rgba(135, 57, 249, 0.2));
  padding-top: 16px;
  margin-top: auto;
}

.nc-user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.nc-user-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8739f9, #6020d0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
}

.nc-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.nc-user-role {
  color: var(--nc-tx2, #9ca3af);
  font-size: 11px;
  margin: 0;
}

.nc-signout {
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--nc-br, rgba(135, 57, 249, 0.2));
  background: transparent;
  color: var(--nc-tx2, #9ca3af);
  font-size: 13px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}

.nc-signout:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
