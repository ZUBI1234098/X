<template>
  <div class="nexcrm-root nc-main">
    <p class="nc-page-title">Customers</p>
    <p class="nc-page-sub">{{ custs.length }} customers</p>
    <div class="nc-card nc-gcard nc-table-wrap">
      <table class="nc-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Last Product</th>
            <th>Date</th>
            <th>Spent</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in custs" :key="c.id">
            <td>
              <div class="nc-cust-cell">
                <div class="nc-cust-av">{{ (c.name || 'U')[0] }}</div>
                <span class="nc-fw500">{{ c.name }}</span>
              </div>
            </td>
            <td class="nc-muted">{{ c.email || '—' }}</td>
            <td>{{ c.lastProduct || '—' }}</td>
            <td class="nc-muted">{{ formatDate(c.date) }}</td>
            <td class="nc-price">${{ formatPrice(c.spent) }}</td>
            <td><span class="nc-badge nc-badge-b">{{ c.ords }} orders</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'CustomersNex',
  data() {
    return {
      custs: [],
      purchases: []
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const [custRes, purchRes] = await Promise.all([
          api.get('/customers'),
          api.get('/purchases').catch(() => ({ data: [] }))
        ])
        const customers = custRes.data || []
        const purchases = purchRes.data || []
        this.purchases = purchases
        const byName = {}
        purchases.forEach((p) => {
          const name = (p.customerName || '').trim() || '—'
          if (!byName[name]) byName[name] = { total: 0, count: 0, lastProduct: null, lastDate: null }
          byName[name].total += p.total || 0
          byName[name].count += 1
          if (!byName[name].lastProduct || (p.date > (byName[name].lastDate || ''))) {
            byName[name].lastProduct = p.productName
            byName[name].lastDate = p.date
          }
        })
        this.custs = customers.map((c) => {
          const custName = (c.name || c.email || '—').toString().trim() || '—'
          const agg = byName[custName] || byName[(c.name || '').trim()] || {}
          return {
            id: c.id,
            name: c.name || (c.email && c.email.split('@')[0]) || '—',
            email: c.email,
            date: c.date || c.created_at,
            lastProduct: agg.lastProduct || '—',
            spent: agg.total || 0,
            ords: agg.count || 0
          }
        })
      } catch (_) {
        this.custs = []
      }
    },
    formatDate(d) {
      if (!d) return '—'
      return String(d).slice(0, 10)
    },
    formatPrice(v) {
      if (v == null) return '0'
      const n = Number(v)
      return isNaN(n) ? '0' : n.toFixed(0)
    }
  }
}
</script>

<style scoped>
.nc-main { padding: 32px; min-height: 100%; background: var(--nc-bg); }
.nc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.nc-page-sub { color: var(--nc-tx2); font-size: 14px; margin-bottom: 28px; }
.nc-table-wrap { overflow: hidden; }
.nc-table { width: 100%; border-collapse: collapse; }
.nc-table th { text-align: left; padding: 12px 16px; color: var(--nc-tx2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid var(--nc-br); }
.nc-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 14px; }
.nc-table tr:hover td { background: rgba(135,57,249,.04); }
.nc-cust-cell { display: flex; align-items: center; gap: 10px; }
.nc-cust-av { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #8739f9, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.nc-muted { color: var(--nc-tx2); }
.nc-fw500 { font-weight: 500; }
.nc-price { color: var(--nc-p); font-weight: 600; }
</style>
