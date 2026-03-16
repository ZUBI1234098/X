<template>
  <div class="nexcrm-root nc-dashboard">
    <div v-if="crmp === 'dashboard'" class="nc-dash-page">
      <p class="nc-page-title">Dashboard</p>
      <p class="nc-page-sub">Welcome back, {{ cu.name }} &#128075;</p>
      <div class="nc-sgrid">
        <div
          v-for="s in dstats"
          :key="s.l"
          class="nc-card nc-gcard nc-stat-card"
          @mouseenter="hoverCard($event, true)"
          @mouseleave="hoverCard($event, false)"
        >
          <div class="nc-stat-head">
            <div>
              <p class="nc-stat-label">{{ s.l }}</p>
              <p class="nc-stat-value">{{ s.v }}</p>
            </div>
            <div class="nc-stat-icon" v-html="s.icon" />
          </div>
          <span class="nc-stat-ch" :class="s.ch.startsWith('+') ? 'nc-ch-up' : 'nc-ch-down'">{{ s.ch }}</span>
          <span class="nc-stat-ch-label">vs last month</span>
        </div>
      </div>
      <div class="nc-crow">
        <div class="nc-card nc-gcard nc-chart-card">
          <p class="nc-card-title">Revenue Overview</p>
          <p class="nc-card-sub">Annual revenue performance</p>
          <NexCrmRevenueChart :data="revenueChartData" />
        </div>
        <div class="nc-card nc-gcard nc-activity-card">
          <p class="nc-card-title">Recent Activity</p>
          <div v-for="o in recentOrders" :key="o.id" class="nc-activity-row">
            <div>
              <p class="nc-activity-cust">{{ o.customerName || '—' }}</p>
              <p class="nc-activity-prod">{{ o.productName || '—' }}</p>
            </div>
            <div class="nc-activity-right">
              <p class="nc-activity-price">${{ formatPrice(o.total) }}</p>
              <span :class="'nc-badge ' + stCl('Completed')">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser } from '@/services/api'
import NexCrmRevenueChart from '@/components/nexcrm/NexCrmRevenueChart.vue'

const IC = {
  dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  or: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  cu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  em: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
}

export default {
  name: 'Home',
  components: { NexCrmRevenueChart },
  data() {
    return {
      crmp: 'dashboard',
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalEmployees: 4,
      purchases: [],
      teamCount: 0
    }
  },
  computed: {
    cu() {
      const u = getAuthUser()
      return {
        name: (u && (u.displayName || u.name || (u.email && u.email.split('@')[0]))) || 'User'
      }
    },
    dstats() {
      return [
        { l: 'Total Revenue', v: '$' + (this.totalRevenue / 1000).toFixed(1) + 'K', ch: '+34%', icon: IC.dl },
        { l: 'Orders', v: String(this.totalOrders), ch: '+12%', icon: IC.or },
        { l: 'Customers', v: String(this.totalCustomers), ch: '+28%', icon: IC.cu },
        { l: 'Employees', v: String(this.teamCount || this.totalEmployees), ch: '+1', icon: IC.em }
      ]
    },
    recentOrders() {
      return (this.purchases || []).slice(0, 5)
    },
    revenueChartData() {
      const defaultRev = [12400, 18200, 15800, 24600, 21300, 31200, 28900, 38400, 35100, 42800, 39500, 51200]
      const byMonth = Array(12).fill(0)
      ;(this.purchases || []).forEach((p) => {
        if (p.date && p.total) {
          const m = new Date(p.date).getMonth()
          if (m >= 0 && m < 12) byMonth[m] += Number(p.total)
        }
      })
      const hasData = byMonth.some((v) => v > 0)
      return hasData ? byMonth : defaultRev
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const [custRes, purchRes, teamRes] = await Promise.all([
          api.get('/customers').catch(() => ({ data: [] })),
          api.get('/purchases').catch(() => ({ data: [] })),
          api.get('/team').catch(() => ({ data: [] }))
        ])
        const customers = custRes.data || []
        this.purchases = purchRes.data || []
        const team = teamRes.data || []
        this.totalCustomers = customers.length
        this.totalOrders = this.purchases.length
        this.totalRevenue = this.purchases.reduce((s, p) => s + (p.total || 0), 0)
        this.teamCount = team.length
      } catch (_) {}
    },
    formatPrice(v) {
      if (v == null) return '0'
      const n = Number(v)
      return isNaN(n) ? '0' : n.toFixed(0)
    },
    stCl(s) {
      return s === 'Completed' ? 'nc-badge-g' : s === 'Pending' ? 'nc-badge-y' : 'nc-badge-r'
    },
    hoverCard(e, enter) {
      e.currentTarget.style.transform = enter ? 'translateY(-3px)' : ''
    }
  }
}
</script>

<style scoped>
.nc-dashboard {
  padding: 32px;
  min-height: 100%;
}

.nc-page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.nc-page-sub {
  color: var(--nc-tx2);
  margin-bottom: 28px;
  font-size: 14px;
}

.nc-sgrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.nc-stat-card {
  padding: 20px 24px;
  transition: all 0.3s;
  cursor: default;
}

.nc-stat-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.nc-stat-label {
  color: var(--nc-tx2);
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 500;
}

.nc-stat-value {
  font-size: 28px;
  font-weight: 800;
  font-family: 'Syne', sans-serif;
}

.nc-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(135, 57, 249, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nc-p);
}

.nc-stat-icon >>> svg {
  display: block;
}

.nc-stat-ch { font-size: 12px; font-weight: 600; }
.nc-ch-up { color: #4ade80; }
.nc-ch-down { color: #f87171; }
.nc-stat-ch-label { font-size: 12px; color: var(--nc-tx2); margin-left: 6px; }

.nc-crow {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.nc-chart-card,
.nc-activity-card {
  padding: 24px;
}

.nc-card-title {
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  margin-bottom: 4px;
}

.nc-card-sub {
  color: var(--nc-tx2);
  font-size: 13px;
  margin-bottom: 20px;
}

.nc-activity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.nc-activity-cust { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.nc-activity-prod { color: var(--nc-tx2); font-size: 12px; margin: 0; }
.nc-activity-right { text-align: right; }
.nc-activity-price { font-size: 13px; font-weight: 600; margin-bottom: 2px; }

@media (max-width: 900px) {
  .nc-crow { grid-template-columns: 1fr; }
}
</style>
