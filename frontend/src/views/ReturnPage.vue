<template>
  <div class="return-page">
    <div class="container">
      <div class="main-layout">
        <!-- Left section - combined customer selection and return processing -->
        <div class="left-section">
          <div class="return-section">
            <div class="section-header" v-if="!selectedCustomer">
              <div style="display: flex; align-items: center; gap: 16px;">
                <v-btn 
                  icon 
                  @click="goBack" 
                  class="back-btn"
                  color="#a302d4"
                >
                  <v-icon size="24">mdi-arrow-left</v-icon>
                </v-btn>
                <h2>{{ $t('pages.return.processReturn') }}</h2>
              </div>
            </div>
            
            <div class="return-form">
              <!-- Customer search -->
              <div class="search-section" v-if="!selectedCustomer" style="margin-top: 20px;">
                <div class="form-group">
                  <div class="search-container">
                    <input 
                      v-model="customerSearch" 
                      type="text" 
                      :placeholder="$t('pages.return.searchByName')"
                      @input="filterCustomers"
                      class="search-input"
                      autocomplete="off"
                    >
                    <button 
                      v-if="customerSearch" 
                      @click="clearCustomerSearch" 
                      class="clear-search-btn"
                    >
                      ✕
                    </button>
                  </div>
                  <div class="search-stats" v-if="customerSearch && filteredCustomers.length > 0 && !selectedCustomer">
                    {{ $t('pages.return.found') }}: {{ filteredCustomers.length }} {{ $t('pages.customers.title') }}
                  </div>
                </div>
                
                <!-- Customers list -->
                <div v-if="customerSearch && filteredCustomers.length > 0 && !selectedCustomer" class="customers-container">
                  <div class="customers-list"
                       ref="customersList"
                       @scroll="updateCustomersScrollButtons"
                       @wheel="handleCustomersWheel">
                    <div 
                      v-for="customer in filteredCustomers" 
                      :key="customer.id"
                      @click="selectCustomer(customer)"
                      class="customer-item"
                      :class="{ 'selected': selectedCustomer && selectedCustomer.id === customer.id }"
                    >
                      <div class="customer-avatar">
                        <v-icon color="white">mdi-account</v-icon>
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
                  </div>
                </div>
              </div>
              
              <!-- Back button and title -->
              <div v-if="selectedCustomer" class="back-button-section">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <v-btn 
                    icon
                    @click="goBack"
                    class="back-btn"
                    color="#a302d4"
                  >
                    <v-icon size="24">mdi-arrow-left</v-icon>
                  </v-btn>
                  <h3 class="purchases-title">{{ $t('pages.return.purchases') }}</h3>
                </div>
              </div>

              <!-- Customer purchases -->
              <div v-if="selectedCustomer" class="purchases-section">
                <div class="purchases-header">
                  <div class="customer-name">{{ selectedCustomer.name }}</div>
                  <div class="purchases-count">{{ customerPurchases.length }} {{ $t('pages.return.purchasesFound') }}</div>
                </div>
                
                <div class="purchases-container">
                  <div class="purchases-list"
                       ref="purchasesList"
                       @scroll="updatePurchasesScrollButtons"
                       @wheel="handlePurchasesWheel">
                    <div 
                      v-for="purchase in customerPurchases" 
                      :key="purchase.id"
                      class="purchase-item"
                      :class="{ 'selected': selectedPurchase && selectedPurchase.id === purchase.id }"
                      @click="selectPurchase(purchase)"
                    >
                      <div class="purchase-avatar">
                        <v-icon color="white">mdi-package-variant</v-icon>
                      </div>
                      <div class="purchase-info">
                        <div class="purchase-name">{{ purchase.productName }}</div>
                        <div class="purchase-details">
                          <span class="detail-item">
                            <span class="icon"></span>
                            {{ formatDate(purchase.date) }}
                          </span>
                          <span class="detail-item">
                            <span class="icon"></span>
                            {{ $t('pages.orders.quantity') }}: {{ purchase.quantity }}
                          </span>
                          <span class="detail-item">
                            <span class="icon"></span>
                            ${{ purchase.total }}
                          </span>
                        </div>
                      </div>
                      <div class="selection-indicator">
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="customerPurchases.length === 0" class="no-purchases">
                    <div class="no-results-icon"></div>
                    <div class="no-results-text">
                      <strong>{{ $t('pages.return.noPurchasesFound') }}</strong>
                      <p>{{ $t('pages.return.noPurchaseHistory') }}</p>
                    </div>
                  </div>
                </div>
              </div>


              <!-- All purchases for return (with and without customer) -->
              <div v-if="!selectedCustomer && !customerSearch" class="">
                <div class="section-header no-customer-header">
                  <h3>{{ $t('pages.return.allPurchasesForReturn') }}</h3>
                </div>
                
                <div class="no-customer-purchases-grid"
                     ref="noCustomerPurchasesList"
                     @scroll="updateNoCustomerPurchasesScrollButtons"
                     @wheel="handleNoCustomerPurchasesWheel">
                  <div 
                    v-for="purchase in allPurchasesForReturnList" 
                    :key="'return-' + purchase.id"
                    class="no-customer-purchase-card"
                    :class="{ 'selected': selectedNoCustomerPurchase && selectedNoCustomerPurchase.id === purchase.id }"
                    @click="selectNoCustomerPurchase(purchase)"
                  >
                    <div class="purchase-name">{{ purchase.productName }}</div>
                    <div class="purchase-price">${{ purchase.total }}</div>
                    <div class="purchase-quantity">{{ $t('pages.orders.quantity') }}: {{ purchase.quantity }}</div>
                    <div class="purchase-date">{{ formatDateShort(purchase.date) }}</div>
                    <div v-if="purchase.customerName" class="purchase-customer">{{ purchase.customerName }}</div>
                  </div>
                </div>
                
                <div v-if="allPurchasesForReturnList.length === 0" class="no-purchases">
                  {{ $t('pages.return.noPurchasesForReturn') }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right section - recent returns -->
        <div class="history-section">
          <div class="section-header">
            <h3 v-if="!selectedPurchase && !selectedNoCustomerPurchase && !selectedRecentPurchase">{{ $t('pages.return.recentReturns') }}</h3>
            <h3 v-else>{{ $t('pages.return.returnForm') }}</h3>
            <p v-if="!selectedPurchase && !selectedNoCustomerPurchase && !selectedRecentPurchase" class="section-subtitle"></p>
          </div>
          
          <!-- Return form when purchase is selected -->
          <div v-if="selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase" class="return-form-section">
            <!-- Selected purchase info -->
            <div class="form-group">
              <label>{{ $t('pages.return.selectedPurchase') }}:</label>
              <div class="selected-purchase-info">
                <div class="purchase-header">
                  <div class="purchase-product">{{ (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).productName }}</div>
                  <div class="purchase-date">{{ formatDate((selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).date) }}</div>
                </div>
                <div class="purchase-details">
                  <span class="detail-item">
                    <span class="detail-icon"></span>
                    {{ $t('pages.orders.quantity') }}: {{ (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).quantity }}
                  </span>
                  <span class="detail-item">
                    <span class="detail-icon"></span>
                    ${{ (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).total }}
                  </span>
                  <span class="detail-item">
                    <span class="detail-icon"></span>
                    {{ (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).paymentMethod || $t('common.cash') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Return quantity -->
            <div class="form-group">
              <label>{{ $t('pages.return.returnQuantity') }}:</label>
              <input 
                v-model="returnData.quantity" 
                type="number" 
                :min="1" 
                :max="(selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).remainingQuantity || (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).quantity"
                :placeholder="$t('pages.return.quantityToReturn')"
                class="form-input"
              />
              <div class="quantity-info">
                {{ $t('pages.return.availableForReturn') }}: {{ (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).remainingQuantity || (selectedPurchase || selectedNoCustomerPurchase || selectedRecentPurchase).quantity }}
              </div>
            </div>

            <!-- Return reason -->
            <div class="form-group">
              <label>{{ $t('pages.return.returnReason') }}:</label>
              <select v-model="returnData.reason" class="form-select">
                <option value="">{{ $t('pages.return.selectReason') }}</option>
                <option value="defective">{{ $t('pages.return.defective') }}</option>
                <option value="wrong_item">{{ $t('pages.return.wrongItem') }}</option>
                <option value="customer_request">{{ $t('pages.return.customerRequest') }}</option>
                <option value="damaged">{{ $t('pages.return.damaged') }}</option>
                <option value="not_satisfied">{{ $t('pages.return.notSatisfied') }}</option>
              </select>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label>{{ $t('pages.return.notes') }}:</label>
              <textarea 
                v-model="returnData.notes" 
                :placeholder="$t('pages.return.additionalNotes')"
                class="form-textarea"
              ></textarea>
            </div>

            <!-- Process button -->
            <div class="process-button-container">
              <button 
                @click="processReturn" 
                class="process-btn" 
                :disabled="!canProcess"
              >
                <span class="btn-icon"></span>
                {{ $t('pages.return.processReturn') }}
              </button>
            </div>
          </div>
          
          <div v-if="!selectedPurchase && !selectedNoCustomerPurchase && !selectedRecentPurchase" class="returns-list"
               ref="returnsList"
               @scroll="updateReturnsScrollButtons"
               @wheel="handleReturnsWheel">
            <div v-for="(return_, index) in recentReturns" :key="'return-' + index" class="return-item">
              <div class="return-header">
                <div class="return-product">{{ return_.productName }}</div>
                <div class="return-date">{{ formatDateShort(return_.date) }}</div>
              </div>
              <div class="return-details">
                <span class="detail-item">
                  <span class="detail-icon"></span>
                  {{ $t('pages.orders.quantity') }}: {{ return_.quantity }}
                </span>
                <span class="detail-item">
                  <span class="detail-icon"></span>
                  {{ return_.customerName }}
                </span>
                <span class="detail-item">
                  <span class="detail-icon"></span>
                  {{ getReturnReasonText(return_.reason) }}
                </span>
              </div>
            </div>
            
            <div v-if="recentReturns.length === 0" class="empty-returns">
              <div class="empty-icon"></div>
              <p>{{ $t('pages.return.noRecentReturns') }}</p>
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
  name: 'ReturnPage',
  data() {
    return {
      ordersCount: 0,
      notification: null,
      customerSearch: '',
      filteredCustomers: [],
      customers: [],
      selectedCustomer: null,
      customerPurchases: [],
      selectedPurchase: null,
      returnData: {
        quantity: 1,
        reason: '',
        notes: ''
      },
      recentReturns: [],
      noCustomerPurchases: [],
      selectedNoCustomerPurchase: null,
      recentPurchases: [],
      selectedRecentPurchase: null,
      // Returns scroll variables
      canScrollReturnsUp: false,
      canScrollReturnsDown: false,
      scrollReturnsThumbHeight: 20,
      scrollReturnsThumbPosition: 0,
      // Customers scroll variables
      canScrollCustomersUp: false,
      canScrollCustomersDown: false,
      scrollCustomersThumbHeight: 20,
      scrollCustomersThumbPosition: 0,
      // Purchases scroll variables
      canScrollPurchasesUp: false,
      canScrollPurchasesDown: false,
      scrollPurchasesThumbHeight: 20,
      scrollPurchasesThumbPosition: 0,
      // No customer purchases scroll variables
      canScrollNoCustomerPurchasesUp: false,
      canScrollNoCustomerPurchasesDown: false,
      scrollNoCustomerPurchasesThumbHeight: 20,
      scrollNoCustomerPurchasesThumbPosition: 0,
    }
  },
  computed: {
    // Показываем только покупки, по которым ещё можно сделать возврат (remainingQuantity > 0)
    // Только покупки без клиента (гостевые). Покупки клиентов из базы показываются только при выборе клиента.
    allPurchasesForReturnList() {
      return this.noCustomerPurchases.filter(p => (p.remainingQuantity != null ? p.remainingQuantity : p.quantity) > 0)
    },
    canProcess() {
      const hasValidPurchase = this.selectedPurchase || this.selectedNoCustomerPurchase || this.selectedRecentPurchase
      const purchase = this.selectedPurchase || this.selectedNoCustomerPurchase || this.selectedRecentPurchase
      const maxQuantity = purchase.remainingQuantity || purchase.quantity
      
      return (
        hasValidPurchase &&
        this.returnData.quantity > 0 &&
        this.returnData.quantity <= maxQuantity &&
        this.returnData.reason
      )
    },

  },
  methods: {
    // Навигация назад
    goBack() {
      this.$router.go(-1)
    },

    // Returns scroll methods
    scrollReturns(direction) {
      const container = this.$refs.returnsList
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
    
    handleReturnsWheel(event) {
      event.preventDefault()
      const container = this.$refs.returnsList
      if (!container) return
      
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      container.scrollTo({
        top: container.scrollTop + scrollAmount,
        behavior: 'smooth'
      })
    },
    
    updateReturnsScrollButtons() {
      const container = this.$refs.returnsList
      if (!container) return
      
      this.canScrollReturnsUp = container.scrollTop > 0
      this.canScrollReturnsDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
    },

    // Customers scroll methods
    scrollCustomers(direction) {
      const container = this.$refs.customersList
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
    
    handleCustomersWheel(event) {
      event.preventDefault()
      const container = this.$refs.customersList
      if (!container) return
      
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      container.scrollTo({
        top: container.scrollTop + scrollAmount,
        behavior: 'smooth'
      })
    },
    
    updateCustomersScrollButtons() {
      const container = this.$refs.customersList
      if (!container) return
      
      this.canScrollCustomersUp = container.scrollTop > 0
      this.canScrollCustomersDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
    },

    // Purchases scroll methods
    scrollPurchases(direction) {
      const container = this.$refs.purchasesList
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
    
    handlePurchasesWheel(event) {
      event.preventDefault()
      const container = this.$refs.purchasesList
      if (!container) {
        console.log('Purchases container not found')
        return
      }
      
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      container.scrollTo({
        top: container.scrollTop + scrollAmount,
        behavior: 'smooth'
      })
    },
    
    updatePurchasesScrollButtons() {
      const container = this.$refs.purchasesList
      if (!container) {
        console.log('Purchases container not found in updatePurchasesScrollButtons')
        return
      }
      
      this.canScrollPurchasesUp = container.scrollTop > 0
      this.canScrollPurchasesDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
    },

    // No customer purchases scroll methods
    scrollNoCustomerPurchases(direction) {
      const container = this.$refs.noCustomerPurchasesList
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
    
    handleNoCustomerPurchasesWheel(event) {
      event.preventDefault()
      const container = this.$refs.noCustomerPurchasesList
      if (!container) return
      
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      container.scrollTo({
        top: container.scrollTop + scrollAmount,
        behavior: 'smooth'
      })
    },
    
    updateNoCustomerPurchasesScrollButtons() {
      const container = this.$refs.noCustomerPurchasesList
      if (!container) return
      
      this.canScrollNoCustomerPurchasesUp = container.scrollTop > 0
      this.canScrollNoCustomerPurchasesDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
    },

    getCustomerInitials(name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    },
    
    clearCustomerSearch() {
      this.customerSearch = ''
      this.filteredCustomers = []
      this.selectedCustomer = null
      this.customerPurchases = []
      this.selectedPurchase = null
      this.resetReturnData()
    },
    
    clearCustomerSelection() {
      this.selectedCustomer = null
      this.customerPurchases = []
      this.selectedPurchase = null
      this.selectedNoCustomerPurchase = null
      this.selectedRecentPurchase = null
      this.resetReturnData()
    },
    
    filterCustomers() {
      if (!this.customerSearch.trim()) {
        this.filteredCustomers = []
        return
      }
      const search = this.customerSearch.toLowerCase().trim()
      this.filteredCustomers = this.customers.filter(customer =>
        customer.name.toLowerCase().includes(search) ||
        (customer.phone && customer.phone.toLowerCase().includes(search)) ||
        (customer.email && customer.email.toLowerCase().includes(search))
      ).slice(0, 10)
      
      // If a customer is selected and we're searching for a different customer,
      // clear the current selection to show search results
      if (this.selectedCustomer && this.filteredCustomers.length > 0) {
        const isCurrentCustomerInResults = this.filteredCustomers.some(
          customer => customer.id === this.selectedCustomer.id
        )
        if (!isCurrentCustomerInResults) {
          this.clearCustomerSelection()
        }
      }
      
      // If a customer is selected but search doesn't match current customer,
      // clear selection to show new search results
      if (this.selectedCustomer && this.filteredCustomers.length === 0) {
        // Keep current selection if no results found
      }
      
      // If no customer is selected and we have search results, show them
      if (!this.selectedCustomer && this.filteredCustomers.length > 0) {
        // Results will be shown automatically due to v-if condition
      }
      
      // Update scroll buttons after filtering
      this.$nextTick(() => {
        this.updateCustomersScrollButtons()
      })
    },
    async selectCustomer(customer) {
      this.selectedCustomer = customer
      this.selectedPurchase = null
      this.resetReturnData()
      
      // Загружаем покупки клиента
      await this.fetchCustomerPurchases(customer.name)
      
      // Initialize purchases scroll after customer is selected and purchases are loaded
      this.$nextTick(() => {
        this.updatePurchasesScrollButtons()
      })
    },
    // Остаток для возврата по FIFO: возвраты списываются со старых покупок, новые покупки показываются
    async applyFifoRemaining(purchases, getTotalReturned) {
      if (!purchases || !purchases.length) return []
      const key = (p) => `${p.productId}|${(p.customerName != null ? String(p.customerName) : '').trim()}`
      const groups = new Map()
      for (const p of purchases) {
        const k = key(p)
        if (!groups.has(k)) groups.set(k, [])
        groups.get(k).push({ ...p })
      }
      const out = []
      for (const [, group] of groups) {
        const first = group[0]
        const productId = first.productId
        const customerName = (first.customerName != null ? String(first.customerName) : '').trim()
        let totalReturned = 0
        try {
          totalReturned = await getTotalReturned(productId, customerName)
        } catch (_) {}
        const byDate = [...group].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        let left = Math.max(0, totalReturned)
        for (const p of byDate) {
          const take = Math.min(p.quantity, left)
          const remaining = p.quantity - take
          left -= take
          p.remainingQuantity = Math.max(0, remaining)
          if (p.remainingQuantity > 0) out.push(p)
        }
      }
      return out
    },
    async fetchCustomerPurchases(customerName) {
      try {
        const response = await api.get(`/purchases/customer/${encodeURIComponent(customerName)}`)
        const purchases = response.data || []
        const getTotalReturned = async (productId, _customerName) => {
          const r = await api.get(`/returns/customer/${encodeURIComponent(customerName)}/product/${productId}`)
          return (r.data && r.data.totalReturned != null) ? r.data.totalReturned : 0
        }
        const withRemaining = await this.applyFifoRemaining(purchases, getTotalReturned)
        const filteredPurchases = []
        for (const purchase of withRemaining) {
          let productName = purchase.productName
          if (!productName || productName.trim() === '') {
            try {
              const productResponse = await api.get(`/products/${purchase.productId}`)
              productName = productResponse.data.name || `Product ${purchase.productId}`
            } catch (_) {
              productName = `Product ${purchase.productId}`
            }
          }
          filteredPurchases.push({ ...purchase, productName })
        }
        filteredPurchases.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        this.customerPurchases = filteredPurchases
        
        if (this.customerPurchases.length === 0) {
          this.showNotification('info', this.$t('pages.return.messages.noPurchasesAvailable'))
        }
        
        // Update scroll buttons after loading purchases
        this.$nextTick(() => {
          this.updatePurchasesScrollButtons()
        })
      } catch (error) {
        console.error('Error fetching customer purchases:', error)
        this.customerPurchases = []
        this.showNotification('error', this.$t('pages.return.messages.errorLoadingPurchases'))
      }
    },
    selectPurchase(purchase) {
      this.selectedPurchase = purchase
      this.selectedNoCustomerPurchase = null // Clear no customer purchase selection
      this.selectedRecentPurchase = null
      this.returnData.quantity = 1 // Reset to 1 when selecting new purchase
    },
    selectNoCustomerPurchase(purchase) {
      this.selectedNoCustomerPurchase = purchase
      this.selectedPurchase = null // Clear customer purchase selection
      this.selectedRecentPurchase = null
      this.returnData.quantity = 1 // Reset to 1 when selecting new purchase
    },
    selectRecentPurchase(purchase) {
      this.selectedRecentPurchase = purchase
      this.selectedPurchase = null
      this.selectedNoCustomerPurchase = null
      this.returnData.quantity = 1
    },
    resetReturnData() {
      this.returnData = {
        quantity: 1,
        reason: '',
        notes: ''
      }
    },
    // Удаляет возвращённую позицию из списка или уменьшает remainingQuantity (чтобы товар сразу исчез с экрана)
    removeReturnedPurchaseFromList(list, purchase, returnedQty) {
      if (!list || !Array.isArray(list) || !purchase) return
      const pid = Number(purchase.productId)
      if (Number.isNaN(pid)) return
      // Сначала по ссылке (выбранный элемент = тот же объект из списка)
      let idx = list.indexOf(purchase)
      if (idx === -1) {
        const idMatch = (a, b) => (a == null && b == null) || String(a) === String(b) || Number(a) === Number(b)
        const samePurchase = (p) => {
          if (Number(p.productId) !== pid) return false
          if (purchase.id != null && p.id != null) return idMatch(p.id, purchase.id)
          if (purchase.date != null && p.date != null) return String(p.date).slice(0, 19) === String(purchase.date).slice(0, 19)
          return true
        }
        idx = list.findIndex(samePurchase)
      }
      if (idx === -1) return
      const item = list[idx]
      const currentRemaining = item.remainingQuantity != null ? item.remainingQuantity : item.quantity
      const newRemaining = Math.max(0, currentRemaining - returnedQty)
      if (newRemaining <= 0) {
        list.splice(idx, 1)
      } else {
        this.$set(item, 'remainingQuantity', newRemaining)
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      
      // Debug: log the original date string
      console.log('Original date string:', dateString)
      
      let date
      
      // Handle different date formats
      if (typeof dateString === 'string') {
        // If it's already a valid ISO string, use it directly
        if (dateString.includes('T') || dateString.includes('Z')) {
          date = new Date(dateString)
        } else {
          // If it's just a date without time, add time
          date = new Date(dateString + 'T00:00:00')
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString)
        return 'Неверная дата'
      }
      
      console.log('Parsed date:', date)
      
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    formatDateShort(dateString) {
      if (!dateString) return ''
      
      let date
      
      // Handle different date formats
      if (typeof dateString === 'string') {
        // If it's already a valid ISO string, use it directly
        if (dateString.includes('T') || dateString.includes('Z')) {
          date = new Date(dateString)
        } else {
          // If it's just a date without time, add time
          date = new Date(dateString + 'T00:00:00')
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Неверная дата'
      }
      
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    getReturnReasonText(reason) {
      const reasonMap = {
        'defective': this.$t('pages.return.defective'),
        'wrong_item': this.$t('pages.return.wrongItem'),
        'customer_request': this.$t('pages.return.customerRequest'),
        'damaged': this.$t('pages.return.damaged'),
        'not_satisfied': this.$t('pages.return.notSatisfied')
      }
      return reasonMap[reason] || reason
    },
    showNotification(type, message) {
      this.notification = { type, message }
      setTimeout(() => {
        this.notification = null
      }, 3000)
    },
    async fetchRecentReturns() {
      try {
        const res = await api.get('/returns')
        console.log('Raw returns data from server:', res.data)
        this.recentReturns = res.data.slice(0, 10) // Get first 10 returns
        console.log('Processed recent returns:', this.recentReturns)
      } catch (e) {
        console.error('Error fetching returns:', e)
        this.recentReturns = []
      }
    },
    async fetchNoCustomerPurchases() {
      try {
        const response = await api.get('/purchases/no-customer')
        const purchases = response.data || []
        const noCustomerApi = (this.$t && this.$t('pages.return.noCustomer')) || 'No Customer'
        const getTotalReturned = async (productId, _customerName) => {
          const r = await api.get(`/returns/customer/${encodeURIComponent(noCustomerApi)}/product/${productId}`)
          return (r.data && r.data.totalReturned != null) ? r.data.totalReturned : 0
        }
        const withRemaining = await this.applyFifoRemaining(purchases, getTotalReturned)
        const filteredPurchases = []
        for (const purchase of withRemaining) {
          let productName = purchase.productName
          if (!productName || productName.trim() === '') {
            try {
              const productResponse = await api.get(`/products/${purchase.productId}`)
              productName = productResponse.data.name || `Product ${purchase.productId}`
            } catch (_) {
              productName = `Product ${purchase.productId}`
            }
          }
          filteredPurchases.push({ ...purchase, productName })
        }
        filteredPurchases.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        this.noCustomerPurchases = filteredPurchases

        // Update scroll buttons after loading purchases
        this.$nextTick(() => {
          this.updateNoCustomerPurchasesScrollButtons()
        })
      } catch (error) {
        console.error('Error fetching no customer purchases:', error)
        this.noCustomerPurchases = []
        this.showNotification('error', this.$t('pages.return.messages.errorLoadingNoCustomerPurchases'))
      }
    },
    async fetchRecentPurchases() {
      try {
        const response = await api.get('/purchases')
        const data = response.data
        const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.purchases) ? data.purchases : (data && Array.isArray(data.items) ? data.items : []))
        let allPurchases = (rawList || []).slice(0, 50)
        if (allPurchases.length === 0) {
          try {
            const noCustomerRes = await api.get('/purchases/no-customer')
            const noData = noCustomerRes.data
            const noList = Array.isArray(noData) ? noData : (noData && Array.isArray(noData.purchases) ? noData.purchases : [])
            allPurchases = (noList || []).slice(0, 50)
          } catch (_) {}
        }
        const noCustomerApi = (this.$t && this.$t('pages.return.noCustomer')) || 'No Customer'
        const getTotalReturned = async (productId, customerName) => {
          const apiCust = (customerName && String(customerName).trim()) ? String(customerName).trim() : noCustomerApi
          const r = await api.get(`/returns/customer/${encodeURIComponent(apiCust)}/product/${productId}`)
          return (r.data && r.data.totalReturned != null) ? r.data.totalReturned : 0
        }
        const withRemaining = await this.applyFifoRemaining(allPurchases, getTotalReturned)
        const list = []
        for (const p of withRemaining) {
          let name = (p.productName && String(p.productName).trim()) ? String(p.productName).trim() : ''
          if (!name) {
            try {
              const pr = await api.get(`/products/${p.productId}`)
              name = (pr.data && pr.data.name) ? pr.data.name : `Product ${p.productId}`
            } catch (_) {
              name = `Product ${p.productId}`
            }
          }
          list.push({ ...p, productName: name })
        }
        list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        this.recentPurchases = list
        this.$nextTick(() => this.updateRecentPurchasesScrollButtons())
      } catch (error) {
        console.error('Error fetching recent purchases:', error)
        this.recentPurchases = []
        this.showNotification('error', this.$t('pages.return.messages.errorLoadingPurchases'))
      }
    },
    updateRecentPurchasesScrollButtons() {
      const container = this.$refs.recentPurchasesList
      if (!container) return
    },
    handleRecentPurchasesWheel(event) {
      event.preventDefault()
      const container = this.$refs.recentPurchasesList
      if (!container) return
      const scrollAmount = event.deltaY > 0 ? 60 : -60
      container.scrollTo({ top: container.scrollTop + scrollAmount, behavior: 'smooth' })
    },
    async processReturn() {
      if (!this.canProcess) {
        this.showNotification('error', this.$t('pages.return.messages.fillRequiredFields'))
        return
      }

      try {
        const purchase = this.selectedPurchase || this.selectedNoCustomerPurchase || this.selectedRecentPurchase
        const customer = this.selectedCustomer
        
        // Validate purchase data
        if (!purchase) {
          this.showNotification('error', this.$t('pages.return.messages.noPurchaseSelected'))
          return
        }
        
        if (!purchase.productId) {
          this.showNotification('error', this.$t('pages.return.messages.invalidPurchaseData'))
          return
        }
        
        // If productName is empty, try to get it from the products table
        let productName = purchase.productName
        if (!productName || productName.trim() === '') {
          try {
            const productResponse = await api.get(`/products/${purchase.productId}`)
            productName = productResponse.data.name || `Product ${purchase.productId}`
          } catch (productError) {
            console.error('Error fetching product name:', productError)
            productName = `Product ${purchase.productId}`
          }
        }
        
        // Create return record
        const returnRecord = {
          productId: purchase.productId,
          productName: productName,
          customerName: customer ? customer.name : (purchase.customerName || this.$t('pages.return.noCustomer')),
          quantity: parseInt(this.returnData.quantity),
          reason: this.returnData.reason,
          notes: this.returnData.notes,
          date: new Date().toISOString()
        }

        const response = await api.post('/returns', returnRecord)
        console.log('Return processed successfully:', response.data)

        const returnQty = parseInt(this.returnData.quantity, 10)
        const hadCustomer = !!this.selectedCustomer
        const customerName = this.selectedCustomer && this.selectedCustomer.name

        // Сразу убираем товар из списка на экране (до обновления с сервера)
        if (this.selectedPurchase && this.customerPurchases.length) {
          this.removeReturnedPurchaseFromList(this.customerPurchases, purchase, returnQty)
          // та же покупка может быть в «Все покупки для возврата» — обновляем и там
          this.removeReturnedPurchaseFromList(this.recentPurchases, purchase, returnQty)
          this.removeReturnedPurchaseFromList(this.noCustomerPurchases, purchase, returnQty)
        }
        if (this.selectedNoCustomerPurchase && this.noCustomerPurchases.length) {
          this.removeReturnedPurchaseFromList(this.noCustomerPurchases, purchase, returnQty)
        }
        // allPurchasesForReturnList берётся из recentPurchases ИЛИ noCustomerPurchases — удаляем из обоих
        if (this.selectedRecentPurchase) {
          this.removeReturnedPurchaseFromList(this.recentPurchases, purchase, returnQty)
          this.removeReturnedPurchaseFromList(this.noCustomerPurchases, purchase, returnQty)
        }

        // Stock update is handled automatically by the backend API

        // Update orders-count in localStorage and emit event
        let count = parseInt(localStorage.getItem('orders-count') || '0')
        count = Math.max(0, count - 1)
        localStorage.setItem('orders-count', count)
        this.ordersCount = count
        if (EventBus) {
          EventBus.$emit(EVENTS.ORDER_CHANGED, { count })
        }

        if (EventBus) {
          EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'return' })
        }
        // Уведомление в углу не показываем — есть центральная анимация
        
        // Сбрасываем форму и выбор, чтобы возвращённая позиция больше не отображалась в форме
        this.resetReturnData()
        this.selectedPurchase = null
        this.selectedNoCustomerPurchase = null
        this.selectedRecentPurchase = null

        // Обновляем списки с сервера, чтобы возвращённый товар нигде не отображался.
        // recentPurchases и noCustomerPurchases уже обновлены локально (removeReturnedPurchaseFromList),
        // их не перезапрашиваем сразу — иначе из-за задержки/кэша сервер может вернуть старые данные и товар снова появится.
        await this.fetchRecentReturns()
        if (hadCustomer && customerName) {
          await this.fetchCustomerPurchases(customerName)
        }
        
        this.$nextTick(() => {
          this.updateReturnsScrollButtons()
        })

      } catch (error) {
        console.error('Error processing return:', error)
        this.showNotification('error', this.$t('pages.return.messages.errorProcessingReturn'))
      }
    }
  },
  async mounted() {
    // Get orders count from localStorage
    const savedOrders = localStorage.getItem('orders-count');
    this.ordersCount = savedOrders ? parseInt(savedOrders) : 0;

    if (EventBus) {
      EventBus.$on(EVENTS.ORDER_CHANGED, data => {
        this.ordersCount = data.count;
      });
    }

    // Load customers
    try {
      const customersRes = await api.get('/customers')
      this.customers = customersRes.data || []
    } catch (e) {
      console.error('Error loading customers:', e)
      this.customers = []
    }
    
    this.fetchRecentReturns()
    this.fetchNoCustomerPurchases()
    this.fetchRecentPurchases()
    
    // Обновлять списки после новой покупки (чтобы купленный товар сразу был доступен для возврата)
    this.onPurchaseCompleted = () => {
      this.fetchRecentPurchases()
      this.fetchNoCustomerPurchases()
      if (this.selectedCustomer) {
        this.fetchCustomerPurchases(this.selectedCustomer.name)
      }
    }
    if (EventBus) {
      EventBus.$on('purchase-completed', this.onPurchaseCompleted)
    }
    
    // Initialize scroll listeners
    this.$nextTick(() => {
      this.updateReturnsScrollButtons()
      this.updateCustomersScrollButtons()
      this.updateNoCustomerPurchasesScrollButtons()
      // Don't initialize purchases scroll here as it's not rendered yet
    })
  },
  beforeDestroy() {
    if (EventBus && this.onPurchaseCompleted) {
      EventBus.$off('purchase-completed', this.onPurchaseCompleted)
    }
    // Clean up event listeners
    if (EventBus) {
      EventBus.$off('ORDER_CHANGED')
    }
  }
}
</script>

<style scoped>
/* Base layout styles */
.return-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px 0;
}

.container {
  max-width: 1700px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

/* Left section */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Return section (now includes customer selection) */
.return-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  border: 1px solid rgba(163, 2, 212, 0.1);
  position: relative;
  height: 800px;
  overflow: hidden;
}

.return-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.section-header {
  margin-bottom: -20px;
  width: 700px;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700px;
  color: #1e293b;
}

.section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

/* Search section styles */
.search-section {
  margin-top: -0px;
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: none !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.search-container:focus-within {
  border: none !important;
  box-shadow: none !important;
}

.search-icon {
  color: #1e293b;
  font-size: 20px;
  opacity: 0.7;
  transition: all 0.2s ease;
  padding: 12px 16px;
  z-index: 2;
  position: absolute;
  left: 0;
}

.search-input {
  flex: 1;
  padding: 12px 1px 12px 20px;
  border: none !important;
  background: transparent;
  font-size: 16px;
  outline: none !important;
  color: #1e293b;
  text-align: left;
  box-shadow: none !important;
}

.search-input::placeholder {
  color: #94a3b8;
}

.clear-search-btn {
  padding: 8px 12px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: 8px;
}

.clear-search-btn:hover {
  background: #e2e8f0;
  color: #374151;
}

.search-stats {
  margin-top: 2px;
  font-size: 14px;
  color: #a302d4;
  font-weight: 500;
}


.customers-container {
  margin-top: 16px;
}

.customers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  scroll-behavior: smooth;
}


.customers-list::-webkit-scrollbar {
  width: 8px;
}

.customers-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.customers-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.customer-item {
  display: flex;
  align-items: center;
  padding: 24px 12px;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: white;
  border: 12px solid transparent;
}

.customer-item:hover {

  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}



.customer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e4e4e4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  margin-right: 16px;
  flex-shrink: 0;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 4px;
}

.customer-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.selection-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}

.checkmark {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

/* Purchases section */
.purchases-section {
  margin-top: 0;
  border-top: none;
  padding-top: 0;
}

.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.customer-name {
  font-size: 16px;
  color: #242a31;

}

.back-button-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 0;
  position: relative;
}

.purchases-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
}

.purchases-title-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.purchases-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.back-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.2);
}

