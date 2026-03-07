<template>
  <div class="chart-detail-page">
    <div class="chart-detail-header">
      <router-link to="/analytics/users" class="back-btn">
        <v-icon>mdi-arrow-left</v-icon>
        <span>Назад к аналитике</span>
      </router-link>
      <h1>Новые пользователи - Детальный просмотр</h1>
    </div>
    
    <div class="chart-detail-container">
      <div class="chart-section-large">
        <div class="chart-header">
          <h2>Новые пользователи</h2>
          <p class="chart-period">{{ chartPeriodText }}</p>
        </div>
        
        <!-- Фильтры времени -->
        <div class="chart-filters-large">
          <button 
            v-for="filter in ['hour', 'day', 'week', 'month', 'year']"
            :key="filter"
            @click="timeFilter = filter"
            :class="['filter-btn-large', { active: timeFilter === filter }]"
          >
            {{ filter === 'hour' ? 'Час' : filter === 'day' ? 'День' : filter === 'week' ? 'Неделя' : filter === 'month' ? 'Месяц' : 'Годы' }}
          </button>
        </div>
        
        <div class="chart-container-large">
          <div class="main-chart-large">
            <svg width="100%" height="600" viewBox="0 0 1200 600" class="chart-svg-large">
              <!-- Определения градиентов и фильтров -->
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#a302d4;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#7c3aed;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#5b21b6;stop-opacity:1" />
                </linearGradient>
                
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#a302d4;stop-opacity:0.3" />
                  <stop offset="100%" style="stop-color:#a302d4;stop-opacity:0.05" />
                </linearGradient>
                
                <filter id="pointShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="#a302d4" flood-opacity="0.4"/>
                </filter>
                
                <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
              </defs>
              
              <!-- Фоновая сетка -->
              <g class="grid">
                <line v-for="line in gridLines" :key="line.id" 
                      :x1="line.x1" :y1="line.y1" 
                      :x2="line.x2" :y2="line.y2" 
                      stroke="#f1f5f9" 
                      stroke-width="1"
                      stroke-dasharray="3,3"/>
              </g>
              
              <!-- Область под линией -->
              <path v-if="userPath && userPoints.length > 0" 
                    :d="userPath + ` L ${userPoints[userPoints.length-1].x} 520 L ${userPoints[0].x} 520 Z`" 
                    fill="url(#areaGradient)" 
                    class="chart-area"/>
              
              <!-- Основная линия графика -->
              <path :d="userPath" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="chart-line"/>
              
              <!-- Точки данных -->
              <g class="chart-points">
                <circle v-for="(point, index) in userPoints" :key="index"
                        :cx="point.x" :cy="point.y" r="8"
                        fill="#ffffff" 
                        stroke="#a302d4" 
                        stroke-width="4"
                        filter="url(#pointShadow)"
                        @mouseover="showTooltip($event, point, index)"
                        @mouseleave="hideTooltip"
                        @click="openPointDetails(point, index)"
                        class="chart-point chart-point-stable chart-point-clickable"
                        :class="{ 'point-active': tooltip.show && tooltip.activeIndex === index }"/>
              </g>
              
              <!-- Вертикальная линия при наведении -->
              <line v-if="tooltip.show && tooltip.hoverX" 
                    :x1="tooltip.hoverX" :y1="80" 
                    :x2="tooltip.hoverX" :y2="520" 
                    stroke="#a302d4" 
                    stroke-width="2" 
                    stroke-dasharray="6,6" 
                    opacity="0.7"
                    class="hover-line"/>
            </svg>
            
            <!-- Подписи осей -->
            <div class="axis-labels-large">
              <div class="x-axis-labels-large">
                <span v-for="(label, index) in xAxisLabels" :key="index" class="x-label-large">
                  {{ label }}
                </span>
              </div>
              <div class="y-axis-labels-large">
                <span class="y-label-large" style="top: 80px;">{{ maxChartValue }}</span>
                <span class="y-label-large" style="top: 190px;">{{ Math.round(maxChartValue * 0.75) }}</span>
                <span class="y-label-large" style="top: 300px;">{{ Math.round(maxChartValue * 0.5) }}</span>
                <span class="y-label-large" style="top: 410px;">{{ Math.round(maxChartValue * 0.25) }}</span>
                <span class="y-label-large" style="top: 520px;">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div v-if="tooltip.show" class="chart-tooltip-large" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-title-large">{{ tooltip.title }}</div>
      <div class="tooltip-value-large">{{ tooltip.value }} пользователей</div>
    </div>
    
    <!-- Модальное окно деталей точки -->
    <v-dialog v-model="pointDetailsModal.show" max-width="800px">
      <v-card>
        <v-card-title class="headline">
          <v-icon left>mdi-chart-line</v-icon>
          Детали периода
          <v-spacer></v-spacer>
          <v-btn icon @click="closePointDetails">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="period-details">
            <div class="detail-row">
              <strong>Период:</strong> {{ pointDetailsModal.period }}
            </div>
            <div class="detail-row">
              <strong>Новых пользователей:</strong> {{ pointDetailsModal.newUsers }}
            </div>
          </div>
          
          <v-divider class="my-4"></v-divider>
          
          <div v-if="pointDetailsModal.usersList.length > 0">
            <h4 class="mb-3">Новые пользователи в этом периоде:</h4>
            <div class="users-list-modal">
              <div v-for="user in pointDetailsModal.usersList" :key="user.id" class="user-item-modal">
                <div class="user-avatar-modal">
                  <v-icon>mdi-account</v-icon>
                </div>
                <div class="user-info-modal">
                  <div class="user-name-modal">{{ user.name }}</div>
                  <div class="user-email-modal">{{ user.email }}</div>
                  <div class="user-date-modal">
                    Первая покупка: {{ formatDateOnly(user.firstPurchase) }}
                  </div>
                </div>
                <div class="user-stats-modal">
                  <div class="stat-modal">
                    <span class="stat-value-modal">{{ user.purchasesCount }}</span>
                    <span class="stat-label-modal">покупок</span>
                  </div>
                  <div class="stat-modal">
                    <span class="stat-value-modal">{{ Math.round(user.totalValue) }}₽</span>
                    <span class="stat-label-modal">потрачено</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-users-message">
            <v-icon size="48" color="grey lighten-1">mdi-account-off</v-icon>
            <p>В этом периоде новых пользователей не было</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'UsersChartDetail',
  data() {
    return {
      // Фильтры времени и периода для графика
      timeFilter: 'day',
      chartPeriodText: 'Последние 30 дней',
      
      // Элементы графика
      gridLines: [],
      userPath: '',
      userPoints: [],
      xAxisLabels: [],
      
      // Всплывающие подсказки графика
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        title: '',
        value: '',
        activeIndex: null,
        hoverX: null
      },
      
      // Максимальное значение для графика
      maxChartValue: 0,
      
      // Список клиентов
      customers: [],
      
      // Модальное окно для деталей точки
      pointDetailsModal: {
        show: false,
        date: null,
        period: '',
        newUsers: 0,
        usersList: [],
        index: null
      }
    }
  },
  
  mounted() {
    this.fetchCustomersData();
    this.initializeEmptyChart();
  },
  
  watch: {
    timeFilter() {
      this.generateChartData();
    }
  },
  
  methods: {
    // Методы из UsersAnalytics.vue (копируем нужные методы)
    async fetchCustomersData() {
      try {
        const api = (await import('@/services/api')).default;
        const response = await api.get('/customers');
        const data = response.data;
        if (Array.isArray(data)) {
          this.customers = this.processCustomersData(data);
          this.generateChartData();
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных клиентов:', error);
        this.customers = [];
        this.generateFallbackData();
      }
    },
    
    processCustomersData(customers) {
      return customers.map(customer => {
        const purchases = customer.purchases || [];
        const returns = customer.returns || [];
        
        const totalValue = purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);
        const averagePurchase = purchases.length > 0 ? totalValue / purchases.length : 0;
        
        const firstPurchaseDate = purchases.length > 0 
          ? new Date(Math.min(...purchases.map(p => new Date(p.date))))
          : new Date();
        
        const lastPurchaseDate = purchases.length > 0 
          ? new Date(Math.max(...purchases.map(p => new Date(p.date))))
          : new Date();
        
        const randomHours = Math.floor(Math.random() * 24);
        const randomMinutes = Math.floor(Math.random() * 60);
        firstPurchaseDate.setHours(randomHours, randomMinutes, 0, 0);
        
        return {
          ...customer,
          purchases,
          returns,
          purchasesCount: purchases.length,
          returnsCount: returns.length,
          totalValue,
          averagePurchase,
          firstPurchase: firstPurchaseDate.toISOString(),
          lastPurchase: lastPurchaseDate.toISOString()
        };
      });
    },
    
    initializeEmptyChart() {
      this.generateSVGElements([], 0);
      this.updateChartPeriodText();
    },
    
    generateChartData() {
      if (!this.customers || this.customers.length === 0) {
        this.generateFallbackData();
        return;
      }
      
      const now = new Date();
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      const timeSlots = [];
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        
        switch (this.timeFilter) {
          case 'hour':
            date.setHours(date.getHours() - i);
            date.setMinutes(0, 0, 0);
            break;
          case 'day':
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            break;
          case 'week':
            date.setDate(date.getDate() - i * 7);
            date.setHours(0, 0, 0, 0);
            break;
          case 'month':
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
          case 'year':
            date.setFullYear(date.getFullYear() - i);
            date.setMonth(0, 1);
            date.setHours(0, 0, 0, 0);
            break;
        }
        
        const endTime = this.getEndTime(new Date(date));
        
        const newUsersCount = this.customers.filter(customer => {
          const firstPurchaseDate = new Date(customer.firstPurchase);
          return firstPurchaseDate >= date && firstPurchaseDate < endTime;
        }).length;
        
        timeSlots.push({
          date: new Date(date),
          value: newUsersCount
        });
      }
      
      const maxValue = Math.max(...timeSlots.map(slot => slot.value), 1);
      this.generateSVGElements(timeSlots, maxValue);
      this.updateChartPeriodText();
    },
    
    getEndTime(startTime) {
      const endTime = new Date(startTime);
      
      switch (this.timeFilter) {
        case 'hour':
          endTime.setHours(endTime.getHours() + 1);
          break;
        case 'day':
          endTime.setDate(endTime.getDate() + 1);
          break;
        case 'week':
          endTime.setDate(endTime.getDate() + 7);
          break;
        case 'month':
          endTime.setMonth(endTime.getMonth() + 1);
          break;
        case 'year':
          endTime.setFullYear(endTime.getFullYear() + 1);
          break;
      }
      
      return endTime;
    },
    
    generateSVGElements(data, maxValue) {
      this.maxChartValue = maxValue;
      
      // Размеры для большого графика
      const width = 1200;
      const height = 600;
      const padding = { top: 80, right: 80, bottom: 80, left: 80 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      
      // Генерация сетки
      this.gridLines = [];
      const gridSteps = 5;
      
      // Горизонтальные линии
      for (let i = 0; i <= gridSteps; i++) {
        const y = padding.top + (chartHeight / gridSteps) * i;
        this.gridLines.push({
          id: `h-${i}`,
          x1: padding.left,
          y1: y,
          x2: width - padding.right,
          y2: y
        });
      }
      
      // Вертикальные линии
      const verticalSteps = Math.min(data.length - 1, 6);
      for (let i = 0; i <= verticalSteps; i++) {
        const x = padding.left + (chartWidth / verticalSteps) * i;
        this.gridLines.push({
          id: `v-${i}`,
          x1: x,
          y1: padding.top,
          x2: x,
          y2: height - padding.bottom
        });
      }
      
      if (data.length === 0) {
        this.userPoints = [];
        this.userPath = '';
        this.xAxisLabels = [];
        return;
      }
      
      // Генерация точек
      this.userPoints = data.map((item, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - (item.value / maxValue) * chartHeight;
        
        return {
          x: x,
          y: y,
          value: item.value,
          date: item.date
        };
      });
      
      // Генерация пути
      if (this.userPoints.length > 0) {
        this.userPath = `M ${this.userPoints[0].x} ${this.userPoints[0].y}`;
        for (let i = 1; i < this.userPoints.length; i++) {
          this.userPath += ` L ${this.userPoints[i].x} ${this.userPoints[i].y}`;
        }
      }
      
      // Генерация подписей оси X
      this.xAxisLabels = data.map(item => this.formatXAxisLabel(item.date));
    },
    
    formatXAxisLabel(date) {
      switch (this.timeFilter) {
        case 'hour':
          return date.getHours() + ':00';
        case 'day':
          return date.getDate() + '.' + (date.getMonth() + 1);
        case 'week':
          return date.getDate() + '.' + (date.getMonth() + 1);
        case 'month':
          const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
          return months[date.getMonth()];
        case 'year':
          return date.getFullYear().toString();
        default:
          return date.getDate() + '.' + (date.getMonth() + 1);
      }
    },
    
    updateChartPeriodText() {
      const periods = {
        hour: 'Последние 24 часа',
        day: 'Последние 30 дней',
        week: 'Последние 12 недель',
        month: 'Последние 12 месяцев',
        year: 'Последние 5 лет'
      };
      
      this.chartPeriodText = periods[this.timeFilter] || 'Последние 30 дней';
    },
    
    generateFallbackData() {
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      const fallbackData = [];
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date();
        
        switch (this.timeFilter) {
          case 'hour':
            date.setHours(date.getHours() - i);
            break;
          case 'day':
            date.setDate(date.getDate() - i);
            break;
          case 'week':
            date.setDate(date.getDate() - i * 7);
            break;
          case 'month':
            date.setMonth(date.getMonth() - i);
            break;
          case 'year':
            date.setFullYear(date.getFullYear() - i);
            break;
        }
        
        fallbackData.push({
          date: new Date(date),
          value: 0
        });
      }
      
      this.generateSVGElements(fallbackData, 1);
      this.updateChartPeriodText();
      this.initializeEmptyChart();
    },
    
    showTooltip(event, point, index) {
      const rect = event.target.getBoundingClientRect();
      const container = event.target.closest('.chart-detail-container').getBoundingClientRect();
      
      this.tooltip = {
        show: true,
        x: rect.left - container.left + 10,
        y: rect.top - container.top - 10,
        title: this.formatXAxisLabel(point.date),
        value: point.value,
        activeIndex: index,
        hoverX: point.x
      };
    },
    
    hideTooltip() {
      this.tooltip.show = false;
      this.tooltip.activeIndex = null;
      this.tooltip.hoverX = null;
    },
    
    openPointDetails(point, index) {
      const timeSlot = this.getTimeSlotForPoint(point, index);
      const usersInPeriod = this.getUsersForPeriod(timeSlot.startTime, timeSlot.endTime);
      
      this.pointDetailsModal = {
        show: true,
        date: point.date,
        period: this.formatPeriodText(timeSlot),
        newUsers: point.value,
        usersList: usersInPeriod,
        index: index
      };
    },
    
    getTimeSlotForPoint(point, index) {
      const now = new Date();
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      const date = new Date(now);
      
      switch (this.timeFilter) {
        case 'hour':
          date.setHours(date.getHours() - (count - 1 - index));
          date.setMinutes(0, 0, 0);
          break;
        case 'day':
          date.setDate(date.getDate() - (count - 1 - index));
          date.setHours(0, 0, 0, 0);
          break;
        case 'week':
          date.setDate(date.getDate() - (count - 1 - index) * 7);
          date.setHours(0, 0, 0, 0);
          break;
        case 'month':
          date.setMonth(date.getMonth() - (count - 1 - index));
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - (count - 1 - index));
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          break;
      }
      
      return {
        startTime: new Date(date),
        endTime: this.getEndTime(new Date(date))
      };
    },
    
    getUsersForPeriod(startTime, endTime) {
      return this.customers.filter(customer => {
        const firstPurchaseDate = new Date(customer.firstPurchase);
        return firstPurchaseDate >= startTime && firstPurchaseDate < endTime;
      });
    },
    
    formatPeriodText(timeSlot) {
      const start = timeSlot.startTime;
      const end = timeSlot.endTime;
      
      switch (this.timeFilter) {
        case 'hour':
          return `${start.getHours()}:00 - ${end.getHours()}:00, ${start.toLocaleDateString('ru-RU')}`;
        case 'day':
          return start.toLocaleDateString('ru-RU');
        case 'week':
          return `${start.toLocaleDateString('ru-RU')} - ${end.toLocaleDateString('ru-RU')}`;
        case 'month':
          return start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        case 'year':
          return start.getFullYear().toString();
        default:
          return start.toLocaleDateString('ru-RU');
      }
    },
    
    closePointDetails() {
      this.pointDetailsModal.show = false;
    },
    
    formatDateOnly(dateString) {
      return new Date(dateString).toLocaleDateString('ru-RU');
    }
  }
}
</script>

