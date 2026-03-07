import axios from 'axios'
import api from './api'

class GPTService {
  constructor() {
    this.apiKey = process.env.VUE_APP_OPENAI_API_KEY || ''
    this.apiUrl = 'https://api.openai.com/v1/chat/completions'
    this.model = 'gpt-3.5-turbo'
    this.maxTokens = 1000
    this.temperature = 0.7
  }

  /**
   * Обрабатывает команду пользователя через GPT
   * @param {string} command - Команда пользователя
   * @param {Object} context - Контекст системы
   * @returns {Promise<Object>} - Результат обработки
   */
  async processCommand(command, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      const userPrompt = this.buildUserPrompt(command, context)

      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      })

      const gptResponse = response.data.choices[0].message.content
      return await this.parseGPTResponse(gptResponse)

    } catch (error) {
      console.error('Ошибка при обращении к GPT API:', error)
      return {
        success: false,
        error: 'Ошибка при обработке команды через GPT',
        fallback: true
      }
    }
  }

  /**
   * Строит системный промпт для GPT
   * @param {Object} context - Контекст системы
   * @returns {string} - Системный промпт
   */
  buildSystemPrompt(context) {
    return `Вы - AI-помощник для системы управления бизнесом (CRM). 
Ваша задача - понимать команды пользователя на русском языке и преобразовывать их в структурированные действия. Для навигационных команд используйте action: "navigate" и указывайте маршрут в поле navigation.

КРИТИЧЕСКИ ВАЖНО:
- "создай отчет по КЛИЕНТАМ" = type: "customers" (НЕ "sales")
- "создай отчет по ПРОДАЖАМ" = type: "sales" 
- "создай отчет по ТОВАРАМ" = type: "products"
- "покажи всех КЛИЕНТОВ" = type: "customers"
- "покажи все ТОВАРЫ" = type: "products"
- ВСЕГДА анализируйте команду и определяйте правильный тип данных!

Доступные функции системы:
1. Управление клиентами: создание, поиск, редактирование, удаление
2. Управление товарами: создание, поиск, редактирование, удаление, управление складом
3. Управление заказами: создание, редактирование, удаление, просмотр
4. Аналитика: статистика продаж, клиентов, товаров, доходов
5. Отчеты: генерация различных отчетов
6. Экспорт/импорт данных
7. Уведомления и настройки
8. Навигация: переходы между разделами системы
9. Отображение данных: показ таблиц, графиков, статистики

Контекст системы:
- Текущее время: ${new Date().toLocaleString('ru-RU')}
- Доступные API: ${context.availableAPIs || 'customers, products, purchases, analytics'}
- Текущий пользователь: ${context.currentUser || 'Администратор'}
- Сессия: ${context.sessionId || 'неизвестна'}

Правила ответа:
1. Всегда отвечайте на русском языке
2. Если команда неясна, задавайте уточняющие вопросы
3. Для критичных операций (удаление) запрашивайте подтверждение
4. Возвращайте результат в JSON формате с полями: success, action, data, message, requiresConfirmation, confidence, navigation
5. Если требуется подтверждение, установите requiresConfirmation: true
6. В поле action укажите тип действия: create, read, update, delete, search, analytics, report, notification, bulk, navigate, display
7. В поле data укажите параметры для выполнения действия
8. В поле message укажите понятное сообщение для пользователя
9. В поле confidence укажите уверенность в понимании команды (0-1)
10. В поле navigation укажите навигационное действие: {route: 'путь', params: {}, query: {}}

Структура данных для разных действий:
- create: {type: "customer|product|order", data: {...}}
- read/search: {type: "customers|products|orders", query: "поисковый запрос", filters: {...}}
- update: {type: "customer|product|order", id: number, data: {...}}
- delete: {type: "customer|product|order", id: number}
- analytics: {type: "dashboard|sales|customers|products", period: "day|week|month|year", filters: {...}}
- report: {type: "sales|customers|inventory", format: "pdf|excel|csv", parameters: {...}}
- navigate: {navigation: {route: "путь_к_разделу"}}

ВАЖНО: Если пользователь просит перейти в раздел, открыть страницу, показать аналитику - используйте action: "navigate" и укажите правильный маршрут в navigation.route

ОБЯЗАТЕЛЬНО: Для навигационных команд всегда возвращайте JSON в формате:
{
  "action": "navigate",
  "navigation": {
    "route": "/путь_к_разделу"
  },
  "message": "Переходим в раздел...",
  "success": true
}

Примеры команд:

ТОВАРЫ:
- "добавь товар а" → {action: "create", data: {type: "product", data: {name: "а", price: 0, category: "", stock: 0, description: ""}}}
- "создай товар iPhone с ценой 50000 и количеством 10" → {action: "create", data: {type: "product", data: {name: "iPhone", price: 50000, category: "", stock: 10, description: ""}}}
- "измени товар с ID 1 на цену 60000" → {action: "update", data: {type: "product", id: 1, data: {price: 60000}}}
- "обнови товар iPhone на количество 20" → {action: "update", data: {type: "product", data: {name: "iPhone", stock: 20}}}
- "удали товар с ID 1" → {action: "delete", data: {type: "product", id: 1}}
- "убери товар iPhone" → {action: "delete", data: {type: "product", data: {name: "iPhone"}}}
- "покажи все товары" → {action: "read", data: {type: "products"}}
- "найди товары с низким остатком" → {action: "read", data: {type: "products", query: "низкий остаток"}}

КЛИЕНТЫ:
- "создай клиента Иван Петров с телефоном +7-999-123-45-67" → {action: "create", data: {type: "customer", data: {name: "Иван Петров", phone: "+7-999-123-45-67", email: "", address: ""}}}
- "добавь клиента Мария с email maria@mail.ru" → {action: "create", data: {type: "customer", data: {name: "Мария", phone: "", email: "maria@mail.ru", address: ""}}}
- "измени клиента с ID 2 на телефон +7-888-555-44-33" → {action: "update", data: {type: "customer", id: 2, data: {phone: "+7-888-555-44-33"}}}
- "обнови клиента Иван на email ivan@mail.ru" → {action: "update", data: {type: "customer", data: {name: "Иван", email: "ivan@mail.ru"}}}
- "удали клиента с ID 3" → {action: "delete", data: {type: "customer", id: 3}}
- "убери клиента Мария" → {action: "delete", data: {type: "customer", data: {name: "Мария"}}}
- "покажи всех клиентов" → {action: "read", data: {type: "customers"}}
- "найди клиентов по имени Иван" → {action: "read", data: {type: "customers", query: "Иван"}}

НАВИГАЦИЯ:
- "зайди в аналитику" → {action: "navigate", navigation: {route: "/analytics"}}
- "зайди в аналитику товаров" → {action: "navigate", navigation: {route: "/analytics/products"}}
- "покажи аналитику клиентов" → {action: "navigate", navigation: {route: "/analytics/customers"}}
- "открой раздел товаров" → {action: "navigate", navigation: {route: "/products"}}
- "перейди к клиентам" → {action: "navigate", navigation: {route: "/customers"}}
- "покажи главную страницу" → {action: "navigate", navigation: {route: "/"}}
- "открой аналитику" → {action: "navigate", navigation: {route: "/analytics"}}
- "покажи аналитику" → {action: "navigate", navigation: {route: "/analytics"}}
- "перейди в аналитику" → {action: "navigate", navigation: {route: "/analytics"}}
- "зайди в настройки" → {action: "navigate", navigation: {route: "/settings"}}
- "открой задачи" → {action: "navigate", navigation: {route: "/tasks"}}

АНАЛИТИКА И ОТЧЕТЫ:
- "покажи статистику за последний месяц" → {action: "analytics", data: {type: "dashboard", period: "month"}}
- "создай отчет по продажам за месяц" → {action: "report", data: {type: "sales", period: "month", format: "json"}}
- "создай отчет по клиентам" → {action: "report", data: {type: "customers", period: "all", format: "json"}}
- "создай отчет по клиентам за месяц" → {action: "report", data: {type: "customers", period: "month", format: "json"}}
- "создай отчет по товарам" → {action: "report", data: {type: "products", period: "all", format: "json"}}
- "создай отчет по товарам за месяц" → {action: "report", data: {type: "products", period: "month", format: "json"}}
- "покажи аналитику продаж" → {action: "analytics", data: {type: "sales", period: "month"}}
- "покажи топ товары" → {action: "analytics", data: {type: "products", period: "month"}}

ЗАКАЗЫ:
- "создай заказ на iPhone для клиента Иван Петров" → {action: "create", data: {type: "order", data: {product: "iPhone", customer: "Иван Петров"}}}
- "найди заказы за сегодня" → {action: "read", data: {type: "orders", query: "сегодня"}}

УВЕДОМЛЕНИЯ:
- "настрой уведомления о низком остатке" → {action: "notification", data: {type: "low_stock"}}

ВАЖНО: 
- "создай отчет по клиентам" = отчет по КЛИЕНТАМ (type: "customers")
- "создай отчет по продажам" = отчет по ПРОДАЖАМ (type: "sales") 
- "создай отчет по товарам" = отчет по ТОВАРАМ (type: "products")
- "покажи всех клиентов" = показать список клиентов (type: "customers")
- "покажи все товары" = показать список товаров (type: "products")`

  }

  

  /**
   * Строит пользовательский промпт
   * @param {string} command - Команда пользователя
   * @param {Object} context - Контекст системы
   * @returns {string} - Пользовательский промпт
   */
  buildUserPrompt(command, context) {
    return `Команда пользователя: "${command}"

Проанализируйте команду и определите:
1. Какое действие нужно выполнить
2. Какие параметры извлечь из команды
3. Нужно ли подтверждение пользователя
4. Какой ответ дать пользователю

Верните результат в JSON формате.`
  }

  /**
   * Парсит ответ GPT и извлекает структурированные данные
   * @param {string} gptResponse - Ответ от GPT
   * @returns {Object} - Структурированный результат
   */
  async parseGPTResponse(gptResponse) {
    try {
      // Пытаемся найти JSON в ответе GPT
      const jsonMatch = gptResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // Обрабатываем все CRUD операции
        if (parsed.action === 'create' && parsed.data && parsed.data.type === 'product') {
          return await this.handleProductCreation(parsed)
        }
        if (parsed.action === 'create' && parsed.data && parsed.data.type === 'customer') {
          return await this.handleCustomerCreation(parsed)
        }
        if (parsed.action === 'update' && parsed.data && parsed.data.type === 'product') {
          return await this.handleProductUpdate(parsed)
        }
        if (parsed.action === 'update' && parsed.data && parsed.data.type === 'customer') {
          return await this.handleCustomerUpdate(parsed)
        }
        if (parsed.action === 'delete' && parsed.data && parsed.data.type === 'product') {
          return await this.handleProductDeletion(parsed)
        }
        if (parsed.action === 'delete' && parsed.data && parsed.data.type === 'customer') {
          return await this.handleCustomerDeletion(parsed)
        }
        if (parsed.action === 'read' && parsed.data && parsed.data.type) {
          return await this.handleSearch(parsed)
        }
        if (parsed.action === 'analytics' && parsed.data) {
          return await this.handleAnalytics(parsed)
        }
        if (parsed.action === 'report' && parsed.data) {
          return await this.handleReport(parsed)
        }
        if (parsed.action === 'navigate' && parsed.navigation) {
          return {
            success: true,
            action: 'navigate',
            navigation: parsed.navigation,
            message: parsed.message || 'Переходим в раздел...',
            source: 'gpt'
          }
        }
        
        return {
          success: true,
          ...parsed,
          source: 'gpt'
        }
      }

      // Если JSON не найден, возвращаем текстовый ответ
      return {
        success: true,
        action: 'unknown',
        message: gptResponse,
        data: {},
        source: 'gpt'
      }

    } catch (error) {
      console.error('Ошибка при парсинге ответа GPT:', error)
      return {
        success: false,
        error: 'Ошибка при обработке ответа AI',
        message: gptResponse,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает создание товара через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат создания товара
   */
  async handleProductCreation(parsed) {
    try {
      const productData = {
        name: (parsed.data.data && parsed.data.data.name) || 'Новый товар',
        price: (parsed.data.data && parsed.data.data.price) || 0,
        category: (parsed.data.data && parsed.data.data.category) || '',
        stock: (parsed.data.data && parsed.data.data.stock) || 0,
        description: (parsed.data.data && parsed.data.data.description) || ''
      }
      
      console.log('Создаем товар через бэкенд:', productData)
      
      const response = await api.post('/products', productData)
      const result = response.data
      if (result) {
        console.log('Товар успешно создан:', result)
        
        return {
          success: true,
          action: 'create',
          data: {
            type: 'product',
            data: result
          },
          message: `Товар '${productData.name}' успешно добавлен в базу данных!`,
          source: 'gpt'
        }
      } else {
        throw new Error('Ошибка сервера при создании товара')
      }
    } catch (error) {
      console.error('Ошибка создания товара:', error)
      return {
        success: false,
        action: 'create',
        data: {
          type: 'product',
          data: parsed.data.data || {}
        },
        message: `Ошибка при создании товара: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает создание клиента через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат создания клиента
   */
  async handleCustomerCreation(parsed) {
    try {
      const customerData = {
        name: (parsed.data.data && parsed.data.data.name) || 'Новый клиент',
        phone: (parsed.data.data && parsed.data.data.phone) || '',
        email: (parsed.data.data && parsed.data.data.email) || '',
        address: (parsed.data.data && parsed.data.data.address) || '',
        deals: (parsed.data.data && parsed.data.data.deals) || '',
        date: new Date().toISOString()
      }
      
      console.log('Создаем клиента через бэкенд:', customerData)
      
      const response = await api.post('/customers', customerData)
      const result = response.data
      if (result) {
        console.log('Клиент успешно создан:', result)
        
        return {
          success: true,
          action: 'create',
          data: {
            type: 'customer',
            data: result
          },
          message: `Клиент '${customerData.name}' успешно добавлен в базу данных!`,
          source: 'gpt'
        }
      } else {
        throw new Error('Ошибка сервера при создании клиента')
      }
    } catch (error) {
      console.error('Ошибка создания клиента:', error)
      return {
        success: false,
        action: 'create',
        data: {
          type: 'customer',
          data: parsed.data.data || {}
        },
        message: `Ошибка при создании клиента: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает обновление товара через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат обновления товара
   */
  async handleProductUpdate(parsed) {
    try {
      const productId = (parsed.data.data && parsed.data.data.id) || (parsed.data.id)
      if (!productId) {
        throw new Error('ID товара не указан')
      }

      const productData = {
        name: (parsed.data.data && parsed.data.data.name) || '',
        price: (parsed.data.data && parsed.data.data.price) || 0,
        category: (parsed.data.data && parsed.data.data.category) || '',
        stock: (parsed.data.data && parsed.data.data.stock) || 0,
        description: (parsed.data.data && parsed.data.data.description) || ''
      }
      
      console.log('Обновляем товар через бэкенд:', productId, productData)
      
      await api.put(`/products/${productId}`, productData)
      console.log('Товар успешно обновлен')
      return {
        success: true,
        action: 'update',
        data: {
          type: 'product',
          data: { id: productId, ...productData }
        },
        message: `Товар с ID ${productId} успешно обновлен!`,
        source: 'gpt'
      }
    } catch (error) {
      console.error('Ошибка обновления товара:', error)
      return {
        success: false,
        action: 'update',
        data: {
          type: 'product',
          data: parsed.data.data || {}
        },
        message: `Ошибка при обновлении товара: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает обновление клиента через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат обновления клиента
   */
  async handleCustomerUpdate(parsed) {
    try {
      const customerId = (parsed.data.data && parsed.data.data.id) || (parsed.data.id)
      if (!customerId) {
        throw new Error('ID клиента не указан')
      }

      const customerData = {
        name: (parsed.data.data && parsed.data.data.name) || '',
        phone: (parsed.data.data && parsed.data.data.phone) || '',
        email: (parsed.data.data && parsed.data.data.email) || '',
        address: (parsed.data.data && parsed.data.data.address) || '',
        deals: (parsed.data.data && parsed.data.data.deals) || '',
        date: new Date().toISOString()
      }
      
      console.log('Обновляем клиента через бэкенд:', customerId, customerData)
      
      await api.put(`/customers/${customerId}`, customerData)
      console.log('Клиент успешно обновлен')
      return {
        success: true,
        action: 'update',
        data: {
          type: 'customer',
          data: { id: customerId, ...customerData }
        },
        message: `Клиент с ID ${customerId} успешно обновлен!`,
        source: 'gpt'
      }
    } catch (error) {
      console.error('Ошибка обновления клиента:', error)
      return {
        success: false,
        action: 'update',
        data: {
          type: 'customer',
          data: parsed.data.data || {}
        },
        message: `Ошибка при обновлении клиента: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает удаление товара через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат удаления товара
   */
  async handleProductDeletion(parsed) {
    try {
      const productId = (parsed.data.data && parsed.data.data.id) || (parsed.data.id)
      if (!productId) {
        throw new Error('ID товара не указан')
      }
      
      console.log('Удаляем товар через бэкенд:', productId)
      
      await api.delete(`/products/${productId}`)
      console.log('Товар успешно удален')
      return {
        success: true,
        action: 'delete',
        data: {
          type: 'product',
          data: { id: productId }
        },
        message: `Товар с ID ${productId} успешно удален!`,
        source: 'gpt'
      }
    } catch (error) {
      console.error('Ошибка удаления товара:', error)
      return {
        success: false,
        action: 'delete',
        data: {
          type: 'product',
          data: parsed.data.data || {}
        },
        message: `Ошибка при удалении товара: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает удаление клиента через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат удаления клиента
   */
  async handleCustomerDeletion(parsed) {
    try {
      const customerId = (parsed.data.data && parsed.data.data.id) || (parsed.data.id)
      if (!customerId) {
        throw new Error('ID клиента не указан')
      }
      
      console.log('Удаляем клиента через бэкенд:', customerId)
      
      await api.delete(`/customers/${customerId}`)
      console.log('Клиент успешно удален')
      return {
        success: true,
        action: 'delete',
        data: {
          type: 'customer',
          data: { id: customerId }
        },
        message: `Клиент с ID ${customerId} успешно удален!`,
        source: 'gpt'
      }
    } catch (error) {
      console.error('Ошибка удаления клиента:', error)
      return {
        success: false,
        action: 'delete',
        data: {
          type: 'customer',
          data: parsed.data.data || {}
        },
        message: `Ошибка при удалении клиента: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает поиск через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат поиска
   */
  async handleSearch(parsed) {
    try {
      const searchType = parsed.data.type
      const query = (parsed.data.data && parsed.data.data.query) || ''
      
      console.log('Выполняем поиск через бэкенд:', searchType, query)
      
      let apiUrl = ''
      if (searchType === 'customers') {
        apiUrl = '/customers'
      } else if (searchType === 'products') {
        apiUrl = '/products'
      } else {
        throw new Error('Неизвестный тип поиска')
      }
      
      const response = await api.get(apiUrl)
      const results = response.data || []
      if (results !== undefined) {
        console.log('Поиск выполнен успешно:', results.length, 'записей')
        
        return {
          success: true,
          action: 'read',
          data: {
            type: searchType,
            data: results,
            query: query
          },
          message: `Найдено ${results.length} записей`,
          source: 'gpt'
        }
      } else {
        const errorText = await response.text()
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Ошибка поиска:', error)
      return {
        success: false,
        action: 'read',
        data: {
          type: parsed.data.type,
          data: []
        },
        message: `Ошибка при поиске: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает аналитику через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат аналитики
   */
  async handleAnalytics(parsed) {
    try {
      const analyticsType = (parsed.data.data && parsed.data.data.type) || 'dashboard'
      const period = (parsed.data.data && parsed.data.data.period) || 'month'
      
      console.log('Выполняем аналитику через бэкенд:', analyticsType, period)
      
      let apiPath = ''
      if (analyticsType === 'dashboard') {
        apiPath = '/analytics/dashboard'
      } else if (analyticsType === 'sales') {
        apiPath = '/analytics/sales-trend'
      } else if (analyticsType === 'products') {
        apiPath = '/analytics/top-products'
      } else if (analyticsType === 'customers') {
        apiPath = '/analytics/weekly-activity'
      } else {
        apiPath = '/analytics/dashboard'
      }
      
      const response = await api.get(apiPath)
      const results = response.data
      if (results !== undefined) {
        console.log('Аналитика получена успешно:', results)
        
        return {
          success: true,
          action: 'analytics',
          data: {
            type: analyticsType,
            period: period,
            data: results
          },
          message: `Аналитика ${analyticsType} за ${period} получена успешно`,
          source: 'gpt'
        }
      } else {
        const errorText = await response.text()
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Ошибка получения аналитики:', error)
      return {
        success: false,
        action: 'analytics',
        data: {
          type: parsed.data.type,
          data: {}
        },
        message: `Ошибка при получении аналитики: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Обрабатывает создание отчетов через бэкенд
   * @param {Object} parsed - Распарсенный ответ GPT
   * @returns {Object} - Результат создания отчета
   */
  async handleReport(parsed) {
    try {
      const reportType = (parsed.data.data && parsed.data.data.type) || 'sales'
      const period = (parsed.data.data && parsed.data.data.period) || 'month'
      const format = (parsed.data.data && parsed.data.data.format) || 'json'
      
      console.log('Создаем отчет через бэкенд:', reportType, period, format)
      
      let apiPath = ''
      if (reportType === 'sales') {
        apiPath = '/analytics/dashboard'
      } else if (reportType === 'customers') {
        apiPath = '/customers'
      } else if (reportType === 'products') {
        apiPath = '/products'
      } else {
        apiPath = '/analytics/dashboard'
      }
      
      const response = await api.get(apiPath)
      const reportData = response.data
      if (reportData !== undefined) {
        console.log('Данные для отчета получены:', reportData)
        
        // Создаем отчет с реальными данными
        const report = {
          type: reportType,
          period: period,
          format: format,
          generatedAt: new Date().toISOString(),
          data: reportData, // Используем реальные данные
          summary: this.generateReportSummary(reportType, reportData)
        }
        
        return {
          success: true,
          action: 'report',
          data: report,
          message: `Отчет по ${reportType} за ${period} успешно создан!`,
          source: 'gpt'
        }
      } else {
        throw new Error('Ошибка сервера при создании отчета')
      }
    } catch (error) {
      console.error('Ошибка создания отчета:', error)
      return {
        success: false,
        action: 'report',
        data: {
          type: parsed.data.type,
          data: {}
        },
        message: `Ошибка при создании отчета: ${error.message}`,
        source: 'gpt'
      }
    }
  }

  /**
   * Генерирует краткое резюме отчета
   * @param {string} reportType - Тип отчета
   * @param {Object} data - Данные отчета
   * @returns {string} - Краткое резюме
   */
  generateReportSummary(reportType, data) {
    switch (reportType) {
      case 'sales':
        if (Array.isArray(data)) {
          const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0)
          const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0)
          return `Общий доход: ${totalRevenue.toLocaleString()} руб., Заказов: ${totalOrders}`
        }
        return `Данные по продажам: ${data ? Object.keys(data).length : 0} записей`
      
      case 'customers':
        if (Array.isArray(data)) {
          return `Всего клиентов: ${data.length}`
        }
        return `Данные по клиентам: ${data ? Object.keys(data).length : 0} записей`
      
      case 'products':
        if (Array.isArray(data)) {
          const totalStock = data.reduce((sum, item) => sum + (item.stock || 0), 0)
          return `Всего товаров: ${data.length}, Общий остаток: ${totalStock}`
        }
        return `Данные по товарам: ${data ? Object.keys(data).length : 0} записей`
      
      default:
        return `Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}`
    }
  }

  /**
   * Извлекает данные клиента из команды
   * @param {string} command - Команда пользователя
   * @returns {Object} - Данные клиента
   */
  extractCustomerData(command) {
    const patterns = {
      name: /(?:клиент[а]?|пользователь[а]?)\s+([а-яё\s]+?)(?:\s+с\s+телефоном|\s+телефон|\s+email|\s+адрес|$)/i,
      phone: /телефон[а]?\s+([+\d\s\-\(\)]+)/i,
      email: /email[а]?\s+([\w\.-]+@[\w\.-]+\.\w+)/i,
      address: /адрес[а]?\s+([а-яё\w\s\.,\-]+)/i
    }

    const data = {}
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = command.match(pattern)
      if (match) {
        data[key] = match[1].trim()
      }
    })

    return data
  }

  /**
   * Извлекает данные товара из команды
   * @param {string} command - Команда пользователя
   * @returns {Object} - Данные товара
   */
  extractProductData(command) {
    const patterns = {
      name: /(?:товар[а]?|продукт[а]?)\s+([а-яё\w\s]+?)(?:\s+с\s+ценой|\s+цена|\s+категория|\s+количество|$)/i,
      price: /цена[а]?\s+(\d+(?:\.\d+)?)/i,
      category: /категория[и]?\s+([а-яё\w\s]+)/i,
      stock: /количество[а]?\s+(\d+)/i,
      description: /описание[а]?\s+([а-яё\w\s\.,\-]+)/i
    }

    const data = {}
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = command.match(pattern)
      if (match) {
        data[key] = match[1].trim()
      }
    })

    return data
  }

  /**
   * Извлекает поисковый запрос из команды
   * @param {string} command - Команда пользователя
   * @returns {string} - Поисковый запрос
   */
  extractSearchQuery(command) {
    const patterns = [
      /найти\s+[а-яё]+\s+([а-яё\w\s]+)/i,
      /поиск\s+[а-яё]+\s+([а-яё\w\s]+)/i,
      /найди\s+([а-яё\w\s]+)/i,
      /ищи\s+([а-яё\w\s]+)/i
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return command
  }

  /**
   * Определяет тип действия из команды
   * @param {string} command - Команда пользователя
   * @returns {string} - Тип действия
   */
  determineActionType(command) {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes('создать') || lowerCommand.includes('добавить') || lowerCommand.includes('создай')) {
      return 'create'
    }
    if (lowerCommand.includes('найти') || lowerCommand.includes('поиск') || lowerCommand.includes('показать')) {
      return 'read'
    }
    if (lowerCommand.includes('обновить') || lowerCommand.includes('изменить') || lowerCommand.includes('редактировать')) {
      return 'update'
    }
    if (lowerCommand.includes('удалить') || lowerCommand.includes('убрать')) {
      return 'delete'
    }
    if (lowerCommand.includes('статистика') || lowerCommand.includes('аналитика')) {
      return 'analytics'
    }
    if (lowerCommand.includes('отчет') || lowerCommand.includes('отчеты')) {
      return 'report'
    }

    return 'unknown'
  }

  /**
   * Проверяет, требует ли команда подтверждения
   * @param {string} command - Команда пользователя
   * @param {string} actionType - Тип действия
   * @returns {boolean} - Требуется ли подтверждение
   */
  requiresConfirmation(command, actionType) {
    const lowerCommand = command.toLowerCase()
    
    // Критичные операции
    if (actionType === 'delete') {
      return true
    }
    
    // Операции с большими объемами данных
    if (lowerCommand.includes('все') || lowerCommand.includes('массово')) {
      return true
    }
    
    // Операции с деньгами
    if (lowerCommand.includes('удалить заказ') || lowerCommand.includes('отменить заказ')) {
      return true
    }

    return false
  }

  /**
   * Генерирует подтверждающее сообщение
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
}

// Создаем единственный экземпляр сервиса
const gptService = new GPTService()

export default gptService
