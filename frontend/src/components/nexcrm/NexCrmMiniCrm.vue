<template>
  <div class="nc-fl" style="position: relative">
    <div class="nc-glow" />
    <div class="nc-gcard nc-box" style="border-radius: 18px; overflow: hidden; background: var(--nc-bg2); position: relative; z-index: 1; box-shadow: 0 30px 80px rgba(0,0,0,.5)">
      <div style="background: #12121a; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nc-br)">
        <div style="display: flex; gap: 6px">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #f87171" />
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #facc15" />
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #4ade80" />
        </div>
        <div style="flex: 1; background: rgba(255,255,255,.05); border-radius: 6px; padding: 4px 12px; font-size: 11px; color: var(--nc-tx2); text-align: center; max-width: 220px; margin: 0 auto">app.nexcrm.io/dashboard</div>
      </div>
      <div style="padding: 16px">
        <div style="display: flex; gap: 8px; margin-bottom: 12px">
          <div v-for="s in stats" :key="s.l" style="flex: 1; background: rgba(135,57,249,.1); border-radius: 8px; padding: 8px 10px; border: 1px solid var(--nc-br)">
            <p style="font-size: 9px; color: var(--nc-tx2)">{{ s.l }}</p>
            <p style="font-size: 11px; font-weight: 700; font-family: 'Syne', sans-serif">{{ s.v }}</p>
          </div>
        </div>
        <div style="background: rgba(135,57,249,.06); border-radius: 8px; padding: 10px; border: 1px solid var(--nc-br)">
          <p style="font-size: 9px; color: var(--nc-tx2); margin-bottom: 6px">Revenue Chart</p>
          <div style="height: 60px"><canvas ref="mc" /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart } from 'chart.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const REV = [12400, 18200, 15800, 24600, 21300, 31200, 28900, 38400, 35100, 42800, 39500, 51200]

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
  name: 'NexCrmMiniCrm',
  data() {
    return {
      stats: [
        { l: 'Revenue', v: '$51.2K' },
        { l: 'Orders', v: '187' },
        { l: 'Users', v: '138' }
      ]
    }
  },
  mounted() {
    this._ch = new Chart(this.$refs.mc, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{
          data: REV,
          borderColor: '#8739f9',
          borderWidth: 1.5,
          tension: 0.4,
          fill: true,
          backgroundColor: (ctx) => makeGrad(ctx, 135, 57, 249),
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        animation: false
      }
    })
  },
  beforeDestroy() {
    if (this._ch) {
      this._ch.destroy()
      this._ch = null
    }
  }
}
</script>

<style scoped>
.nc-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse, rgba(135, 57, 249, 0.2), transparent 70%);
  filter: blur(20px);
  border-radius: 32px;
  z-index: 0;
}
</style>
