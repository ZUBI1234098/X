<template>
  <div class="buy-page">
    <div class="container">
      <div class="main-layout">
        <!-- Left section - products -->
        <div class="products-section">
          <!-- Header with back button -->
          <div class="section-header">
            <div style="display: flex; align-items: center; gap: 16px;">
              <v-btn 
                icon 
                @click="goBack" 
                class="back-btn"
                color="#a302d4"
              >
                <v-icon size="24">mdi-arrow-left</v-icon>
              </v-btn>
                <h2 class="section-title">{{ $t('pages.buy.title') }}</h2>
            </div>
          </div>
          <div class="search-bar">
            <input 
              v-model="productSearch" 
              @input="filterProducts"
              :placeholder="$t('common.search')"
              class="search-input"
            >
          </div>
          
          <div ref="productsGrid" class="products-grid">
            <div 
              v-for="product in filteredProducts" 
              :key="product.id"
              @click="addToCart(product)"
              class="product-card"
              :class="{ 'out-of-stock': product.stock === 0 }"
            >
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">${{ product.price }}</div>
              <div class="product-stock">{{ $t('common.stock') }}: {{ product.stock }}</div>

              <!-- Индикатор количества товаров -->
              <div class="stock-indicator">
                <div 
                  class="stock-bar" 
                  :style="{ width: Math.min(product.stock / 50 * 100, 100) + '%' }"
                  :class="{
                    'stock-low': product.stock <= 10,
                    'stock-medium': product.stock > 10 && product.stock <= 30,
                    'stock-high': product.stock > 30
                  }"
                ></div>
              </div>
            </div>
          </div>
          
          <div v-if="filteredProducts.length === 0" class="no-products">
            {{ $t('pages.products.noProductsFound') }}
          </div>
        </div>
        
        <!-- Right section - cart and checkout -->
        <div class="cart-section">
          <h3>{{ $t('pages.buy.cart') }} ({{ totalItems }} {{ $t('common.items') }})</h3>
          
          <!-- Cart -->
          <div ref="cartItems" class="cart-items">
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <div class="item-details">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-total">${{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
              <div class="quantity-controls">
                <button @click="decreaseQuantity(item)" class="qty-btn">-</button>
                <span class="quantity">{{ item.quantity }}</span>
                <button @click="increaseQuantity(item)" class="qty-btn">+</button>
                <button @click="removeFromCart(item)" class="remove-btn">✕</button>
              </div>
            </div>
            
            <div v-if="cart.length === 0" class="empty-cart">
              {{ $t('pages.buy.emptyCart') }}
            </div>
          </div>
          
          <!-- Checkout form -->
          <div class="checkout-form">
            <!-- Customer selection -->
            <div class="form-group">
              <label>{{ $t('pages.orders.customer') }}:</label>
              <div v-if="!selectedCustomer" class="customer-selector">
                <button 
                  @click="openCustomerModal" 
                  class="customer-select-btn"
                >
                  <span>{{ $t('pages.buy.selectCustomer') }}</span>
                  <span class="arrow"></span>
                </button>
              </div>
              
              <div v-if="selectedCustomer" class="customer-selection">
                <button @click="openCustomerModal" class="customer-select-btn selected">
                  <span>{{ selectedCustomer.name }}</span>
                  <span class="arrow"></span>
                </button>
                
                <button @click="clearCustomer" class="clear-btn">{{ $t('common.clear') }}</button>
              </div>
              
              <div v-if="selectedCustomer" class="">
              </div>
            </div>
            
            <!-- Customer selection modal -->
            <div v-if="showCustomerModal" class="modal-overlay" @click="closeCustomerModal">
              <div class="modal-content" @click.stop>
                <div class="modal-header">
                  <div class="header-content">
                    <h3>{{ $t('pages.buy.selectCustomer') }}</h3>
                    <p class="subtitle">{{ $t('pages.buy.startTyping') }}</p>
                  </div>
                  <button @click="closeCustomerModal" class="close-btn">✕</button>
                </div>
                
                <div class="modal-body">
                  <div class="search-section">
                    <div class="search-container">
                      <div class="search-icon">🔍</div>
                      <input 
                        v-model="customerSearch"
                        @input="onCustomerSearch"
                        :placeholder="$t('pages.buy.searchByName')"
                        class="modal-search-input"
                        autocomplete="off"
                        ref="searchInput"
                      >
                      <button 
                        v-if="customerSearch" 
                        @click="clearSearch" 
                        class="clear-search-btn"
                      >
                        ✕
                      </button>
                    </div>
                    <div class="search-stats" v-if="customerSearch">
                      {{ $t('pages.buy.found') }}: {{ filteredCustomers.length }} {{ $t('pages.buy.of') }} {{ customers.length }} {{ $t('pages.customers.title') }}
                    </div>
                    <div class="search-hint" v-if="!customerSearch">
                    </div>
                  </div>
                  
                  <div class="customers-list">
                    <!-- Show customers only when searching -->
                    <div 
                      v-for="customer in filteredCustomers" 
                      :key="customer.id"
                      @click="selectCustomerFromModal(customer)"
                      class="customer-item"
                      :class="{ 'selected': selectedCustomer && selectedCustomer.id === customer.id }"
                      v-if="customerSearch && customerSearch.length >= 1"
                    >
                      <div class="customer-avatar">
                        {{ getCustomerInitials(customer.name) }}
                      </div>
                      <div class="customer-info">
                        <div class="customer-name">{{ customer.name }}</div>
                        <div class="customer-details">
                          <span v-if="customer.phone" class="detail-item">
                            <span class="icon"></span>
                            {{ customer.phone }}
                          </span>
                          <span v-if="customer.email" class="detail-item">
                            <span class="icon"></span>
                            {{ customer.email }}
                          </span>
                          <span v-if="customer.address" class="detail-item">
                            <span class="icon"></span>
                            {{ customer.address }}
                          </span>
                        </div>
                      </div>
                      <div class="selection-indicator">
                      </div>
                    </div>
                    
                    <!-- Message about needing to enter search -->
                    <div v-if="!customerSearch || customerSearch.length < 1" class="search-prompt">
                      <div class="prompt-icon"></div>
                      <div class="prompt-text">
                        <strong>{{ $t('pages.buy.customerSearch') }}</strong>
                        <p>{{ $t('pages.buy.enterCharacter') }}</p>
                      </div>
                    </div>
                    
                    <!-- Message about no results found -->
                    <div v-if="customerSearch && customerSearch.length >= 1 && filteredCustomers.length === 0" class="no-customers">
                      <div class="no-results-icon"></div>
                      <div class="no-results-text">
                        <strong>{{ $t('pages.buy.noCustomersFound') }}</strong>
                        <p>{{ $t('pages.buy.tryChanging') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="modal-footer">
                  <div class="footer-info">
                    <span v-if="selectedCustomer" class="selected-info">
                      ✓ {{ $t('pages.buy.selected') }}: {{ selectedCustomer.name }}
                    </span>
                    <span v-else-if="customerSearch && customerSearch.length < 1" class="search-info">
                      {{ $t('pages.buy.enterMore') }} {{ 1 - customerSearch.length }} {{ $t('pages.buy.moreCharacters') }}
                    </span>
                  </div>
                  <div class="footer-buttons">
                    <button @click="closeCustomerModal" class="cancel-btn">
                      <span class="btn-icon">✕</span>
                      {{ $t('common.cancel') }}
                    </button>
                    <button 
                      @click="confirmSelection" 
                      :disabled="!selectedCustomer"
                      class="confirm-btn"
                    >
                      <span class="btn-icon">✓</span>
                      {{ $t('pages.buy.selectCustomer') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment method -->
            <div class="form-group">
              <label>{{ $t('pages.orders.payment') }}:</label>
              <select v-model="paymentMethod" class="payment-select">
                <option value="">{{ $t('pages.buy.selectPayment') }}</option>
                <option value="cash">{{ $t('common.cash') }}</option>
                <option value="card">{{ $t('common.card') }}</option>
                <option value="transfer">{{ $t('pages.buy.transfer') }}</option>
              </select>
            </div>
            
            <!-- Total and purchase button -->
            <div class="checkout-summary">
              <div class="total-amount">{{ $t('pages.orders.total') }}: ${{ cartTotal }}</div>
              <button 
                @click="processPurchase"
                :disabled="!canPurchase"
                class="purchase-btn"
              >
                {{ $t('pages.buy.completePurchase') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import api from '@/services/api'
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'BuyPage',
  data() {
    return {
      // Products
      products: [],
      filteredProducts: [],
      productSearch: '',
      
      // Customers
      customers: [],
      customerSearch: '',
      selectedCustomer: null,
      showCustomerModal: false,
      
      // Cart
      cart: [],
      
      // Checkout
      paymentMethod: '',
      
      // Notifications
      notification: null
    }
  },
  
  computed: {
    // Customer filtering - show only when searching at least 1 character
    filteredCustomers() {
      if (!this.customerSearch || this.customerSearch.trim().length < 1) {
        return []
      }
      
      const search = this.customerSearch.toLowerCase().trim()
      return this.customers.filter(customer => {
        return (
          (customer.name && customer.name.toLowerCase().includes(search)) ||
          (customer.phone && customer.phone.toLowerCase().includes(search)) ||
          (customer.email && customer.email.toLowerCase().includes(search)) ||
          (customer.address && customer.address.toLowerCase().includes(search))
        )
      })
    },
    
    // Cart total
    cartTotal() {
      return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)
    },
    
    // Total items count
    totalItems() {
      return this.cart.reduce((total, item) => total + item.quantity, 0)
    },
    
    // Can complete purchase
    canPurchase() {
      return this.cart.length > 0 && this.paymentMethod // Убираем проверку this.selectedCustomer
    }
  },
  
  methods: {
    // Навигация назад
    goBack() {
      this.$router.go(-1)
    },
    
    // Load products
    async fetchProducts() {
      try {
        const response = await api.get('/products')
        this.products = response.data.filter(product => product.stock > 0)
        this.filteredProducts = this.products
        console.log('Products loaded:', this.products.length)
      } catch (error) {
        console.error('Error loading products:', error)
        this.showNotification('error', this.$t('pages.buy.messages.errorLoadingProducts'))
      }
    },
    
    // Load customers
    async fetchCustomers() {
      try {
        const response = await api.get('/customers')
        this.customers = response.data || []
        console.log('Customers loaded:', this.customers.length)
      } catch (error) {
        console.error('Error loading customers:', error)
        this.showNotification('error', this.$t('pages.buy.messages.errorLoadingCustomers'))
      }
    },
    
    // Filter products
    filterProducts() {
      if (!this.productSearch.trim()) {
        this.filteredProducts = this.products
        return
      }
      
      const search = this.productSearch.toLowerCase()
      this.filteredProducts = this.products.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      )
    },
    
    // Customer search
    onCustomerSearch() {
      // Reset customer selection when search changes
      if (this.customerSearch !== (this.selectedCustomer && this.selectedCustomer.name)) {
        this.selectedCustomer = null
      }
    },
    
    // Open modal
    openCustomerModal() {
      this.showCustomerModal = true
      this.customerSearch = ''
      this.selectedCustomer = null
      this.$nextTick(() => {
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus()
        }
      })
    },
    
    // Close modal
    closeCustomerModal() {
      this.showCustomerModal = false
      this.customerSearch = ''
      // Don't reset selectedCustomer when closing modal
    },
    
    // Select customer from modal
    selectCustomerFromModal(customer) {
      this.selectedCustomer = customer
    },
    
    // Confirm selection
    confirmSelection() {
      if (this.selectedCustomer) {
        this.closeCustomerModal()
        this.showNotification('success', this.$t('pages.buy.messages.customerSelected'))
      }
    },
    
    // Get customer initials
    getCustomerInitials(name) {
      if (!name) return '?'
      const words = name.split(' ')
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase()
      }
      return name[0].toUpperCase()
    },
    
    // Clear search
    clearSearch() {
      this.customerSearch = ''
      this.selectedCustomer = null
    },
    
    // Clear customer
    clearCustomer() {
      this.selectedCustomer = null
      this.showNotification('info', this.$t('pages.buy.messages.customerSelectionCleared'))
    },
    
    // Add to cart
    addToCart(product) {
      if (product.stock === 0) {
        this.showNotification('error', this.$t('pages.buy.messages.productOutOfStock'))
        return
      }
      
      const existingItem = this.cart.find(item => item.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          existingItem.quantity++
          this.showNotification('success', `${product.name} ${this.$t('pages.buy.messages.quantityIncreased')}`)
        } else {
          this.showNotification('error', this.$t('pages.buy.messages.notEnoughStock'))
        }
      } else {
        this.cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.stock
        })
        this.showNotification('success', `${product.name} ${this.$t('pages.buy.messages.addedToCart')}`)
      }
    },
    
    // Increase quantity
    increaseQuantity(item) {
      if (item.quantity < item.maxStock) {
        item.quantity++
      } else {
        this.showNotification('error', this.$t('pages.buy.messages.notEnoughStock'))
      }
    },
    
    // Decrease quantity
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--
      } else {
        this.removeFromCart(item)
      }
    },
    
    // Remove from cart
    removeFromCart(item) {
      const index = this.cart.findIndex(cartItem => cartItem.id === item.id)
      if (index > -1) {
        this.cart.splice(index, 1)
        this.showNotification('info', `${item.name} ${this.$t('pages.buy.messages.removedFromCart')}`)
      }
    },
    
    // Process purchase
    async processPurchase() {
      if (!this.canPurchase) {
        this.showNotification('error', this.$t('pages.buy.messages.fillRequiredFields'))
        return
      }
      
      try {
        // Создаем отдельную запись для каждого товара в корзине
        const purchasePromises = this.cart.map(item => {
          const purchaseData = {
            productId: item.id,
            productName: item.name,
            customerName: this.selectedCustomer ? this.selectedCustomer.name : '',
            customerId: this.selectedCustomer ? this.selectedCustomer.id : null,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
            paymentMethod: this.paymentMethod,
            notes: `Purchase via POS system`,
            date: new Date().toISOString()
          }
          
          return api.post('/purchases', purchaseData)
        })
        
        // Ждем завершения всех покупок
        await Promise.all(purchasePromises)
        
        EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'purchase' })
        // Уведомление в углу не показываем — есть центральная анимация
        
        // Сохраняем данные корзины перед очисткой для проверки уведомлений
        const cartItemsForNotification = [...this.cart]
        
        // Refresh products to update stock
        await this.fetchProducts()
        
        // Проверяем уведомления только для купленных товаров с обновленными данными
        cartItemsForNotification.forEach(item => {
          // Получаем обновленное количество товара после покупки
          const updatedProduct = this.products.find(p => p.id === item.id)
          if (updatedProduct) {
            console.log(`=== ПРОВЕРКА КУПЛЕННОГО ТОВАРА ===`)
            console.log(`Название: ${item.name}`)
            console.log(`ID: ${item.id}`)
            console.log(`Купили: ${item.quantity}`)
            console.log(`Осталось после покупки: ${updatedProduct.stock}`)
            console.log(`Нужно уведомление: ${updatedProduct.stock <= 10}`)
            console.log(`=====================================`)
            
            // Отправляем событие для системы уведомлений
            if (updatedProduct.stock === 0) {
              EventBus.$emit('stock-alert', {
                productId: item.id,
                productName: item.name,
                currentStock: updatedProduct.stock,
                type: 'critical'
              })
            } else if (updatedProduct.stock <= 10) {
              EventBus.$emit('stock-alert', {
                productId: item.id,
                productName: item.name,
                currentStock: updatedProduct.stock,
                type: 'warning'
              })
            }
          }
        })
        
        // Store customer and cart data before clearing
        const customerName = this.selectedCustomer ? this.selectedCustomer.name : 'Guest Customer' // Добавляем проверку
        const cartItems = [...this.cart]
        const totalAmount = this.cartTotal
        
        // Clear cart and form
        this.cart = []
        this.selectedCustomer = null
        this.paymentMethod = ''
        
        // Emit event for other components
        EventBus.$emit('purchase-completed', {
          customerName: customerName,
          items: cartItems,
          total: totalAmount
        })
        
      } catch (error) {
        console.error('Purchase error:', error)
        this.showNotification('error', this.$t('pages.buy.messages.errorProcessingPurchase'))
      }
    },
    
    // Show notification
    showNotification(type, message) {
      this.notification = { type, message }
      setTimeout(() => {
        this.notification = null
      }, 3000)
    },
    
    // Handle wheel event for cart items
    handleCartWheel(event) {
      if (this.$refs.cartItems) {
        event.preventDefault()
        this.$refs.cartItems.scrollTop += event.deltaY
      }
    },
    
    // Handle wheel event for products grid
    handleWheel(event) {
      if (this.$refs.productsGrid) {
        event.preventDefault()
        this.$refs.productsGrid.scrollTop += event.deltaY
      }
    }
  },
  
  mounted() {
    this.fetchProducts()
    this.fetchCustomers()
    
    // Add wheel event listeners
    this.$nextTick(() => {
      if (this.$refs.productsGrid) {
        this.$refs.productsGrid.addEventListener('wheel', this.handleWheel)
      }
      if (this.$refs.cartItems) {
        this.$refs.cartItems.addEventListener('wheel', this.handleCartWheel)
      }
    })
  },
  
  beforeDestroy() {
    // Remove wheel event listeners
    if (this.$refs.productsGrid) {
      this.$refs.productsGrid.removeEventListener('wheel', this.handleWheel)
    }
    if (this.$refs.cartItems) {
      this.$refs.cartItems.removeEventListener('wheel', this.handleCartWheel)
    }
  }
}
</script>

