<template>
  <div class="stock-notification-container">
    <!-- Иконка уведомлений -->
    <div 
      class="notification-icon"
      :class="{ 
        'has-notifications': hasNotifications,
        'critical': hasCriticalNotifications,
        'warning': hasWarningNotifications && !hasCriticalNotifications
      }"
      @click="toggleNotifications"
    >
      <v-icon size="24" :color="iconColor">
        {{ iconName }}
      </v-icon>
      
      <!-- Счетчик уведомлений -->
      <div v-if="notificationCount > 0" class="notification-badge">
        {{ notificationCount }}
      </div>
      
      <!-- Анимация пульсации для критических уведомлений -->
      <div v-if="hasCriticalNotifications" class="pulse-ring"></div>
    </div>
    
    <!-- Панель уведомлений (все сообщения) -->
    <div v-if="showNotifications" class="notifications-panel">
      <div class="panel-header">
        <h3>{{ $t('notifications.stockAlerts') }}</h3>
        <button type="button" class="close-btn" :aria-label="$t('notifications.close')" @click="closeNotifications">
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>
      
      <div class="notifications-list">
        <!-- Все уведомления -->
        <div v-if="allNotifications.length > 0" class="notification-section">
          <div 
            v-for="notification in allNotifications" 
            :key="`notification-${notification.id}`"
            class="notification-item"
            :class="{ 
              'unread': !notification.read,
              'critical': notification.type === 'critical',
              'warning': notification.type === 'warning'
            }"
          >
            <div class="notification-content">
              <div class="product-name">
                {{ notification.productName }}
              </div>
              <div class="notification-message">
                {{ notification.type === 'critical' 
                  ? $t('notifications.productOutOfStock') 
                  : $t('notifications.lowStockMessage', { stock: notification.currentStock }) 
                }}
              </div>
              <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Сообщение если нет уведомлений -->
        <div v-if="allNotifications.length === 0" class="no-notifications">
          <v-icon size="48" color="grey">mdi-check-circle</v-icon>
          <p>{{ $t('notifications.noAlerts') }}</p>
        </div>
      </div>
      
      <div class="panel-footer">
        <button @click="markAllAsRead" class="mark-all-btn" :disabled="unreadNotifications.length === 0">
          {{ $t('notifications.markAllAsRead') }} ({{ unreadNotifications.length }})
        </button>
      </div>
    </div>
    
    <!-- Overlay для закрытия панели при клике в любом месте -->
    <div v-if="showNotifications" class="notifications-overlay" @click="closeNotifications"></div>
  </div>
</template>

<script>
import api from '@/services/api'
import { EventBus } from '@/utils/EventBus.js'

