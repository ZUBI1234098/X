<template>
  <div class="nexcrm-root nc-main">
    <div class="nc-page-header">
      <p class="nc-page-title">Orders</p>
      <p class="nc-page-sub">{{ orders.length }} total orders</p>
    </div>
    <div class="nc-card nc-gcard nc-table-wrap">
      <table class="nc-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Customer</th>
            <th>Employee</th>
            <th>Date</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td class="nc-muted">#{{ o.id }}</td>
            <td class="nc-fw500">{{ o.productName || '—' }}</td>
            <td>{{ o.customerName || '—' }}</td>
            <td class="nc-muted">{{ o.emp || '—' }}</td>
            <td class="nc-muted">{{ formatDate(o.date) }}</td>
            <td class="nc-price">${{ formatPrice(o.total) }}</td>
            <td><span :class="'nc-badge ' + statusClass(o)">{{ orderStatus(o) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'Orders',
  data() {
    return {
      orders: []
    }
  },
  mounted() {
    this.fetchOrders()
  },
  methods: {
    async fetchOrders() {
      try {
        const res = await api.get('/purchases')
        this.orders = (res.data || []).map((p) => ({
          id: p.id,
          productName: p.productName,
          customerName: p.customerName,
          total: p.total,
          date: p.date,
          emp: p.createdByUserId != null ? '—' : '—'
        }))
      } catch (_) {
        this.orders = []
      }
    },
    formatDate(d) {
      if (!d) return '—'
      const s = String(d).slice(0, 10)
      return s
    },
    formatPrice(v) {
      if (v == null) return '0'
      const n = Number(v)
      return isNaN(n) ? '0' : n.toFixed(0)
    },
    orderStatus() {
      return 'Completed'
    },
    statusClass() {
      return 'nc-badge-g'
    }
  }
}
</script>

<style scoped>
.nc-main {
  padding: 32px;
  min-height: 100%;
  background: var(--nc-bg);
}

.nc-page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.nc-page-sub {
  color: var(--nc-tx2);
  font-size: 14px;
  margin-bottom: 28px;
}

.nc-table-wrap {
  overflow: hidden;
}

.nc-table {
  width: 100%;
  border-collapse: collapse;
}

.nc-table th {
  text-align: left;
  padding: 12px 16px;
  color: var(--nc-tx2);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--nc-br);
}

.nc-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 14px;
}

.nc-table tr:hover td {
  background: rgba(135, 57, 249, 0.04);
}

.nc-muted { color: var(--nc-tx2); }
.nc-fw500 { font-weight: 500; }
.nc-price { color: var(--nc-p); font-weight: 600; }
</style>