<style scoped>
/* Main container */
.buy-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
}

.container {
  max-width: 1700px;
  margin: 0 auto;
  position: relative;
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.back-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}

.back-btn:hover {
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}

.main-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

/* Products section */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  border: 1px solid rgba(163, 2, 212, 0.1);
  position: relative;
  overflow: hidden;
}

.products-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.search-input:focus {
  outline: none;
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #a302d4 #f1f5f9;
  background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
}

.products-grid::-webkit-scrollbar {
  width: 8px;
}

.products-grid::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.products-grid::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
  transition: background 0.3s;
}

.products-grid::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.product-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.05);
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #a302d4, #7c3aed);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.product-card:hover {
  border-color: #a302d4;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(163, 2, 212, 0.15);
}

.product-card:hover::before {
  transform: scaleX(1);
}

.product-card.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-name {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #a302d4;
  margin-bottom: 4px;
}

.product-stock {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.product-category {
  font-size: 12px;
  color: #7c3aed;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  border: 1px solid rgba(163, 2, 212, 0.2);
  margin-bottom: 8px;
}

.stock-indicator {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

.stock-bar {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.stock-bar.stock-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.stock-bar.stock-medium {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.stock-bar.stock-high {
  background: linear-gradient(90deg, #10b981, #059669);
}

.no-products {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-style: italic;
}

/* Cart section */
.cart-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(163, 2, 212, 0.1);
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  position: relative;
  height: fit-content;
  overflow: hidden;
}

.cart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.cart-section h3 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
  padding-top: 8px;
}

.cart-items {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.cart-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.cart-item:last-child {
  border-bottom: none;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-price {
  font-size: 14px;
  color: #64748b;
}

.item-total {
  font-weight: 600;
  color: #a302d4;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn, .remove-btn {
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover, .remove-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: scale(1.05);
}

.remove-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.remove-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.quantity {
  font-weight: 600;
  color: #1e293b;
  min-width: 20px;
  text-align: center;
}

.empty-cart {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-style: italic;
}

/* Checkout form */
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
}

.form-group::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(163, 2, 212, 0.2), transparent);
}

.form-group label {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 8px;
  display: block;
  position: relative;
}

.form-group label::before {
  margin-right: 8px;
  font-size: 18px;
}

.customer-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.customer-select-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.customer-select-btn:hover {
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1);
}

.customer-select-btn:focus {
  outline: none;
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1);
}

