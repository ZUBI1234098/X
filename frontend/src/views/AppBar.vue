<template>
  <div class="app-bar">
    <div class="breadcrumb-navigation">
      <template v-for="(item, index) in breadcrumbs">
        <span v-if="index > 0" :key="`separator-${index}`" class="breadcrumb-separator">/</span>
        <span 
          v-if="index < breadcrumbs.length - 1 && item.path" 
          :key="`link-${index}`"
          class="breadcrumb-link"
          @click="navigateTo(item.path)"
        >
          {{ item.name }}
        </span>
        <span v-else :key="`current-${index}`" class="breadcrumb-current">
          {{ item.name }}
        </span>
      </template>
    </div>
    <div class="app-bar-actions">
      <StockNotification />
      <LanguageSwitcher @language-changed="onLanguageChanged" />
      <v-btn small text @click="logout">{{ $t('auth.logout') || 'Выйти' }}</v-btn>
    </div>
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import StockNotification from '@/components/StockNotification.vue'
import { logout as apiLogout } from '@/services/api'

export default {
  name: 'AppBar',
  emits: ['language-changed'],
  components: {
    LanguageSwitcher,
    StockNotification
  },
  data() {
    return {}
  },
  computed: {
    breadcrumbs() {
      const route = this.$route
      const pathSegments = route.path.split('/').filter(segment => segment)
      
      // Базовые breadcrumbs
      let breadcrumbs = [
        {
          name: this.$t('navigation.home'),
          path: '/home'
        }
      ]
      
      // Определяем breadcrumbs на основе текущего маршрута
      if (pathSegments.length === 0 || pathSegments[0] === 'home') {
        breadcrumbs[0].name = this.$t('navigation.dashboard')
        return breadcrumbs
      }
      
      // Аналитика
      if (pathSegments[0] === 'analytics') {
        breadcrumbs.push({
          name: this.$t('navigation.analytics'),
          path: '/analytics'
        })
        
        if (pathSegments[1]) {
          const analyticsPages = {
            'revenue': this.$t('navigation.revenue'),
            'orders': this.$t('navigation.orders'), 
            'tasks': this.$t('navigation.tasks'),
            'users': this.$t('navigation.users'),
            'customers': this.$t('navigation.customers'),
            'products': this.$t('navigation.products'),
            'buy': this.$t('navigation.buy'),
            'returns': this.$t('navigation.returns'),
            'expenses': this.$t('navigation.expenses')
          }
          
          const pageName = analyticsPages[pathSegments[1]]
          if (pageName) {
            breadcrumbs.push({
              name: pageName,
              path: `/analytics/${pathSegments[1]}`
            })
          }
          
          // Детальная страница пользователей
          if (pathSegments[1] === 'users' && pathSegments[2] === 'detail') {
            breadcrumbs.push({
              name: this.$t('navigation.detail'),
              path: '/analytics/users/detail'
            })
          }
        }
      }
      // Клиенты
      else if (pathSegments[0] === 'customer' || pathSegments[0] === 'customers') {
        breadcrumbs.push({
          name: this.$t('navigation.customers')
        })
      }
      // Товары
      else if (pathSegments[0] === 'product' || pathSegments[0] === 'products') {
        breadcrumbs.push({
          name: this.$t('navigation.products')
        })
      }
      // Задачи
      else if (pathSegments[0] === 'tasks') {
        breadcrumbs.push({
          name: this.$t('navigation.tasks')
        })
      }
      // Настройки
      else if (pathSegments[0] === 'settings') {
        breadcrumbs.push({
          name: this.$t('navigation.settings')
        })
      }
      // Покупки
      else if (pathSegments[0] === 'buy') {
        breadcrumbs.push({
          name: this.$t('navigation.buy'),
          path: '/buy'
        })
        breadcrumbs.push({
          name: this.$t('navigation.productPurchase')
        })
      }
      // Возвраты
      else if (pathSegments[0] === 'return') {
        breadcrumbs.push({
          name: this.$t('navigation.return'),
          path: '/return'
        })
        breadcrumbs.push({
          name: this.$t('navigation.productReturn')
        })
      }
      // Графики
      else if (pathSegments[0] === 'activityChart') {
        breadcrumbs.push({
          name: this.$t('navigation.activityChart')
        })
      }
      else if (pathSegments[0] === 'revenueChart') {
        breadcrumbs.push({
          name: this.$t('navigation.revenueChart')
        })
      }
      else if (pathSegments[0] === 'usersChart') {
        breadcrumbs.push({
          name: this.$t('navigation.usersChart')
        })
      }
      
      return breadcrumbs
    }
  },
  mounted() {
    // Компонент готов
  },
  methods: {
    logout() {
      apiLogout()
      this.$router.push('/login')
    },
    navigateTo(path) {
      this.$router.push(path)
    },
    onLanguageChanged(locale) {
      // Эмитируем событие изменения языка для родительских компонентов
      this.$emit('language-changed', locale)
    }
  }
}
</script>

<style scoped>
.app-bar {
  width: 100%;
  height: 80px;
  background: #ffffff;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-bottom: 2px solid #e2e8f0;
  position: relative;
  z-index: 10;
}

.app-bar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
}

.breadcrumb-navigation {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
}

.breadcrumb-link {
  color: #a3a3a3;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #a302d4;
}

.breadcrumb-current {
  color: #000000;
  font-weight: 600;
}

.breadcrumb-separator {
  color: #a3a3a3;
  margin: 0 4px;
  font-weight: 400;
}

/* Анимация появления */
.breadcrumb-navigation > * {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .app-bar {
    padding: 0 16px;
    height: 80px;
  }
  
  .app-bar-actions {
    right: 16px;
    gap: 12px;
  }
  
  .breadcrumb-navigation {
    font-size: 20px;
  }
  
  .breadcrumb-separator {
    margin: 0 6px;
  }
}

@media (max-width: 480px) {
  .app-bar {
    height: 70px;
  }
  
  .app-bar-actions {
    right: 12px;
    gap: 8px;
  }
  
  .breadcrumb-navigation {
    font-size: 18px;
  }
}
</style>