export default {
  name: 'StockNotification',
  data() {
    return {
      notifications: [],
      showNotifications: false,
      // Добавляем новые события в EventBus
      PURCHASE_COMPLETED: 'purchase-completed',
      STOCK_ALERT: 'stock-alert'
    }
  },
  computed: {
    // Все уведомления (включая прочитанные), отсортированные по статусу и времени
    allNotifications() {
      return [...this.notifications].sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    },
    
    // Непрочитанные уведомления
    unreadNotifications() {
      return this.notifications.filter(n => !n.read)
    },
    
    // Критические уведомления (все), отсортированные
    criticalNotifications() {
      return this.allNotifications.filter(n => n.type === 'critical')
    },
    
    // Предупреждения (все), отсортированные
    warningNotifications() {
      return this.allNotifications.filter(n => n.type === 'warning')
    },
    
    // Есть ли непрочитанные уведомления
    hasNotifications() {
      return this.unreadNotifications.length > 0
    },
    
    // Есть ли критические непрочитанные уведомления
    hasCriticalNotifications() {
      return this.unreadNotifications.filter(n => n.type === 'critical').length > 0
    },
    
    // Есть ли предупреждающие непрочитанные уведомления
    hasWarningNotifications() {
      return this.unreadNotifications.filter(n => n.type === 'warning').length > 0
    },
    
    // Количество непрочитанных уведомлений
    notificationCount() {
      return this.unreadNotifications.length
    },
    
    // Иконка и цвет - всегда одинаковые независимо от типа уведомления
    iconName() {
      if (this.hasNotifications) {
        return 'mdi-bell'
      }
      return 'mdi-bell-outline'
    },
    
    iconColor() {
      if (this.hasNotifications) {
        return '#a302d4'
      }
      return 'grey'
    }
  },
  methods: {
    // Переключить панель уведомлений
    toggleNotifications() {
      this.showNotifications = !this.showNotifications
      
      if (this.showNotifications) {
        EventBus.$emit('notifications-opened')
      } else {
        this.markAllAsReadOnClose()
        EventBus.$emit('notifications-closed')
      }
    },
    
    // Закрыть панель уведомлений (при закрытии помечаем все как прочитанные)
    closeNotifications() {
      this.showNotifications = false
      this.markAllAsReadOnClose()
      EventBus.$emit('notifications-closed')
    },
    
    // При закрытии панели отметить все просмотренные как прочитанные
    markAllAsReadOnClose() {
      this.markAllAsRead()
    },
    
    // Отметить уведомление как прочитанное
    markAsRead(notification) {
      notification.read = true
      this.saveNotifications()
    },
    
    // Отметить все непрочитанные уведомления как прочитанные
    markAllAsRead() {
      this.notifications.forEach(n => {
        if (!n.read) {
          n.read = true
        }
      })
      this.saveNotifications()
    },
    
    // Добавить новое уведомление
    addNotification(productId, productName, currentStock, type) {
      const notification = {
        id: Date.now() + Math.random(),
        productId,
        productName,
        currentStock,
        type, // 'critical' или 'warning'
        timestamp: new Date().toISOString(),
        read: false
      }
      
      // Проверяем, нет ли уже уведомления для этого товара
      const existingIndex = this.notifications.findIndex(n => 
        n.productId === productId && n.type === type && !n.read
      )
      
      if (existingIndex === -1) {
        this.notifications.unshift(notification)
        this.saveNotifications()
        
        // Показываем уведомление в браузере
        this.showBrowserNotification(notification)
      }
    },
    
    // Показать уведомление в браузере
    showBrowserNotification(notification) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = notification.type === 'critical' 
          ? this.$t('notifications.browserTitle.critical')
          : this.$t('notifications.browserTitle.warning')
          
        const body = notification.type === 'critical'
          ? this.$t('notifications.browserMessage.critical', { productName: notification.productName })
          : this.$t('notifications.browserMessage.warning', { 
              productName: notification.productName, 
              stock: notification.currentStock 
            })
        
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `stock-${notification.productId}-${notification.type}`
        })
      }
    },
    
    // Запросить разрешение на уведомления браузера
    requestNotificationPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    },
    
    // Сохранить уведомления в localStorage
    saveNotifications() {
      localStorage.setItem('stock-notifications', JSON.stringify(this.notifications))
    },
    
    // Загрузить уведомления из localStorage
    loadNotifications() {
      const saved = localStorage.getItem('stock-notifications')
      if (saved) {
        this.notifications = JSON.parse(saved)
      }
    },
    
    // Форматировать время
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) { // меньше минуты
        return this.$t('notifications.justNow')
      } else if (diff < 3600000) { // меньше часа
        const minutes = Math.floor(diff / 60000)
        return this.$t('notifications.minutesAgo', { minutes })
      } else if (diff < 86400000) { // меньше дня
        const hours = Math.floor(diff / 3600000)
        return this.$t('notifications.hoursAgo', { hours })
      } else {
        return date.toLocaleDateString()
      }
    },
    
    // Проверить товар на низкий запас после покупки
    async checkStockAfterPurchase(cartItems) {
      for (const item of cartItems) {
        // Получаем обновленное количество товара
        const updatedProduct = await this.getUpdatedProductStock(item.id)
        if (updatedProduct) {
          if (updatedProduct.stock === 0) {
            // Товар закончился
            this.addNotification(
              item.id, 
              item.name, 
              updatedProduct.stock, 
              'critical'
            )
          } else if (updatedProduct.stock <= 10) {
            // Низкий запас
            this.addNotification(
              item.id, 
              item.name, 
              updatedProduct.stock, 
              'warning'
            )
          }
        }
      }
    },
    
    // Получить обновленное количество товара
    async getUpdatedProductStock(productId) {
      try {
        const response = await api.get(`/products/${productId}`)
        return response.data
      } catch (error) {
        console.error('Error fetching product stock:', error)
        return null
      }
    },
    
    // Обработчик клика на документ для закрытия панели
    handleDocumentClick(event) {
      // Проверяем, что панель открыта и клик не по иконке уведомлений
      if (this.showNotifications) {
        const notificationContainer = this.$el
        const isClickInside = notificationContainer.contains(event.target)
        
        // Если клик не внутри контейнера уведомлений, закрываем панель
        if (!isClickInside) {
          this.closeNotifications()
        }
      }
    }
  },
  mounted() {
    this.loadNotifications()
    this.requestNotificationPermission()
    
    // Добавляем обработчик клика на документ для закрытия панели
    document.addEventListener('click', this.handleDocumentClick)
    
    // Подписываемся на события покупки
    EventBus.$on(this.PURCHASE_COMPLETED, async (data) => {
      await this.checkStockAfterPurchase(data.items)
    })
    
    // Подписываемся на события уведомлений о запасах
    EventBus.$on('stock-alert', (data) => {
      this.addNotification(data.productId, data.productName, data.currentStock, data.type)
    })
  },
  beforeDestroy() {
    // Убираем обработчик клика на документ
    document.removeEventListener('click', this.handleDocumentClick)
    
    EventBus.$off(this.PURCHASE_COMPLETED)
    EventBus.$off('stock-alert')
  }
}
</script>

