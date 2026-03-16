<template>
  <div class="nexcrm-root nc-main">
    <div class="nc-page-header nc-page-header-flex">
      <div>
        <p class="nc-page-title">Products</p>
        <p class="nc-page-sub">{{ prods.length }} products total</p>
      </div>
      <button type="button" class="nc-btn nc-btn-p nc-btn-sm" @click="pmod = true">+ Add Product</button>
    </div>

    <div v-if="pmod" class="nc-modal-bg" @click.self="pmod = false">
      <div class="nc-card nc-gcard nc-modal-box">
        <div class="nc-modal-head">
          <span class="nc-modal-title">Add Product</span>
          <button type="button" class="nc-modal-close" @click="pmod = false">&#10005;</button>
        </div>
        <div class="nc-field">
          <label class="nc-label">Product name</label>
          <input v-model="np.name" class="nc-input" placeholder="Enterprise Suite" />
        </div>
        <div class="nc-field">
          <label class="nc-label">Price</label>
          <input v-model="np.price" class="nc-input" placeholder="$99/mo" />
        </div>
        <div class="nc-field">
          <label class="nc-label">Status</label>
          <select v-model="np.st" class="nc-input">
            <option>Active</option>
            <option>Paused</option>
          </select>
        </div>
        <button type="button" class="nc-btn nc-btn-p nc-modal-submit" @click="addProd">Add Product</button>
      </div>
    </div>

    <div class="nc-card nc-gcard nc-table-wrap">
      <table class="nc-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Sales</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in prods" :key="p.id">
            <td class="nc-fw500">{{ p.name }}</td>
            <td class="nc-price">${{ formatPrice(p.price) }}</td>
            <td>{{ salesByProduct[p.id] || 0 }}</td>
            <td class="nc-muted">{{ formatDate(p.date) }}</td>
            <td><span :class="'nc-badge ' + (p.st === 'Active' ? 'nc-badge-g' : 'nc-badge-y')">{{ p.st || 'Active' }}</span></td>
            <td class="nc-actions">
              <button type="button" class="nc-action-btn nc-edit" title="Edit">&#9998;</button>
              <button type="button" class="nc-action-btn nc-del" @click="delProd(p.id)">&#128465;</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ProductsNex',
  data() {
    return {
      prods: [],
      pmod: false,
      np: { name: '', price: '', st: 'Active' },
      salesByProduct: {}
    }
  },
  mounted() {
    this.fetchProducts()
    this.fetchSales()
  },
  methods: {
    async fetchProducts() {
      try {
        const res = await api.get('/products')
        this.prods = (res.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          date: p.date || p.created_at,
          st: p.status || 'Active'
        }))
      } catch (_) {
        this.prods = []
      }
    },
    async fetchSales() {
      try {
        const res = await api.get('/purchases').catch(() => ({ data: [] }))
        const byId = {}
        ;(res.data || []).forEach((p) => {
          const id = p.productId
          byId[id] = (byId[id] || 0) + (p.quantity || 1)
        })
        this.salesByProduct = byId
      } catch (_) {
        this.salesByProduct = {}
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
    },
    async addProd() {
      if (!this.np.name || !this.np.price) return
      const priceVal = parseFloat(String(this.np.price).replace(/[^0-9.]/g, '')) || 0
      try {
        await api.post('/products', {
          name: this.np.name.trim(),
          price: priceVal,
          category: '',
          stock: 0,
          description: '',
          date: new Date().toISOString(),
          minStock: 10,
          barcode: ''
        })
        this.pmod = false
        this.np = { name: '', price: '', st: 'Active' }
        this.fetchProducts()
        this.fetchSales()
      } catch (_) {}
    },
    async delProd(id) {
      try {
        await api.delete(`/products/${id}`)
        this.fetchProducts()
        this.fetchSales()
      } catch (_) {}
    }
  }
}
</script>

<style scoped>
.nc-main { padding: 32px; min-height: 100%; background: var(--nc-bg); }
.nc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.nc-page-sub { color: var(--nc-tx2); font-size: 14px; margin-bottom: 28px; }
.nc-page-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.nc-btn-sm { padding: 10px 20px; font-size: 14px; }
.nc-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
.nc-modal-box { width: 400px; padding: 32px; animation: nc-fadeUp 0.3s ease both; }
.nc-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.nc-modal-title { font-size: 20px; font-weight: 700; }
.nc-modal-close { background: none; border: none; color: var(--nc-tx2); cursor: pointer; font-size: 20px; }
.nc-field { margin-bottom: 18px; }
.nc-modal-submit { width: 100%; justify-content: center; padding: 14px; }
.nc-table-wrap { overflow: hidden; }
.nc-table { width: 100%; border-collapse: collapse; }
.nc-table th { text-align: left; padding: 12px 16px; color: var(--nc-tx2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid var(--nc-br); }
.nc-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 14px; }
.nc-table tr:hover td { background: rgba(135,57,249,.04); }
.nc-muted { color: var(--nc-tx2); }
.nc-fw500 { font-weight: 500; }
.nc-price { color: var(--nc-p); font-weight: 600; }
.nc-actions { display: flex; gap: 8px; }
.nc-action-btn { background: none; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 14px; }
.nc-edit { background: rgba(135,57,249,.1); color: var(--nc-p); }
.nc-del { background: rgba(239,68,68,.1); color: #f87171; }
</style>
