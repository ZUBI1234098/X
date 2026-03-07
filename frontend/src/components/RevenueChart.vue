<!-- UsersChart.vue -->
<template>
  <div class="users-container">
    <div class="metrics">
      <div class="metric-item">
        <div class="value">811</div>
        <div class="label">Orders</div>
      </div>
      <div class="metric-item">
        <div class="value">234</div>
        <div class="label">Today</div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <svg width="10%" height="150" viewBox="0 0 300 150">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0891B2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <g v-for="(bar, index) in bars" :key="index">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            fill="url(#barGradient)"
            rx="2"
            ry="2"
            class="bar"
            :style="{ animationDelay: index * 50 + 'ms' }"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UsersChart',
  data() {
    return {
      data: [40, 65, 55, 80, 60, 95, 45, 70, 85, 50, 75, 90, 35, 60, 80, 55, 70, 85, 40, 65]
    }
  },
  computed: {
    bars() {
      const barWidth = 12
      const barSpacing = 3
      const maxHeight = 120
      const maxValue = Math.max(...this.data)
      
      return this.data.map((value, index) => {
        const height = (value / maxValue) * maxHeight
        const x = index * (barWidth + barSpacing) + 10
        const y = 150 - height - 10
        
        return {
          x,
          y,
          width: barWidth,
          height
        }
      })
    }
  },
  mounted() {
    // Анимация обновления данных
    this.animateData()
  },
  methods: {
    animateData() {
      setInterval(() => {
        this.data = this.data.map(() => Math.random() * 100 + 20)
      }, 4000)
    }
  }
}
</script>

<style scoped>
.users-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.metrics {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 30px;
}

.metric-item {
  text-align: center;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 4px;
}

.label {
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  align-items: end;

}

.bar {
  animation: growUp 0.8s ease-out;
  transition: height 0.5s ease-in-out, y 0.5s ease-in-out;
}

@keyframes growUp {
  from {
    height: 0;
    y: 140;
  }
  to {
    height: var(--final-height);
    y: var(--final-y);
  }
}
</style><!-- UsersChart.vue -->
<template>
  <div class="users-container">
    <div class="metrics">
      <div class="metric-item">
        <div class="value">811</div>
        <div class="label">Orders</div>
      </div>
      <div class="metric-item">
        <div class="value">234</div>
        <div class="label">Today</div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <svg width="100%" height="150" viewBox="0 0 300 150">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0891B2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <g v-for="(bar, index) in bars" :key="index">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            fill="url(#barGradient)"
            rx="2"
            ry="2"
            class="bar"
            :style="{ animationDelay: index * 50 + 'ms' }"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UsersChart',
  data() {
    return {
      data: [40, 65, 55, 80, 60, 95, 45, 70, 85, 50, 75, 90, 35, 60, 80, 55, 70, 85, 40, 65]
    }
  },
  computed: {
    bars() {
      const barWidth = 12
      const barSpacing = 3
      const maxHeight = 120
      const maxValue = Math.max(...this.data)
      
      return this.data.map((value, index) => {
        const height = (value / maxValue) * maxHeight
        const x = index * (barWidth + barSpacing) + 10
        const y = 150 - height - 10
        
        return {
          x,
          y,
          width: barWidth,
          height
        }
      })
    }
  },
  mounted() {
    // Анимация обновления данных
    this.animateData()
  },
  methods: {
    animateData() {
      setInterval(() => {
        this.data = this.data.map(() => Math.random() * 100 + 20)
      }, 4000)
    }
  }
}
</script>

<style scoped>
.users-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.metrics {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 30px;
}

.metric-item {
  text-align: center;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 4px;
}

.label {
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  align-items: end;

}

.bar {
  animation: growUp 0.8s ease-out;
  transition: height 0.5s ease-in-out, y 0.5s ease-in-out;
}

@keyframes growUp {
  from {
    height: 0;
    y: 140;
  }
  to {
    height: var(--final-height);
    y: var(--final-y);
  }
}
</style>