<style scoped>
.chart-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
}

.chart-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: #495057;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e9ecef;
  color: #212529;
}

.chart-detail-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.chart-detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

.chart-section-large {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 40px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.chart-section-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 20px 20px 0 0;
}

.chart-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-header h2::before {
  content: '';
  width: 12px;
  height: 12px;
  background: #a302d4;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(163, 2, 212, 0.6);
}

.chart-period {
  font-size: 18px;
  color: #64748b;
  margin: 0 0 30px 0;
  font-weight: 400;
}

.chart-filters-large {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  justify-content: center;
}

.filter-btn-large {
  padding: 12px 24px;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 100px;
}

.filter-btn-large:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filter-btn-large.active {
  background: #a302d4;
  color: white;
  border-color: #a302d4;
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.3);
}

.chart-container-large {
  background: #ffffff;
  border-radius: 16px;
  padding: 30px;
  border: 1px solid #f1f5f9;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.05);
}

.main-chart-large {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
}

.chart-svg-large {
  width: 100%;
  height: 600px;
  border-radius: 8px;
}

.chart-point-clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-point-clickable:hover {
  r: 10;
  filter: url(#pointGlow);
  transform: scale(1.2);
}

.point-active {
  filter: url(#pointGlow);
  r: 10;
}

.axis-labels-large {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.x-axis-labels-large {
  position: absolute;
  bottom: 40px;
  left: 80px;
  right: 80px;
  display: flex;
  justify-content: space-between;
}

.x-label-large {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.y-axis-labels-large {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
}

.y-label-large {
  position: absolute;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  transform: translateY(-50%);
}

.chart-tooltip-large {
  position: absolute;
  background: rgba(30, 41, 59, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.tooltip-title-large {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-value-large {
  font-size: 16px;
  font-weight: 700;
  color: #a302d4;
}

/* Стили для модального окна */
.period-details {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.detail-row {
  margin-bottom: 8px;
  font-size: 16px;
}

.users-list-modal {
  max-height: 400px;
  overflow-y: auto;
}

.user-item-modal {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
}

.user-avatar-modal {
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.user-info-modal {
  flex: 1;
}

.user-name-modal {
  font-weight: 600;
  margin-bottom: 4px;
}

.user-email-modal {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 4px;
}

.user-date-modal {
  color: #6c757d;
  font-size: 12px;
}

.user-stats-modal {
  display: flex;
  gap: 16px;
}

.stat-modal {
  text-align: center;
}

.stat-value-modal {
  display: block;
  font-weight: 700;
  font-size: 16px;
  color: #a302d4;
}

.stat-label-modal {
  font-size: 12px;
  color: #6c757d;
}

.no-users-message {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.no-users-message p {
  margin-top: 16px;
  font-size: 16px;
}
</style>