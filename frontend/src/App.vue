<template>
  <div data-app style="min-height: 100vh; display: flex;">
    <template v-if="showAppLayout">
      <Seidbar 
        :current-route="$route.path" 
        style="width: 200px; height: 100vh;" 
        @show-notification="handleNotification"
        @show-loading="handleLoading"
      />
      <div style="flex: 1; display: flex; flex-direction: column;">
        <app-bar @language-changed="onLanguageChanged" />
        <div style="flex: 1;">
          <router-view />
        </div>
      </div>
    </template>
    <div v-else style="flex: 1;">
      <router-view />
    </div>
    
    <ExpenseModal v-if="showAppLayout" />
    <SuccessAnimation v-if="showAppLayout" />
    
    <!-- Уведомления -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="white"
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
    
    <!-- Индикатор загрузки -->
    <v-dialog v-model="loading.show" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          {{ loading.text }}
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Seidbar from './views/Seidbar.vue'
import AppBar from './views/AppBar.vue'
import ExpenseModal from './components/ExpenseModal.vue'
import SuccessAnimation from './components/SuccessAnimation.vue'

export default {
  components: {
    Seidbar,
    AppBar,
    ExpenseModal,
    SuccessAnimation
  },
  computed: {
    showAppLayout() {
      const guestPaths = ['/login', '/register', '/verify-email']
      return !guestPaths.includes(this.$route.path)
    }
  },
  data() {
    return {
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 4000
      },
      loading: {
        show: false,
        text: ''
      }
    }
  },
  mounted() {},
  methods: {
    handleNotification(type, message) {
      this.snackbar.color = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'
      this.snackbar.text = message
      this.snackbar.show = true
    },
    
    handleLoading(message) {
      this.loading.text = message
      this.loading.show = true
      
      // Автоматически скрываем загрузку через 5 секунд
      setTimeout(() => {
        this.loading.show = false
      }, 5000)
    },
    
    onLanguageChanged(locale) {
      // Эмитируем глобальное событие изменения языка
      window.dispatchEvent(new CustomEvent('language-changed', { 
        detail: { locale } 
      }))
    }
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

/* Глобальные стили скроллбара - серый цвет */
* {
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

*::-webkit-scrollbar-corner {
  background: #f3f4f6;
}

</style>
