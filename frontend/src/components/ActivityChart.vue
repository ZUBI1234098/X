<!-- SalesChart.vue -->
<template>
  <div class="sales-container">
    <div class="metrics">
      <div class="metric-item">
        <div class="value">$2,345</div>
        <div class="label">Profit</div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0.1" />
          </linearGradient>
          <linearGradient id="areaGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <path
          :d="mountainPath1"
          fill="url(#areaGradient1)"
          stroke="none"
        />
        

        <path
          :d="mountainPath2"
          fill="url(#areaGradient2)"
          stroke="none"
        />
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SalesChart',
  data() {
    return {
      data1: [20, 40, 25, 60, 35, 80, 45, 70, 30, 50, 25, 40],
      data2: [10, 30, 15, 45, 25, 65, 35, 55, 20, 40, 15, 30]
    }
  },
  computed: {
    mountainPath1() {
      const points = this.data1.map((value, index) => {
        const x = (index / (this.data1.length - 1)) * 400
        const y = 200 - (value / 100) * 160
        return `${x},${y}`
      }).join(' ')
      
      return `M 0,200 L ${points} L 400,200 Z`
    },
    mountainPath2() {
      const points = this.data2.map((value, index) => {
        const x = (index / (this.data2.length - 1)) * 400
        const y = 200 - (value / 100) * 160
        return `${x},${y}`
      }).join(' ')
      
      return `M 0,200 L ${points} L 400,200 Z`
    }
  },
  mounted() {
    this.animateData()
  },
  methods: {
    animateData() {
      setInterval(() => {
        this.data1 = this.data1.map(() => Math.random() * 80 + 20)
        this.data2 = this.data2.map(() => Math.random() * 60 + 10)
      }, 3000)
    }
  }
}
</script>

<style scoped>
.sales-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.metrics {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
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

svg {
  width: 100%;
  height: 100%;
}

path {
  transition: d 0.5s ease-in-out;
}
</style>
<template>
  <div class="sales-container">
    <div class="metrics">
      <div class="metric-item">
        <div class="value">$2,345</div>
        <div class="label">Profit</div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0.1" />
          </linearGradient>
          <linearGradient id="areaGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <path
          :d="mountainPath1"
          fill="url(#areaGradient1)"
          stroke="none"
        />
        
        <path
          :d="mountainPath2"
          fill="url(#areaGradient2)"
          stroke="none"
        />
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SalesChart',
  data() {
    return {
      data1: [20, 40, 25, 60, 35, 80, 45, 70, 30, 50, 25, 40],
      data2: [10, 30, 15, 45, 25, 65, 35, 55, 20, 40, 15, 30]
    }
  },
  computed: {
    mountainPath1() {
      const points = this.data1.map((value, index) => {
        const x = (index / (this.data1.length - 1)) * 400
        const y = 200 - (value / 100) * 160
        return `${x},${y}`
      }).join(' ')
      
      return `M 0,200 L ${points} L 400,200 Z`
    },
    mountainPath2() {
      const points = this.data2.map((value, index) => {
        const x = (index / (this.data2.length - 1)) * 400
        const y = 200 - (value / 100) * 160
        return `${x},${y}`
      }).join(' ')
      
      return `M 0,200 L ${points} L 400,200 Z`
    }
  },
  mounted() {
    this.animateData()
  },
  methods: {
    animateData() {
      setInterval(() => {
        this.data1 = this.data1.map(() => Math.random() * 80 + 20)
        this.data2 = this.data2.map(() => Math.random() * 60 + 10)
      }, 3000)
    }
  }
}
</script>
<style scoped>
.sales-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.metrics {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
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

svg {
  width: 100%;
  height: 100%;
}

path {
  transition: d 0.5s ease-in-out;
}
</style>
