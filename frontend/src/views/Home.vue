<template>
  <div class="main-content">
    <div class="button-row">
      <router-link class="my-btn" to="/analytics">
        <div class="btn-label">{{ $t('navigation.revenue') }}</div>
        <div class="value-row">
          <span class="score">${{ formatTodayRevenue }}</span>
          <span class="dollar-sign-circle">
            <v-icon class="icon" size="32">mdi-cash</v-icon>
          </span>
        </div>
      </router-link>
      <router-link class="my-btn" to="/analytics/orders">
        <div class="btn-label">{{ $t('navigation.orders') }}</div>
        <div class="value-row">
          <span class="score">{{ todayOrders }}</span>
          <span class="dollar-sign-circle">
            <v-icon class="icon" size="32">mdi-cart</v-icon>
          </span>
        </div>
      </router-link>
      <router-link class="my-btn" to="/tasks">
        <div class="btn-label">{{ $t('navigation.tasks') }}</div>
        <div class="value-row">
          <span class="score">{{ totalTasks }}</span>
          <span class="dollar-sign-circle">
            <v-icon class="icon" size="32">mdi-check</v-icon>
          </span>
        </div>
      </router-link>
      <router-link class="my-btn" to="/customer">
        <div class="btn-label">{{ $t('navigation.users') }}</div>
        <div class="value-row">
          <span class="score">{{ usersCount }}</span>
          <span class="dollar-sign-circle">
            <v-icon class="icon" size="32">mdi-account-group</v-icon>
          </span>
        </div>
      </router-link>
    </div>
    
    <div class="charts-container">
      <div class="chart-block-side">
        <h1 class="chart-title">{{ $t('navigation.revenue') }}</h1>
        <h4 class="chart-subtitle">{{ $t('pages.home.weekly') }}</h4>
        <div class="chart-content">
          <svg width="100%" height="340" viewBox="0 0 350 340">
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="40%" style="stop-color:#87CEEB;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#a302d4;stop-opacity:1" />
              </linearGradient>
            </defs>
            <!-- Столбики для каждого дня -->
            <rect 
              v-for="(bar, index) in revenueBars" 
              :key="index"
              :x="bar.x" 
              :y="bar.y" 
              :width="bar.width" 
              :height="bar.height" 
              :fill="bar.fill"
              rx="4"
              @mouseover="showTooltip('Revenue', revenueData[index], days[index], bar.x + bar.width/2, bar.y)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"
            />
            <!-- Дни недели под столбцами -->
            <text 
              v-for="(bar, index) in revenueBars" 
              :key="'day-' + index"
              :x="bar.x + bar.width/2" 
              :y="320" 
              text-anchor="middle" 
              font-size="18" 
              font-weight="600" 
              fill="#374151"
            >
              {{ days[index] }}
            </text>
          </svg>
          
        </div>
        
        <!-- Tooltip для Revenue графика -->
        <div 
          v-if="tooltip.visible && tooltip.type === 'Revenue'" 
          class="chart-tooltip"
          :class="{ 'tooltip-above': tooltip.showAbove, 'tooltip-below': !tooltip.showAbove }"
          :style="{ 
            left: tooltip.leftPercent + '%', 
            top: tooltip.topPercent + '%'
          }"
        >
          <div class="tooltip-title">{{ tooltip.day }}</div>
          <div class="tooltip-content">
            <span class="tooltip-label">{{ tooltip.type }}:</span>
            <span class="tooltip-value">${{ tooltip.value }}</span>
          </div>
        </div>
      </div>

      <div class="chart-block-center">
        <h1 class="chart-title">{{ $t('pages.home.activity') }}</h1>
        <h4 class="chart-subtitle">{{ $t('pages.home.last7days') }}</h4>
        <div class="chart-content" style="position: relative;">
          <svg width="100%" height="450" viewBox="0 0 1100 450">
              <defs>
                <linearGradient id="tasksGradient" x1="10%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#a302d4;stop-opacity:0.6" />
                  <stop offset="100%" style="stop-color:#a302d4;stop-opacity:0.1" />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:0.6" />
                  <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:0.1" />
                </linearGradient>
              </defs>
              
              <!-- Волнообразные области -->
              <path :d="tasksWavePath" fill="url(#tasksGradient)" />
              <path :d="ordersWavePath" fill="url(#ordersGradient)" />
              
              <!-- Волнообразные линии -->
              <path :d="tasksWaveLine" fill="none" stroke="#8b5cf6" stroke-width="" stroke-linecap="round" />
              <path :d="ordersWaveLine" fill="none" stroke="#06b6d4" stroke-width="0" stroke-linecap="round" />
              
              <!-- Точки данных с tooltip -->
              <g v-for="(point, index) in tasksWavePoints" :key="'task-' + index">
                <circle 
                  :cx="point.x" 
                  :cy="point.y" 
                  r="10" 
                  fill="#8b5cf6" 
                  stroke="white" 
                  stroke-width="4"
                  @mouseover="showTooltip('Tasks', tasksData[index], days[index], point.x, point.y)"
                  @mouseleave="hideTooltip"
                  @click="navigateToTasks"
                  style="cursor: pointer;"
                />
              </g>
              <g v-for="(point, index) in ordersWavePoints" :key="'order-' + index">
                <circle 
                  :cx="point.x" 
                  :cy="point.y" 
                  r="10" 
                  fill="#06b6d4" 
                  stroke="white" 
                  stroke-width="4"
                  @mouseover="showTooltip('Orders', ordersData[index], days[index], point.x, point.y)"
                  @mouseleave="hideTooltip"
                  style="cursor: pointer;"
                />
              </g>
              
              <!-- Легенда Tasks и Orders по центру -->
              <g>
                <!-- Tasks -->
                <circle cx="450" cy="415" r="8" fill="#a302d4" />
                <text x="468" y="421" font-size="20" font-weight="600" fill="#374151">{{ $t('pages.home.tasks') }}</text>
                
                <!-- Orders -->
                <circle cx="580" cy="415" r="8" fill="#87CEEB" />
                <text x="598" y="421" font-size="20" font-weight="600" fill="#374151">{{ $t('pages.home.orders') }}</text>
              </g>
            </svg>
          
          <!-- Tooltip с умным позиционированием -->
          <div 
            v-if="tooltip.visible && (tooltip.type === 'Tasks' || tooltip.type === 'Orders')" 
            class="chart-tooltip"
            :class="{ 'tooltip-above': tooltip.showAbove, 'tooltip-below': !tooltip.showAbove }"
            :style="{ 
              left: tooltip.leftPercent + '%', 
              top: tooltip.topPercent + '%'
            }"
          >
            <div class="tooltip-title">{{ tooltip.day }}</div>
            <div class="tooltip-content">
              <span class="tooltip-label">{{ tooltip.type }}:</span>
              <span class="tooltip-value">{{ tooltip.value }}</span>
            </div>
          </div>
          

        </div>
      </div>

      <div class="chart-block-side" :class="{ 'hidden-by-notifications': notificationsOpen }">
        <h1 class="chart-title">{{ $t('pages.home.users') }}</h1>
        <h4 class="chart-subtitle">{{ $t('pages.home.total') }}: {{ usersCount }}</h4>
        <div class="chart-content">
          <div class="users-chart">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#a302d4;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r="80" fill="none" stroke="#f1f5f9" stroke-width="16" />
              <circle 
                cx="140" 
                cy="140" 
                r="80" 
                fill="none" 
                stroke="url(#usersGradient)" 
                stroke-width="16" 
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="offset"
                transform="rotate(-90 140 140)"
                class="progress-circle"
              />
              <text x="140" y="130" text-anchor="middle" font-size="18" font-weight="600" fill="#64748b">
                {{ $t('pages.home.active') }}
              </text>
              <text x="140" y="155" text-anchor="middle" font-size="28" font-weight="bold" fill="#1e293b">
                {{ activePercentage }}%
              </text>
            </svg>
          </div>
          <div class="users-stats">
            <div class="stat-row">
              <span>{{ $t('pages.home.active') }}:</span>
              <span>{{ activeUsers }}</span>
            </div>
            <div class="stat-row">
              <span>{{ $t('pages.home.inactive') }}:</span>
              <span>{{ inactiveUsers }}</span>
            </div>
            <div class="stat-row">
              <span>{{ $t('pages.home.newToday') }}:</span>
              <span>{{ newToday }}</span>
            </div>
          </div>
          <div v-if="notification" class="notification" :class="notification.type">
            {{ notification.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

let EventBus, EVENTS
try {
  const eventBusModule = require('@/utils/EventBus.js')
  EventBus = eventBusModule.EventBus
  EVENTS = eventBusModule.EVENTS
} catch (error) {
  console.warn('EventBus not found, working without real-time updates')
}

export default {
  name: 'Home',
  data() {
    return {
      revenueData: [1200, 1500, 980, 2100, 1800, 2300, 2000],
      tasksData: [12, 19, 15, 25, 22, 30, 28],
      ordersData: [5, 8, 6, 12, 9, 15, 13],
      usersCount: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      newToday: 0,
      notification: null,
      todayOrders: 0,
      totalTasks: 0,
      todayRevenue: 0,
      totalRevenue: 0,
      todayOrdersList: [],
      notificationsOpen: false, // Отслеживание состояния панели уведомлений
      tooltip: {
        visible: false,
        x: 0,
        y: 0,
        leftPercent: 0,
        topPercent: 0,
        showAbove: true,
        type: '',
        value: 0,
        day: ''
      },
    }
  },
  computed: {
    days() {
      const today = new Date()
      const daysArray = []
      const dayNames = [
        this.$t('pages.home.days.sun'),
        this.$t('pages.home.days.mon'),
        this.$t('pages.home.days.tue'),
        this.$t('pages.home.days.wed'),
        this.$t('pages.home.days.thu'),
        this.$t('pages.home.days.fri'),
        this.$t('pages.home.days.sat')
      ]
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        daysArray.push(dayNames[date.getDay()])
      }
      
      return daysArray
    },
    formatRevenue() {
      const total = this.revenueData.reduce((sum, val) => sum + val, 0)
      return (total / 1000).toFixed(1) + 'K'
    },
    formatTodayRevenue() {
      if (this.todayRevenue >= 1000) {
        return (this.todayRevenue / 1000).toFixed(1) + 'K'
      }
      return this.todayRevenue.toFixed(0)
    },
    activePercentage() {
      if (this.usersCount === 0) return 0
      return Math.round((this.activeUsers / this.usersCount) * 100)
    },
    circumference() {
      return 2 * Math.PI * 80
    },
    offset() {
      return this.circumference - (this.activePercentage / 100) * this.circumference
    },
    revenuePointsArray() {
      return this.revenueData.map((value, index) => {
        const x = 30 + (index / (this.revenueData.length - 1)) * 290
        const y = 250 - (value / Math.max(...this.revenueData)) * 180
        return { x, y }
      })
    },
    revenuePoints() {
      return this.revenuePointsArray.map(point => `${point.x},${point.y}`).join(' ')
    },
    revenuePath() {
      const points = this.revenuePointsArray.map(point => `${point.x},${point.y}`).join(' L ')
      return `M 30,270 L ${points} L 320,270 Z`
    },
    revenueBars() {
      const maxValue = Math.max(...this.revenueData, 1)
      const barWidth = 35
      const barSpacing = 8
      const chartWidth = 280
      const chartHeight = 220
      const startX = 35
      const minHeight = 15
      
      return this.revenueData.map((value, index) => {
        let height
        if (value === 0) {
          height = minHeight
        } else {
          height = Math.max((value / maxValue) * (chartHeight - minHeight) + minHeight, minHeight)
        }
        
        const x = startX + index * (barWidth + barSpacing)
        const y = 287 - height
        const fill = value === 0 ? '#e2e8f0' : 'url(#revenueGradient)'
        
        return {
          x,
          y,
          width: barWidth,
          height,
          fill
        }
      })
    },
    tasksPointsArray() {
      return this.tasksData.map((value, index) => {
        const x = 30 + (index / (this.tasksData.length - 1)) * 340
        const y = 250 - (value / Math.max(...this.tasksData, ...this.ordersData)) * 180
        return { x, y }
      })
    },
    tasksPoints() {
      return this.tasksPointsArray.map(point => `${point.x},${point.y}`).join(' ')
    },
    tasksPath() {
      const points = this.tasksPointsArray.map(point => `${point.x},${point.y}`).join(' L ')
      return `M 30,260 L ${points} L 370,260 Z`
    },
    ordersPointsArray() {
      return this.ordersData.map((value, index) => {
        const x = 30 + (index / (this.ordersData.length - 1)) * 340
        const y = 250 - (value / Math.max(...this.tasksData, ...this.ordersData)) * 180
        return { x, y }
      })
    },
    ordersPoints() {
      return this.ordersPointsArray.map(point => `${point.x},${point.y}`).join(' ')
    },
    ordersPath() {
      const points = this.ordersPointsArray.map(point => `${point.x},${point.y}`).join(' L ')
      return `M 30,260 L ${points} L 370,260 Z`
    },
    
    tasksWavePoints() {
      return this.tasksData.map((value, index) => {
        const x = 70 + (index / (this.tasksData.length - 1)) * 960
        const y = 350 - (value / Math.max(...this.tasksData, ...this.ordersData, 1)) * 280
        return { x, y }
      })
    },
    
    ordersWavePoints() {
      return this.ordersData.map((value, index) => {
        const x = 70 + (index / (this.ordersData.length - 1)) * 960
        const y = 350 - (value / Math.max(...this.tasksData, ...this.ordersData, 1)) * 280
        return { x, y }
      })
    },
    
    
    tasksWaveLine() {
      if (this.tasksWavePoints.length < 2) return ''
      
      let path = `M ${this.tasksWavePoints[0].x} ${this.tasksWavePoints[0].y}`
      
      for (let i = 1; i < this.tasksWavePoints.length; i++) {
        const prev = this.tasksWavePoints[i - 1]
        const curr = this.tasksWavePoints[i]
        
        const cp1x = prev.x + (curr.x - prev.x) * 0.4
        const cp1y = prev.y + Math.sin(i * 1.5) * 35
        const cp2x = curr.x - (curr.x - prev.x) * 0.4
        const cp2y = curr.y + Math.sin(i * 1.5 + 1) * 35
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      }
      
      return path
    },
    
    ordersWaveLine() {
      if (this.ordersWavePoints.length < 2) return ''
      
      let path = `M ${this.ordersWavePoints[0].x} ${this.ordersWavePoints[0].y}`
      
      for (let i = 1; i < this.ordersWavePoints.length; i++) {
        const prev = this.ordersWavePoints[i - 1]
        const curr = this.ordersWavePoints[i]
        
        const cp1x = prev.x + (curr.x - prev.x) * 0.4
        const cp1y = prev.y + Math.sin(i * 1.5 + 2) * 30
        const cp2x = curr.x - (curr.x - prev.x) * 0.4
        const cp2y = curr.y + Math.sin(i * 1.5 + 3) * 30
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      }
      
      return path
    },
    
    tasksWavePath() {
      if (this.tasksWavePoints.length < 2) return ''
      
      let path = `M 70 390 L ${this.tasksWavePoints[0].x} ${this.tasksWavePoints[0].y}`
      
      for (let i = 1; i < this.tasksWavePoints.length; i++) {
        const prev = this.tasksWavePoints[i - 1]
        const curr = this.tasksWavePoints[i]
        
        const cp1x = prev.x + (curr.x - prev.x) * 0.4
        const cp1y = prev.y + Math.sin(i * 1.5) * 35
        const cp2x = curr.x - (curr.x - prev.x) * 0.4
        const cp2y = curr.y + Math.sin(i * 1.5 + 1) * 35
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      }
      
      path += ` L 1030 390 Z`
      return path
    },
    
    ordersWavePath() {
      if (this.ordersWavePoints.length < 2) return ''
      
      let path = `M 70 390 L ${this.ordersWavePoints[0].x} ${this.ordersWavePoints[0].y}`
      
      for (let i = 1; i < this.ordersWavePoints.length; i++) {
        const prev = this.ordersWavePoints[i - 1]
        const curr = this.ordersWavePoints[i]
        
        const cp1x = prev.x + (curr.x - prev.x) * 0.4
        const cp1y = prev.y + Math.sin(i * 1.5 + 2) * 30
        const cp2x = curr.x - (curr.x - prev.x) * 0.4
        const cp2y = curr.y + Math.sin(i * 1.5 + 3) * 30
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      } 
      
      path += ` L 1030 390 Z`
      return path
    },
    
    totalWeeklyTasks() {
      return this.tasksData.reduce((sum, val) => sum + val, 0)
    },
    
    totalWeeklyOrders() {
      return this.ordersData.reduce((sum, val) => sum + val, 0)
    }
  },
  watch: {
    '$i18n.locale'() {
      // Принудительно обновляем компонент при смене языка
      this.$forceUpdate()
    }
  },
  methods: {
    async fetchCustomersData() {
      try {
        const res = await api.get('/customers')
        const customers = res.data
        const total = customers.length
        const today = new Date().toISOString().split('T')[0]
        const newToday = customers.filter(customer => customer.date && customer.date.startsWith(today)).length
        const active = customers.filter(customer => {
          const hasDeals = customer.deals && customer.deals !== ''
          const recentDate = customer.date && this.isRecentDate(customer.date)
          return hasDeals || recentDate
        }).length
        this.usersCount = total
        this.activeUsers = active
        this.inactiveUsers = total - active
        this.newToday = newToday
      } catch (error) {
        console.error('Error fetching customers:', error)
        this.usersCount = 0
        this.activeUsers = 0
        this.inactiveUsers = 0
        this.newToday = 0
      }
    },
    async fetchTodayOrders() {
      try {
        const res = await api.get('/purchases/today/count')
        this.todayOrders = res.data.count
      } catch (error) {
        console.error('Error fetching today\'s orders:', error)
        this.todayOrders = 0
      }
    },
    isRecentDate(date) {
      if (!date) return false
      const customerDate = new Date(date)
      const now = new Date()
      const diffTime = Math.abs(now - customerDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30
    },

    showNotification(message, type = 'success') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 3001)
    },
    handleCustomersChanged(data) {
      this.usersCount = data.total
      this.activeUsers = data.active
      this.inactiveUsers = data.inactive
      this.newToday = data.newToday
      this.showNotification('Users data updated!', 'info')
    },
    handleTasksChanged(data) {
      this.totalTasks = data.totalTasks
      if (Array.isArray(data.tasksData) && data.tasksData.length === 7) {
        this.tasksData = data.tasksData
      }
      this.showNotification('Tasks data updated!', 'info')
    },
    
    async fetchTodayRevenue() {
      try {
        const res = await api.get('/purchases')
        const purchasesData = res.data
        
        // Calculate today's data
        const today = new Date().toISOString().split('T')[0]
        const todayPurchases = purchasesData.filter(p => p.date.startsWith(today))
        this.todayOrders = todayPurchases.length
        this.todayRevenue = todayPurchases.reduce((sum, p) => sum + p.total, 0)
        
        this.todayOrdersList = todayPurchases
      } catch (error) {
        console.error('Ошибка при получении данных за день:', error)
        this.todayRevenue = 0
        this.todayOrders = 0
        this.todayOrdersList = []
      }
    },
    
    async fetchWeeklyTasks() {
      try {
        const saved = localStorage.getItem('tasks-list')
        if (saved) {
          const tasks = JSON.parse(saved)
          this.totalTasks = tasks.length
          
          const weeklyData = Array(7).fill(0)
          const today = new Date()
          today.setHours(23, 59, 59, 999)
          
          tasks.forEach(task => {
            let taskDate
            if (task.dueDate) {
              taskDate = new Date(task.dueDate)
            } else {
              taskDate = new Date(task.id)
            }
            
            const daysDiff = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 && daysDiff < 7) {
              weeklyData[6 - daysDiff]++
            }
          })
          
          this.tasksData = weeklyData
          console.log('Tasks data for last 7 days:', weeklyData, 'Total:', this.totalTasks)
        } else {
          this.tasksData = Array(7).fill(0)
          this.totalTasks = 0
        }
      } catch (error) {
        console.error('Error fetching weekly tasks:', error)
        this.tasksData = Array(7).fill(0)
        this.totalTasks = 0
      }
    },
    
    async fetchWeeklyOrders() {
      try {
        const res = await api.get('/purchases')
        const purchases = res.data
        
        const weeklyData = Array(7).fill(0)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        
        purchases.forEach(purchase => {
          if (purchase.date) {
            const purchaseDate = new Date(purchase.date)
            const daysDiff = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 && daysDiff < 7) {
              weeklyData[6 - daysDiff]++
            }
          }
        })
        
        this.ordersData = weeklyData
        console.log('Orders data for last 7 days:', weeklyData, 'Total orders:', purchases.length)
      } catch (error) {
        console.error('Error fetching weekly orders:', error)
        this.ordersData = Array(7).fill(0)
      }
    },
    
    async fetchWeeklyRevenue() {
      try {
        const res = await api.get('/purchases')
        const purchases = res.data
        
        const weeklyData = Array(7).fill(0)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        
        purchases.forEach(purchase => {
          if (purchase.date && purchase.total) {
            const purchaseDate = new Date(purchase.date)
            const daysDiff = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 && daysDiff < 7) {
              weeklyData[6 - daysDiff] += purchase.total
            }
          }
        })
        
        this.revenueData = weeklyData
        console.log('Revenue data for last 7 days:', weeklyData)
      } catch (error) {
        console.error('Error fetching weekly revenue:', error)
        this.revenueData = Array(7).fill(0)
      }
    },
    
    showTooltip(type, value, day, svgX, svgY) {
      // Умное позиционирование tooltip
      let svgWidth, svgHeight
      
      // Определяем размеры SVG в зависимости от типа графика
      if (type === 'Revenue') {
        svgWidth = 350
        svgHeight = 300
      } else {
        svgWidth = 1100
        svgHeight = 450
      }
      
      // Конвертируем SVG координаты в проценты
      let leftPercent = (svgX / svgWidth) * 100
      let topPercent = (svgY / svgHeight) * 100
      
      // Определяем, показывать tooltip выше или ниже точки
      const showAbove = svgY < 100 // Если точка в верхней четверти графика
      
      // Корректируем позицию для предотвращения выхода за границы
      if (leftPercent < 10) {
        leftPercent = 10
      } else if (leftPercent > 85) {
        leftPercent = 85
      }
      
      if (showAbove) {
        topPercent = topPercent + 15 // Показываем ниже точки
      } else {
        topPercent = topPercent - 8 // Показываем выше точки
      }
      
      // Убеждаемся, что tooltip не выходит за границы по вертикали
      if (topPercent < 5) {
        topPercent = 5
      } else if (topPercent > 90) {
        topPercent = 90
      }
      
      this.tooltip = {
        visible: true,
        x: svgX,
        y: svgY,
        leftPercent: leftPercent,
        topPercent: topPercent,
        showAbove: !showAbove, // Инвертируем для CSS класса
        type: type,
        value: value,
        day: day
      }
    },
    
    hideTooltip() {
      this.tooltip.visible = false
    },
    
    navigateToTasks() {
      this.$router.push('/tasks')
    },
    
    navigateToOrders() {
      this.$router.push('/product')
    }
  },
  mounted() {
    this.fetchCustomersData()
    this.fetchTodayOrders()
    this.fetchTodayRevenue()
    this.fetchWeeklyTasks()
    this.fetchWeeklyOrders()
    this.fetchWeeklyRevenue()
    
    const saved = localStorage.getItem('tasks-list');
    if (saved) {
      const tasks = JSON.parse(saved);
      this.totalTasks = tasks.length;
    }
    if (EventBus && EVENTS) {
      EventBus.$on(EVENTS.CUSTOMERS_CHANGED, this.handleCustomersChanged)
      EventBus.$on('TASKS_CHANGED', this.handleTasksChanged)
      EventBus.$on(EVENTS.CUSTOMER_ADDED, (data) => {
        this.showNotification(`Customer "${data.customer.name}" added`, 'success')
        setTimeout(() => this.fetchCustomersData(), 500)
      })
      EventBus.$on(EVENTS.CUSTOMER_DELETED, (data) => {
        this.showNotification(`Customer "${data.customerName}" deleted`, 'warning')
        setTimeout(() => this.fetchCustomersData(), 500)
      })
      EventBus.$on(EVENTS.CUSTOMER_UPDATED, (data) => {
        this.showNotification(`Customer "${data.customer.name}" updated`, 'info')
        setTimeout(() => this.fetchCustomersData(), 500)
      })
      EventBus.$on(EVENTS.PURCHASE_ADDED, () => {
        this.todayOrders++
        this.fetchTodayRevenue()
        this.fetchWeeklyOrders()
        this.fetchWeeklyRevenue()
      })
      
      EventBus.$on('TASKS_CHANGED', (data) => {
        this.handleTasksChanged(data)
        this.fetchWeeklyTasks()
      })
      
      // Отслеживание состояния панели уведомлений
      EventBus.$on('notifications-opened', () => {
        this.notificationsOpen = true
      })
      EventBus.$on('notifications-closed', () => {
        this.notificationsOpen = false
      })
    }
    
    setInterval(() => {
      this.fetchWeeklyTasks()
      this.fetchWeeklyOrders()
      this.fetchWeeklyRevenue()
      this.fetchCustomersData()
      this.fetchTodayRevenue()
    }, 30000)
  },
  beforeDestroy() {
    if (EventBus && EVENTS) {
      EventBus.$off(EVENTS.CUSTOMERS_CHANGED, this.handleCustomersChanged)
      EventBus.$off('TASKS_CHANGED', this.handleTasksChanged)
      EventBus.$off(EVENTS.CUSTOMER_ADDED)
      EventBus.$off(EVENTS.CUSTOMER_DELETED)
      EventBus.$off(EVENTS.CUSTOMER_UPDATED)
      EventBus.$off(EVENTS.PURCHASE_ADDED)
      EventBus.$off('notifications-opened')
      EventBus.$off('notifications-closed')
    }
  }
}
</script>

