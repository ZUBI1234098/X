import axios from 'axios'

class N8NService {
  constructor() {
    this.baseUrl = 'http://localhost:5678' // URL вашего n8n сервера
    this.webhookUrl = `${this.baseUrl}/webhook/ai-assistant`
    this.testWebhookUrl = `${this.baseUrl}/webhook/test-product`
    this.apiUrl = `${this.baseUrl}/api/v1`
    this.timeout = 30000 // Увеличиваем таймаут для GPT обработки
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  /**
   * Отправляет команду в n8n для обработки
   * @param {string} command - Текстовая команда пользователя
   * @param {Object} context - Дополнительный контекст
   * @returns {Promise<Object>} - Результат обработки команды
   */
  async processCommand(command, context = {}) {
    const payload = {
      command: command,
      timestamp: new Date().toISOString(),
      context: {
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        sessionId: this.getSessionId(),
        ...context
      }
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`Попытка ${attempt}/${this.retryAttempts} отправки команды в n8n:`, command)
        
        const response = await axios.post(this.webhookUrl, payload, {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': this.generateRequestId()
          }
        })

        console.log('Ответ от n8n:', response.data)

        return {
          success: true,
          data: response.data,
          source: 'n8n',
          attempt: attempt
        }
      } catch (error) {
        console.error(`Ошибка при отправке команды в n8n (попытка ${attempt}):`, error)
        
        if (attempt === this.retryAttempts) {
          return {
            success: false,
            error: this.getErrorMessage(error),
            source: 'n8n',
            attempts: attempt
          }
        }
        
        // Ждем перед следующей попыткой
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  /**
   * Генерирует уникальный ID запроса
   * @returns {string} - Уникальный ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Получает ID сессии
   * @returns {string} - ID сессии
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('ai-assistant-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('ai-assistant-session-id', sessionId)
    }
    return sessionId
  }

  /**
   * Задержка между попытками
   * @param {number} ms - Миллисекунды
   * @returns {Promise} - Promise с задержкой
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Получает понятное сообщение об ошибке
   * @param {Error} error - Ошибка
   * @returns {string} - Сообщение об ошибке
   */
  getErrorMessage(error) {
    if (error.code === 'ECONNREFUSED') {
      return 'n8n сервер недоступен. Проверьте, что n8n запущен на порту 5678.'
    }
    if (error.code === 'ETIMEDOUT') {
      return 'Превышено время ожидания ответа от n8n сервера.'
    }
    if (error.response) {
      return `Ошибка сервера: ${error.response.status} - ${error.response.statusText}`
    }
    return error.message || 'Неизвестная ошибка при обращении к n8n'
  }

  /**
   * Проверяет доступность n8n сервера
   * @returns {Promise<boolean>} - Статус подключения
   */
  async checkConnection() {
    try {
      // Используем прокси-эндпоинт в бэкенде для проверки подключения к n8n
      const response = await axios.get('http://localhost:3002/api/n8n/health', { timeout: 5000 })
      return response.data.success
    } catch (error) {
      console.warn('n8n сервер недоступен:', error.message)
      return false
    }
  }

  /**
   * Получает список доступных команд из n8n
   * @returns {Promise<Array>} - Список команд
   */
  async getAvailableCommands() {
    try {
      const response = await axios.get(`${this.webhookUrl}/commands`, {
        timeout: this.timeout
      })
      return response.data
    } catch (error) {
      console.error('Ошибка при получении команд:', error)
      return []
    }
  }

  /**
   * Отправляет данные для создания клиента через n8n
   * @param {Object} customerData - Данные клиента
   * @returns {Promise<Object>} - Результат создания
   */
  async createCustomer(customerData) {
    return await this.processCommand(`создать клиента: ${JSON.stringify(customerData)}`)
  }

  /**
   * Отправляет данные для создания товара через n8n
   * @param {Object} productData - Данные товара
   * @returns {Promise<Object>} - Результат создания
   */
  async createProduct(productData) {
    return await this.processCommand(`создать товар: ${JSON.stringify(productData)}`)
  }

  /**
   * Отправляет запрос на поиск через n8n
   * @param {string} searchType - Тип поиска (customers, products, orders)
   * @param {string} searchTerm - Поисковый запрос
   * @returns {Promise<Object>} - Результат поиска
   */
  async search(searchType, searchTerm) {
    return await this.processCommand(`найти ${searchType}: ${searchTerm}`)
  }

  /**
   * Отправляет запрос на получение статистики через n8n
   * @returns {Promise<Object>} - Статистика
   */
  async getStatistics() {
    return await this.processCommand('показать статистику')
  }

  /**
   * Отправляет запрос на обновление склада через n8n
   * @param {number} productId - ID товара
   * @param {number} quantity - Количество для изменения
   * @returns {Promise<Object>} - Результат обновления
   */
  async updateStock(productId, quantity) {
    return await this.processCommand(`обновить склад: товар ${productId}, количество ${quantity}`)
  }

  /**
   * Отправляет запрос на создание заказа через n8n
   * @param {Object} orderData - Данные заказа
   * @returns {Promise<Object>} - Результат создания заказа
   */
  async createOrder(orderData) {
    return await this.processCommand(`создать заказ: ${JSON.stringify(orderData)}`)
  }

  /**
   * Отправляет запрос на удаление записи через n8n
   * @param {string} type - Тип записи (customer, product, order)
   * @param {number} id - ID записи
   * @returns {Promise<Object>} - Результат удаления
   */
  async deleteRecord(type, id) {
    return await this.processCommand(`удалить ${type}: ${id}`)
  }

  /**
   * Отправляет запрос на обновление записи через n8n
   * @param {string} type - Тип записи (customer, product, order)
   * @param {number} id - ID записи
   * @param {Object} updateData - Данные для обновления
   * @returns {Promise<Object>} - Результат обновления
   */
  async updateRecord(type, id, updateData) {
    return await this.processCommand(`обновить ${type} ${id}: ${JSON.stringify(updateData)}`)
  }

  /**
   * Отправляет запрос на получение аналитики через n8n
   * @param {string} analyticsType - Тип аналитики
   * @param {Object} filters - Фильтры
   * @returns {Promise<Object>} - Результат аналитики
   */
  async getAnalytics(analyticsType, filters = {}) {
    return await this.processCommand(`аналитика ${analyticsType}: ${JSON.stringify(filters)}`)
  }

  /**
   * Отправляет запрос на экспорт данных через n8n
   * @param {string} dataType - Тип данных для экспорта
   * @param {Object} options - Опции экспорта
   * @returns {Promise<Object>} - Результат экспорта
   */
  async exportData(dataType, options = {}) {
    return await this.processCommand(`экспорт ${dataType}: ${JSON.stringify(options)}`)
  }

  /**
   * Отправляет запрос на импорт данных через n8n
   * @param {string} dataType - Тип данных для импорта
   * @param {Object} data - Данные для импорта
   * @returns {Promise<Object>} - Результат импорта
   */
  async importData(dataType, data) {
    return await this.processCommand(`импорт ${dataType}: ${JSON.stringify(data)}`)
  }

  /**
   * Отправляет запрос на создание отчета через n8n
   * @param {string} reportType - Тип отчета
   * @param {Object} parameters - Параметры отчета
   * @returns {Promise<Object>} - Результат создания отчета
   */
  async generateReport(reportType, parameters = {}) {
    return await this.processCommand(`отчет ${reportType}: ${JSON.stringify(parameters)}`)
  }

  /**
   * Отправляет запрос на настройку уведомлений через n8n
   * @param {Object} notificationSettings - Настройки уведомлений
   * @returns {Promise<Object>} - Результат настройки
   */
  async setupNotifications(notificationSettings) {
    return await this.processCommand(`настройка уведомлений: ${JSON.stringify(notificationSettings)}`)
  }

  /**
   * Отправляет запрос на выполнение массовых операций через n8n
   * @param {string} operation - Тип операции
   * @param {Array} items - Список элементов для обработки
   * @returns {Promise<Object>} - Результат операции
   */
  async bulkOperation(operation, items) {
    return await this.processCommand(`массовая операция ${operation}: ${JSON.stringify(items)}`)
  }

  /**
   * Тестирует создание продукта через простой webhook
   * @param {string} command - Команда создания продукта
   * @returns {Promise<Object>} - Результат создания
   */
  async testCreateProduct(command) {
    const payload = {
      command: command,
      timestamp: new Date().toISOString()
    }

    try {
      console.log('Тестирование создания продукта:', command)
      
      const response = await axios.post(this.testWebhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Ответ от тестового webhook:', response.data)

      return {
        success: true,
        data: response.data,
        source: 'n8n-test'
      }
    } catch (error) {
      console.error('Ошибка при тестировании создания продукта:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
        source: 'n8n-test'
      }
    }
  }
}

// Создаем единственный экземпляр сервиса
const n8nService = new N8NService()

export default n8nService
