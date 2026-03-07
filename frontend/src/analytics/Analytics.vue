<template>
  <div class="analytics-main">
    <div class="page-header">
      <div class="date-info">
      </div>
    </div>

    <div class="analytics-grid">
      <router-link class="analytics-card revenue" to="/analytics/revenue">
        <div class="card-background-pattern"></div>
        <div class="analytics-header">{{ $t('pages.analytics.cards.revenue') }}</div>
        <div class="card-icon">
          <v-icon size="48" color="#ffffff">mdi-cash</v-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="card-content">
          <div class="card-title"></div>
          <div class="card-value">
            <span class="currency-symbol">$</span>
            <span class="value-number">{{ todayRevenue.toLocaleString() }}</span>
          </div>
          <div class="card-subtitle">
            <div class="subtitle-dot"></div>
            {{ $t('pages.analytics.subtitles.todayRevenue') }}
          </div>
        </div>
        <div class="card-chart">
          <svg class="mini-chart" viewBox="0 0 200 80">
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.3"/>
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0"/>
              </linearGradient>
            </defs>
            <path d="M0,70 Q50,50 100,30 T200,20" fill="none" stroke="#8b5cf6" stroke-width="3" class="chart-line"/>
            <path d="M0,70 Q50,50 100,30 T200,20 L200,80 L0,80 Z" fill="url(#revenueGradient)" class="chart-area"/>
            <circle cx="200" cy="20" r="4" fill="#8b5cf6" class="chart-dot"/>
          </svg>
          <div class="trend-indicator" :class="revenueTrend.isPositive ? 'positive' : 'negative'">
            <v-icon size="12" :color="revenueTrend.isPositive ? '#10b981' : '#ef4444'">
              {{ revenueTrend.isPositive ? 'mdi-trending-up' : 'mdi-trending-down' }}
            </v-icon>
            <span>{{ revenueTrend.isPositive ? '+' : '-' }}{{ revenueTrend.value }}%</span>
          </div>
        </div>
        <div class="card-hover-effect"></div>
      </router-link>

      <router-link class="analytics-card orders" to="/analytics/orders">
        <div class="card-background-pattern"></div>
        <div class="analytics-header">{{ $t('pages.analytics.cards.orders') }}</div>
        <div class="card-icon">
          <v-icon size="48" color="#ffffff">mdi-cart</v-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="card-content">
          <div class="card-title"></div>
          <div class="card-value">
            <span class="value-number">{{ totalOrders.toLocaleString() }}</span>
          </div>
          <div class="card-subtitle">
            <div class="subtitle-dot"></div>
            {{ $t('pages.analytics.subtitles.totalOrders') }}
          </div>
        </div>
        <div class="card-chart">
          <svg class="mini-chart" viewBox="0 0 200 80">
            <defs>
              <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.3"/>
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0"/>
              </linearGradient>
            </defs>
            <!-- Bar chart for orders -->
            <rect x="10" y="56" width="10" height="24" fill="#8b5cf6" opacity="0.6" rx="3"/>
            <rect x="25" y="44" width="10" height="36" fill="#8b5cf6" opacity="0.7" rx="3"/>
            <rect x="40" y="36" width="10" height="44" fill="#8b5cf6" opacity="0.8" rx="3"/>
            <rect x="55" y="30" width="10" height="50" fill="#8b5cf6" opacity="0.9" rx="3"/>
            <rect x="70" y="24" width="10" height="56" fill="#8b5cf6" rx="3"/>
            <rect x="85" y="40" width="10" height="40" fill="#8b5cf6" opacity="0.8" rx="3"/>
            <rect x="100" y="32" width="10" height="48" fill="#8b5cf6" opacity="0.9" rx="3"/>
            <rect x="115" y="20" width="10" height="60" fill="#8b5cf6" rx="3"/>
            <rect x="130" y="28" width="10" height="52" fill="#8b5cf6" opacity="0.9" rx="3"/>
            <rect x="145" y="16" width="10" height="64" fill="#8b5cf6" rx="3"/>
            <rect x="160" y="36" width="10" height="44" fill="#8b5cf6" opacity="0.8" rx="3"/>
            <rect x="175" y="24" width="10" height="56" fill="#8b5cf6" rx="3"/>
          </svg>
          <div class="trend-indicator" :class="ordersTrend.isPositive ? 'positive' : 'negative'">
            <v-icon size="12" :color="ordersTrend.isPositive ? '#10b981' : '#ef4444'">
              {{ ordersTrend.isPositive ? 'mdi-trending-up' : 'mdi-trending-down' }}
            </v-icon>
            <span>{{ ordersTrend.isPositive ? '+' : '-' }}{{ ordersTrend.value }}%</span>
          </div>
        </div>
        <div class="card-hover-effect"></div>
      </router-link>


      <router-link class="analytics-card users" to="/analytics/users">
        <div class="card-background-pattern"></div>
        <div class="analytics-header">{{ $t('pages.analytics.cards.users') }}</div>
        <div class="card-icon">
          <v-icon size="48" color="#ffffff">mdi-account-group</v-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="card-content">
          <div class="card-title"></div>
          <div class="card-value">
            <span class="value-number">{{ totalUsers.toLocaleString() }}</span>
          </div>
          <div class="card-subtitle">
            <div class="subtitle-dot"></div>
            {{ $t('pages.analytics.subtitles.totalUsers') }}
          </div>
        </div>
        <div class="card-chart">
          <svg class="mini-chart" viewBox="0 0 200 80">
            <!-- Wave pattern for user activity -->
            <path d="M0,50 Q25,30 50,50 T100,50 Q125,70 150,50 T200,50" 
                  fill="none" stroke="#8b5cf6" stroke-width="3" opacity="0.8" class="wave-line"/>
            <path d="M0,60 Q25,40 50,60 T100,60 Q125,40 150,60 T200,60" 
                  fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.5" class="wave-line"/>
            <!-- User activity indicators -->
            <circle cx="50" cy="50" r="3" fill="#10b981" class="activity-dot">
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="50" r="3" fill="#10b981" class="activity-dot">
              <animate attributeName="r" values="3;5;3" dur="2s" begin="0.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="150" cy="50" r="3" fill="#10b981" class="activity-dot">
              <animate attributeName="r" values="3;5;3" dur="2s" begin="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div class="trend-indicator" :class="usersTrend.isPositive ? 'positive' : 'negative'">
            <v-icon size="12" :color="usersTrend.isPositive ? '#10b981' : '#ef4444'">mdi-account-plus</v-icon>
            <span>{{ usersTrend.isPositive ? '+' : '' }}{{ usersTrend.value }} {{ $t('pages.analytics.trends.new') }}</span>
          </div>
        </div>
        <div class="card-hover-effect"></div>
      </router-link>

      <router-link class="analytics-card buy" to="/analytics/buy">
        <div class="card-background-pattern"></div>
        <div class="analytics-header">{{ $t('pages.analytics.cards.products') }}</div>
        <div class="card-icon">
          <v-icon size="48" color="#ffffff">mdi-shopping</v-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="card-content">
          <div class="card-title"></div>
          <div class="card-value">
            <span class="value-number">{{ totalPurchases.toLocaleString() }}</span>
          </div>
          <div class="card-subtitle">
            <div class="subtitle-dot"></div>
            {{ $t('pages.analytics.subtitles.totalProducts') }}
          </div>
        </div>
        <div class="card-chart">
          <svg class="mini-chart" viewBox="0 0 200 80">
            <!-- Spline curve for purchases -->
            <path d="M10,60 C30,40 50,70 80,50 C110,30 130,60 160,40 C180,20 190,30 190,30" 
                  fill="none" stroke="#8b5cf6" stroke-width="3"/>
            <!-- Purchase points -->
            <circle cx="30" cy="44" r="3" fill="#8b5cf6" opacity="0.8"/>
            <circle cx="80" cy="50" r="4" fill="#8b5cf6"/>
            <circle cx="130" cy="56" r="3" fill="#8b5cf6" opacity="0.8"/>
            <circle cx="160" cy="40" r="5" fill="#8b5cf6"/>
            <!-- Gradient area under curve -->
            <path d="M10,60 C30,40 50,70 80,50 C110,30 130,60 160,40 C180,20 190,30 190,30 L190,80 L10,80 Z" 
                  fill="url(#purchaseGradient)" opacity="0.3"/>
            <defs>
              <linearGradient id="purchaseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.4"/>
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="trend-indicator" :class="purchasesTrend.isPositive ? 'positive' : 'negative'">
            <v-icon size="12" :color="purchasesTrend.isPositive ? '#10b981' : '#ef4444'">mdi-cart-plus</v-icon>
            <span>{{ purchasesTrend.isPositive ? '+' : '-' }}{{ purchasesTrend.value }}%</span>
          </div>
        </div>
        <div class="card-hover-effect"></div>
      </router-link>



      <router-link class="analytics-card expenses" to="/analytics/expenses">
        <div class="card-background-pattern"></div>
        <div class="analytics-header">{{ $t('pages.analytics.cards.expenses') }}</div>
        <div class="card-icon">
          <v-icon size="48" color="#ffffff">mdi-cash-minus</v-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="card-content">
          <div class="card-title"></div>
          <div class="card-value">
            <span class="currency-symbol">$</span>
            <span class="value-number">{{ totalExpenses.toLocaleString() }}</span>
          </div>
          <div class="card-subtitle">
            <div class="subtitle-dot"></div>
            {{ $t('pages.analytics.subtitles.totalExpenses') }}
          </div>
        </div>
        <div class="card-chart">
          <svg class="mini-chart" viewBox="0 0 200 80">
            <defs>
              <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.3"/>
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0"/>
              </linearGradient>
            </defs>
            <path d="M0,40 Q50,60 100,50 T200,30" fill="none" stroke="#8b5cf6" stroke-width="3" class="chart-line"/>
            <path d="M0,40 Q50,60 100,50 T200,30 L200,80 L0,80 Z" fill="url(#expensesGradient)" class="chart-area"/>
            <circle cx="200" cy="30" r="4" fill="#8b5cf6" class="chart-dot"/>
          </svg>
          <div class="trend-indicator positive">
            <v-icon size="12" color="#10b981">mdi-trending-up</v-icon>
            <span>+12%</span>
          </div>
        </div>
        <div class="card-hover-effect"></div>
      </router-link>


    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'Analytics',
  data() {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalPurchases: 0,

      totalExpenses: 0,
      todayRevenue: 0,
      todayOrders: 0,
      activeUsers: 0,
      // Добавляем данные за предыдущий период для расчета трендов
      previousRevenue: 0,
      previousOrders: 0,
      previousUsers: 0,
      previousPurchases: 0,

      showExpenseForm: false,
      editingIndex: null,
      newExpense: {
        description: '',
        amount: '',
        category: '',
        date: ''
      },
      expenses: [],
      expenseHeaders: [
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Amount', value: 'amount', sortable: false },
        { text: 'Category', value: 'category', sortable: false },
        { text: 'Date', value: 'date', sortable: false },
        { text: 'Actions', value: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    currentDate() {
      return new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    // Добавляем computed свойства для расчета трендов
    revenueTrend() {
      if (this.previousRevenue === 0) return { value: 0, isPositive: true }
      const change = ((this.todayRevenue - this.previousRevenue) / this.previousRevenue) * 100
      return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0
      }
    },
    ordersTrend() {
      if (this.previousOrders === 0) return { value: 0, isPositive: true }
      const change = ((this.totalOrders - this.previousOrders) / this.previousOrders) * 100
      return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0
      }
    },
    usersTrend() {
      if (this.previousUsers === 0) return { value: 0, isPositive: true }
      const newUsers = this.totalUsers - this.previousUsers
      return {
        value: newUsers,
        isPositive: newUsers >= 0,
        label: 'New'
      }
    },
    purchasesTrend() {
      if (this.previousPurchases === 0) return { value: 0, isPositive: true }
      const change = ((this.totalPurchases - this.previousPurchases) / this.previousPurchases) * 100
      return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0
      }
    },

  },
  watch: {
    '$i18n.locale'() {
      // Принудительно обновляем компонент при смене языка
      this.$forceUpdate()
    }
  },
  mounted() {
    this.fetchAnalyticsData()
    this.fetchExpenses()
  },
  methods: {
    async fetchAnalyticsData() {
      try {
        // Fetch dashboard stats
        const dashboardRes = await api.get('/analytics/dashboard')
        const dashboardData = dashboardRes.data
        this.totalRevenue = (dashboardData.totalRevenue || 0) - this.totalExpenses
        this.totalOrders = dashboardData.totalSales || 0
        this.totalUsers = dashboardData.totalCustomers || 0

        const purchasesRes = await api.get('/purchases')
        const purchasesData = purchasesRes.data
        this.totalPurchases = purchasesData.length

        // Calculate today's data
        const today = new Date().toISOString().split('T')[0]
        const todayPurchases = purchasesData.filter(p => p.date.startsWith(today))
        this.todayRevenue = todayPurchases.reduce((sum, p) => sum + p.total, 0) - this.totalExpenses



        this.activeUsers = Math.floor(this.totalUsers * 0.7)

      } catch (error) {
        console.error('Error fetching analytics data:', error)
      }
    },
    
    async fetchExpenses() {
      try {
        const response = await api.get('/expenses')
        const data = response.data
        this.expenses = data
        this.totalExpenses = data.reduce((sum, expense) => sum + expense.amount, 0)
      } catch (error) {
        console.error('Error fetching expenses:', error)
        // Mock data for demonstration
        this.expenses = [
          { id: 1, description: 'Office Supplies', amount: 250, category: 'Office', date: '2024-01-15' },
          { id: 2, description: 'Marketing Campaign', amount: 1500, category: 'Marketing', date: '2024-01-14' },
          { id: 3, description: 'Software License', amount: 800, category: 'Software', date: '2024-01-13' }
        ]
        this.totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0)
      }
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU')
    },
    
    editExpense(index) {
      const expense = this.expenses[index]
      this.newExpense = {
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: expense.date
      }
      this.editingIndex = index
      this.showExpenseForm = true
    },
    
    deleteExpense(index) {
      if (confirm('Are you sure you want to delete this expense?')) {
        this.expenses.splice(index, 1)
        this.totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0)
        this.updateRevenue()
      }
    },
    
    addNewExpense() {
      this.showExpenseForm = true
      this.editingIndex = null
    },
    
    saveExpense() {
      if (this.newExpense.description && this.newExpense.amount && this.newExpense.category && this.newExpense.date) {
        if (this.editingIndex !== null) {
          // Update existing expense
          this.expenses[this.editingIndex] = {
            ...this.expenses[this.editingIndex],
            description: this.newExpense.description,
            amount: parseFloat(this.newExpense.amount),
            category: this.newExpense.category,
            date: this.newExpense.date
          }
        } else {
          // Add new expense
          this.expenses.push({
            id: Date.now(),
            description: this.newExpense.description,
            amount: parseFloat(this.newExpense.amount),
            category: this.newExpense.category,
            date: this.newExpense.date
          })
        }
        this.totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0)
         this.updateRevenue()
         this.cancelExpenseForm()
      }
    },
    
    cancelExpenseForm() {
       this.showExpenseForm = false
       this.editingIndex = null
       this.newExpense = {
         description: '',
         amount: '',
         category: '',
         date: ''
       }
     },
     
     updateRevenue() {
       // Recalculate revenue considering expenses
       const baseRevenue = 15420 // or get from API
       const baseTodayRevenue = 2340 // or get from API
       this.totalRevenue = baseRevenue - this.totalExpenses
       this.todayRevenue = baseTodayRevenue - this.totalExpenses
     }
  }
}
</script>

