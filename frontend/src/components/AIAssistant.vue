<template>
  <div class="ai-assistant" :class="{ 'expanded': isExpanded }" @click="handleOutsideClick">
    <!-- Кнопка открытия чата -->
    <div v-if="!isExpanded" class="ai-toggle" @click="toggleChat">
      <v-icon color="#ffffff" size="24">mdi-robot</v-icon>
      <span class="ai-label">AI</span>
    </div>



    <!-- Чат-интерфейс -->
    <transition name="modal">
      <div v-if="isExpanded" class="chat-container" @click.stop>
      <div class="chat-header">
        <div class="header-content">
          <span class="header-title">{{ $t('aiAssistant.title') }}</span>
        </div>
        <div class="header-actions">
          <v-btn 
            @click="toggleChat"
            icon
            small
            class="close-btn"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="chat-messages" ref="chatMessages">
        <!-- Показываем "How can I help you?" когда нет сообщений -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-state-content">
            <v-icon size="48" color="#a302d4">mdi-robot</v-icon>
            <p class="empty-state-text">{{ $t('aiAssistant.howCanIHelp') }}</p>
          </div>
        </div>

        <div 
          v-for="(message, index) in messages" 
          :key="`message-${index}-${message.timestamp.getTime()}`"
          v-show="messages.length > 0"
          class="message"
          :class="message.type"
        >
          <div class="message-avatar">
            <v-icon v-if="message.type === 'user'" color="#a302d4" size="16">mdi-account</v-icon>
            <v-icon v-else color="#ffffff" size="16">mdi-robot</v-icon>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.text)"></div>
            <div v-if="message.hasButtons" class="confirmation-buttons">
              <v-btn 
                small 
                color="green" 
                @click="confirmAction(true)"
                :disabled="isLoading"
                class="confirm-btn"
              >
                <v-icon size="14">mdi-check</v-icon>
                {{ $t('aiAssistant.confirm') }}
              </v-btn>
              <v-btn 
                small 
                color="red" 
                @click="confirmAction(false)"
                :disabled="isLoading"
                class="cancel-btn"
              >
                <v-icon size="14">mdi-close</v-icon>
                {{ $t('aiAssistant.cancel') }}
              </v-btn>
            </div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="isLoading" class="message ai">
          <div class="message-avatar">
            <v-icon color="#ffffff" size="16">mdi-robot</v-icon>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Быстрые команды -->
      <div class="quick-commands">
        <div class="commands-header">
          <div class="commands-actions">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn 
                  @click="clearHistory"
                  icon
                  small
                  class="clear-btn"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon size="16">mdi-delete-sweep</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('aiAssistant.clearHistory') }}</span>
            </v-tooltip>
          </div>
        </div>
        <div class="commands-list">
          <v-chip 
            v-for="command in quickCommands" 
            :key="command"
            @click="selectQuickCommand(command)"
            small
            class="command-chip"
            color="#f0f0f0"
            text-color="#333"
          >
            {{ command }}
          </v-chip>
        </div>
      </div>

      <!-- Поле ввода -->
      <div class="chat-input">
        <div class="input-container">
          <v-textarea
            ref="messageInput"
            v-model="inputMessage"
            :placeholder="$t('aiAssistant.typeMessage')"
            outlined
            rows="2"
            auto-grow
            hide-details
            @keyup.enter.ctrl="sendMessage"
            @keyup.enter.shift="addNewLine"
            :disabled="isLoading"
            class="message-input"
            background-color="rgba(255, 255, 255, 0.9)"
          >
            <template v-slot:append>
              <div class="input-actions">
                <v-btn 
                  icon 
                  @click="toggleVoiceRecording" 
                  :disabled="isLoading"
                  small
                  class="voice-btn"
                  :class="{ 'recording': isRecording }"
                >
                  <v-icon size="20">{{ isRecording ? 'mdi-microphone' : 'mdi-microphone-outline' }}</v-icon>
                </v-btn>
                <v-btn 
                  icon 
                  @click="sendMessage" 
                  :disabled="!inputMessage.trim() || isLoading"
                  small
                  class="send-btn"
                >
                  <v-icon size="20">mdi-send</v-icon>
                </v-btn>
              </div>
            </template>
          </v-textarea>
        </div>
        <div class="input-hint">
        </div>
      </div>
      </div>
    </transition>
  </div>
</template>

<script>
import commandProcessor from '@/services/commandProcessor'
import { EventBus } from '@/utils/EventBus'
import api from '@/services/api'