.customer-select-btn.selected {
  border-color: #a302d4;
  color: #1e293b;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
}

.arrow {
  color: #a302d4;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.customer-selection {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.customer-select-btn.selected {
  flex: 1;
}

.clear-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: scale(1.05);
}

.selected-customer {
  padding: 8px 12px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 12px;
  color: #065f46;
}

.payment-select {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.05);
  position: relative;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a302d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 20px;
  padding-right: 50px;
}

.payment-select:hover {
  border-color: #a302d4;
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.1);
  transform: translateY(-1px);
}

.payment-select:focus {
  outline: none;
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1), 0 4px 15px rgba(163, 2, 212, 0.15);
  transform: translateY(-1px);
}

.payment-select option {
  padding: 12px;
  background: #ffffff;
  color: #1e293b;
  font-size: 16px;
}

.payment-select option:hover {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
}

.payment-select option:checked {
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid rgba(163, 2, 212, 0.1);
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
}

.purchase-btn {
  padding: 16px 24px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.3);
}

.purchase-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(163, 2, 212, 0.4);
}

.purchase-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Modal styles */
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
  max-width: 600px;
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
  max-height: 60vh;
  overflow-y: auto;
}

.search-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #1e293b;
  font-size: 20px;
  z-index: 2;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.search-container:hover .search-icon {
 background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  opacity: 1;
}