<style scoped>
.analytics-main {
  padding: 20px;
  background: #f8fafc;
  min-height: 150vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.analytics-grid {
  margin-top: -20px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
  margin-bottom: 40px;
  padding: 0 30px;
}

.analytics-card {
  background: rgb(255, 255, 255);
  border-radius: 20px;
  width: 100%;
  height: 800px;
  margin-left: 0;
  margin-right: 0;
  color: #1f2937;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 300px;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

/* Фоновый паттерн для карточек */
.card-background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  background-image: radial-gradient(circle at 50% 50%, #8b5cf6 2px, transparent 2px);
  background-size: 24px 24px;
  z-index: 1;
}

/* Верхний градиент */
.analytics-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 20px 20px 0 0;
  z-index: 2;
}

/* Эффект при наведении */
.card-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.05));
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 1;
  border-radius: 20px;
}

.analytics-card:hover {
  border: 1px solid #8b5cf6;
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
  color: #1f2937;
  text-decoration: none;
  transform: translateY(-2px);
}

.analytics-card:hover .card-hover-effect {
  opacity: 1;
}

.analytics-card:hover::before {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  height: 6px;
}

/* Улучшенная иконка */
.card-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  margin-top: 120px;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  min-height: 72px;
  position: relative;
  z-index: 3;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 3;
  position: relative;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
  letter-spacing: -0.025em;
}