<style scoped>
.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 0 20px;
  background: #f8fafc;
}

.button-row {
  display: flex;
  flex-direction: row;
  gap: 40px;
  width: 100%;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: 30px;
}

.my-btn {
  width: 400px;
  height: 150px;
  background: linear-gradient(155deg, #a302d4, #87CEEB);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 40px;
  cursor: pointer;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 0 0 32px;
  text-decoration: none;
}

.my-btn:hover {
  background-color: #8a02b0;
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.3);
}

.value-row {
  display: flex;
  align-items: center;
  justify-content: space-between; 
  width: 100%;
  margin-bottom: 10px;
  position: relative;
  gap: 16px; 
}

.dollar-sign-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  color: #ffffff;
  border-radius: 50%;
  font-size: 28px;
  font-weight: bold;
  margin-left: 0;
  margin-right: 20px;
  position: relative;
}

.icon {
  color: #ffffff;
  margin-right: 10px;
  margin-bottom: 10px;
}

.charts-container {
  display: flex;
  flex-direction: row;
  gap: 30px;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 800px;
  flex-wrap: nowrap;
}

.chart-block-center {
  width: 850px;
  height: 550px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  overflow: visible; 
}

.chart-block-side {
  width: 400px;
  height: 550px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  position: relative;
}

/* Скрытие только заголовка и подзаголовка блока пользователей когда открыты уведомления */
.chart-block-side:last-child.hidden-by-notifications .chart-title,
.chart-block-side:last-child.hidden-by-notifications .chart-subtitle {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.chart-title {
  font-size: 28px;
  color: #000000;
  margin: 0 0 5px 0;
  text-align: center;
  font-weight: 700;
  z-index: 10;
  position: relative;
}

.chart-subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin: 0 0 20px 0;
  text-align: center;
  z-index: 10;
  position: relative;
}

