<template>
  <div class="nexcrm-root nc-main">
    <p class="nc-page-title">Analytics</p>
    <p class="nc-page-sub">Business performance overview</p>
    <div class="nc-sgrid">
      <div v-for="s in astats" :key="s.l" class="nc-card nc-gcard nc-stat-card">
        <div class="nc-stat-head">
          <div>
            <p class="nc-stat-label">{{ s.l }}</p>
            <p class="nc-stat-value">{{ s.v }}</p>
          </div>
          <div class="nc-stat-icon" v-html="s.icon" />
        </div>
        <span class="nc-stat-ch nc-ch-up">{{ s.ch }}</span>
        <span class="nc-stat-ch-label">vs last year</span>
      </div>
    </div>
    <div class="nc-card nc-gcard nc-chart-card" style="margin-bottom: 20px">
      <p class="nc-card-title">Revenue Chart</p>
      <p class="nc-card-sub">Monthly revenue for 2024</p>
      <NexCrmRevenueChart :data="revenueData" />
    </div>
    <div class="nc-agrid">
      <div class="nc-card nc-gcard nc-chart-card">
        <p class="nc-card-title">Orders Chart</p>
        <NexCrmOrdersChart />
      </div>
      <div class="nc-card nc-gcard nc-chart-card">
        <p class="nc-card-title">Customer Growth</p>
        <NexCrmCustomersChart />
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'
import NexCrmRevenueChart from '@/components/nexcrm/NexCrmRevenueChart.vue'
import NexCrmOrdersChart from '@/components/nexcrm/NexCrmOrdersChart.vue'
import NexCrmCustomersChart from '@/components/nexcrm/NexCrmCustomersChart.vue'

const IC = {
  dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  or: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  cu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
}

export default {
  name: 'AnalyticsNex',
  components: { NexCrmRevenueChart, NexCrmOrdersChart, NexCrmCustomersChart },
  data() {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0
    }
  },
  computed: {
    astats() {
      return [
        { l: 'Annual Revenue', v: '$' + (this.totalRevenue / 1000).toFixed(1) + 'K', ch: '+42%', icon: IC.dl },
        { l: 'Total Orders', v: String(this.totalOrders), ch: '+28%', icon: IC.or },
        { l: 'Customers', v: String(this.totalCustomers), ch: '+31%', icon: IC.cu }
      ]
    },
    revenueData() {
      return [12400, 18200, 15800, 24600, 21300, 31200, 28900, 38400, 35100, 42800, 39500, 51200]
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const [purchRes, custRes] = await Promise.all([
          api.get('/purchases').catch(() => ({ data: [] })),
          api.get('/customers').catch(() => ({ data: [] }))
        ])
        const purchases = purchRes.data || []
        const customers = custRes.data || []
        this.totalOrders = purchases.length
        this.totalCustomers = customers.length
        this.totalRevenue = purchases.reduce((s, p) => s + (p.total || 0), 0)
      } catch (_) {}
    }
  }
}
</script>

<style scoped>
.nc-main { padding: 32px; min-height: 100%; }
.nc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.nc-page-sub { color: var(--nc-tx2); font-size: 14px; margin-bottom: 28px; }
.nc-sgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
.nc-stat-card { padding: 20px 24px; }
.nc-stat-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.nc-stat-label { color: var(--nc-tx2); font-size: 13px; margin-bottom: 6px; }
.nc-stat-value { font-size: 28px; font-weight: 800; font-family: 'Syne', sans-serif; }
.nc-stat-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(135,57,249,.15); display: flex; align-items: center; justify-content: center; color: var(--nc-p); }
.nc-stat-icon >>> svg { display: block; }
.nc-stat-ch { font-size: 12px; font-weight: 600; }
.nc-ch-up { color: #4ade80; }
.nc-stat-ch-label { font-size: 12px; color: var(--nc-tx2); margin-left: 6px; }
.nc-chart-card { padding: 28px; }
.nc-card-title { font-weight: 700; font-family: 'Syne', sans-serif; margin-bottom: 4px; }
.nc-card-sub { color: var(--nc-tx2); font-size: 13px; margin-bottom: 20px; }
.nc-agrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .nc-agrid { grid-template-columns: 1fr; } }
</style>