.card-value {
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.currency-symbol {
  font-size: 20px;
  font-weight: 600;
  color: #8b5cf6;
  margin-right: 4px;
}

.value-number {
  font-size: 36px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.card-subtitle {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.subtitle-dot {
  width: 4px;
  height: 4px;
  background: #8b5cf6;
  border-radius: 50%;
}

/* Expenses карточка улучшения */
.analytics-card.expenses-wide {
  grid-column: span 5;
  min-height: 500px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
  margin-bottom: 24px;
}

.analytics-card.expenses-wide::before {
  display: none;
}

.expenses-card {
  margin-top: -150px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  height: 350px;
  width: 3000px;
  padding: 8px;
  overflow: hidden;
}

.expenses-card-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  margin: -8px -8px 0 -8px;
  padding: 24px 32px;
  border-radius: 24px 24px 0 0;
  border-bottom: 1px solid #e2e8f0;
}

.expenses-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expenses-title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expenses-icon {
  background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  margin: 24px 32px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.form-header {
  margin-bottom: 20px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.form-divider {
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 2px;
}

.custom-input {
  border-radius: 12px;
}

.form-actions {
  margin-top: 8px;
}

.elevated-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.elevated-btn:hover {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.cancel-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  border-color: #d1d5db;
  color: #6b7280;
}

.table-container {
  margin: 0 32px 32px 32px;
}

.custom-table {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.edit-btn, .delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.date-cell {
  font-weight: 500;
  color: #374151;
}

.amount-cell {
  font-weight: 700;
  color: #059669;
  font-family: 'Inter', monospace;
}

.currency {
  color: #8b5cf6;
  font-weight: 600;
}

.category-badge {
  background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
  color: #5b21b6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Стили для графиков */
.card-chart {
  width: 100%;
  padding: 0 16px;
  margin-bottom: 16px;
  position: relative;
  z-index: 3;
}

.mini-chart {
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
}

.chart-line, .smooth-line {
  stroke-dasharray: 300;
  stroke-dashoffset: 300;
  animation: drawLine 2s ease-out forwards;
}

.wave-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: drawWave 2.5s ease-out forwards;
}

.decline-line {
  stroke-dasharray: 300;
  stroke-dashoffset: -300;
  animation: drawDecline 2s ease-out forwards;
}

.chart-area {
  opacity: 0;
  animation: fadeInArea 1.5s ease-out 0.5s forwards;
}

.chart-dot, .pulse-dot {
  opacity: 0;
  animation: popIn 0.5s ease-out 1.5s forwards;
}

.pulse-dot {
  animation: popIn 0.5s ease-out 1.5s forwards, pulse 2s infinite 2s;
}

.progress-ring {
  transform-origin: center;
  animation: drawRing 2s ease-out forwards;
}

.activity-dot {
  opacity: 0;
  animation: popIn 0.3s ease-out 1s forwards;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.trend-indicator.positive {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.trend-indicator.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Анимации */
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawWave {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawDecline {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fadeInArea {
  to {
    opacity: 1;
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  80% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

@keyframes drawRing {
  from {
    stroke-dasharray: 0 100;
  }
  to {
    stroke-dasharray: 70 30;
  }
}

.analytics-header {
  font-size: 20px;
  font-weight: 800;
  color: #374151;
  text-align: center;
  margin-top: 50px;
  margin-bottom: 10px;
  letter-spacing: -0.025em;
  z-index: 3;
  position: relative;
  letter-spacing: -0.025em;
}

/* Адаптивность для разных размеров экрана */
@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 20px;
  }
  
  .analytics-card {
    min-height: 200px;
  }
}
</style>