.back-btn:hover {
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}

.hover-lift:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(163, 2, 212, 0.3) !important;
  z-index: 10 !important;
}

.purchases-count {
  font-size: 14px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.purchases-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.purchases-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 600px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.purchases-list::-webkit-scrollbar {
  width: 8px;
}

.purchases-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.purchases-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.purchase-item {
  display: flex;
  align-items: center;
  padding: 24px 12px;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: white;
  border: 2px solid transparent;
}

.purchase-item:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}



.purchase-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e4e4e4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 16px;
  flex-shrink: 0;
}

.purchase-info {
  flex: 1;
  min-width: 0;
}

.purchase-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 4px;
}

.purchase-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.no-purchases {
  display: flex;
  align-items: center;
  padding: 40px 20px;
  text-align: left;
  color: #64748b;
}

.no-results-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  margin-right: 16px;
  flex-shrink: 0;
}

.no-results-text {
  flex: 1;
}

.no-results-text strong {
  color: #374151;
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.no-results-text p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.return-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {

  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  margin-top: -16px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #a302d4;
  box-shadow: 0 0 0 3px rgba(163, 2, 212, 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Customer select button */
.customer-select-btn {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: left;
}

.customer-select-btn:hover {
  border-color: #a302d4;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #374151;
}

.btn-text.selected {
  color: #a302d4;
  font-weight: 600;
}

.change-text {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
  margin-left: auto;
}

.no-purchase-selected {
  padding: 16px;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  text-align: center;
  color: #64748b;
}

.selected-purchase-info {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #a302d4;
  border-radius: 12px;
}



.quantity-info {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* Process button */
.process-btn {
  padding: 16px 24px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: -20px;
}

.process-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(163, 2, 212, 0.3);
}

.process-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  color: #1e293b;
  font-size: 20px;
  opacity: 0.7;
  transition: all 0.2s ease;
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  margin-right: 8px;
}

.customer-select-btn:hover .btn-icon {
  opacity: 1;
}

.btn-text.selected .btn-icon {
  color: #a302d4;
  opacity: 1;
}

/* History section */
.history-section {
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

/* Return form section in right column */
.return-form-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.return-form-section .form-group {
  margin-bottom: 16px;
}

.return-form-section .form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.return-form-section .form-input,
.return-form-section .form-select,
.return-form-section .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #ffffff;
}

.return-form-section .form-input:focus,
.return-form-section .form-select:focus,
.return-form-section .form-textarea:focus {
  outline: none;
  border: none;
  box-shadow: none;
}

/* Remove borders from all input elements */
.form-input,
.form-select,
.form-textarea {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.return-form-section .form-textarea {
  min-height: 60px;
  resize: vertical;
}

.return-form-section .quantity-info {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.return-form-section .process-btn {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.return-form-section .process-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.3);
}

.return-form-section .process-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.process-button-container {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.history-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.returns-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 720px;
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}

.returns-list::-webkit-scrollbar {
  width: 8px;
}

.returns-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.returns-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.return-item {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border-left: 4px solid #fbbf24;
  transition: all 0.3s ease;
  min-height: 100px;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.08);
}

.return-item:hover {
  transform: translateX(6px) translateY(-2px);
  box-shadow: 0 8px 25px rgba(163, 2, 212, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.return-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.return-product {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
}

.return-date {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.return-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: -10px;
}

.empty-returns {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  z-index: 10002;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.notification.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.notification.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* No Customer Purchases Section */
.no-customer-purchases-section {
  margin-top: 0px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.no-customer-header {
  margin-top: 10px !important;
  margin-bottom: 10px !important;
}

.no-customer-purchases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  max-height: 575px;
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

.no-customer-purchases-grid::-webkit-scrollbar {
  width: 8px;
}

.no-customer-purchases-grid::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.no-customer-purchases-grid::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
  transition: background 0.3s;
}

.no-customer-purchases-grid::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.no-customer-purchase-card {
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

.no-customer-purchase-card::before {
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

.no-customer-purchase-card:hover {
  border-color: #a302d4;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(163, 2, 212, 0.15);
}

.no-customer-purchase-card:hover::before {
  transform: scaleX(1);
}

.no-customer-purchase-card.selected {
  border-color: #a302d4;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.2);
}

.no-customer-purchase-card.selected::before {
  transform: scaleX(1);
}

.no-customer-purchase-card .purchase-name {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 8px;
}

.no-customer-purchase-card .purchase-price {
  font-size: 18px;
  font-weight: 700;
  color: #a302d4;
  margin-bottom: 4px;
}

.no-customer-purchase-card .purchase-quantity {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.no-customer-purchase-card .purchase-date {
  font-size: 12px;
  color: #7c3aed;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  border: 1px solid rgba(163, 2, 212, 0.2);
  margin-top: 8px;
  white-space: nowrap;
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.no-customer-purchase-card .purchase-customer {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.selection-checkmark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
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

/* Responsive design */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .container {
    padding: 0 10px;
  }
}
</style>