<style scoped>
.stock-notification-container {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon:hover {
  background-color: rgba(163, 2, 212, 0.1);
  transform: scale(1.1);
}

.notification-icon.has-notifications {
  animation: pulse 2s infinite;
  transform: scale(1.1);
}

.notification-icon.critical {
  color: #ef4444 !important;
  animation: pulse-critical 1s infinite;
}

.notification-icon.warning {
  color: #f59e0b !important;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes pulse-critical {
  0% {
    transform: scale(1.1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(1.1);
  }
  75% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1.1);
  }
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border: 2px solid #ef4444;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0;
  }
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff0000;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 0, 0, 0.4);
  animation: bounce 0.5s ease, pulse-badge 2s infinite;
  border: 2px solid white;
  z-index: 10;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-3px) scale(1.05);
  }
  60% {
    transform: translateY(-2px) scale(1.02);
  }
}

.notifications-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1e293b;
}


.notifications-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-section {
  margin-bottom: 16px;
}

.notification-item {
  display: block;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

/* Стили для критических уведомлений (товар закончился) */
.notification-item.critical {
  border-left: 4px solid #ef4444;
}

/* Стили для предупреждающих уведомлений (низкий запас) */
.notification-item.warning {
  border-left: 4px solid #f59e0b;
}

/* Непрочитанные — голубая подсветка */
.notification-item.unread {
  background: #e3f2fd;
  box-shadow: 0 0 0 1px rgba(33, 150, 243, 0.2), 0 0 12px rgba(33, 150, 243, 0.15);
}

.notification-item.unread .product-name {
  color: #1565c0;
  font-weight: 700;
}

.notification-item.unread .notification-message {
  color: #1976d2;
  font-weight: 600;
}

.notification-item.unread .notification-time {
  color: #42a5f5;
}

.notification-content {
  width: 100%;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-message {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #94a3b8;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}

.no-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.no-notifications p {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
}

.panel-footer {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-top: 1px solid #e2e8f0;
}

.mark-all-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mark-all-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-1px);
}

.mark-all-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
}

.notifications-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-panel {
    width: 320px;
    right: -50px;
  }
}

@media (max-width: 480px) {
  .notifications-panel {
    width: 280px;
    right: -80px;
  }
}
</style>
