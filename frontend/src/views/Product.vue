<template v-slot:item.category="{ item }">
  <span v-if="item.category">{{ item.category }}</span>
  <span v-else class="text-grey">-</span>
</template>

<template v-slot:item.description="{ item }">
  <span v-if="item.description">{{ item.description }}</span>
  <span v-else class="text-grey">-</span>
</template>
<template>
  <div class="main-content">


    <div class="product-table-block">
      <v-card flat>
        <v-card-title style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <v-btn 
              icon 
              @click="goBack" 
              class="back-btn"
              color="#a302d4"
            >
              <v-icon size="24">mdi-arrow-left</v-icon>
            </v-btn>
            <span class="product-title" style="margin: 0;">{{ $t('navigation.products') }}</span>
          </div>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :label="$t('common.search')"
            hide-details
            outlined
            class="search-input"
            style="max-width: 300px; margin: 0 24px; flex: 1; text-align: center;"
          ></v-text-field>
          <v-btn color="#a302d4" dark class="add-btn" @click="startAdd" style="margin-left: auto;">
            + {{ $t('pages.products.addProduct') }}
          </v-btn>
        </v-card-title>

        <!-- Старая форма скрыта, теперь используется inline-редактирование в таблице -->

        <v-card-text>
          <div class="products-table-container">
            <div class="products-table">
            <div class="table-header">
              <div class="table-cell" style="flex: 0 0 60px;"> id</div>
              <div class="table-cell">{{ $t('pages.products.productName') }}</div>
              <div class="table-cell">{{ $t('pages.products.productPrice') }}</div>
              <div class="table-cell">{{ $t('pages.products.productCategory') }}</div>
              <div class="table-cell">{{ $t('pages.products.stock') }}</div>
              <div class="table-cell">{{ $t('pages.products.productDescription') }}</div>
              <div class="table-cell">{{ $t('pages.products.dateTime') }}</div>
              <div class="table-cell">{{ $t('pages.products.actions') }}</div>
            </div>
            
            <!-- Сообщение если нет продуктов - показываем сверху -->
            <div v-if="filteredProducts.length === 0 && !showForm" class="no-data-message">
              <v-icon size="48" color="#e5e7eb">mdi-package-variant</v-icon>
              <p>{{ $t('pages.products.noProductsFound') }}</p>
            </div>
            
            <div class="table-body" ref="tableBody">
              <div v-if="showForm" class="table-row edit-row">
                <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                  <span style="color: #666; font-size: 12px;">{{ $t('pages.products.new') }}</span>
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.name" 
                    :placeholder="$t('pages.products.placeholder.productName')" 
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                  />
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.price" 
                    :placeholder="$t('pages.products.placeholder.price')" 
                    type="number"
                    step="0.01"
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                  />
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.category" 
                    :placeholder="$t('pages.products.placeholder.category')" 
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                  />
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.stock" 
                    :placeholder="$t('pages.products.placeholder.stock')" 
                    type="number"
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                  />
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.description" 
                    :placeholder="$t('pages.products.placeholder.description')" 
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                  />
                </div>
                <div class="table-cell">
                  <v-text-field 
                    v-model="newProduct.date" 
                    type="datetime-local" 
                    dense
                    outlined
                    hide-details
                    class="inline-input"
                    readonly
                  />
                </div>
                <div class="table-cell actions-cell">
                  <v-btn icon @click="saveProduct" :loading="saving" small color="green">
                    <v-icon size="20">mdi-check</v-icon>
                  </v-btn>
                  <v-btn icon @click="cancelEdit" small color="red">
                    <v-icon size="20">mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
              
              <!-- Обычные строки продуктов -->
              <div 
                v-for="(product, index) in filteredProducts" 
                :key="product.id || index"
                class="table-row"
                :class="{ 
                  'low-stock': product.stock <= 10 && product.stock > 0,
                  'out-of-stock': product.stock === 0
                }"
              >
                <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                  <span style="color: #666; font-weight: 500;">{{ index + 1 }}</span>
                </div>
                <div class="table-cell">
                  <div class="product-name">{{ product.name }}</div>
                </div>
                <div class="table-cell">
                  <span v-if="product.price && product.price > 0" class="price-text">${{ parseFloat(product.price).toFixed(2) }}</span>
                  <span v-else class="text-grey">-</span>
                </div>
                <div class="table-cell">
                  <span class="category-text">{{ product.category || '-' }}</span>
                </div>
                <div class="table-cell">
                  <v-chip 
                    v-if="product.stock !== null && product.stock !== undefined && product.stock !== ''"
                    :color="product.stock > 10 ? 'green' : product.stock > 0 ? 'orange' : 'red'" 
                    text-color="white" 
                    small
                    class="stock-chip"
                  >
                    {{ product.stock }}
                  </v-chip>
                  <span v-else class="text-grey">-</span>
                </div>
                <div class="table-cell">
                  <span class="description-text">{{ product.description || '-' }}</span>
                </div>
                <div class="table-cell">
                  <div class="datetime-full">
                    <div class="date-part">{{ formatDateOnly(product.date) }}</div>
                    <div class="time-part">{{ formatTimeWithSeconds(product.date) }}</div>
                  </div>
                </div>
                <div class="table-cell actions-cell">
                  <v-btn icon @click="showProductAnalytics(product)" class="analytics-btn" small>
                    <v-icon color="#a302d4" size="20">mdi-chart-line</v-icon>
                  </v-btn>
                  <v-btn v-if="isOwner" icon @click="editProductInline(index)" small>
                    <v-icon size="20">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn v-if="isOwner" icon @click="deleteProduct(index)" :loading="deleting[index]" small>
                    <v-icon color="red" size="20">mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div v-if="lastAddedProduct" class="added-message">
            <v-alert type="success" dismissible @input="lastAddedProduct = null">
              {{ $t('pages.products.productSaved', { name: lastAddedProduct }) }}
            </v-alert>
          </div>
          <div v-if="lastEditMessage" class="added-message">
            <v-alert type="info" dismissible @input="lastEditMessage = null">
              {{ lastEditMessage }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Модальное окно аналитики продукта -->
    <div v-if="analyticsModal.show" class="modal-overlay" @click="closeAnalyticsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ $t('pages.products.analytics.title') }}</h3>
          </div>
          <button @click="closeAnalyticsModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="period-info-section">
            <div class="info-row">
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.productName') }}</span>
              <span class="info-value">{{ analyticsModal.product && analyticsModal.product.name || 'Unknown Product' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.price') }}</span>
              <span class="info-value">${{ analyticsModal.product && parseFloat(analyticsModal.product.price || 0).toFixed(2) || '0.00' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.stock') }}</span>
              <span class="info-value">{{ analyticsModal.product && analyticsModal.product.stock || 0 }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.totalSales') }}</span>
              <span class="info-value">{{ analyticsModal.analytics.totalSales }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.totalRevenue') }}</span>
              <span class="info-value">${{ (analyticsModal.analytics.totalRevenue || 0).toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.customers') }}</span>
              <span class="info-value">{{ analyticsModal.analytics.customers }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.returns') }}</span>
              <span class="info-value">{{ analyticsModal.analytics.returns }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.firstSale') }}</span>
              <span class="info-value">{{ analyticsModal.analytics.firstSale ? formatDate(analyticsModal.analytics.firstSale) : $t('pages.products.analytics.noSalesYet') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.products.analytics.lastSale') }}</span>
              <span class="info-value">{{ analyticsModal.analytics.lastSale ? formatDate(analyticsModal.analytics.lastSale) : $t('pages.products.analytics.noSalesYet') }}</span>
            </div>
          </div>
          
        </div>
        
        <div class="modal-footer">
          <div class="footer-info">
            <span class="period-summary">
            </span>
          </div>
          <div class="footer-buttons">
            <button @click="closeAnalyticsModal" class="confirm-btn">
              {{ $t('pages.products.analytics.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser } from '@/services/api'
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'ProductsPage',
  data() {
    return {
      search: '',
      showForm: false,
      editIndex: null,
      saving: false,
      deleting: {},
      newProduct: {
        name: '',
        price: '',
        category: '',
        stock: '',
        description: '',
        date: ''
      },
      products: [],
      lastAddedProduct: null,
      lastEditMessage: null,
      canScrollUp: false,
      canScrollDown: false,
      // Модальное окно аналитики
      analyticsModal: {
        show: false,
        product: null,
        analytics: {
          totalSales: 0,
          totalRevenue: 0,
          customers: 0,
          returns: 0
        }
      },
      headers: [
        { text: 'Product Name', value: 'name', sortable: false },
        { text: 'Price', value: 'price', sortable: false },
        { text: 'Category', value: 'category', sortable: false },
        { text: 'Stock', value: 'stock', sortable: false },
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Date & Time', value: 'date', sortable: false },
        { text: 'Actions', value: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    isOwner() {
      const u = getAuthUser()
      return u && u.isOwner === true
    },
    totalProducts() {
      return this.products.length
    },
    lowStockProducts() {
      return this.products.filter(product => product.stock <= 10).length
    },
    newToday() {
      const today = new Date().toISOString().split('T')[0]
      return this.products.filter(product => product.date && product.date.startsWith(today)).length
    },
    totalValue() {
      return this.products.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0
        const stock = parseInt(product.stock) || 0
        return sum + (price * stock)
      }, 0)
    },
    averagePrice() {
      if (this.products.length === 0) return 0
      const totalPrice = this.products.reduce((sum, product) => {
        return sum + (parseFloat(product.price) || 0)
      }, 0)
      return totalPrice / this.products.length
    },
    filteredProducts() {
      if (!this.search) return this.products
      
      const searchLower = this.search.toLowerCase()
      
      return this.products.filter(product => {

        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower)
        const priceMatch = product.price && product.price.toString().includes(searchLower)
        const categoryMatch = product.category && product.category.toLowerCase().includes(searchLower)
        const stockMatch = product.stock && product.stock.toString().includes(searchLower)
        const descriptionMatch = product.description && product.description.toLowerCase().includes(searchLower)
        const formattedDate = this.formatDate(product.date).toLowerCase()
        const dateMatch = formattedDate.includes(searchLower)
        
        return nameMatch || priceMatch || categoryMatch || stockMatch || descriptionMatch || dateMatch
      })
    }
  },
  watch: {
    '$i18n.locale'() {
      // Принудительно обновляем компонент при смене языка
      this.$forceUpdate()
    }
  },
  methods: {
    // Навигация назад
    goBack() {
      this.$router.go(-1)
    },
    
    // Методы для прокрутки таблицы
    initializeTableScroll() {
      this.$nextTick(() => {
        const tableBody = this.$refs.tableBody || document.querySelector('.table-body')
        if (tableBody) {
          // Добавляем обработчик колеса мыши для плавной прокрутки
          tableBody.addEventListener('wheel', this.handleTableWheel, { passive: false })
          
          // Добавляем обработчик прокрутки для обновления индикаторов
          tableBody.addEventListener('scroll', this.updateScrollIndicators)
          
          // Инициализируем индикаторы прокрутки
          this.updateScrollIndicators()
        }
      })
    },
    
    handleTableWheel(event) {
      event.preventDefault()
      const container = event.currentTarget
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      
      container.scrollTo({
        top: container.scrollTop + scrollAmount,
        behavior: 'smooth'
      })
    },
    
    updateScrollIndicators() {
      const container = document.querySelector('.table-body')
      if (!container) return
      
      // Можно добавить логику для показа/скрытия кнопок прокрутки
      const canScrollUp = container.scrollTop > 0
      const canScrollDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
      
      // Сохраняем состояние для возможного использования в шаблоне
      this.canScrollUp = canScrollUp
      this.canScrollDown = canScrollDown
    },
    
    scrollTable(direction) {
      const container = document.querySelector('.table-body')
      if (!container) return
      
      const scrollAmount = 120
      const currentScroll = container.scrollTop
      
      if (direction === 'up') {
        container.scrollTo({
          top: Math.max(0, currentScroll - scrollAmount),
          behavior: 'smooth'
        })
      } else {
        container.scrollTo({
          top: currentScroll + scrollAmount,
          behavior: 'smooth'
        })
      }
    },
    
    async fetchProducts() {
      try {
        const res = await api.get('/products')
        // Сортируем продукты по дате создания (новые первыми)
        this.products = res.data.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at || 0)
          const dateB = new Date(b.date || b.created_at || 0)
          return dateB - dateA
        })
        // --- Важно: не вызываем emitProductsChanged здесь, чтобы не было зацикливания ---
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    },
    startAdd() {
      this.newProduct = {
        name: '',
        price: '',
        category: '',
        stock: '',
        description: '',
        date: new Date().toISOString().slice(0, 16)
      }
      this.editIndex = null
      this.showForm = true
    },
    async saveProduct() {
      if (
        this.newProduct.name || this.newProduct.price || this.newProduct.category || 
        this.newProduct.stock || this.newProduct.description || this.newProduct.date
      ) {
        this.saving = true
        try {
          // Сохраняем старые данные продукта до изменений (для сравнения)
          const oldProduct = this.editIndex !== null ? { ...this.products[this.editIndex] } : null

          const productData = {
            name: this.newProduct.name || '',
            price: this.newProduct.price ? parseFloat(this.newProduct.price) || 0 : 0,
            category: this.newProduct.category || '',
            // При редактировании добавляем/убавляем количество к текущему
            stock: this.editIndex !== null ? 
              (this.products[this.editIndex].stock + (parseInt(this.newProduct.stock) || 0)) :
              (this.newProduct.stock ? parseInt(this.newProduct.stock) || 0 : 0),
            description: this.newProduct.description || '',
            date: this.newProduct.date || new Date().toISOString().slice(0, 16),
            minStock: this.newProduct.minStock ? parseInt(this.newProduct.minStock) || 10 : 10,
            barcode: this.newProduct.barcode || ''
          }

          let response
          if (this.editIndex === null) {
            response = await api.post('/products', productData)
            const newProduct = { ...productData, id: response.data.id }
            this.products.unshift(newProduct)
            EventBus.$emit(EVENTS.PRODUCT_ADDED, {
              product: newProduct,
              total: this.products.length
            })
            this.lastAddedProduct = productData.name
            
            // Прокрутка к началу таблицы для показа нового продукта
            this.$nextTick(() => {
              const tableBody = this.$refs.tableBody
              if (tableBody) {
                tableBody.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                })
              }
            })

            // Activity logging handled by backend; no client-side activity creation here
          } else {
            await api.put(
              `/products/${this.products[this.editIndex].id}`,
              productData
            )
            const updatedId = this.products[this.editIndex].id
            this.products[this.editIndex] = { ...productData, id: updatedId }
            EventBus.$emit(EVENTS.PRODUCT_UPDATED, {
              product: { ...productData, id: updatedId },
              total: this.products.length
            })
            // Не показываем сообщение об успешном добавлении при редактировании

            // Подготовка описания изменений
            const changes = []
            if (oldProduct && oldProduct.name !== productData.name) {
              changes.push(`Name: "${oldProduct.name}" → "${productData.name}"`)
            }
            if (oldProduct && Number(oldProduct.price) !== Number(productData.price)) {
              changes.push(`Price: ${oldProduct.price} → ${productData.price}`)
            }
            if (oldProduct && (oldProduct.category || '') !== (productData.category || '')) {
              changes.push(`Category: "${oldProduct.category || '-'}" → "${productData.category || '-'}"`)
            }
            if (oldProduct && (oldProduct.description || '') !== (productData.description || '')) {
              changes.push('Description updated')
            }

            // Изменение склада (штук)
            const addedPieces = parseInt(this.newProduct.stock) || 0
            const messages = []
            if (addedPieces !== 0) {
              // Activity logging handled by backend
              messages.push(addedPieces > 0 ? `Stock added: +${addedPieces}` : `Stock adjusted: ${addedPieces}`)
            }

                        // Прочие изменения
            if (changes.length > 0) {
              // Activity logging handled by backend
              messages.push(`Edited: ${changes.join(', ')}`)
            }

            // Показать одно уведомление объединённо (если были изменения)
            if (messages.length > 0) {
              this.lastEditMessage = messages.join(' | ')
            }
            
            // Товар обновлен успешно
          }
          
          this.resetForm()
          this.emitProductsChanged()

          setTimeout(() => {
            this.lastAddedProduct = null
            this.lastEditMessage = null
          }, 3000)
        } catch (error) {
          console.error('Error saving product:', error)
        } finally {
          this.saving = false
        }
      }
    },
    editProduct(index) {
      this.editIndex = index
      // Копируем все данные продукта, но обнуляем поле stock
      this.newProduct = { 
        ...this.products[index],
        stock: '' // Очищаем поле количества, чтобы пользователь мог только добавить/убавить
      }
      this.showForm = true
    },
    editProductInline(index) {
      this.editIndex = index
      // Копируем все данные продукта, но обнуляем поле stock для inline-редактирования
      this.newProduct = { 
        ...this.products[index],
        stock: '' // Очищаем поле количества, чтобы пользователь мог только добавить/убавить
      }
      this.showForm = true
    },
    async deleteProduct(index) {
      this.$set(this.deleting, index, true)
      try {
        const productId = this.products[index].id
        const productName = this.products[index].name
        
        await api.delete(`/products/${productId}`)
        this.products.splice(index, 1)
        EventBus.$emit(EVENTS.PRODUCT_DELETED, {
          productId,
          productName,
          total: this.products.length
        })
        this.emitProductsChanged()
      } catch (error) {
        console.error('Error deleting product:', error)
      } finally {
        this.$set(this.deleting, index, false)
      }
    },
    cancelEdit() {
      this.resetForm()
    },
    resetForm() {
      this.newProduct = {
        name: '',
        price: '',
        category: '',
        stock: '',
        description: '',
        date: new Date().toISOString().slice(0, 16),
        minStock: this.newProduct.minStock ? parseInt(this.newProduct.minStock) || 10 : 10,
        barcode: this.newProduct.barcode || ''
      }
      this.editIndex = null
      this.showForm = false
    },
    formatDate(date) {
      if (!date) return ''
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      return new Date(date).toLocaleString('en-US', options)
    },
    formatDateOnly(date) {
      if (!date) return ''
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      }
      return new Date(date).toLocaleDateString('en-US', options)
    },
    formatTimeWithSeconds(date) {
      if (!date) return ''
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      return new Date(date).toLocaleTimeString('en-US', options)
    },
    emitProductsChanged() {
      EventBus.$emit(EVENTS.PRODUCTS_CHANGED, {
        total: this.totalProducts,
        lowStock: this.lowStockProducts,
        newToday: this.newToday,
        products: this.products
      })
    },
    
    async createProductActivity({ product, quantity = 0, description, status }) {
      try {
        const activityData = {
          productId: product.id,
          productName: product.name,
          customerName: '-',
          quantity: quantity > 0 ? quantity : 0,
          description: description,
          amount: 0,
          status: status,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
        
        await api.post('/product-activities', activityData)
        this.emitProductsChanged()
        // Мгновенное оповещение аналитики
        EventBus.$emit('PRODUCT_ACTIVITY_ADDED', activityData)
      } catch (error) {
        console.error('Ошибка при создании активности продукта:', error)
      }
    },

    async showProductAnalytics(product) {
      try {
        this.analyticsModal.product = product;
        
        // Получаем аналитические данные для продукта
        const analytics = await this.getProductAnalytics(product);
        this.analyticsModal.analytics = analytics;
        
        // Показываем модальное окно
        this.analyticsModal.show = true;
      } catch (error) {
        console.error('Ошибка при получении аналитики продукта:', error);
      }
    },

    async getProductAnalytics(product) {
      try {
        // Получаем все покупки и возвраты для этого продукта
        const [purchasesResponse, returnsResponse] = await Promise.all([
          api.get('/purchases'),
          api.get('/returns')
        ]);

        const purchases = purchasesResponse.data.filter(p => p.productName === product.name);
        const returns = returnsResponse.data.filter(r => r.productName === product.name);

        console.log('Product analytics debug:', {
          productName: product.name,
          purchases: purchases,
          returns: returns,
          samplePurchase: purchases[0]
        });

        // Подсчитываем статистику
        const totalSales = purchases.length;
        // Проверяем разные возможные поля для цены и количества
        const totalRevenue = purchases.reduce((sum, p) => {
          const price = p.price || p.total || p.amount || 0;
          const quantity = p.quantity || 1;
          console.log('Purchase item:', { price, quantity, total: price * quantity });
          return sum + (price * quantity);
        }, 0);
        const uniqueCustomers = new Set(purchases.map(p => p.customerName)).size;
        const totalReturns = returns.length;
        
        // Находим даты первой и последней продажи
        let firstSale = null;
        let lastSale = null;
        
        if (purchases.length > 0) {
          const sortedPurchases = purchases.sort((a, b) => new Date(a.date) - new Date(b.date));
          firstSale = sortedPurchases[0].date;
          lastSale = sortedPurchases[sortedPurchases.length - 1].date;
        }

        const result = {
          totalSales,
          totalRevenue,
          customers: uniqueCustomers,
          returns: totalReturns,
          firstSale,
          lastSale
        };
        
        console.log('Analytics result:', result);
        return result;
      } catch (error) {
        console.error('Ошибка при получении данных аналитики:', error);
        return {
          totalSales: 0,
          totalRevenue: 0,
          customers: 0,
          returns: 0,
          firstSale: null,
          lastSale: null
        };
      }
    },

    closeAnalyticsModal() {
      this.analyticsModal.show = false;
      this.analyticsModal.product = null;
      this.analyticsModal.analytics = {
        totalSales: 0,
        totalRevenue: 0,
        customers: 0,
        returns: 0,
        firstSale: null,
        lastSale: null
      };
    }
  },
  mounted() {
    this.fetchProducts()
    this.initializeTableScroll()
    // Подписка на событие изменения товаров после покупки
    EventBus.$on('PRODUCTS_CHANGED', this.fetchProducts)
  },
  beforeDestroy() {
    EventBus.$off('PRODUCTS_CHANGED', this.fetchProducts)
  }
}
</script>

<style scoped>
.main-content {
  min-height: 1000px!important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  background: #faf9fb;
}

/* Стили для статистических карточек в стиле Revenue Analytics */
.stats-section {
  margin-top: 40px;
  margin-left: 40px;
  margin-right: 40px;
  width: 1660px;
  margin-bottom: 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #a302d4;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-table-block {
  margin-top: 40px;
  margin-left: 40px;
  margin-right: 40px;
  width: 1660px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.product-table-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.product-table-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}

.product-title {
  font-size: 34px;
  color: #000000;
  font-weight: bold;
  margin-right: 40px;
  min-width: 180px;
}

.back-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}

.back-btn:hover {
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}

.search-input {
  margin-left: 380px !important;
  border-radius: 45px !important;
}

.add-btn {
  margin-bottom: 5px;
  width: 200px;
  height: 50px !important;
  border-radius: 40px !important;
  box-shadow: 2px 2px 8px rgba(163, 2, 212, 0.08);
  margin-top: 16px;
}

.cancel-btn {
  width: 120px;
  height: 50px !important;
  border-radius: 40px !important;
  margin-top: 16px;
}

.form-container {
  background: #f8f9fa;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #e0e0e0;
}

.custom-table .v-data-table-header th,
.custom-table .v-data-table__wrapper td {
  min-width: 160px;
  text-align: left !important;
  padding-left: 16px !important;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.added-message {
  margin-top: 16px;
}

.custom-table {
  border-radius: 8px;
}

.custom-table .v-data-table-header {
  background-color: #f8f9fa;
}

.custom-table .v-data-table-header th {
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  text-align: left !important;
  padding-left: 16px !important;
}

.custom-table .v-data-table__wrapper td {
  text-align: left !important;
  padding-left: 16px !important;
  vertical-align: middle;
}

.custom-table tbody tr:hover {
  background-color: #f9fafb !important;
}

@media (max-width: 1200px) {
  .stats-section {
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
  }
  
  .stats-container {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .product-table-block {
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
  }
  
  .search-input {
    margin-left: 20px !important;
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .product-title {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
  }
}

.v-btn--loading {
  pointer-events: none;
}

.form-container .v-text-field,
.form-container .v-textarea {
  margin-bottom: 8px;
}

.form-container .v-text-field--outlined,
.form-container .v-textarea--outlined {
  border-radius: 8px;
}

.added-message .v-alert {
  border-radius: 8px;
  font-weight: 500;
}

.v-btn--icon {
  transition: all 0.2s ease;
}

.v-btn--icon:hover {
  transform: scale(1.1);
}

.search-input .v-input__control {
  border-radius: 25px;
}

.form-container {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для модального окна аналитики */
.analytics-btn {
  margin-right: 8px;
}

.analytics-btn:hover {
  background-color: rgba(163, 2, 212, 0.1);
  transform: scale(1.1);
  transition: all 0.2s ease;
}

/* Стили модального окна идентичные Order Details */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(163, 2, 212, 0.3);
  animation: slideIn 0.3s ease;
  position: relative;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-content h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 400;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.modal-body {
  padding: 0;
  max-height: 330px;
  overflow-y: auto;
  padding-bottom: 60px;
}

.period-info-section {
  padding: 24px 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-row:last-child {
  margin-bottom: 10px;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
  font-size: 15px;
}

.orders-section {
  padding: 20px 0 40px 0;
}

.section-header {
  padding: 0 24px 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.orders-list {
  max-height: 440px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  background: #ffffff;
  margin-bottom: 4px;
}

.order-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.order-number {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.order-info {
  flex: 1;
}

.order-product {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.order-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.icon {
  font-size: 12px;
}

.order-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-completed {
  background: #10b981;
  color: #000000;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-default {
  background: #f3f4f6;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-top: 1px solid #e2e8f0;
}

.footer-info {
  flex: 1;
}

.period-summary {
  color: #10b981;
  font-weight: 500;
  font-size: 14px;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    height: 90vh;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-body {
    padding: 0;
  }
  
  .period-info-section {
    padding: 1px 2px;
  }
  
  .orders-section {
    padding: 16px 0 20px 0;
  }
  
  .order-item {
    padding: 12px 20px;
  }
  
  .order-details {
    flex-direction: column;
    gap: 4px;
  }
}

/* Products Table Styles */
.products-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 600px;
  overflow: hidden;
}

.products-table {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  max-height: calc(600px - 50px);
}

.table-header {
  display: flex;
  background: #ececec;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  min-height: 50px;
}

.table-header .table-cell {
  padding: 16px 12px;
  flex: 1;
  text-align: left;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.table-header .table-cell:last-child {
  border-right: none;
}



.table-row {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  background: white;
}

.table-row:hover {
  /* Hover effect removed */
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateX(2px);
}

.table-row.low-stock {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.table-row.low-stock .table-cell {
  color: #d97706;
  font-weight: 500;
}

.table-row.low-stock .product-name {
  color: #d97706;
  font-weight: 600;
}

.table-row.low-stock .price-text {
  color: #d97706;
  font-weight: 600;
}

.table-row.low-stock .category-text {
  color: #d97706;
  font-weight: 500;
}

.table-row.low-stock .description-text {
  color: #d97706;
  font-weight: 500;
}

.table-row.out-of-stock {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-left: 4px solid #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.table-row.out-of-stock .table-cell {
  color: #dc2626;
  font-weight: 500;
}

.table-row.out-of-stock .product-name {
  color: #dc2626;
  font-weight: 600;
}

.table-row.out-of-stock .price-text {
  color: #dc2626;
  font-weight: 600;
}

.table-row.out-of-stock .category-text {
  color: #dc2626;
  font-weight: 500;
}

.table-row.out-of-stock .description-text {
  color: #dc2626;
  font-weight: 500;
}

.table-cell {
  padding: 16px 12px;
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #334155;
  border-right: 1px solid #f1f5f9;
}

.table-cell:last-child {
  border-right: none;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.price-text {
  font-weight: 500;
  color: #000000;
  font-size: 15px;
}

.category-text {
  color: #000000;
  font-weight: 500;
}

.description-text {
  color: #64748b;
  font-size: 13px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datetime-full {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-part {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.time-part {
  color: #1e293b;
  font-size: 15px;
  font-weight: 500;
}

.actions-cell {
  justify-content: center;
  gap: 4px;
}

.stock-chip {
  font-weight: 500 !important;
  font-size: 15px !important;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.no-data p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #e9ecef;
}

.no-data-message p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #6c757d;
}

/* Scrollbar Styling - серый цвет */
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
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Responsive Design for Products Table */
@media (max-width: 1200px) {
  .table-cell {
    padding: 12px 8px;
    font-size: 13px;
  }
  
  .description-text {
    max-width: 150px;
  }
}

@media (max-width: 768px) {
  .products-table {
    font-size: 12px;
  }
  
  .table-cell {
    padding: 10px 6px;
  }
  
  .description-text {
    max-width: 100px;
  }
  
  .datetime-full {
     font-size: 11px;
   }
 }

/* Стили для inline-редактирования */


.inline-input {
  margin: 0 !important;
  padding: 0 !important;
}

.inline-input .v-input__control {
  min-height: 32px !important;
}

.inline-input .v-text-field__details {
  display: none !important;
}

.inline-input .v-input__slot {
  margin-bottom: 0 !important;
  padding: 4px 8px !important;
  min-height: 32px !important;
}

.edit-row .table-cell {
  padding: 8px 4px !important;
}

 </style>