.chart-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: visible; /* Важно для tooltip */
}

.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  z-index: 10;
  position: relative;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.users-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  margin-top: -40px;
}

.users-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: -20px;
}

.stat-row {
  margin-top: 0;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 700;
  transition: background-color 0.3s ease;
  min-height: 40px;
  align-items: center;
}

.stat-row:hover {
  background: #f1f5f9;
}

.progress-circle {
  transition: stroke-dashoffset 2s ease-in-out;
}

/* Улучшенные стили для tooltip */
.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.chart-tooltip.tooltip-above {
  transform: translate(-50%, -120%);
}

.chart-tooltip.tooltip-below {
  transform: translate(-50%, 20%);
}

.chart-tooltip::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.chart-tooltip.tooltip-above::before {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px 5px 0 5px;
  border-color: rgba(0, 0, 0, 0.95) transparent transparent transparent;
}

.chart-tooltip.tooltip-below::before {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 5px 5px 5px;
  border-color: transparent transparent rgba(0, 0, 0, 0.95) transparent;
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 11px;
  color: #ccc;
  text-align: center;
}

.tooltip-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tooltip-label {
  font-weight: 500;
}

.tooltip-value {
  font-weight: bold;
  color: #87CEEB;
}

.notification {
  position: absolute;
  bottom: 10px;
  right: 10px;
  left: 10px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  animation: slideIn 0.3s ease-out;
  z-index: 10002;
}

.notification.success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.notification.warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.notification.info {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.score {
  animation: scoreUpdate 0.6s ease-out;
}

@keyframes scoreUpdate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  100% {
    transform: scale(1);
  }
}

.chart-block-side,
.chart-block-center {
  animation: fadeInUp 0.8s ease-out;
}

.chart-block-side:nth-child(1) { animation-delay: 0.2s; }
.chart-block-center:nth-child(2) { animation-delay: 0.4s; }
.chart-block-side:nth-child(3) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>