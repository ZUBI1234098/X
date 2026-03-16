<template>
  <div style="position: relative; height: 220px"><canvas ref="c" /></div>
</template>

<script>
import { Chart } from 'chart.js'

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
  name: 'NexCrmUserGrowthChart',
  mounted() {
    this._ch = new Chart(this.$refs.c, {
      type: 'line',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        datasets: [
          { data: [89, 108, 124, 156, 178, 203, 231, 264], label: 'Active', borderColor: '#6366f1', borderWidth: 2, tension: 0.4, fill: true, backgroundColor: (ctx) => makeGrad(ctx, 99, 102, 241), pointRadius: 0 },
          { data: [24, 31, 28, 44, 39, 52, 48, 67], label: 'New', borderColor: '#8739f9', borderWidth: 2, tension: 0.4, fill: true, backgroundColor: (ctx) => makeGrad(ctx, 135, 57, 249), pointRadius: 0 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOPTS }, scales: { x: XSCALE, y: YSCALE } }
    })
  },
  beforeDestroy() {
    if (this._ch) { this._ch.destroy(); this._ch = null }
  }
}
</script>
