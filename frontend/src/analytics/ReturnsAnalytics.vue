<template>
  <div class="returns-analytics">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/analytics" class="back-btn">
          <v-icon>mdi-arrow-left</v-icon>
        </router-link>
        <h1 class="page-title">{{ $t('analytics.charts.returnsTitle') }}</h1>
      </div>
      <div class="time-filters">
        <v-btn-toggle v-model="timeFilter" mandatory class="filter-toggle">
          <v-btn value="hour" small>{{ $t('analytics.timeFilters.hour') }}</v-btn>
          <v-btn value="day" small>{{ $t('analytics.timeFilters.day') }}</v-btn>
          <v-btn value="week" small>{{ $t('analytics.timeFilters.week') }}</v-btn>
          <v-btn value="month" small>{{ $t('analytics.timeFilters.month') }}</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-icon returns">
          <v-icon size="24" color="#ffffff">mdi-keyboard-return</v-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ totalReturns.toLocaleString() }}</div>
          <div class="metric-label">{{ $t('analytics.stats.totalReturns') }}</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon warning">
          <v-icon size="24" color="#ffffff">mdi-percent</v-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ returnRate.toFixed(1) }}%</div>
          <div class="metric-label">{{ $t('analytics.stats.returnRate') }}</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon info">
          <v-icon size="24" color="#ffffff">mdi-currency-usd</v-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">${{ returnValue.toLocaleString() }}</div>
          <div class="metric-label">{{ $t('analytics.stats.returnValue') }}</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon success">
          <v-icon size="24" color="#ffffff">mdi-package-variant</v-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ totalQuantity.toLocaleString() }}</div>
          <div class="metric-label">{{ $t('analytics.stats.unitsReturned') }}</div>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="main-chart">
        <div class="chart-header">
          <h3>{{ $t('analytics.charts.returnsDynamics') }}</h3>
          <div class="chart-period">{{ chartPeriodText }}</div>
        </div>
        <div class="chart-content">
          <svg width="100%" height="400" viewBox="0 0 1000 400">
            <defs>
              <linearGradient id="returnsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.1" />
              </linearGradient>
            </defs>
            
            <!-- Grid lines -->
            <g v-for="(line, index) in gridLines" :key="'grid-' + index">
              <line 
                :x1="50" 
                :y1="line.y" 
                :x2="950" 
                :y2="line.y" 
                stroke="#e5e7eb" 
                stroke-width="1"
              />
              <text 
                :x="40" 
                :y="line.y + 4" 
                font-size="12" 
                fill="#6b7280" 
                text-anchor="end"
              >
                {{ line.value }}
              </text>
            </g>
            
            <!-- Returns area -->
            <path
              :d="returnsPath"
              fill="url(#returnsGradient)"
              stroke="#ef4444"
              stroke-width="3"
            />
            
            <!-- Data points -->
            <circle
              v-for="(point, index) in returnsPoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="6"
              fill="#ef4444"
              stroke="white"
              stroke-width="2"
              @mouseover="showTooltip(point, index)"
              @mouseleave="hideTooltip"
              class="data-point"
            />
            
            <!-- X-axis labels -->
            <g v-for="(point, index) in returnsPoints" :key="'label-' + index">
              <text 
                :x="point.x" 
                :y="385" 
                font-size="12" 
                fill="#6b7280" 
                text-anchor="middle"
              >
                {{ formatXAxisLabel(returnsData[index]) }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div class="side-stats">
        <div class="stat-block">
          <h4>Причины возвратов</h4>
          <div class="reasons-list">
            <div 
              v-for="(reason, index) in returnReasons" 
              :key="index" 
              class="reason-item"
            >
              <div class="reason-indicator" :style="{ backgroundColor: reason.color }"></div>
              <div class="reason-info">
                <div class="reason-name">{{ reason.reason }}</div>
                <div class="reason-count">{{ reason.count }} случаев</div>
              </div>
              <div class="reason-percentage">{{ ((reason.count / totalReturns) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <div class="stat-block">
          <h4>Статистика по периодам</h4>
          <div class="period-stats">
            <div class="period-item">
              <span class="period-label">Сегодня:</span>
              <span class="period-value">{{ todayReturns.toLocaleString() }}</span>
            </div>
            <div class="period-item">
              <span class="period-label">Вчера:</span>
              <span class="period-value">{{ yesterdayReturns.toLocaleString() }}</span>
            </div>
            <div class="period-item">
              <span class="period-label">Эта неделя:</span>
              <span class="period-value">{{ weekReturns.toLocaleString() }}</span>
            </div>
            <div class="period-item">
              <span class="period-label">Прошлая неделя:</span>
              <span class="period-value">{{ lastWeekReturns.toLocaleString() }}</span>
            </div>
            <div class="period-item">
              <span class="period-label">Этот месяц:</span>
              <span class="period-value">{{ monthReturns.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div 
      v-if="tooltip.visible" 
      class="chart-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">{{ tooltip.date }}</div>
      <div class="tooltip-content">
        <span class="tooltip-label">Возвраты:</span>
        <span class="tooltip-value">{{ tooltip.value }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ReturnsAnalytics',
  data() {
    return {
      timeFilter: 'day',
      totalReturns: 0,
      returnRate: 0,
      returnValue: 0,
      totalQuantity: 0,
      todayReturns: 0,
      yesterdayReturns: 0,
      weekReturns: 0,
      lastWeekReturns: 0,
      monthReturns: 0,
      returnsData: [],
      returnReasons: [
        { reason: 'Дефект товара', count: 45, color: '#ef4444' },
        { reason: 'Не подошел размер', count: 32, color: '#f97316' },
        { reason: 'Не соответствует описанию', count: 28, color: '#eab308' },
        { reason: 'Передумал', count: 15, color: '#22c55e' },
        { reason: 'Другое', count: 8, color: '#6366f1' }
      ],
      tooltip: {
        visible: false,
        x: 0,
        y: 0,
        date: '',
        value: ''
      }
    }
  },
  computed: {
    chartPeriodText() {
      const periods = {
        hour: 'За последние 24 часа',
        day: 'За последние 30 дней',
        week: 'За последние 12 недель',
        month: 'За последние 12 месяцев'
      }
      return periods[this.timeFilter]
    },
    gridLines() {
      const maxValue = Math.max(...this.returnsData.map(d => d.value))
      const lines = []
      for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * i)
        const y = 350 - (i * 70)
        lines.push({ y, value })
      }
      return lines
    },
    returnsPoints() {
      if (!this.returnsData.length) return []
      const maxValue = Math.max(...this.returnsData.map(d => d.value))
      const width = 900
      const stepX = width / (this.returnsData.length - 1)
      
      return this.returnsData.map((item, index) => ({
        x: 50 + (index * stepX),
        y: 350 - ((item.value / maxValue) * 300)
      }))
    },
    returnsPath() {
      if (!this.returnsPoints.length) return ''
      
      let path = `M 50 350`
      this.returnsPoints.forEach(point => {
        path += ` L ${point.x} ${point.y}`
      })
      path += ` L 950 350 Z`
      
      return path
    }
  },
  mounted() {
    this.loadReturnsData()
  },
  watch: {
    timeFilter() {
      this.loadReturnsData()
    }
  },
  methods: {
    async loadReturnsData() {
      try {
        // Загрузка данных с бэкенда
        const response = await api.get('/analytics/returns-stats')
        const data = response.data
        
        this.totalReturns = data.totalReturns || 128
        this.returnRate = data.returnRate || 3.2
        this.returnValue = data.returnValue || 15420
        this.totalQuantity = data.totalQuantity || 156
        this.todayReturns = data.todayReturns || 8
        this.yesterdayReturns = data.yesterdayReturns || 12
        this.weekReturns = data.weekReturns || 45
        this.lastWeekReturns = data.lastWeekReturns || 38
        this.monthReturns = data.monthReturns || 128
        
        this.generateChartData()
      } catch (error) {
        console.error('Ошибка загрузки данных возвратов:', error)
        this.generateMockData()
      }
    },
    generateChartData() {
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12
      }
      
      const count = periods[this.timeFilter]
      this.returnsData = Array.from({ length: count }, (_, i) => {
        const date = new Date()
        
        switch (this.timeFilter) {
          case 'hour':
            date.setHours(date.getHours() - (count - 1 - i))
            break
          case 'day':
            date.setDate(date.getDate() - (count - 1 - i))
            break
          case 'week':
            date.setDate(date.getDate() - (count - 1 - i) * 7)
            break
          case 'month':
            date.setMonth(date.getMonth() - (count - 1 - i))
            break
        }
        
        return {
          date,
          value: Math.floor(Math.random() * 20) + 5
        }
      })
    },
    generateMockData() {
      this.totalReturns = 128
      this.returnRate = 3.2
      this.returnValue = 15420
      this.totalQuantity = 156
      this.todayReturns = 8
      this.yesterdayReturns = 12
      this.weekReturns = 45
      this.lastWeekReturns = 38
      this.monthReturns = 128
      
      this.generateChartData()
    },
    formatXAxisLabel(dataPoint) {
      const date = dataPoint.date
      
      switch (this.timeFilter) {
        case 'hour':
          return date.getHours().toString().padStart(2, '0') + ':00'
        case 'day':
          return `${date.getDate()}/${date.getMonth() + 1}`
        case 'week':
          return `${date.getDate()}/${date.getMonth() + 1}`
        case 'month':
          return date.toLocaleDateString('ru-RU', { month: 'short' })
        default:
          return ''
      }
    },
    showTooltip(point, index) {
      const dataPoint = this.returnsData[index]
      this.tooltip = {
        visible: true,
        x: point.x + 10,
        y: point.y - 10,
        date: dataPoint.date.toLocaleDateString('ru-RU'),
        value: dataPoint.value.toString()
      }
    },
    hideTooltip() {
      this.tooltip.visible = false
    }
  }
}
</script>

<style scoped>
.returns-analytics {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.time-filters .filter-toggle {
  border-radius: 8px;
  overflow: hidden;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.returns { background: #ef4444; }
.metric-icon.warning { background: #f59e0b; }
.metric-icon.info { background: #3b82f6; }
.metric-icon.success { background: #10b981; }

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.metric-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.main-chart {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.chart-period {
  font-size: 14px;
  color: #64748b;
}

.chart-content {
  position: relative;
}

.data-point {
  cursor: pointer;
  transition: r 0.2s;
}

.data-point:hover {
  r: 8;
}

.side-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stat-block {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-block h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.reasons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  transition: background 0.2s;
}

.reason-item:hover {
  background: #f1f5f9;
}

.reason-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.reason-info {
  flex: 1;
}

.reason-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.reason-count {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.reason-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.period-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.period-item:last-child {
  border-bottom: none;
}

.period-label {
  font-size: 14px;
  color: #64748b;
}

.period-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-content {
  display: flex;
  gap: 8px;
}

.tooltip-label {
  color: #d1d5db;
}

.tooltip-value {
  font-weight: 600;
}

@media (max-width: 1024px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .metrics-row {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .returns-analytics {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>