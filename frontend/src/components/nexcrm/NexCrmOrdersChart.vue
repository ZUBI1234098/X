<template>
  <div style="position: relative; height: 220px"><canvas ref="c" /></div>
</template>

<script>
import { Chart } from 'chart.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ORD = [48, 67, 55, 89, 76, 112, 98, 134, 121, 156, 143, 187]
const TOPTS = { backgroundColor: '#1a1a26', borderColor: 'rgba(135,57,249,.3)', borderWidth: 1, titleColor: '#9ca3af', bodyColor: '#fff', padding: 10 }
const YSCALE = { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } } }

export default {
  name: 'NexCrmOrdersChart',
  mounted() {
    this._ch = new Chart(this.$refs.c, {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [{ data: ORD, label: 'Orders', backgroundColor: 'rgba(135,57,249,.8)', borderRadius: 6 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: TOPTS },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
          y: YSCALE
        }
      }
    })
  },
  beforeDestroy() {
    if (this._ch) { this._ch.destroy(); this._ch = null }
  }
}
</script>
