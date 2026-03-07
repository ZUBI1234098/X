<template>
  <div 
    :class="['customers-section', { 'hidden': isHidden, 'expanded': isExpanded, 'language-animation': isLanguageAnimating }]"
  >
    <div class="section-header" @click.stop="toggleExpanded" style="position: relative; display: flex; justify-content: center; align-items: center; padding: 16px 50px 16px 50px; overflow: visible;">
      <v-btn 
        v-if="isExpanded"
        icon
        @click.stop="exitExpanded"
        class="back-btn hover-lift mr-2"
        style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div style="display: flex; align-items: center; justify-content: center; flex: 1;">
        <h1 class="chart-title" @click="toggleExpanded">
          {{ $t('pages.orders.latestOrders') }}
        </h1>
      </div>
      <v-text-field
        v-if="isExpanded"
        v-model="searchQuery"
        :placeholder="$t('pages.orders.searchByName') || $t('common.search')"
        hide-details
        outlined
        rounded
        class="customers-search-input"
        @click.stop
        style="position: absolute; right: 10px; width: 160px; z-index: 10;"
      ></v-text-field>
    </div>
    
    <div class="customers-list" @click.stop @wheel="handleScroll" ref="customersList">
      <!-- Таблица заказов -->
      <div v-if="!selectedOrderForDetail" class="orders-table-container">
        <div class="orders-table">
          <!-- Заголовок таблицы -->
          <div class="table-header">
            <div class="table-cell header-cell">{{ $t('pages.orders.orderId') }}</div>
            <div class="table-cell header-cell">{{ $t('pages.orders.product') }}</div>
            <div class="table-cell header-cell">{{ $t('pages.orders.date') }}</div>
            <div class="table-cell header-cell">{{ $t('pages.orders.amount') }}</div>
            <div class="table-cell header-cell">{{ $t('pages.orders.status') }}</div>
          </div>
          
          <!-- Тело таблицы с прокруткой -->
          <div class="table-body" @wheel="handleTableScroll">
            <div 
              v-for="order in filteredOrders" 
              :key="order.id" 
              class="table-row order-row"
              @click.stop="selectOrder(order)"
            >
              <div class="table-cell">
                <div class="order-id-styled">
                  <span class="order-id-number">#{{ order.id }}</span>
                </div>
              </div>
              
              <div class="table-cell">
                <div class="product-info">
                  <div class="product-name">{{ order.productName || 'Unknown Product' }}</div>
                  <div class="customer-name-small">{{ order.customerName || 'Unknown Customer' }}</div>
                </div>
              </div>
              
              <div class="table-cell">
                <div class="order-date">
                  <div class="date-main">{{ formatDateOnly(order.date || order.createdAt) }}</div>
                  <div class="date-time">{{ formatTimeOnly(order.date || order.createdAt) }}</div>
                </div>
              </div>
              
              <div class="table-cell">
                <div class="order-amount" :class="{
                  'positive-amount': order.status === 'completed',
                  'negative-amount': order.status === 'returned'
                }">
                  <span class="amount-sign">{{ order.status === 'returned' ? '-' : '+' }}</span>
                  <span class="amount-value">${{ Math.abs(parseFloat(order.total || 0)).toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="table-cell">
                <div class="order-status">
                  <v-chip 
                    x-small 
                    :color="order.status === 'returned' ? '#eab308' : '#10b981'"
                    :text-color="'white'"
                    class="status-chip-compact"
                  >
                    <v-icon left size="8">{{ order.status === 'returned' ? 'mdi-arrow-left' : 'mdi-check' }}</v-icon>
                    {{ order.status === 'returned' ? $t('analytics.customer.orderStatus.delivered') || 'Returned' : $t('analytics.customer.orderStatus.completed') || 'Completed' }}
                  </v-chip>
                </div>
              </div>
            </div>
            
            <!-- Сообщение об отсутствии данных -->
            <div v-if="!filteredOrders || filteredOrders.length === 0" class="no-orders-row">
              <div class="no-orders-content">
                <v-icon size="48" color="#e5e7eb">mdi-shopping-outline</v-icon>
                <p class="no-orders-text">{{ $t('pages.orders.noOrdersFound') }}</p>
                <p class="no-orders-subtext">{{ $t('analytics.charts.noData') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LatestOrders',
  props: {
    ordersList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['order-selected'],
  data() {
    return {
      isExpanded: false,
      isHidden: false,
      searchQuery: '',
      selectedOrderForDetail: null,
      isLanguageAnimating: false
    }
  },
  computed: {
    filteredOrders() {
      if (!this.ordersList || !Array.isArray(this.ordersList)) return [];
      if (!this.searchQuery) {
        return this.ordersList;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.ordersList.filter(order => 
        (order.productName && order.productName.toLowerCase().includes(query)) ||
        (order.customerName && order.customerName.toLowerCase().includes(query))
      );
    }
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },
    
    exitExpanded() {
      this.isExpanded = false;
      this.selectedOrderForDetail = null;
    },
    
    selectOrder(order) {
      this.$emit('order-selected', order);
    },
    
    handleScroll(event) {
      // Обработка прокрутки
      event.stopPropagation();
    },
    
    handleTableScroll(event) {
      // Обработка прокрутки таблицы
      event.stopPropagation();
    },
    
    formatDateOnly(date) {
      if (!date) return this.$t('common.notAvailable')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    
    formatTimeOnly(date) {
      if (!date) return this.$t('common.notAvailable')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getStatusColor(status) {
      const statusColors = {
        'completed': 'success',
        'pending': 'warning',
        'cancelled': 'error',
        'processing': 'info'
      };
      return statusColors[status] || 'default';
    },
    
    handleLanguageChange() {
      // Запускаем анимацию перемещения снизу вверх
      this.isLanguageAnimating = true;
      
      // Сбрасываем анимацию через 0.6 секунды (чуть больше времени анимации)
      setTimeout(() => {
        this.isLanguageAnimating = false;
      }, 600);
    }
  },
  mounted() {
    // Слушаем событие изменения языка
    window.addEventListener('language-changed', this.handleLanguageChange);
  },
  beforeDestroy() {
    // Удаляем слушатель события
    window.removeEventListener('language-changed', this.handleLanguageChange);
  }
}
</script>

<style scoped>
/* Стили идентичные customers-section из OrdersAnalytics.vue */

.customers-section {
  margin-left: 1px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  cursor: pointer;
}

.customers-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.customers-section.expanded {
  position: fixed;
  top: 508px;
  right: 900px;
  transform: translate(50%, -50%);
  width: 1650px !important;
  height: 80vh !important;
  z-index: 1000;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(163, 2, 212, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(163, 2, 212, 0.2);
}

.customers-section.expanded::before {
  height: 6px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6, #3b82f6);
  border-radius: 20px 20px 0 0;
}

.customers-section:hover:not(.expanded) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}

.customers-section.hidden {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
  border: none;
}

.customers-section.language-animation {
  animation: slideUpFromBottom 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(163, 2, 212, 0.2);
  border-color: #a302d4;
}

@keyframes slideUpFromBottom {
  0% {
    transform: translateY(50px) scale(0.95);
    opacity: 0.8;
    box-shadow: 0 2px 8px rgba(163, 2, 212, 0.1);
  }
  50% {
    transform: translateY(-5px) scale(1.02);
    opacity: 0.95;
    box-shadow: 0 12px 40px rgba(163, 2, 212, 0.25);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
    box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  }
}

.chart-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  cursor: pointer;
  transition: color 0.3s ease;
}

.chart-title:hover {
  color: #a302d4;
}

.back-btn {
  background: linear-gradient(135deg, #a302d4, #7c3aed) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3) !important;
}

.back-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(163, 2, 212, 0.4) !important;
}

.customers-search-input {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px) !important;
}

.customers-list {
  flex: 1;
  overflow-y: visible;
  height: calc(100% - 40px);
  margin-top: 5px;
  padding-top: 0;
  padding-right: 6px;
}

.customers-section.expanded .customers-list {
  height: calc(100vh - 200px);
}

/* Стили для таблицы заказов */
.orders-table-container {
  width: 100%;
  height: 100%;
}

.orders-table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 0.8fr 1fr 1fr;
  background: #f8f9fa;
  font-weight: 750;
  font-size: 12px;
  text-transform: uppercase;
  color: #6c757d;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(30, 41, 59, 0.1);
  padding: 20px 0;
}

.table-header .table-cell {
  padding: 0 20px;
  display: flex;
  align-items: center;
  color: #6c757d;
}

.table-body {
  max-height: 800px;
  min-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  background: #ffffff;
}

.table-body::-webkit-scrollbar {
  width: 8px;
}

.table-body::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 0.8fr 1fr 1fr;
  border-bottom: 1px solid rgba(30, 41, 59, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 80px;
  background: #ffffff;
  position: relative;
  cursor: pointer;
}

.table-row:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.table-cell {
  padding: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.table-cell:last-child {
  border-right: none;
}

.order-id-styled {
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 15px;
}

.customer-name-small {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.order-date {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-main {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.date-time {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.order-amount {
  font-weight: 600;
  font-size: 15px;
}

.positive-amount {
  color: #059669;
}

.negative-amount {
  color: #dc2626;
}

.amount-sign {
  font-weight: 700;
  margin-right: 4px;
}

.amount-value {
  font-weight: 700;
}

.order-status {
  display: flex;
  justify-content: flex-end;
}

.status-chip-compact {
  font-size: 10px !important;
  font-weight: 600 !important;
}

.no-orders-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  background: #ffffff;
}

.no-orders-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.no-orders-text {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}

.no-orders-subtext {
  margin-top: 8px;
  font-size: 14px;
  color: #64748b;
}

/* Адаптивные стили для мобильных устройств */
@media (max-width: 768px) {
  .customers-section {
    padding: 16px;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .table-cell {
    padding: 8px 12px;
  }
}
</style>
