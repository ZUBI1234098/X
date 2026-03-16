<template>
  <div style="position: relative; height: 220px"><canvas ref="c" /></div>
</template>

<script>
import { Chart } from 'chart.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CUST = [32, 45, 38, 61, 54, 78, 71, 96, 88, 112, 104, 138]
const TOPTS = { backgroundColor: '#1a1a26', borderColor: 'rgba(135,57,249,.3)', borderWidth: 1, titleColor: '#9ca3af', bodyColor: '#fff', padding: 10 }
const XSCALE = { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } } }
const YSCALE = { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } } }

export default {
  name: 'NexCrmCustomersChart',
  mounted() {
    this._ch = new Chart(this.$refs.c, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{
          data: CUST,
          label: 'Customers',
          borderColor: '#6366f1',
          borderWidth: 2.5,
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOPTS }, scales: { x: XSCALE, y: YSCALE } }
    })
  },
  beforeDestroy() {
    if (this._ch) { this._ch.destroy(); this._ch = null }
  }
}
</script>
