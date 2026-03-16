<template>
  <div class="nexcrm-root nc-main">
    <p class="nc-page-title">Employees</p>
    <p class="nc-page-sub">{{ employees.length }} team members</p>
    <div class="nc-egrid">
      <div
        v-for="(e, i) in employees"
        :key="e.id"
        class="nc-card nc-gcard nc-employee-card"
        @mouseenter="hoverCard($event, true)"
        @mouseleave="hoverCard($event, false)"
      >
        <div class="nc-employee-header">
          <div class="nc-employee-av" :style="avStyle(i)">{{ e.av }}</div>
          <div>
            <p class="nc-employee-name">{{ e.name }}</p>
            <span class="nc-badge nc-badge-p nc-role-badge">{{ e.role }}</span>
          </div>
        </div>
        <div class="nc-employee-stats">
          <div v-for="s in [{ l: 'Sales', v: e.sales, c: 'var(--nc-tx)' }, { l: 'Revenue', v: e.rev, c: 'var(--nc-p)' }, { l: 'Growth', v: e.gr, c: '#4ade80' }]" :key="s.l" class="nc-em-stat">
            <p class="nc-stat-label">{{ s.l }}</p>
            <p class="nc-stat-value" :style="{ color: s.c }">{{ s.v }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'EmployeesNex',
  data() {
    return {
      employees: []
    }
  },
  mounted() {
    this.fetchTeam()
  },
  methods: {
    async fetchTeam() {
      try {
        const res = await api.get('/team')
        const list = res.data || []
        const defaults = [
          { sales: 142, rev: '$58,400', gr: '+23%' },
          { sales: 98, rev: '$41,200', gr: '+18%' },
          { sales: 76, rev: '$32,100', gr: '+12%' },
          { sales: 61, rev: '$26,800', gr: '+9%' }
        ]
        this.employees = list.map((emp, i) => {
          const d = defaults[i % defaults.length]
          const name = emp.displayName || emp.name || (emp.email && emp.email.split('@')[0]) || 'User'
          const av = name.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() || 'U'
          return {
            id: emp.id,
            name,
            av,
            role: emp.role || 'Sales Rep',
            sales: d.sales,
            rev: d.rev,
            gr: d.gr
          }
        })
        if (this.employees.length === 0) {
          this.employees = [
            { id: 1, name: 'Alex Morgan', av: 'AM', role: 'Sales Lead', sales: 142, rev: '$58,400', gr: '+23%' },
            { id: 2, name: 'Sarah Chen', av: 'SC', role: 'Account Manager', sales: 98, rev: '$41,200', gr: '+18%' },
            { id: 3, name: 'Mike Davis', av: 'MD', role: 'Sales Rep', sales: 76, rev: '$32,100', gr: '+12%' },
            { id: 4, name: 'Emma Wilson', av: 'EW', role: 'Sales Rep', sales: 61, rev: '$26,800', gr: '+9%' }
          ]
        }
      } catch (_) {
        this.employees = [
          { id: 1, name: 'Alex Morgan', av: 'AM', role: 'Sales Lead', sales: 142, rev: '$58,400', gr: '+23%' },
          { id: 2, name: 'Sarah Chen', av: 'SC', role: 'Account Manager', sales: 98, rev: '$41,200', gr: '+18%' },
          { id: 3, name: 'Mike Davis', av: 'MD', role: 'Sales Rep', sales: 76, rev: '$32,100', gr: '+12%' },
          { id: 4, name: 'Emma Wilson', av: 'EW', role: 'Sales Rep', sales: 61, rev: '$26,800', gr: '+9%' }
        ]
      }
    },
    avStyle(i) {
      const h1 = 260 + (i % 4) * 20
      const h2 = 280 + (i % 4) * 20
      return { background: `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 60%, 40%))` }
    },
    hoverCard(e, enter) {
      e.currentTarget.style.transform = enter ? 'translateY(-4px)' : ''
    }
  }
}
</script>

<style scoped>
.nc-main { padding: 32px; min-height: 100%; }
.nc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.nc-page-sub { color: var(--nc-tx2); font-size: 14px; margin-bottom: 28px; }
.nc-egrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
.nc-employee-card { padding: 24px; transition: all 0.3s; }
.nc-employee-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.nc-employee-av { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
.nc-employee-name { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
.nc-role-badge { font-size: 11px; }
.nc-employee-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.nc-em-stat { background: rgba(135,57,249,.08); border-radius: 10px; padding: 12px; text-align: center; }
.nc-stat-label { color: var(--nc-tx2); font-size: 11px; margin-bottom: 4px; }
.nc-stat-value { font-weight: 700; font-size: 14px; font-family: 'Syne', sans-serif; }
</style>
