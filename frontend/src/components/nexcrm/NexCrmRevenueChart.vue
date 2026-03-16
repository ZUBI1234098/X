<template>
  <div style="position: relative; height: 220px"><canvas ref="c" /></div>
</template>

<script>
import { Chart } from 'chart.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TOPTS = { backgroundColor: '#1a1a26', borderColor: 'rgba(135,57,249,.3)', borderWidth: 1, titleColor: '#9ca3af', bodyColor: '#fff', padding: 10 }
const XSCALE = { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } } }
const YSCALE = { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } } }

function makeGrad(ctx, r, g, b) {
  const chart = ctx.chart
  const area = chart.chartArea
  if (!area) return `rgba(${r},${g},${b},.2)`
  const grad = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
  grad.addColorStop(0, `rgba(${r},${g},${b},.35)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  return grad
}

export default {
  name: 'NexCrmRevenueChart',
  props: {
    data: {
      type: Array,
      default: () => [12400, 18200, 15800, 24600, 21300, 31200, 28900, 38400, 35100, 42800, 39500, 51200]
    }
  },
  mounted() {
    this.renderChart()
  },
  watch: {
    data: { handler() { this.renderChart() }, deep: true }
  },
  methods: {
    renderChart() {
      if (this._ch) {
        this._ch.destroy()
        this._ch = null
      }
      const data = this.data && this.data.length ? this.data : [12400, 18200, 15800, 24600, 21300, 31200, 28900, 38400, 35100, 42800, 39500, 51200]
      this._ch = new Chart(this.$refs.c, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [{
            data,
            label: 'Revenue',
            borderColor: '#8739f9',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            backgroundColor: (ctx) => makeGrad(ctx, 135, 57, 249),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#8739f9'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOPTS }, scales: { x: XSCALE, y: YSCALE } }
      })
    }
  },
  beforeDestroy() {
    if (this._ch) { this._ch.destroy(); this._ch = null }
  }
}
</script>