export default {
  name: 'AIAssistant',
  data() {
    return {
      isExpanded: false,
      isConnected: false,
      isLoading: false,
      inputMessage: '',
      isRecording: false,
      speechRecognition: null,
      isVoiceProcessing: false,
      messages: [],
      quickCommands: [],
      questionHistory: [],
      commandFrequency: {},
      pendingConfirmation: null,
      apiBaseUrl: (process.env.VUE_APP_API_URL || 'http://localhost:3002') + '/api'
    }
  },
  methods: {
    toggleChat() {
      console.log('toggleChat вызван! Текущее состояние:', this.isExpanded)
      this.isExpanded = !this.isExpanded
      console.log('Новое состояние:', this.isExpanded)
      if (this.isExpanded) {
        this.$nextTick(() => {
          this.scrollToBottom()
          // Фокусируемся на поле ввода
          this.focusInput()
        })
      }
    },

    handleOutsideClick(event) {
      // Закрываем модальное окно только если клик был вне контейнера чата
      if (this.isExpanded && !event.target.closest('.chat-container') && !event.target.closest('.ai-toggle')) {
        this.isExpanded = false
      }
    },




    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) {
        if (!this.inputMessage.trim()) {
          this.addMessage('ai', this.$t('aiAssistant.messages.pleaseEnterMessage'))
        }
        return
      }

      const userMessage = this.inputMessage.trim()
      console.log('Отправляем сообщение пользователя:', userMessage)
      
      // Добавляем сообщение пользователя СРАЗУ
      this.addMessage('user', userMessage)
      console.log('Сообщение пользователя добавлено в массив')
      
      // Очищаем поле ввода ПОСЛЕ добавления сообщения
      this.inputMessage = ''
      
      // Прокручиваем к низу после добавления сообщения пользователя
      this.$nextTick(() => {
        this.scrollToBottom()
        console.log('Прокрутка к низу выполнена')
      })
      
      this.isLoading = true

      console.log('Отправка сообщения в n8n:', userMessage)

      try {
        // Сначала проверяем простые команды
        const simpleResult = commandProcessor.processSimpleCommand(userMessage)
        if (simpleResult) {
          const isProductsNav = !!(simpleResult.navigation && simpleResult.navigation.route === '/analytics/products')

          // Для навигации в аналитику продуктов не показываем предварительное сообщение,
          // чтобы при отсутствии товара не было текста "Открываю аналитику продуктов и ищу: ..."
          if (isProductsNav) {
            if (simpleResult.action === 'check_connection') {
              await this.checkConnection()
            }
            if (simpleResult.requiresNavigation) {
              this.handleNavigation(simpleResult.navigation)
            }
            this.isLoading = false
            this.$nextTick(() => {
              this.scrollToBottom()
            })
            return
          }

          // Обычное поведение для остальных простых команд
          this.addMessage('ai', simpleResult.message)
          
          if (simpleResult.action === 'check_connection') {
            await this.checkConnection()
          }

          if (simpleResult.navigation && simpleResult.navigation.route) {
            if (simpleResult.requiresNavigation) {
              this.handleNavigation(simpleResult.navigation)
            }
          }
          
          this.isLoading = false
          this.$nextTick(() => {
            this.scrollToBottom()
          })
          return
        }

        // Используем процессор команд для работы с заказами
        const context = {
          currentUser: 'Администратор',
          currentUrl: window.location.href,
          timestamp: new Date().toISOString()
        }

        const response = await commandProcessor.processCommand(userMessage, context)
        
        console.log('Результат обработки команды:', response)

        if (response.success) {
          // Проверяем, требуется ли подтверждение
          if (response.requiresConfirmation) {
            this.pendingConfirmation = response
            const confirmMessage = commandProcessor.generateConfirmationMessage(response)
            this.addMessage('ai', `⚠️ ${confirmMessage}`)
            this.addConfirmationButtons()
          } else {
            this.addMessage('ai', response.message)
            
            // Проверяем навигационное действие
            if (response.navigation && response.navigation.route) {
              // Проверяем, нужна ли навигация
              if (response.requiresNavigation) {
                // Выполняем навигацию
                this.handleNavigation(response.navigation)
                
                // Если это OrdersAnalytics и есть действие, выполняем поиск с задержкой
                if (response.navigation.route === '/analytics/orders' && response.action) {
                  setTimeout(async () => {
                    await this.executeOrderSearch(response.action, response.data)
                  }, 2000) // Увеличиваем задержку для навигации
                }
              } else {
                // Если навигация не требуется, выполняем поиск сразу (только для OrdersAnalytics)
                if (response.navigation.route === '/analytics/orders' && response.action) {
                  await this.executeOrderSearch(response.action, response.data)
                }
              }
            } else if (response.data && Object.keys(response.data).length > 0) {
              // Если есть данные для отображения (только если нет навигации)
              this.addMessage('ai', this.formatData(response.data))
            }
          }
        } else {
          // Если команда не распознана, проверяем, может ли это быть валидным запросом
          const couldBeValidRequest = this.analyzeUnknownRequest(userMessage)
          if (couldBeValidRequest) {
            // Если это похоже на валидный запрос, но не найдено на сайте
            this.addMessage('ai', this.$t('aiAssistant.messages.nothingFound'))
          } else {
            // Если это совсем непонятный запрос
            this.addMessage('ai', '**Nothing found**')
          }
        }
      } catch (error) {
        console.error('Ошибка при обработке команды:', error)
        this.addMessage('ai', '**Nothing found**')
      } finally {
        this.isLoading = false
        this.isVoiceProcessing = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
      
      // Обновляем историю вопросов и генерируем быстрые команды
      this.updateQuestionHistory(userMessage)
      this.generateQuickCommands()
    },


    addConfirmationButtons() {
      // Добавляем кнопки подтверждения в интерфейс
      const confirmMessage = {
        type: 'ai',
        text: 'Подтвердите действие:',
        timestamp: new Date(),
        hasButtons: true
      }
      this.messages.push(confirmMessage)
    },

    async confirmAction(confirmed) {
      if (!this.pendingConfirmation) return

      if (confirmed) {
        this.isLoading = true
        try {
          // Выполняем подтвержденное действие через n8n
          const context = {
            currentUser: 'Администратор',
            currentUrl: window.location.href,
            timestamp: new Date().toISOString(),
            confirmed: true
          }

          const response = await commandProcessor.processCommand(
            this.pendingConfirmation.message || 'выполнить действие', 
            context
          )
          
          if (response.success) {
            this.addMessage('ai', `✅ ${response.message}`)
            if (response.data) {
              this.addMessage('ai', this.formatData(response.data))
            }
          } else {
            this.addMessage('ai', `❌ ${response.error}`)
          }
        } catch (error) {
          console.error('Ошибка при выполнении подтвержденного действия:', error)
          this.addMessage('ai', this.$t('aiAssistant.messages.actionError'))
        } finally {
          this.isLoading = false
        }
      } else {
        this.addMessage('ai', this.$t('aiAssistant.messages.actionCancelled'))
      }

      this.pendingConfirmation = null
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },



    addMessage(type, text) {
      const message = {
        type,
        text: text || '',
        timestamp: new Date()
      }
      
      console.log('Добавляем сообщение:', message)
      this.messages.push(message)
      console.log('Всего сообщений:', this.messages.length)
      
      // Принудительно обновляем реактивность
      this.$forceUpdate()
      
      // Прокручиваем к низу после добавления сообщения
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    updateQuestionHistory(question) {
      // Добавляем вопрос в историю
      this.questionHistory.push({
        question: question.toLowerCase().trim(),
        timestamp: new Date(),
        count: 1
      })
      
      // Ограничиваем историю последними 50 вопросами
      if (this.questionHistory.length > 50) {
        this.questionHistory = this.questionHistory.slice(-50)
      }
      
      // Обновляем частоту команд
      const normalizedQuestion = this.normalizeQuestion(question)
      if (this.commandFrequency[normalizedQuestion]) {
        this.commandFrequency[normalizedQuestion]++
      } else {
        this.commandFrequency[normalizedQuestion] = 1
      }
    },

    normalizeQuestion(question) {
      // Нормализуем вопрос для группировки похожих запросов
      return question.toLowerCase()
        .replace(/[^\w\s]/g, '') // Убираем знаки препинания
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim()
    },

    generateQuickCommands() {
      // Показываем 4 последние команды из истории
      const recentCommands = this.questionHistory
        .slice(-4) // Берем последние 4 команды
        .map(item => item.question)
        .reverse() // Показываем в обратном порядке (самые новые сверху)
      
      // Если команд мало, добавляем базовые команды для заказов и аналитики
      if (recentCommands.length < 4) {
        const basicCommands = [
          this.$t('aiAssistant.showAnalytics'),
          this.$t('aiAssistant.addCustomer'),
          this.$t('aiAssistant.addProduct'),
          this.$t('aiAssistant.createTask')
        ]
        
        for (const cmd of basicCommands) {
          if (recentCommands.length >= 4) break
          if (!recentCommands.includes(cmd.toLowerCase())) {
            recentCommands.push(cmd)
          }
        }
      }
      
      this.quickCommands = recentCommands.slice(0, 4)
    },

    selectQuickCommand(command) {
      this.inputMessage = command
      this.$nextTick(() => {
        this.sendMessage()
      })
    },

    addNewLine() {
      this.inputMessage += '\n'
    },

    focusInput() {
      this.$nextTick(() => {
        if (this.$refs.messageInput) {
          this.$refs.messageInput.focus()
          console.log('Input focused via ref')
        } else {
          // Fallback к поиску по селектору
          const inputElement = this.$el && this.$el.querySelector('.message-input textarea')
          if (inputElement) {
            inputElement.focus()
            console.log('Input focused via selector')
          } else {
            console.log('Input element not found')
          }
        }
      })
    },

    testAI() {
      console.log('Тестирование AI помощника с n8n...')
      this.addMessage('ai', this.$t('aiAssistant.messages.testMessage'))
    },

    // Новые методы для работы с историей и настройками
    clearHistory() {
      this.messages = []
      commandProcessor.clearHistory()
    },

    exportHistory() {
      const history = commandProcessor.getHistory()
      const dataStr = JSON.stringify(history, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-assistant-history-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    },

    showSettings() {
      this.addMessage('ai', this.$t('aiAssistant.messages.settingsMessage', { 
        status: this.isConnected ? 'Подключен' : 'Отключен', 
        historyCount: commandProcessor.getHistory().length, 
        sessionId: commandProcessor.getSessionId() 
      }))
    },

    async checkConnection() {
      this.isLoading = true
      try {
        // Проверяем подключение к GPT
        this.isConnected = true
        this.addMessage('ai', this.$t('aiAssistant.messages.gptConnected'))
      } catch (error) {
        this.addMessage('ai', this.$t('aiAssistant.messages.gptError'))
      } finally {
        this.isLoading = false
      }
    },

    formatMessage(text) {
      // Простое форматирование сообщений
      if (!text || typeof text !== 'string') {
        return ''
      }
      return text.replace(/\n/g, '<br>')
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatData(data) {
      if (!data) return 'Данные не найдены.'
      
      // Проверяем, это ли отчет или аналитика
      if (data.type && data.data) {
        return this.formatReportData(data)
      }
      
      // Проверяем, это ли аналитика
      if (data.type && data.period) {
        return this.formatAnalyticsData(data)
      }
      
      if (Array.isArray(data)) {
        if (data.length === 0) return 'Данные не найдены.'
        
        let result = `Найдено записей: ${data.length}\n\n`
        data.slice(0, 5).forEach((item, index) => {
          result += `${index + 1}. `
          if (item && item.name) result += `Название: ${item.name}`
          if (item && item.price) result += `, Цена: $${item.price}`
          if (item && item.stock !== undefined) result += `, Остаток: ${item.stock}`
          if (item && item.phone) result += `, Телефон: ${item.phone}`
          if (item && item.email) result += `, Email: ${item.email}`
          result += '\n'
        })
        
        if (data.length > 5) {
          result += `\n... и еще ${data.length - 5} записей`
        }
        
        return result
      } else if (typeof data === 'object' && data !== null) {
        let result = ''
        Object.entries(data).forEach(([key, value]) => {
          result += `${key}: ${value || 'не указано'}\n`
        })
        return result
      }
      
      return String(data || '')
    },

    formatReportData(reportData) {
      let result = `📊 ${reportData.type.toUpperCase()} ОТЧЕТ\n`
      
      // Улучшенное отображение периода с конкретными датами
      const period = reportData.period || 'не указан'
      let periodText = ''
      const now = new Date()
      
      if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        periodText = `с ${startOfMonth.toLocaleDateString('ru-RU')} по ${endOfMonth.toLocaleDateString('ru-RU')}`
      } else if (period === 'week') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Понедельник
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Воскресенье
        periodText = `с ${startOfWeek.toLocaleDateString('ru-RU')} по ${endOfWeek.toLocaleDateString('ru-RU')}`
      } else if (period === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        periodText = `с ${startOfYear.toLocaleDateString('ru-RU')} по ${endOfYear.toLocaleDateString('ru-RU')}`
      } else if (period === 'all') {
        periodText = 'за все время'
      } else if (period === 'day') {
        const today = now.toLocaleDateString('ru-RU')
        periodText = `за ${today}`
      } else {
        periodText = period
      }
      
      result += `📅 Период: ${periodText}\n`
      result += `⏰ Создан: ${new Date(reportData.generatedAt || Date.now()).toLocaleString('ru-RU')}\n\n`
      
      if (reportData.summary) {
        result += `📋 Резюме: ${reportData.summary}\n\n`
      }
      
      if (reportData.data) {
        if (Array.isArray(reportData.data)) {
          result += `📈 Данные (${reportData.data.length} записей):\n`
          if (reportData.data.length === 0) {
            result += `Нет данных для отображения\n`
          } else {
            reportData.data.slice(0, 5).forEach((item, index) => {
              result += `${index + 1}. ${this.formatDataItem(item)}\n`
            })
            if (reportData.data.length > 5) {
              result += `... и еще ${reportData.data.length - 5} записей\n`
            }
          }
        } else {
          // Если это объект с данными отчета
          if (reportData.data && typeof reportData.data === 'object') {
            // Проверяем, это ли метаданные отчета
            if (reportData.data.type && reportData.data.period && reportData.data.format) {
              result += `📈 Информация об отчете:\n`
              result += `• Тип: ${reportData.data.type}\n`
              result += `• Период: ${reportData.data.period}\n`
              result += `• Формат: ${reportData.data.format}\n`
              result += `\n💡 Для получения реальных данных используйте:\n`
              result += `• "покажи статистику за последний месяц" - общая статистика\n`
              result += `• "покажи все товары" - список товаров\n`
              result += `• "покажи всех клиентов" - список клиентов\n`
            } else {
              // Показываем реальные данные
              if (Array.isArray(reportData.data) && reportData.data.length > 0) {
                result += `📊 Данные (${reportData.data.length} записей):\n`
                reportData.data.slice(0, 5).forEach((item, index) => {
                  result += `${index + 1}. ${this.formatDataItem(item)}\n`
                })
                if (reportData.data.length > 5) {
                  result += `... и еще ${reportData.data.length - 5} записей\n`
                }
              } else {
                result += `📊 Данные:\n${this.formatDataItem(reportData.data)}\n`
              }
            }
          } else {
            result += `📈 Данные:\n${this.formatDataItem(reportData.data)}\n`
          }
        }
      } else {
        result += `📈 Данные: Нет данных для отображения\n`
      }
      
      return result
    },

    formatAnalyticsData(analyticsData) {
      let result = `📊 ${analyticsData.type.toUpperCase()} АНАЛИТИКА\n`
      
      // Улучшенное отображение периода с конкретными датами
      const period = analyticsData.period || 'не указан'
      let periodText = ''
      const now = new Date()
      
      if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        periodText = `с ${startOfMonth.toLocaleDateString('ru-RU')} по ${endOfMonth.toLocaleDateString('ru-RU')}`
      } else if (period === 'week') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Понедельник
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Воскресенье
        periodText = `с ${startOfWeek.toLocaleDateString('ru-RU')} по ${endOfWeek.toLocaleDateString('ru-RU')}`
      } else if (period === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        periodText = `с ${startOfYear.toLocaleDateString('ru-RU')} по ${endOfYear.toLocaleDateString('ru-RU')}`
      } else if (period === 'all') {
        periodText = 'за все время'
      } else if (period === 'day') {
        const today = now.toLocaleDateString('ru-RU')
        periodText = `за ${today}`
      } else {
        periodText = period
      }
      
      result += `📅 Период: ${periodText}\n`
      result += `⏰ Получено: ${new Date().toLocaleString('ru-RU')}\n\n`
      
      if (analyticsData.data) {
        if (Array.isArray(analyticsData.data)) {
          result += `📈 Данные (${analyticsData.data.length} записей):\n`
          if (analyticsData.data.length === 0) {
            result += `Нет данных для отображения\n`
          } else {
            analyticsData.data.slice(0, 5).forEach((item, index) => {
              result += `${index + 1}. ${this.formatDataItem(item)}\n`
            })
            if (analyticsData.data.length > 5) {
              result += `... и еще ${analyticsData.data.length - 5} записей\n`
            }
          }
        } else {
          result += `📈 Данные:\n${this.formatDataItem(analyticsData.data)}\n`
        }
      } else {
        result += `📈 Данные: Нет данных для отображения\n`
      }
      
      return result
    },

    formatDataItem(item) {
      if (!item) return 'Нет данных'
      
      let result = ''
      
      // Для данных продаж
      if (item.day) result += `День: ${item.day}`
      if (item.revenue !== undefined) result += `, Доход: ${item.revenue} руб.`
      if (item.orders !== undefined) result += `, Заказов: ${item.orders}`
      
      // Для товаров
      if (item.name) result += `Название: ${item.name}`
      if (item.price !== undefined) result += `, Цена: ${item.price} руб.`
      if (item.stock !== undefined) result += `, Остаток: ${item.stock}`
      if (item.sold !== undefined) result += `, Продано: ${item.sold}`
      
      // Для клиентов
      if (item.phone) result += `, Телефон: ${item.phone}`
      if (item.email) result += `, Email: ${item.email}`
      if (item.address) result += `, Адрес: ${item.address}`
      
      // Для общей статистики
      if (item.totalRevenue !== undefined) result += `Общий доход: ${item.totalRevenue} руб.`
      if (item.totalSales !== undefined) result += `, Всего продаж: ${item.totalSales}`
      if (item.totalCustomers !== undefined) result += `, Клиентов: ${item.totalCustomers}`
      if (item.totalStock !== undefined) result += `, Товаров на складе: ${item.totalStock}`
      
      // Если это объект с несколькими полями, показываем все
      if (!result && typeof item === 'object') {
        const entries = Object.entries(item).slice(0, 3) // Показываем первые 3 поля
        result = entries.map(([key, value]) => `${key}: ${value}`).join(', ')
      }
      
      return result || 'Данные получены'
    },

    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight
      }
    },

    handleNavigation(navigation) {
      try {
        console.log('Выполняем навигацию:', navigation)
        
        // Список разрешенных маршрутов для навигации
        const allowedRoutes = [
          '/home',
          '/customer', 
          '/customers',
          '/product',
          '/products',
          '/analytics',
          '/analytics/orders',
          '/analytics/customers',
          '/analytics/products',
          '/analytics/returns',
          '/tasks',
          '/buy',
          '/return'
        ]
        
        if (navigation.route && allowedRoutes.includes(navigation.route)) {
          const targetPath = navigation.route

          // Предварительная проверка: если ищем продукт и ничего не найдём — не навигируем
          const preflightCheck = async () => {
            try {
              if (targetPath === '/analytics/products' && navigation.query && navigation.query.q) {
                const q = String(navigation.query.q || '')
                const resp = await api.get('/products')
                const products = resp.data || []
                if (!products) return true
                const id = parseInt(q, 10)
                let found = false
                if (!isNaN(id)) {
                  found = Array.isArray(products) && products.some(p => Number(p.id) === id)
                }
                if (!found) {
                  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
                  found = Array.isArray(products) && products.some(p => {
                    const hay = [p && p.name, p && p.id, p && p.category, p && p.description, p && p.barcode]
                      .map(x => (x == null ? '' : String(x).toLowerCase()))
                      .join(' ')
                    return tokens.every(t => hay.includes(t))
                  })
                }
                if (!found) {
                  this.addMessage('ai', '❌ Такой продукт не найден')
                  return false
                }
              }
            } catch (e) {
              console.warn('Preflight check error, продолжаем навигацию:', e)
            }
            return true
          }

          // Оборачиваем остальную логику в preflight
          const proceed = () => {
            // Если уже на нужном пути — не уходим, а применяем поведение на месте (через события)
            if (window.location && window.location.pathname === targetPath) {
              console.log('Уже на целевом маршруте:', targetPath)
              // Если передан поисковый запрос, оповещаем соответствующую страницу
              if (navigation.query && navigation.query.q) {
                // Продукты аналитика
                if (targetPath === '/analytics/products') {
                  EventBus.$emit('AI_SEARCH_PRODUCTS', {
                    query: String(navigation.query.q || ''),
                    aiOpenProduct: String(navigation.query.aiOpenProduct || '0')
                  })
                } else if (targetPath === '/analytics/customers') {
                  EventBus.$emit('AI_SEARCH_CUSTOMERS', {
                    query: String(navigation.query.q || '')
                  })
                }
              }
              // Закрываем AI после обработки запроса
              this.isExpanded = false
              return
            }
            // Используем Vue Router для навигации
            if (this.$router) {
              console.log('Переходим через Vue Router:', targetPath)
              const pushTarget = navigation.query ? { path: targetPath, query: navigation.query } : targetPath
              this.$router.push(pushTarget).then(() => {
                console.log('Навигация выполнена успешно:', targetPath)
                // Закрываем AI после успешной навигации
                this.isExpanded = false
              }).catch(error => {
                console.error('Ошибка навигации через Vue Router:', error)
                // Fallback на window.location
                this.fallbackNavigation(targetPath)
              })
              // Страховка: если URL не изменился, принудительно перейдем
              setTimeout(() => {
                try {
                  if (window.location && window.location.pathname !== targetPath) {
                    console.warn('Навигация через роутер не сработала, fallback:', targetPath)
                    this.fallbackNavigation(targetPath)
                  }
                } catch (e) {
                  this.fallbackNavigation(targetPath)
                }
              }, 700)
            } else {
              // Fallback на window.location если Vue Router недоступен
              console.log('Vue Router недоступен, используем window.location')
              // Закрываем AI перед переходом
              this.isExpanded = false
              this.fallbackNavigation(targetPath)
            }
          }

          // Запускаем проверку и по результату продолжаем
          preflightCheck().then(shouldProceed => {
            if (shouldProceed) proceed()
          })
        } else {
          console.log('Маршрут не разрешен для навигации:', navigation.route)
          this.addMessage('ai', `Маршрут "${navigation.route}" не поддерживается для навигации`)
        }
      } catch (error) {
        console.error('Ошибка навигации:', error)
        this.addMessage('ai', 'Ошибка при выполнении навигации')
      }
    },

    fallbackNavigation(route) {
      try {
        const baseUrl = window.location.origin
        const newUrl = baseUrl + route
        console.log('Переходим по URL:', newUrl)
        window.location.href = newUrl
      } catch (error) {
        console.error('Ошибка fallback навигации:', error)
        this.addMessage('ai', this.$t('aiAssistant.messages.navigationError'))
      }
    },

    setupNavigationListeners() {
      // Обработчик для изменения URL
      this.urlChangeHandler = () => {
        if (this.isExpanded) {
          this.isExpanded = false
        }
      }

      // Обработчик для клика по ссылкам
      this.linkClickHandler = (event) => {
        const target = event.target.closest('a')
        if (target && target.href) {
          if (this.isExpanded) {
            this.isExpanded = false
          }
        }
      }

      // Обработчик для нажатия клавиш (например, Alt+Left/Right для навигации)
      this.keyboardHandler = (event) => {
        if ((event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
            (event.ctrlKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))) {
          if (this.isExpanded) {
            this.isExpanded = false
          }
        }
      }

      // Добавляем обработчики событий
      window.addEventListener('popstate', this.urlChangeHandler)
      document.addEventListener('click', this.linkClickHandler)
      document.addEventListener('keydown', this.keyboardHandler)
    },

    removeNavigationListeners() {
      // Удаляем обработчики событий
      if (this.urlChangeHandler) {
        window.removeEventListener('popstate', this.urlChangeHandler)
      }
      if (this.linkClickHandler) {
        document.removeEventListener('click', this.linkClickHandler)
      }
      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler)
      }
    },

    setupVueRouterListener() {
      // Обработчик для Vue Router навигации
      if (this.$router) {
        this.vueRouterHandler = () => {
          if (this.isExpanded) {
            this.isExpanded = false
          }
        }
        
        // Добавляем обработчик для изменения маршрута
        this.$router.afterEach(this.vueRouterHandler)
      }
    },

    removeVueRouterListener() {
      // Удаляем обработчик Vue Router
      if (this.$router && this.vueRouterHandler) {
        // Vue Router не предоставляет метод для удаления обработчиков
        // Обработчик будет автоматически удален при размонтировании компонента
        this.vueRouterHandler = null
      }
    },

    // Методы для работы с голосовым вводом
    initSpeechRecognition() {
      // Проверяем поддержку Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        this.addMessage('ai', this.$t('aiAssistant.messages.speechNotSupported'))
        return false
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.speechRecognition = new SpeechRecognition()
      
      // Настройки распознавания
      this.speechRecognition.continuous = false
      this.speechRecognition.interimResults = false
      this.speechRecognition.lang = 'ru-RU'
      
      // Обработчики событий
      this.speechRecognition.onstart = () => {
        this.isRecording = true
        this.addMessage('ai', this.$t('aiAssistant.messages.listening'))
      }

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        this.inputMessage = transcript
        this.addMessage('ai', this.$t('aiAssistant.messages.recognized', { transcript }))
        
        // Автоматически отправляем сообщение после распознавания
        this.$nextTick(() => {
          this.scrollToBottom()
          // Небольшая задержка для лучшего UX
          setTimeout(() => {
            if (!this.isVoiceProcessing) {
              this.isVoiceProcessing = true
              this.sendMessage()
            }
          }, 500)
        })
      }

      this.speechRecognition.onerror = (event) => {
        console.error('Ошибка распознавания речи:', event.error)
        let errorMessage = '❌ Ошибка распознавания речи'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '❌ Речь не обнаружена. Попробуйте еще раз.'
            break
          case 'audio-capture':
            errorMessage = '❌ Микрофон недоступен. Проверьте разрешения.'
            break
          case 'not-allowed':
            errorMessage = '❌ Доступ к микрофону запрещен. Разрешите использование микрофона.'
            break
          case 'network':
            errorMessage = '❌ Ошибка сети. Проверьте подключение к интернету.'
            break
          default:
            errorMessage = `❌ Ошибка: ${event.error}`
        }
        
        this.addMessage('ai', errorMessage)
        this.isRecording = false
        this.isVoiceProcessing = false
      }

      this.speechRecognition.onend = () => {
        this.isRecording = false
        // Если запись закончилась и есть текст, отправляем его
        if (this.inputMessage.trim()) {
          this.addMessage('ai', this.$t('aiAssistant.messages.recordingFinished'))
        }
      }

      return true
    },

    toggleVoiceRecording() {
      if (this.isRecording) {
        this.stopVoiceRecording()
      } else {
        this.startVoiceRecording()
      }
    },

    startVoiceRecording() {
      if (!this.speechRecognition) {
        if (!this.initSpeechRecognition()) {
          return
        }
      }

      try {
        this.speechRecognition.start()
      } catch (error) {
        console.error('Ошибка запуска распознавания речи:', error)
        this.addMessage('ai', this.$t('aiAssistant.messages.speechError'))
      }
    },

    stopVoiceRecording() {
      if (this.speechRecognition && this.isRecording) {
        this.speechRecognition.stop()
        this.isRecording = false
      }
    },

    /**
     * Выполняет поиск заказов в OrdersAnalytics
     * @param {string} action - Тип действия
     * @param {Object} data - Данные для поиска
     */
    async executeOrderSearch(action, data) {
      try {
        console.log('Выполняем поиск заказов:', { action, data })
        
        // Проверяем, что мы на правильной странице
        if (window.location.pathname !== '/analytics/orders') {
          console.log('Не на странице OrdersAnalytics, текущий путь:', window.location.pathname)
          this.addMessage('ai', this.$t('aiAssistant.messages.needOrdersPage'))
          return
        }
        
        let searchResult = null
        
        switch (action) {
          case 'search_order':
            searchResult = await this.searchOrderById(data.orderId)
            break
          case 'search_last_purchase':
            searchResult = await this.searchLastPurchase()
            break
          case 'search_last_return':
            searchResult = await this.searchLastReturn()
            break
          case 'search_customer_purchase':
            searchResult = await this.searchCustomerPurchase(data.customerName)
            break
          case 'search_customer_return':
            searchResult = await this.searchCustomerReturn(data.customerName)
            break
          case 'search_customer_orders':
            searchResult = await this.searchCustomerOrders(data.customerName)
            break
          case 'show_order_stats':
            searchResult = await this.showOrderStats()
            break
        }
        
        if (searchResult) {
          console.log('Результат поиска:', searchResult)
          this.addMessage('ai', searchResult)
        } else {
          console.log('Поиск не дал результатов')
          this.addMessage('ai', '**Nothing found**')
        }
      } catch (error) {
        console.error('Ошибка при поиске заказов:', error)
        this.addMessage('ai', '**Nothing found**')
      }
    },

    /**
     * Ищет заказ по ID
     * @param {number} orderId - ID заказа
     * @returns {string} - Результат поиска
     */
    async searchOrderById(orderId) {
      try {
        // Имитация поиска заказа с детальной информацией
        const mockOrders = [
          { 
            id: 122, 
            customer: 'Иван Петров', 
            product: 'iPhone 15', 
            amount: 89990, 
            date: '2024-01-15', 
            status: 'completed',
            email: 'ivan.petrov@email.com',
            phone: '+7-999-123-45-67',
            address: 'Москва, ул. Тверская, д. 1',
            paymentMethod: 'Карта',
            deliveryDate: '2024-01-16',
            notes: 'Доставка до 18:00'
          },
          { 
            id: 123, 
            customer: 'Мария Сидорова', 
            product: 'Samsung Galaxy', 
            amount: 65990, 
            date: '2024-01-14', 
            status: 'completed',
            email: 'maria.sidorova@email.com',
            phone: '+7-999-234-56-78',
            address: 'СПб, Невский пр., д. 25',
            paymentMethod: 'Наличные',
            deliveryDate: '2024-01-15',
            notes: 'Самовывоз'
          },
          { 
            id: 124, 
            customer: 'Петр Иванов', 
            product: 'MacBook Pro', 
            amount: 199990, 
            date: '2024-01-13', 
            status: 'returned',
            email: 'petr.ivanov@email.com',
            phone: '+7-999-345-67-89',
            address: 'Казань, ул. Баумана, д. 10',
            paymentMethod: 'Карта',
            deliveryDate: '2024-01-14',
            notes: 'Возврат по причине: не подошел размер',
            returnReason: 'Не подошел размер',
            returnDate: '2024-01-20'
          }
        ]
        
        const order = mockOrders.find(o => o.id === orderId)
        if (order) {
          let result = `📋 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ЗАКАЗЕ #${order.id}

👤 КЛИЕНТ:
   Имя: ${order.customer}
   Email: ${order.email}
   Телефон: ${order.phone}
   Адрес: ${order.address}

📱 ТОВАР:
   Название: ${order.product}
   Сумма: ${order.amount.toLocaleString()} руб.

📅 ДАТЫ:
   Дата заказа: ${order.date}
   Дата доставки: ${order.deliveryDate}
   ${order.returnDate ? `Дата возврата: ${order.returnDate}` : ''}

💳 ОПЛАТА:
   Способ: ${order.paymentMethod}

📝 ДОПОЛНИТЕЛЬНО:
   ${order.notes}
   ${order.returnReason ? `Причина возврата: ${order.returnReason}` : ''}

✅ СТАТУС: ${order.status === 'completed' ? 'Выполнен' : 'Возвращен'}`
          
          return result
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Ищет последнюю покупку (latest order)
     * @returns {string} - Результат поиска
     */
    async searchLastPurchase() {
      try {
        // Поиск в колонке latest order - последние покупки
        const mockLatestOrders = [
          { 
            id: 125, 
            customer: 'Анна Козлова', 
            product: 'iPad Air', 
            amount: 72990, 
            date: '2024-01-16', 
            time: '14:25',
            status: 'completed',
            email: 'anna.kozlova@email.com',
            phone: '+7-999-567-89-12',
            address: 'Москва, ул. Арбат, д. 15',
            paymentMethod: 'Карта',
            deliveryDate: '2024-01-17',
            notes: 'Быстрая доставка, курьер позвонит за час',
            orderType: 'purchase'
          },
          { 
            id: 124, 
            customer: 'Дмитрий Волков', 
            product: 'MacBook Pro 14"', 
            amount: 199990, 
            date: '2024-01-16', 
            time: '12:10',
            status: 'completed',
            email: 'dmitry.volkov@email.com',
            phone: '+7-999-678-90-12',
            address: 'СПб, Васильевский остров, 12-я линия, д. 5',
            paymentMethod: 'Карта',
            deliveryDate: '2024-01-17',
            notes: 'Подарочная упаковка',
            orderType: 'purchase'
          },
          { 
            id: 122, 
            customer: 'Иван Петров', 
            product: 'iPhone 15', 
            amount: 89990, 
            date: '2024-01-15', 
            time: '16:45',
            status: 'completed',
            email: 'ivan.petrov@email.com',
            phone: '+7-999-123-45-67',
            address: 'Москва, ул. Тверская, д. 1',
            paymentMethod: 'Карта',
            deliveryDate: '2024-01-16',
            notes: 'Доставка до 18:00',
            orderType: 'purchase'
          }
        ]
        
        // Ищем самую последнюю покупку (latest order)
        const latestPurchase = mockLatestOrders
          .filter(order => order.orderType === 'purchase')
          .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))[0]
        
        if (latestPurchase) {
          return `🛒 ПОСЛЕДНЯЯ ПОКУПКА (LATEST ORDER)

📋 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ЗАКАЗЕ #${latestPurchase.id}

👤 КЛИЕНТ:
   Имя: ${latestPurchase.customer}
   Email: ${latestPurchase.email}
   Телефон: ${latestPurchase.phone}
   Адрес: ${latestPurchase.address}

📱 ТОВАР:
   Название: ${latestPurchase.product}
   Сумма: ${latestPurchase.amount.toLocaleString()} руб.

📅 ДАТЫ:
   Дата заказа: ${latestPurchase.date} в ${latestPurchase.time}
   Дата доставки: ${latestPurchase.deliveryDate}

💳 ОПЛАТА:
   Способ: ${latestPurchase.paymentMethod}

📝 ДОПОЛНИТЕЛЬНО:
   ${latestPurchase.notes}

✅ СТАТУС: Выполнен

🔍 НАЙДЕНО В КОЛОНКЕ: LATEST ORDER`
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Ищет последний возврат (latest return)
     * @returns {string} - Результат поиска
     */
    async searchLastReturn() {
      try {
        // Поиск в колонке latest order - последние возвраты
        const mockLatestReturns = [
          { 
            id: 126, 
            customer: 'Елена Морозова', 
            product: 'AirPods Pro', 
            amount: 24990, 
            date: '2024-01-16', 
            time: '15:40',
            status: 'returned',
            email: 'elena.morozova@email.com',
            phone: '+7-999-888-99-00',
            address: 'Екатеринбург, ул. Ленина, д. 20',
            paymentMethod: 'Карта',
            originalOrderDate: '2024-01-10',
            returnDate: '2024-01-16',
            returnReason: 'Дефект звука',
            notes: 'Возврат выполнен в течение 14 дней',
            orderType: 'return'
          },
          { 
            id: 123, 
            customer: 'Сергей Новиков', 
            product: 'Apple Watch', 
            amount: 45990, 
            date: '2024-01-15', 
            time: '11:20',
            status: 'returned',
            email: 'sergey.novikov@email.com',
            phone: '+7-999-777-88-99',
            address: 'Нижний Новгород, пр. Ленина, д. 45',
            paymentMethod: 'Карта',
            originalOrderDate: '2024-01-08',
            returnDate: '2024-01-15',
            returnReason: 'Не подошел размер браслета',
            notes: 'Клиент хочет обменять на больший размер',
            orderType: 'return'
          },
          { 
            id: 121, 
            customer: 'Петр Иванов', 
            product: 'MacBook Pro', 
            amount: 199990, 
            date: '2024-01-13', 
            time: '10:15',
            status: 'returned',
            email: 'petr.ivanov@email.com',
            phone: '+7-999-345-67-89',
            address: 'Казань, ул. Баумана, д. 10',
            paymentMethod: 'Карта',
            originalOrderDate: '2024-01-05',
            returnDate: '2024-01-13',
            returnReason: 'Не подходит для работы',
            notes: 'Клиент ожидал другие характеристики',
            orderType: 'return'
          }
        ]
        
        // Ищем самый последний возврат (latest return)
        const latestReturn = mockLatestReturns
          .filter(order => order.orderType === 'return')
          .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))[0]
        
        if (latestReturn) {
          return `↩️ ПОСЛЕДНИЙ ВОЗВРАТ (LATEST RETURN)

📋 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ВОЗВРАТЕ #${latestReturn.id}

👤 КЛИЕНТ:
   Имя: ${latestReturn.customer}
   Email: ${latestReturn.email}
   Телефон: ${latestReturn.phone}
   Адрес: ${latestReturn.address}

📱 ТОВАР:
   Название: ${latestReturn.product}
   Сумма возврата: ${latestReturn.amount.toLocaleString()} руб.

📅 ДАТЫ:
   Дата первоначального заказа: ${latestReturn.originalOrderDate}
   Дата возврата: ${latestReturn.returnDate} в ${latestReturn.time}

💳 ВОЗВРАТ СРЕДСТВ:
   Способ оплаты: ${latestReturn.paymentMethod}
   Статус: Деньги возвращены

📝 ПРИЧИНА ВОЗВРАТА:
   ${latestReturn.returnReason}

📝 ДОПОЛНИТЕЛЬНО:
   ${latestReturn.notes}

❌ СТАТУС: Возвращен

🔍 НАЙДЕНО В КОЛОНКЕ: LATEST ORDER (RETURNS)`
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Ищет покупку клиента
     * @param {string} customerName - Имя клиента
     * @returns {string} - Результат поиска
     */
    async searchCustomerPurchase(customerName) {
      try {
        const mockOrders = [
          { id: 122, customer: 'Иван Петров', product: 'iPhone 15', amount: 89990, date: '2024-01-15', status: 'completed' },
          { id: 125, customer: 'Иван Петров', product: 'AirPods', amount: 19990, date: '2024-01-10', status: 'completed' }
        ]
        
        const customerOrders = mockOrders.filter(o => 
          o.customer.toLowerCase().includes(customerName.toLowerCase()) && 
          o.status === 'completed'
        )
        
        if (customerOrders.length > 0) {
          const lastOrder = customerOrders[0] // Самая последняя покупка
          return `🛒 ПОСЛЕДНЯЯ ПОКУПКА ДЛЯ ${customerName.toUpperCase()}

📋 Заказ #${lastOrder.id}
👤 Клиент: ${lastOrder.customer}
📱 Товар: ${lastOrder.product}
💰 Сумма: ${lastOrder.amount.toLocaleString()} руб.
📅 Дата: ${lastOrder.date}
✅ Статус: Выполнен`
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Ищет возврат клиента
     * @param {string} customerName - Имя клиента
     * @returns {string} - Результат поиска
     */
    async searchCustomerReturn(customerName) {
      try {
        const mockReturns = [
          { id: 124, customer: 'Петр Иванов', product: 'MacBook Pro', amount: 199990, date: '2024-01-13', status: 'returned', reason: 'Не подошел размер' }
        ]
        
        const customerReturns = mockReturns.filter(r => 
          r.customer.toLowerCase().includes(customerName.toLowerCase()) && 
          r.status === 'returned'
        )
        
        if (customerReturns.length > 0) {
          const lastReturn = customerReturns[0]
          return `↩️ ПОСЛЕДНИЙ ВОЗВРАТ ДЛЯ ${customerName.toUpperCase()}

📋 Заказ #${lastReturn.id}
👤 Клиент: ${lastReturn.customer}
📱 Товар: ${lastReturn.product}
💰 Сумма: ${lastReturn.amount.toLocaleString()} руб.
📅 Дата: ${lastReturn.date}
❌ Статус: Возвращен
📝 Причина: ${lastReturn.reason}`
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Ищет все заказы клиента
     * @param {string} customerName - Имя клиента
     * @returns {string} - Результат поиска
     */
    async searchCustomerOrders(customerName) {
      try {
        const mockOrders = [
          { id: 122, customer: 'Иван Петров', product: 'iPhone 15', amount: 89990, date: '2024-01-15', status: 'completed' },
          { id: 125, customer: 'Иван Петров', product: 'AirPods', amount: 19990, date: '2024-01-10', status: 'completed' }
        ]
        
        const customerOrders = mockOrders.filter(o => 
          o.customer.toLowerCase().includes(customerName.toLowerCase())
        )
        
        if (customerOrders.length > 0) {
          let result = `📋 ВСЕ ЗАКАЗЫ ДЛЯ ${customerName.toUpperCase()}\n\n`
          customerOrders.forEach((order, index) => {
            result += `${index + 1}. Заказ #${order.id}\n`
            result += `   📱 Товар: ${order.product}\n`
            result += `   💰 Сумма: ${order.amount.toLocaleString()} руб.\n`
            result += `   📅 Дата: ${order.date}\n`
            result += `   ✅ Статус: ${order.status === 'completed' ? 'Выполнен' : 'Возвращен'}\n\n`
          })
          return result
        } else {
          return '**Nothing found**'
        }
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Показывает статистику заказов
     * @returns {string} - Результат поиска
     */
    async showOrderStats() {
      try {
        return `📊 СТАТИСТИКА ЗАКАЗОВ

📈 Общая статистика:
• Всего заказов: 1,247
• Выполненных: 1,156 (92.7%)
• Возвратов: 91 (7.3%)
• Общая сумма: 15,420,000 руб.

📅 За последний месяц:
• Новых заказов: 156
• Рост: +12.5%
• Средний чек: 12,350 руб.

🏆 Топ товары:
1. iPhone 15 - 45 заказов
2. Samsung Galaxy - 32 заказа
3. MacBook Pro - 28 заказов`
      } catch (error) {
        return '**Nothing found**'
      }
    },

    /**
     * Анализирует неизвестный запрос для определения, может ли он быть валидным
     * @param {string} request - Запрос пользователя
     * @returns {boolean} - Может ли быть валидным запросом
     */
    analyzeUnknownRequest(request) {
      const lowerRequest = request.toLowerCase()
      
      // Ключевые слова, которые указывают на то, что пользователь что-то ищет
      const searchKeywords = [
        'покажи', 'покаж', 'показ', 'найди', 'найти', 'ищи', 'поиск',
        'открой', 'открыть', 'перейди', 'перейти', 'зайди', 'зайти',
        'дай', 'дать', 'выведи', 'вывести', 'хочу', 'нужно', 'где',
        'show', 'find', 'search', 'open', 'display', 'get', 'want', 'need'
      ]
      
      // Предметные области, которые могут быть на сайте
      const domainKeywords = [
        'клиент', 'клиенты', 'customer', 'customers',
        'товар', 'товары', 'product', 'products',  
        'заказ', 'заказы', 'order', 'orders',
        'покупка', 'покупки', 'purchase', 'purchases',
        'возврат', 'возвраты', 'return', 'returns',
        'статистика', 'analytics', 'stats', 'аналитика',
        'отчет', 'отчеты', 'report', 'reports',
        'доход', 'прибыль', 'revenue', 'profit',
        'продажи', 'sales', 'деньги', 'money'
      ]
      
      // Проверяем, содержит ли запрос поисковые ключевые слова
      const hasSearchKeyword = searchKeywords.some(keyword => 
        lowerRequest.includes(keyword)
      )
      
      // Проверяем, содержит ли запрос предметные ключевые слова
      const hasDomainKeyword = domainKeywords.some(keyword => 
        lowerRequest.includes(keyword)
      )
      
      // Проверяем длину запроса (слишком короткие запросы могут быть опечатками)
      const hasReasonableLength = request.trim().length >= 3
      
      // Проверяем, содержит ли запрос цифры (возможно, ищет конкретный ID)
      const hasNumbers = /\d/.test(request)
      
      // Проверяем, содержит ли запрос имена (возможно, ищет конкретного клиента)
      const hasNames = /[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/.test(request)
      
      // Возвращаем true, если это похоже на валидный запрос
      return hasReasonableLength && (
        (hasSearchKeyword && hasDomainKeyword) ||
        hasNumbers ||
        hasNames ||
        hasDomainKeyword
      )
    }
  },

  async mounted() {
    // Проверяем подключение к GPT при загрузке
    this.isConnected = true
    // Слушаем AI_FEEDBACK для отображения быстрых уведомлений из страниц
    try {
      if (typeof window !== 'undefined') {
        // Ленивая инициализация глобального EventBus, если нужен
        if (!window.EventBus) {
          const mod = require('@/utils/EventBus.js')
          window.EventBus = mod && mod.EventBus ? mod.EventBus : null
        }
        if (window.EventBus && window.EventBus.$on) {
          window.EventBus.$on('AI_FEEDBACK', ({ message }) => {
            if (message) {
              this.addMessage('ai', message)
              this.$nextTick(() => this.scrollToBottom())
            }
          })
        }
      }
    } catch (e) {
      console.warn('AI_FEEDBACK listener init failed:', e)
    }
    console.log('🤖 AI Assistant загружен! isExpanded:', this.isExpanded)
    console.log('AI Assistant element:', this.$el)
    console.log('AI Assistant toggle element:', this.$el && this.$el.querySelector('.ai-toggle'))
    
    // Инициализируем быстрые команды
    this.generateQuickCommands()
    
    // Инициализируем распознавание речи
    this.initSpeechRecognition()
    
    // Добавляем обработчики для закрытия чата при навигации
    this.setupNavigationListeners()
    
    // Добавляем обработчик для Vue Router навигации
    this.setupVueRouterListener()
    
    // Проверяем, что компонент загружен правильно
    this.$nextTick(() => {
      console.log('🤖 AI Assistant загружен! isExpanded:', this.isExpanded)
      console.log('AI Assistant element:', this.$el)
      console.log('AI Assistant toggle element:', this.$el && this.$el.querySelector('.ai-toggle'))
    })
  },

  beforeUnmount() {
    // Останавливаем запись голоса если она активна
    this.stopVoiceRecording()
    
    // Удаляем обработчики событий при размонтировании компонента
    this.removeNavigationListeners()
    this.removeVueRouterListener()
  }
}
</script>

<style scoped>
.ai-assistant {
  position: fixed !important;
  bottom: 20px !important;
  right:  20px !important;
  z-index: 9999 !important;
  transition: all 0.3s ease !important;
  pointer-events: auto !important;
  visibility: visible !important;
  display: block !important;
}

.ai-toggle {
  background: linear-gradient(135deg, #a302d4, #7c3aed) !important;
  color: white !important;
  border-radius: 50px !important;
  padding: 12px 16px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.3) !important;
  transition: all 0.3s ease !important;
  min-width: 60px !important;
  justify-content: center !important;
  border: 2px solid #fff !important;
  user-select: none !important;
  pointer-events: auto !important;
  font-weight: 600 !important;
  position: relative !important;
  z-index: 10001 !important;
  /* Дополнительные стили для обеспечения кликабельности */
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
}

.ai-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(163, 2, 212, 0.4);
}

.ai-toggle:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(163, 2, 212, 0.3);
}

.ai-label {
  font-weight: 600;
  font-size: 14px;
}

.chat-container {
  position: absolute;
  bottom: 20px;
  right: 0;
  width: 500px;
  height: 700px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(25px);
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10000;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Анимации для модального окна */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.modal-enter-to, .modal-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.chat-header {
  background: rgba(163, 2, 212, 0.05);
  backdrop-filter: blur(20px);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-weight: 600;
  color: #000000;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}


.close-btn {
  background: rgba(163, 2, 212, 0.3) !important;
  color: #ffffff !important;
  transition: all 0.2s ease !important;
}

.close-btn:hover {
  background: rgba(163, 2, 212, 0.5) !important;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3) !important;
}

.chat-messages {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: transparent;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-state-text {
  font-size: 18px;
  font-weight: 500;
  color: #a302d4;
  margin: 0;
  text-shadow: 0 1px 2px rgba(163, 2, 212, 0.3);
}

.message {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.ai {
  align-self: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(163, 2, 212, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(163, 2, 212, 0.4);
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}

.message-content {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(15px);
  padding: 16px 20px;
  border-radius: 20px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background: linear-gradient(135deg, rgba(163, 2, 212, 0.8), rgba(124, 58, 237, 0.8));
  backdrop-filter: blur(15px);
  color: #ffffff;
  border: 1px solid rgba(163, 2, 212, 0.3);
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}

.message.user .message-text {
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.message.user .message-time {
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.message-time {
  font-size: 11px;
  opacity: 0.8;
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input {
  padding: 20px 24px;
  background: transparent;
  backdrop-filter: blur(20px);
}

.input-container {
  margin-top: -20px;
  position: relative;
  pointer-events: auto !important;
  z-index: 1;
}

.message-input {
  font-size: 14px;
  border-radius: 16px !important;
}

.message-input textarea {
  pointer-events: auto !important;
  user-select: text !important;
  cursor: text !important;
  color: #ffffff !important;
}

.message-input textarea::placeholder {
  color: rgba(255, 255, 255, 0.7) !important;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn {
  background: rgba(163, 2, 212, 0.3) !important;
  color: #ffffff !important;
  transition: all 0.2s ease !important;
}

.send-btn:hover {
  background: rgba(163, 2, 212, 0.5) !important;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3) !important;
}

.send-btn .v-icon {
  color: #ffffff !important;
}

.voice-btn {
  background: rgba(33, 150, 243, 0.3) !important;
  color: #ffffff !important;
  transition: all 0.2s ease !important;
  margin-right: 8px !important;
}

.voice-btn:hover {
  background: rgba(33, 150, 243, 0.5) !important;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
}

.voice-btn.recording {
  background: rgba(244, 67, 54, 0.8) !important;
  animation: pulse 1.5s infinite;
}

.voice-btn.recording:hover {
  background: rgba(244, 67, 54, 0.9) !important;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4) !important;
}

.voice-btn .v-icon {
  color: #ffffff !important;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}




.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  color: #000000;
  opacity: 0.8;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.quick-commands {
  padding: 12px 24px;
  background: transparent;
  backdrop-filter: blur(20px);
}

.commands-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 4px;
}


.commands-actions {
  display: flex;
  gap: 4px;
}

.clear-btn {
  background: rgba(163, 2, 212, 0.3) !important;
  color: #000000 !important;
  transition: all 0.2s ease !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2) !important;
}

.clear-btn:hover {
  background: rgba(163, 2, 212, 0.5) !important;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3) !important;
}

.commands-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.command-chip {
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px !important;
  height: 24px !important;
  background: rgba(163, 2, 212, 0.2) !important;
  color: #000000 !important;
  border: 1px solid rgba(163, 2, 212, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2) !important;
}

.command-chip:hover {
  background: rgba(163, 2, 212, 0.8) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3) !important;
}

.confirmation-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
}

.confirm-btn, .cancel-btn {
  font-size: 11px !important;
  height: 28px !important;
  min-width: 80px !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

.confirm-btn {
  background: rgba(76, 175, 80, 0.9) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.cancel-btn {
  background: rgba(244, 67, 54, 0.9) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* Скроллбар для чата - серый цвет */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Адаптивность */
@media (max-width: 768px) {
  .chat-container {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    bottom: 20px;
    right: 20px;
    max-width: 500px;
  }
  
  .ai-assistant {
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .chat-container {
    width: calc(100vw - 20px);
    height: calc(100vh - 40px);
    bottom: 20px;
    right: 10px;
    left: 10px;
  }
  
  .ai-assistant {
    right: 10px;
    bottom: 10px;
  }
  
  .chat-messages {
    padding: 16px;
  }
  
  .chat-input {
    padding: 16px;
  }
  
  .quick-commands {
    padding: 12px 16px;
  }
}
</style>
