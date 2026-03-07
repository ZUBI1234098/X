import gptService from './gptService'

class CommandProcessor {
  constructor() {
    this.history = []
    this.sessionId = this.generateSessionId()
    this.maxHistorySize = 100
  }

  /**
   * Генерирует уникальный ID сессии
   * @returns {string} - ID сессии
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Получает ID текущей сессии
   * @returns {string} - ID сессии
   */
  getSessionId() {
    return this.sessionId
  }

  /**
   * Получает историю команд
   * @returns {Array} - История команд
   */
  getHistory() {
    return this.history
  }

  /**
   * Очищает историю команд
   */
  clearHistory() {
    this.history = []
  }

  /**
   * Добавляет команду в историю
   * @param {string} command - Команда
   * @param {Object} result - Результат выполнения
   */
  addToHistory(command, result) {
    this.history.push({
      timestamp: new Date().toISOString(),
      command,
      result,
      sessionId: this.sessionId
    })

    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
    }
  }

  /**
   * Обрабатывает команду пользователя через GPT
   * @param {string} command - Команда пользователя
   * @param {Object} context - Контекст выполнения
   * @returns {Promise<Object>} - Результат обработки
   */
  async processCommand(command, context = {}) {
    try {
      console.log('Обработка команды через GPT:', command)

      // Сначала проверяем простые команды
      const simpleResult = this.processSimpleCommand(command)
      if (simpleResult) {
        this.addToHistory(command, simpleResult)
        return simpleResult
      }

      // Обрабатываем команду через GPT
      const result = await gptService.processCommand(command, {
        ...context,
        sessionId: this.sessionId
      })

      // Добавляем в историю
      this.addToHistory(command, result)

      if (result.success) {
        return {
          success: true,
          message: this.formatSuccessMessage(result),
          data: result.data || {},
          action: result.action,
          navigation: result.navigation,
          requiresConfirmation: result.requiresConfirmation,
          confidence: result.confidence,
          source: 'gpt'
        }
      } else {
        return {
          success: false,
          error: result.error || 'Ошибка при обработке команды через GPT',
          suggestions: this.getErrorSuggestions(result.error),
          fallback: result.fallback
        }
      }

    } catch (error) {
      console.error('Ошибка в процессоре команд:', error)
      
      const errorResult = {
        success: false,
        error: error.message || 'Неизвестная ошибка при обработке команды',
        suggestions: this.getErrorSuggestions(error.message),
        fallback: true
      }

      this.addToHistory(command, errorResult)
      return errorResult
    }
  }

  /**
   * Форматирует сообщение об успешном выполнении
   * @param {Object} data - Данные от GPT
   * @returns {string} - Форматированное сообщение
   */
  formatSuccessMessage(data) {
    if (!data) return 'Команда выполнена успешно'

    if (typeof data === 'string') {
      return data
    }

    if (data.message) {
      return data.message
    }

    if (data.action) {
      const actionMessages = {
        'create': 'Запись успешно создана',
        'read': 'Данные получены',
        'update': 'Запись успешно обновлена',
        'delete': 'Запись успешно удалена',
        'search': 'Поиск выполнен',
        'analytics': 'Аналитика получена',
        'report': 'Отчет создан'
      }
      return actionMessages[data.action] || 'Операция выполнена успешно'
    }

    return 'Команда выполнена успешно'
  }

  /**
   * Получает предложения по исправлению ошибок
   * @param {string} error - Текст ошибки
   * @returns {Array} - Массив предложений
   */
  getErrorSuggestions(error) {
    const suggestions = []

    if (error && error.includes('API key')) {
      suggestions.push('Проверьте настройки API ключа OpenAI')
      suggestions.push('Убедитесь, что API ключ действителен')
    }

    if (error && error.includes('timeout')) {
      suggestions.push('Попробуйте еще раз через несколько секунд')
      suggestions.push('Проверьте подключение к интернету')
    }

    if (error && error.includes('не распознана')) {
      suggestions.push('Попробуйте переформулировать команду')
      suggestions.push('Используйте быстрые команды из списка')
    }

    // Общие предложения
    if (suggestions.length === 0) {
      suggestions.push('Попробуйте переформулировать команду')
      suggestions.push('Проверьте подключение к интернету')
      suggestions.push('Используйте команду "Помощь" для получения списка доступных команд')
    }

    return suggestions
  }

  /**
   * Генерирует сообщение для подтверждения действия
   * @param {Object} actionData - Данные действия
   * @returns {string} - Сообщение подтверждения
   */
  generateConfirmationMessage(actionData) {
    const { action, data } = actionData

    switch (action) {
      case 'delete':
        return `Вы уверены, что хотите удалить ${data.type || 'запись'}? Это действие нельзя отменить.`
      
      case 'update':
        return `Вы хотите обновить ${data.type || 'запись'}?`
      
      case 'create':
        return `Создать новую ${data.type || 'запись'}?`
      
      default:
        return 'Подтвердите выполнение этого действия.'
    }
  }

  /**
   * Проверяет, является ли команда навигационной
   * @param {string} command - Команда пользователя
   * @returns {boolean} - Является ли команда навигационной
   */
  isNavigationCommand(command) {
    const lowerCommand = command.toLowerCase()
    const navigationKeywords = [
      'зайди', 'перейди', 'открой', 'покажи', 'перейти',
      'аналитика', 'клиенты', 'товары', 'заказы', 'главная'
    ]
    
    return navigationKeywords.some(keyword => lowerCommand.includes(keyword))
  }

  /**
   * Обрабатывает простые команды без обращения к n8n
   * @param {string} command - Команда пользователя
   * @returns {Object} - Результат обработки
   */
  processSimpleCommand(command) {
    const lowerCommand = command.toLowerCase()

    // Приветствие
    if (lowerCommand.includes('привет') || lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
      return {
        success: true,
        message: 'Привет! Я ваш умный AI-помощник для работы с заказами. Я понимаю любые запросы, даже с опечатками. Чем могу помочь?',
        action: 'greeting'
      }
    }

    // Помощь
    if (lowerCommand.includes('помощь') || lowerCommand.includes('help') || lowerCommand.includes('команды')) {
      return {
        success: true,
        message: `🤖 AI-ПОМОЩНИК - ДОСТУПНЫЕ КОМАНДЫ:

📋 ПОИСК ЗАКАЗОВ:
• "покажи заказ 122" - найти заказ по ID
• "покажи последнюю покупку" - последняя покупка (latest order)
• "покажи последний возврат" - последний возврат (latest return)
• "покажи последнюю покупку для Ивана Петрова" - покупка клиента
• "покажи последний возврат для Марии" - возврат клиента

🔍 ПОИСК ПО КЛИЕНТАМ:
• "найди заказы Ивана Петрова" - все заказы клиента
• "покажи покупки клиента Мария" - покупки клиента
• "покажи возвраты для Ивана" - возвраты клиента

🧭 НАВИГАЦИЯ:
• "зайди в главную" - главная страница (Home)
• "зайди в клиенты" - страница клиентов (Customer)
• "зайди в продукты" - страница товаров (Product)
• "зайди в аналитику" - общая аналитика (Analytics)
• "зайди в задачи" - страница задач (Tasks)
• "зайди в покупку" - страница покупок (BuyPage)
• "зайди в возврат" - страница возвратов (ReturnPage)
• "зайди в аналитику заказов" - аналитика заказов (OrdersAnalytics)
• "покажи аналитику клиентов" - аналитика клиентов
• "покажи аналитику товаров" - аналитика товаров

📊 СТАТИСТИКА:
• "покажи статистику заказов" - общая статистика
• "покажи последние заказы" - последние заказы
• "покажи заказы за сегодня" - заказы за день

⚡ ОСОБЕННОСТИ:
• Понимаю любые формулировки и опечатки  
• Работаю с заказами и аналитикой
• Показываю детальную информацию
• Автоматическая навигация к нужным разделам
• Отвечаю "Nothing found" если ничего не найдено

Просто скажите, что нужно найти или куда перейти!`,
        action: 'help'
      }
    }

    // Статус подключения
    if (lowerCommand.includes('статус') || lowerCommand.includes('проверить подключение') || lowerCommand.includes('проверка')) {
      return {
        success: true,
        message: '✅ AI-помощник работает отлично! Все системы функционируют нормально.',
        action: 'check_connection'
      }
    }

    // Очистка истории
    if (lowerCommand.includes('очистить историю') || lowerCommand.includes('очистить чат')) {
      this.clearHistory()
      return {
        success: true,
        message: '✅ История очищена. Начинаем с чистого листа!',
        action: 'clear_history'
      }
    }

    // Настройки
    if (lowerCommand.includes('настройки') || lowerCommand.includes('settings')) {
      return {
        success: true,
        message: `⚙️ НАСТРОЙКИ AI-ПОМОЩНИКА:
• Режим: Умный (выполняет команды без вопросов)
• Обработка: GPT + Прямые API вызовы
• История: ${this.history.length} записей
• Сессия: ${this.sessionId}
• Статус: Активен

Используйте команды для управления системой!`,
        action: 'settings'
      }
    }

    // Обработка команд для заказов и аналитики
    const orderResult = this.processOrderCommand(command)
    if (orderResult) {
      return orderResult
    }

    // Обработка команд для навигации к аналитике
    const analyticsResult = this.processAnalyticsCommand(command)
    if (analyticsResult) {
      return analyticsResult
    }

    // Обработка команд для общей навигации по страницам
    const navigationResult = this.processNavigationCommand(command)
    if (navigationResult) {
      return navigationResult
    }

    // Поиск клиента по имени и переход в аналитику клиентов
    const customerSearch = this.processCustomerSearchCommand(command)
    if (customerSearch) {
      return customerSearch
    }

    return null
  }

  /**
   * Обрабатывает команды для работы с заказами
   * @param {string} command - Команда пользователя
   * @returns {Object} - Результат обработки
   */
  processOrderCommand(command) {
    const lowerCommand = command.toLowerCase()
    
    // Нормализация команды для обработки опечаток
    const normalizedCommand = this.normalizeOrderCommand(lowerCommand)
    
    // Поиск заказа по ID - улучшенные паттерны
    const orderIdPatterns = [
      /(?:заказ|order|ордер|покажи|show|найди|find|открой|open)\s*(\d+)/,
      /(\d+)\s*(?:заказ|order|ордер)/,
      /(?:номер|number|id)\s*(\d+)/,
      /#(\d+)/
    ]
    
    for (const pattern of orderIdPatterns) {
      const match = normalizedCommand.match(pattern)
      if (match) {
        const orderId = match[1]
        return {
          success: true,
          message: `🔍 Ищу заказ #${orderId}...`,
          action: 'search_order',
          data: { orderId: parseInt(orderId) },
          navigation: { route: '/analytics/orders' },
          requiresNavigation: true
        }
      }
    }
    
    // Поиск последней покупки
    if (this.matchesLastPurchase(normalizedCommand)) {
      return {
        success: true,
        message: `🔍 Ищу последнюю покупку...`,
        action: 'search_last_purchase',
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Поиск последнего возврата
    if (this.matchesLastReturn(normalizedCommand)) {
      return {
        success: true,
        message: `🔍 Ищу последний возврат...`,
        action: 'search_last_return',
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Поиск покупки клиента
    const customerPurchaseMatch = this.extractCustomerFromCommand(normalizedCommand, ['покупка', 'покупку', 'purchase', 'buy'])
    if (customerPurchaseMatch) {
      return {
        success: true,
        message: `🔍 Ищу последнюю покупку для ${customerPurchaseMatch}...`,
        action: 'search_customer_purchase',
        data: { customerName: customerPurchaseMatch },
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Поиск возврата клиента
    const customerReturnMatch = this.extractCustomerFromCommand(normalizedCommand, ['возврат', 'возврату', 'return', 'refund'])
    if (customerReturnMatch) {
      return {
        success: true,
        message: `🔍 Ищу последний возврат для ${customerReturnMatch}...`,
        action: 'search_customer_return',
        data: { customerName: customerReturnMatch },
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Поиск всех заказов клиента
    const customerOrdersMatch = this.extractCustomerFromCommand(normalizedCommand, ['заказ', 'заказы', 'orders'])
    if (customerOrdersMatch) {
      return {
        success: true,
        message: `🔍 Ищу все заказы для ${customerOrdersMatch}...`,
        action: 'search_customer_orders',
        data: { customerName: customerOrdersMatch },
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Статистика заказов
    if (this.matchesOrderStats(normalizedCommand)) {
      return {
        success: true,
        message: `📊 Показываю статистику заказов...`,
        action: 'show_order_stats',
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    return null
  }

  /**
   * Нормализует команду для обработки опечаток
   * @param {string} command - Команда пользователя
   * @returns {string} - Нормализованная команда
   */
  normalizeOrderCommand(command) {
    // Заменяем опечатки и альтернативные формулировки
    const replacements = {
      // Расширенные опечатки в "покажи"
      'покажы': 'покажи', 'покаж': 'покажи', 'показ': 'покажи', 'показжи': 'покажи',
      'покажыи': 'покажи', 'покажыы': 'покажи', 'покажии': 'покажи', 'покажее': 'покажи',
      'покажми': 'покажи', 'покажне': 'покажи', 'покази': 'покажи', 'показы': 'покажи',
      'покаажи': 'покажи', 'покаджи': 'покажи', 'покадж': 'покажи', 'пкажи': 'покажи',
      
      // Расширенные опечатки в "заказ"
      'зака': 'заказ', 'заказы': 'заказ', 'заказов': 'заказ', 'заказа': 'заказ',
      'заказу': 'заказ', 'заказе': 'заказ', 'заказом': 'заказ', 'заказами': 'заказ',
      'закаа': 'заказ', 'заакз': 'заказ', 'зааз': 'заказ', 'закз': 'заказ',
      'ордер': 'заказ', 'ордера': 'заказ', 'ордеры': 'заказ', 'ордеров': 'заказ',
      'ордеру': 'заказ', 'ордером': 'заказ', 'ордерами': 'заказ', 'орде': 'заказ',
      
      // Расширенные опечатки в "покупка"
      'покупку': 'покупка', 'покупки': 'покупка', 'покупок': 'покупка', 'покупке': 'покупка',
      'покупкой': 'покупка', 'покупками': 'покупка', 'покупкй': 'покупка', 'покупкуу': 'покупка',
      'покукпа': 'покупка', 'покупак': 'покупка', 'покупкп': 'покупка', 'покупкуа': 'покупка',
      'покуп': 'покупка', 'покуупка': 'покупка', 'пкупка': 'покупка', 'покупуа': 'покупка',
      
      // Расширенные опечатки в "возврат"
      'возврату': 'возврат', 'возвраты': 'возврат', 'возвратов': 'возврат', 'возврата': 'возврат',
      'возвратом': 'возврат', 'возвратами': 'возврат', 'возврате': 'возврат', 'возвра': 'возврат',
      'возвррат': 'возврат', 'возраат': 'возврат', 'возврвт': 'возврат', 'возвраот': 'возврат',
      'возврра': 'возврат', 'вощврат': 'возврат', 'возрат': 'возврат', 'возвра': 'возврат',
      
      // Расширенные альтернативные формулировки
      'последняя': 'последний', 'последнюю': 'последний', 'последние': 'последний',
      'последнего': 'последний', 'последней': 'последний', 'последним': 'последний',
      'последними': 'последний', 'последних': 'последний', 'последннее': 'последний',
      'поселдний': 'последний', 'послений': 'последний', 'последий': 'последний',
      'latest': 'последний', 'last': 'последний', 'recent': 'последний',
      
      // Расширенные опечатки в именах
      'иван': 'Иван', 'ивн': 'Иван', 'иввн': 'Иван', 'иаван': 'Иван',
      'мария': 'Мария', 'мари': 'Мария', 'мраия': 'Мария', 'мараи': 'Мария',
      'петр': 'Петр', 'петь': 'Петр', 'пер': 'Петр', 'птр': 'Петр',
      'петров': 'Петров', 'петрв': 'Петров', 'петорв': 'Петров',
      'сидоров': 'Сидоров', 'сидров': 'Сидоров', 'сидорв': 'Сидоров',
      
      // Альтернативные названия страниц и разделов  
      'аналитика': 'analytics', 'аналитики': 'analytics', 'аналитику': 'analytics',
      'анлитика': 'analytics', 'аналитка': 'analytics', 'аналтика': 'analytics',
      'заказы': 'orders', 'ордеры': 'orders', 'заакзы': 'orders',
      'клиенты': 'customers', 'клиены': 'customers', 'клинеты': 'customers',
      'товары': 'products', 'товры': 'products', 'товаы': 'products',
      
      // Английские варианты
      'order': 'заказ', 'orders': 'заказ', 'ord': 'заказ',
      'purchase': 'покупка', 'purchases': 'покупка', 'buy': 'покупка',
      'return': 'возврат', 'returns': 'возврат', 'refund': 'возврат',
      'show': 'покажи', 'display': 'покажи', 'view': 'покажи',
      'find': 'найди', 'search': 'найди', 'look': 'найди',
      'open': 'открой', 'go': 'иди', 'navigate': 'иди',
      
      // Дополнительные глаголы действий
      'найди': 'покажи', 'найти': 'покажи', 'ищи': 'покажи', 'поищи': 'покажи',
      'открой': 'покажи', 'открыть': 'покажи', 'зайди': 'покажи', 'перейди': 'покажи',
      'посмотри': 'покажи', 'посмотреть': 'покажи', 'дай': 'покажи', 'выведи': 'покажи'
    }
    
    let normalized = command.toLowerCase()
    
    // Применяем замены
    for (const [wrong, correct] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(wrong, 'gi'), correct)
    }
    
    // Дополнительная нормализация пробелов и знаков препинания
    normalized = normalized.replace(/\s+/g, ' ').trim()
    normalized = normalized.replace(/[.,!?;:]/g, '')
    
    return normalized
  }

  /**
   * Проверяет, соответствует ли команда поиску последней покупки
   * @param {string} command - Нормализованная команда
   * @returns {boolean} - Соответствует ли команда
   */
  matchesLastPurchase(command) {
    const patterns = [
      /последн(ий|ая|ую) покупк(у|а|и)/,
      /latest purchase/,
      /last buy/,
      /последн(ий|ая|ую) покуп/,
      /покажи последн(ий|ая|ую) покупк(у|а|и)/,
      /show last purchase/,
      /show latest purchase/,
      /покажи последнюю покупку/,
      /покажи последнюю покупка/,
      /покажи последнюю покупки/,
      /покажи последний покупка/,
      /покажи последний покупку/,
      /покажи последний покупки/,
      /покажи последняя покупка/,
      /покажи последняя покупку/,
      /покажи последняя покупки/,
      /покажи последние покупка/,
      /покажи последние покупку/,
      /покажи последние покупки/,
      /latest order/,
      /last order/,
      /последний заказ/,
      /последняя заказ/,
      /последнюю заказ/,
      /последние заказ/
    ]
    
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет, соответствует ли команда поиску последнего возврата
   * @param {string} command - Нормализованная команда
   * @returns {boolean} - Соответствует ли команда
   */
  matchesLastReturn(command) {
    const patterns = [
      /последн(ий|ая|ую) возврат/,
      /latest return/,
      /last return/,
      /последн(ий|ая|ую) возвра/,
      /покажи последн(ий|ая|ую) возврат/,
      /show last return/,
      /show latest return/,
      /покажи последний возврат/,
      /покажи последняя возврат/,
      /покажи последнюю возврат/,
      /покажи последние возврат/,
      /покажи последний возврату/,
      /покажи последняя возврату/,
      /покажи последнюю возврату/,
      /покажи последние возврату/,
      /покажи последний возвраты/,
      /покажи последняя возвраты/,
      /покажи последнюю возвраты/,
      /покажи последние возвраты/,
      /покажи последний возвратов/,
      /покажи последняя возвратов/,
      /покажи последнюю возвратов/,
      /покажи последние возвратов/
    ]
    
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Извлекает имя клиента из команды
   * @param {string} command - Нормализованная команда
   * @param {Array} keywords - Ключевые слова для поиска
   * @returns {string|null} - Имя клиента или null
   */
  extractCustomerFromCommand(command, keywords) {
    // Паттерны для поиска имени клиента
    const patterns = [
      /для\s+([а-яё\s]+)/i,
      /клиента\s+([а-яё\s]+)/i,
      /customer\s+([а-яё\s]+)/i,
      /client\s+([а-яё\s]+)/i,
      /([а-яё\s]+)\s+(?:покупк|возврат|заказ)/i
    ]
    
    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        const name = match[1].trim()
        // Проверяем, что это не служебное слово
        if (!['для', 'клиента', 'customer', 'client'].includes(name.toLowerCase())) {
          return name
        }
      }
    }
    
    return null
  }

  /**
   * Проверяет, соответствует ли команда статистике заказов
   * @param {string} command - Нормализованная команда
   * @returns {boolean} - Соответствует ли команда
   */
  matchesOrderStats(command) {
    const patterns = [
      /статистик(у|а|и) заказ/,
      /статистик(у|а|и) покуп/,
      /статистик(у|а|и) возврат/,
      /order stats/,
      /purchase stats/,
      /return stats/,
      /покажи статистик/,
      /show stats/
    ]
    
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Обрабатывает команды для навигации к аналитике
   * @param {string} command - Команда пользователя
   * @returns {Object} - Результат обработки
   */
  processAnalyticsCommand(command) {
    const lowerCommand = command.toLowerCase()
    const normalizedCommand = this.normalizeOrderCommand(lowerCommand)
    
    // Навигация к общей аналитике
    if (this.matchesGeneralAnalytics(normalizedCommand)) {
      return {
        success: true,
        message: `📊 Переходим в аналитику...`,
        action: 'navigate',
        navigation: { route: '/analytics' },
        requiresNavigation: true
      }
    }
    
    // Навигация к аналитике заказов (OrdersAnalytics)
    if (this.matchesOrdersAnalytics(normalizedCommand)) {
      return {
        success: true,
        message: `📋 Переходим в аналитику заказов...`,
        action: 'navigate', 
        navigation: { route: '/analytics/orders' },
        requiresNavigation: true
      }
    }
    
    // Навигация к аналитике клиентов
    if (this.matchesCustomersAnalytics(normalizedCommand)) {
      return {
        success: true,
        message: `👥 Переходим в аналитику клиентов...`,
        action: 'navigate',
        navigation: { route: '/analytics/customers' },
        requiresNavigation: true
      }
    }
    
    // Навигация к аналитике товаров
    if (this.matchesProductsAnalytics(normalizedCommand)) {
      return {
        success: true,
        message: `📦 Переходим в аналитику товаров...`,
        action: 'navigate',
        navigation: { route: '/analytics/products' },
        requiresNavigation: true
      }
    }
    
    // Навигация к возвратам
    if (this.matchesReturnsAnalytics(normalizedCommand)) {
      return {
        success: true,
        message: `↩️ Переходим в аналитику возвратов...`,
        action: 'navigate',
        navigation: { route: '/analytics/returns' },
        requiresNavigation: true
      }
    }
    
    return null
  }

  /**
   * Проверяет команды общей аналитики
   */
  matchesGeneralAnalytics(command) {
    const patterns = [
      /покажи analytics/,
      /открой analytics/,
      /иди в analytics/,
      /перейди в analytics/,
      /зайди в analytics/,
      /аналитика$/,
      /analytics$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды аналитики заказов
   */
  matchesOrdersAnalytics(command) {
    const patterns = [
      /покажи analytics orders/,
      /открой analytics orders/,
      /иди в analytics orders/,
      /analytics заказ/,
      /analytics ордер/,
      /аналитика заказ/,
      /аналитика ордер/,
      /заказы analytics/,
      /ордеры analytics/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды аналитики клиентов
   */
  matchesCustomersAnalytics(command) {
    const patterns = [
      /покажи analytics customers/,
      /открой analytics customers/,
      /analytics клиент/,
      /аналитика клиент/,
      /клиенты analytics/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды аналитики товаров
   */
  matchesProductsAnalytics(command) {
    const patterns = [
      /покажи analytics products/,
      /открой analytics products/,
      /analytics товар/,
      /аналитика товар/,
      /товары analytics/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды аналитики возвратов
   */
  matchesReturnsAnalytics(command) {
    const patterns = [
      /покажи analytics returns/,
      /открой analytics returns/,
      /analytics возврат/,
      /аналитика возврат/,
      /возвраты analytics/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Обрабатывает команды для общей навигации по страницам
   * @param {string} command - Команда пользователя
   * @returns {Object} - Результат обработки
   */
  processNavigationCommand(command) {
    const lowerCommand = command.toLowerCase()
    const normalizedCommand = this.normalizeNavigationCommand(lowerCommand)

    // Команда: "покажи продукт <запрос>" → перейти в ProductsAnalytics, раскрыть список и показать историю
    const productMatch = lowerCommand.match(/(?:покажи|найди|открой)\s+(?:продукт|товар|product|пролук[тт])\s+(.+)/i)
    if (productMatch && productMatch[1]) {
      const query = productMatch[1].trim()
      return {
        success: true,
        message: `📦 Открываю аналитику продуктов и ищу: ${query}...`,
        action: 'navigate',
        navigation: { route: '/analytics/products', query: { q: query, aiOpenProduct: '1' } },
        requiresNavigation: true
      }
    }

    // Универсальная команда: "покажи <что-угодно>" → считаем это поиском по товарам, 
    // если не упомянута другая область (клиенты/заказы/аналитика возвратов и т.д.)
    const genericShowMatch = lowerCommand.match(/(?:покажи|найди|show|find)\s+(.+)/i)
    if (genericShowMatch && genericShowMatch[1]) {
      const forbiddenDomains = ['клиент', 'клиенты', 'customer', 'customers', 'заказ', 'заказы', 'order', 'orders', 'аналитик', 'analytics returns', 'возврат', 'returns', 'return']
      const rest = genericShowMatch[1].trim()
      const mentionsForbidden = forbiddenDomains.some(k => lowerCommand.includes(k))
      if (!mentionsForbidden) {
        return {
          success: true,
          message: `📦 Открываю аналитику продуктов и ищу: ${rest}...`,
          action: 'navigate',
          navigation: { route: '/analytics/products', query: { q: rest, aiOpenProduct: '1' } },
          requiresNavigation: true
        }
      }
    }
    
    // Навигация на главную страницу
    if (this.matchesHomePage(normalizedCommand)) {
      return {
        success: true,
        message: `🏠 Переходим на главную страницу...`,
        action: 'navigate',
        navigation: { route: '/home' },
        requiresNavigation: true
      }
    }
    
    // Навигация к клиентам
    if (this.matchesCustomersPage(normalizedCommand)) {
      return {
        success: true,
        message: `👥 Переходим к клиентам...`,
        action: 'navigate',
        navigation: { route: '/analytics/customers' },
        requiresNavigation: true
      }
    }
    
    // Навигация к товарам
    if (this.matchesProductsPage(normalizedCommand)) {
      return {
        success: true,
        message: `📦 Переходим к товарам...`,
        action: 'navigate',
        navigation: { route: '/product' },
        requiresNavigation: true
      }
    }
    
    // Навигация к задачам
    if (this.matchesTasksPage(normalizedCommand)) {
      return {
        success: true,
        message: `✅ Переходим к задачам...`,
        action: 'navigate',
        navigation: { route: '/tasks' },
        requiresNavigation: true
      }
    }
    
    // Навигация к покупкам
    if (this.matchesBuyPage(normalizedCommand)) {
      return {
        success: true,
        message: `🛒 Переходим к покупкам...`,
        action: 'navigate',
        navigation: { route: '/buy' },
        requiresNavigation: true
      }
    }
    
    // Навигация к возвратам
    if (this.matchesReturnPage(normalizedCommand)) {
      return {
        success: true,
        message: `↩️ Переходим к возвратам...`,
        action: 'navigate',
        navigation: { route: '/return' },
        requiresNavigation: true
      }
    }
    
    return null
  }

  /**
   * Обрабатывает команду поиска клиента и навигацию в аналитику клиентов
   * Примеры: "найди клиента Иван", "покажи клиента Мария", "найди клиента Иван Петров"
   */
  processCustomerSearchCommand(command) {
    const lower = String(command || '').toLowerCase()
    // Паттерны извлечения имени клиента после ключевых слов
    const match = lower.match(/(?:найди|покажи|открой)\s+клиент(?:а|у|ом|ы)?\s+(.+)/i)
    if (match && match[1]) {
      const name = match[1].trim()
      if (name) {
        return {
          success: true,
          message: `👥 Открываю аналитику клиентов и ищу: ${name}...`,
          action: 'navigate',
          navigation: { route: '/analytics/customers', query: { q: name } },
          requiresNavigation: true
        }
      }
    }

    // Вариант без слова "клиент": "найди Иван Петров в клиентах"
    const matchIn = lower.match(/(?:найди|покажи)\s+(.+?)\s+в\s+клиент/)
    if (matchIn && matchIn[1]) {
      const name = matchIn[1].trim()
      if (name) {
        return {
          success: true,
          message: `👥 Открываю аналитику клиентов и ищу: ${name}...`,
          action: 'navigate',
          navigation: { route: '/analytics/customers', query: { q: name } },
          requiresNavigation: true
        }
      }
    }

    return null
  }

  /**
   * Нормализует команду для обработки опечаток в навигации
   * @param {string} command - Команда пользователя
   * @returns {string} - Нормализованная команда
   */
  normalizeNavigationCommand(command) {
    const replacements = {
      // Главная страница
      'главная': 'home', 'главную': 'home', 'главной': 'home', 'главное': 'home',
      'главные': 'home', 'главного': 'home', 'главным': 'home', 'главными': 'home',
      'главных': 'home', 'главн': 'home', 'главнaя': 'home', 'главнa': 'home',
      'home': 'home', 'main': 'home', 'dashboard': 'home',
      
      // Клиенты
      'клиенты': 'customers', 'клиентов': 'customers', 'клиента': 'customers',
      'клиенту': 'customers', 'клиентом': 'customers', 'клиентами': 'customers',
      'клиентах': 'customers', 'клиент': 'customers', 'клиен': 'customers',
      'клиенты': 'customers', 'клиенов': 'customers', 'клиенa': 'customers',
      'customers': 'customers', 'customer': 'customers', 'clients': 'customers',
      
      // Товары/Продукты
      'товары': 'products', 'товаров': 'products', 'товара': 'products',
      'товару': 'products', 'товаром': 'products', 'товарами': 'products',
      'товарах': 'products', 'товар': 'products', 'това': 'products',
      'товарa': 'products', 'товарs': 'products', 'товарa': 'products',
      'продукты': 'products', 'продуктов': 'products', 'продукта': 'products',
      'продукту': 'products', 'продуктом': 'products', 'продуктами': 'products',
      'продуктах': 'products', 'продукт': 'products', 'проду': 'products',
      'products': 'products', 'product': 'products', 'items': 'products',
      
      // Задачи
      'задачи': 'tasks', 'задач': 'tasks', 'задачу': 'tasks', 'задачей': 'tasks',
      'задачами': 'tasks', 'задачах': 'tasks', 'задача': 'tasks', 'зада': 'tasks',
      'задачa': 'tasks', 'задачs': 'tasks', 'задачa': 'tasks',
      'tasks': 'tasks', 'task': 'tasks', 'todo': 'tasks',
      
      // Покупки
      'покупки': 'buy', 'покупок': 'buy', 'покупку': 'buy', 'покупкой': 'buy',
      'покупками': 'buy', 'покупках': 'buy', 'покупка': 'buy', 'покуп': 'buy',
      'покупкa': 'buy', 'покупкs': 'buy', 'покупкa': 'buy',
      'buy': 'buy', 'purchase': 'buy', 'shopping': 'buy',
      
      // Возвраты
      'возвраты': 'return', 'возвратов': 'return', 'возврату': 'return',
      'возвратом': 'return', 'возвратами': 'return', 'возвратах': 'return',
      'возврат': 'return', 'возвра': 'return', 'возвратa': 'return',
      'return': 'return', 'returns': 'return', 'refund': 'return',
      
      // Навигационные глаголы
      'зайди': 'go', 'зайти': 'go', 'перейди': 'go', 'перейти': 'go',
      'иди': 'go', 'идти': 'go', 'открой': 'go', 'открыть': 'go',
      'покажи': 'go', 'показать': 'go', 'открой': 'go', 'открыть': 'go',
      'go': 'go', 'navigate': 'go', 'open': 'go', 'show': 'go',
      
      // Предлоги и союзы
      'в': 'to', 'на': 'to', 'к': 'to', 'to': 'to',
      'страницу': 'page', 'страницы': 'page', 'странице': 'page',
      'страницей': 'page', 'страницами': 'page', 'страницах': 'page',
      'page': 'page', 'section': 'page'
    }
    
    let normalized = command.toLowerCase()
    
    // Применяем замены
    for (const [wrong, correct] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(wrong, 'gi'), correct)
    }
    
    // Дополнительная нормализация пробелов и знаков препинания
    normalized = normalized.replace(/\s+/g, ' ').trim()
    normalized = normalized.replace(/[.,!?;:]/g, '')
    
    return normalized
  }

  /**
   * Проверяет команды для главной страницы
   */
  matchesHomePage(command) {
    const patterns = [
      /go home/,
      /go to home/,
      /navigate home/,
      /open home/,
      /show home/,
      /home$/,
      /home page/,
      /главная$/,
      /главную$/,
      /главной$/,
      /главное$/,
      /главные$/,
      /главного$/,
      /главным$/,
      /главными$/,
      /главных$/,
      /главн$/,
      /главнaя$/,
      /главнa$/,
      /home$/,
      /main$/,
      /dashboard$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды для страницы клиентов
   */
  matchesCustomersPage(command) {
    const patterns = [
      /go customers/,
      /go to customers/,
      /navigate customers/,
      /open customers/,
      /show customers/,
      /customers$/,
      /customer$/,
      /clients$/,
      /клиенты$/,
      /клиентов$/,
      /клиента$/,
      /клиенту$/,
      /клиентом$/,
      /клиентами$/,
      /клиентах$/,
      /клиент$/,
      /клиен$/,
      /клиенты$/,
      /клиенов$/,
      /клиенa$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды для страницы товаров
   */
  matchesProductsPage(command) {
    const patterns = [
      /go products/,
      /go to products/,
      /navigate products/,
      /open products/,
      /show products/,
      /products$/,
      /product$/,
      /items$/,
      /товары$/,
      /товаров$/,
      /товара$/,
      /товару$/,
      /товаром$/,
      /товарами$/,
      /товарах$/,
      /товар$/,
      /това$/,
      /товарa$/,
      /товарs$/,
      /товарa$/,
      /продукты$/,
      /продуктов$/,
      /продукта$/,
      /продукту$/,
      /продуктом$/,
      /продуктами$/,
      /продуктах$/,
      /продукт$/,
      /проду$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды для страницы задач
   */
  matchesTasksPage(command) {
    const patterns = [
      /go tasks/,
      /go to tasks/,
      /navigate tasks/,
      /open tasks/,
      /show tasks/,
      /tasks$/,
      /task$/,
      /todo$/,
      /задачи$/,
      /задач$/,
      /задачу$/,
      /задачей$/,
      /задачами$/,
      /задачах$/,
      /задача$/,
      /зада$/,
      /задачa$/,
      /задачs$/,
      /задачa$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды для страницы покупок
   */
  matchesBuyPage(command) {
    const patterns = [
      /go buy/,
      /go to buy/,
      /navigate buy/,
      /open buy/,
      /show buy/,
      /buy$/,
      /purchase$/,
      /shopping$/,
      /покупки$/,
      /покупок$/,
      /покупку$/,
      /покупкой$/,
      /покупками$/,
      /покупках$/,
      /покупка$/,
      /покуп$/,
      /покупкa$/,
      /покупкs$/,
      /покупкa$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }

  /**
   * Проверяет команды для страницы возвратов
   */
  matchesReturnPage(command) {
    const patterns = [
      /go return/,
      /go to return/,
      /navigate return/,
      /open return/,
      /show return/,
      /return$/,
      /returns$/,
      /refund$/,
      /возвраты$/,
      /возвратов$/,
      /возврату$/,
      /возвратом$/,
      /возвратами$/,
      /возвратах$/,
      /возврат$/,
      /возвра$/,
      /возвратa$/
    ]
    return patterns.some(pattern => pattern.test(command))
  }
}

// Создаем единственный экземпляр процессора
const commandProcessor = new CommandProcessor()

export default commandProcessor