.modal-search-input:focus + .search-icon {
  color: #a302d4;
  opacity: 1;
}

.modal-search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #ffffff;
}

.modal-search-input:focus {
  outline: none;
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.search-stats {
  margin-top: 8px;
  font-size: 12px;
  color: #a302d4;
  font-weight: 500;
}

.search-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

.customers-list {
  max-height: 400px;
  overflow-y: auto;
}

.customer-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.customer-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.customer-item.selected {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border-color: #a302d4;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.customer-info {
  flex: 1;
}

.customer-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.customer-details {
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

.selection-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  animation: checkmarkPop 0.3s ease;
}

@keyframes checkmarkPop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.search-prompt, .no-customers {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  text-align: center;
}

.prompt-icon, .no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.prompt-text, .no-results-text {
  color: #64748b;
}

.prompt-text strong, .no-results-text strong {
  color: #1e293b;
  display: block;
  margin-bottom: 8px;
}

.prompt-text p, .no-results-text p {
  margin: 0;
  font-size: 14px;
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

.selected-info {
  color: #10b981;
  font-weight: 500;
  font-size: 14px;
}

.search-info {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
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
}

.cancel-btn {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #475569;
}

.confirm-btn {
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.4);
}

.confirm-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 12px;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  z-index: 10002;
  animation: slideInUp 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.notification.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification.info {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

/* Responsive design */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .container {
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .customer-details {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .quantity-controls {
    flex-wrap: wrap;
  }
}
</style>