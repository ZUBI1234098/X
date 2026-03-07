<template>
  <div class="main-content">
    <div class="customer-table-block">
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
            <span class="customer-title" style="margin: 0;">{{ $t('navigation.customers') }}</span>
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
            + {{ $t('pages.customers.addCustomer') }}
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="customers-table-container">
            <div class="customers-table">
              <div class="table-header">
                <div class="table-cell" style="flex: 0 0 60px;"> id</div>
                <div class="table-cell">{{ $t('pages.customers.customerName') }}</div>
                <div class="table-cell">{{ $t('pages.customers.customerPhone') }}</div>
                <div class="table-cell">{{ $t('pages.customers.customerEmail') }}</div>
                <div class="table-cell">{{ $t('pages.customers.customerAddress') }}</div>
                <div class="table-cell">{{ $t('pages.customers.deals') }}</div>
                <div class="table-cell">{{ $t('pages.customers.dateTime') }}</div>
                <div class="table-cell">{{ $t('pages.customers.actions') }}</div>
              </div>
              
              <!-- Сообщение если нет клиентов - показываем сверху -->
              <div v-if="filteredCustomers.length === 0 && !showForm" class="no-data-message">
                <v-icon size="48" color="#e5e7eb">mdi-account-group</v-icon>
                <p>{{ $t('pages.customers.noCustomers') }}</p>
              </div>
              
              <div class="table-body" ref="tableBody">
                <!-- Форма добавления/редактирования -->
                <div v-if="showForm" class="table-row edit-row">
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                    <span style="color: #666; font-size: 12px;">{{ $t('pages.customers.new') }}</span>
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.name" 
                      :placeholder="$t('pages.customers.placeholder.customerName')" 
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.phone" 
                      :placeholder="$t('pages.customers.placeholder.phone')" 
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.email" 
                      :placeholder="$t('pages.customers.placeholder.email')" 
                      type="email"
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.address" 
                      :placeholder="$t('pages.customers.placeholder.address')" 
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.deals" 
                      :placeholder="$t('pages.customers.placeholder.deals')" 
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newCustomer.date" 
                      type="datetime-local" 
                      dense
                      outlined
                      hide-details
                      class="inline-input"
                      readonly
                    />
                  </div>
                  <div class="table-cell actions-cell">
                    <v-btn icon @click="saveCustomer" :loading="saving" small color="green">
                      <v-icon size="20">mdi-check</v-icon>
                    </v-btn>
                    <v-btn icon @click="cancelEdit" small color="red">
                      <v-icon size="20">mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
                
                <!-- Строки данных -->
                <div 
                  v-for="(customer, index) in filteredCustomers" 
                  :key="customer.id || index"
                  class="table-row"
                >
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                    <span style="color: #666; font-weight: 500;">{{ index + 1 }}</span>
                  </div>
                  <div class="table-cell">
                    <div class="customer-name">{{ customer.name }}</div>
                  </div>
                  <div class="table-cell">
                    <span class="phone-text">{{ customer.phone || '-' }}</span>
                  </div>
                  <div class="table-cell">
                    <span class="email-text">{{ customer.email || '-' }}</span>
                  </div>
                  <div class="table-cell">
                    <span class="address-text">{{ customer.address || '-' }}</span>
                  </div>
                  <div class="table-cell">
                    <span class="deals-text">{{ customer.deals || '-' }}</span>
                  </div>
                  <div class="table-cell">
                    <div class="datetime-full">
                      <div class="date-part">{{ formatDateOnly(customer.date) }}</div>
                      <div class="time-part">{{ formatTimeWithSeconds(customer.date) }}</div>
                    </div>
                  </div>
                  <div class="table-cell actions-cell">
                    <v-btn v-if="isOwner" icon small @click="editCustomerInline(index)">
                      <v-icon size="20">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn v-if="isOwner" icon small @click="deleteCustomer(index)" :loading="deleting[index]">
                      <v-icon color="red" size="20">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="lastAddedCustomer" class="added-message">
            <v-alert type="success" dismissible @input="lastAddedCustomer = null">
              {{ $t('pages.customers.customerSaved', { name: lastAddedCustomer }) }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser } from '@/services/api'
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'CustomersPage',
  data() {
    return {
      search: '',
      showForm: false,
      editIndex: null,
      saving: false,
      deleting: {},
      newCustomer: {
        name: '',
        phone: '',
        email: '',
        address: '',
        deals: '',
        date: ''
      },
      customers: [],
      lastAddedCustomer: null,
      canScrollUp: false,
      canScrollDown: false,
      headers: [
        { text: 'Name', value: 'name', sortable: false },
        { text: 'Phone', value: 'phone', sortable: false },
        { text: 'Email', value: 'email', sortable: false },
        { text: 'Address', value: 'address', sortable: false },
        { text: 'Deals', value: 'deals', sortable: false },
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
    totalCustomers() {
      return this.customers.length
    },
    activeCustomers() {
      return this.customers.filter(customer => {
        const hasDeals = customer.deals && customer.deals !== ''
        const recentDate = customer.date && this.isRecentDate(customer.date)
        return hasDeals || recentDate
      }).length
    },
    newToday() {
      const today = new Date().toISOString().split('T')[0]
      return this.customers.filter(customer => customer.date === today).length
    },
    filteredCustomers() {
      if (!this.search) return this.customers
      
      const searchLower = this.search.toLowerCase()
      
      return this.customers.filter(customer => {
        const nameMatch = customer.name && customer.name.toLowerCase().includes(searchLower)
        const phoneMatch = customer.phone && customer.phone.toLowerCase().includes(searchLower)
        const emailMatch = customer.email && customer.email.toLowerCase().includes(searchLower)
        const addressMatch = customer.address && customer.address.toLowerCase().includes(searchLower)
        const dealsMatch = customer.deals && customer.deals.toLowerCase().includes(searchLower)
        const formattedDate = this.formatDate(customer.date).toLowerCase()
        const dateMatch = formattedDate.includes(searchLower)
        const dateObj = new Date(customer.date)
        const year = dateObj.getFullYear().toString()
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
        const day = dateObj.getDate().toString().padStart(2, '0')
        const hour = dateObj.getHours().toString().padStart(2, '0')
        const minute = dateObj.getMinutes().toString().padStart(2, '0')
        const second = dateObj.getSeconds().toString().padStart(2, '0')

        const datePartsMatch = year.includes(searchLower) || 
                              month.includes(searchLower) || 
                              day.includes(searchLower) ||
                              hour.includes(searchLower) ||
                              minute.includes(searchLower) ||
                              second.includes(searchLower)
        
        return nameMatch || phoneMatch || emailMatch || addressMatch || dealsMatch || dateMatch || datePartsMatch
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
    
    async fetchCustomers() {
      try {
        const res = await api.get('/customers')
        this.customers = res.data
        this.emitCustomersChanged()
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    },
    startAdd() {
      console.log('Start Add clicked')
      this.newCustomer = {
        name: '',
        phone: '',
        email: '',
        address: '',
        deals: '',
        date: new Date().toISOString().slice(0, 16) 
      }
      this.editIndex = null
      this.showForm = true
      console.log('showForm set to:', this.showForm)
    },
    async saveCustomer() {
      if (
        this.newCustomer.name || this.newCustomer.phone || this.newCustomer.email || 
        this.newCustomer.address || this.newCustomer.deals || this.newCustomer.date
      ) {
        this.saving = true
        try {
          let response
          if (this.editIndex === null) {
            response = await api.post('/customers', this.newCustomer)
            const newCustomer = { ...this.newCustomer, id: response.data.id }
            this.customers.unshift(newCustomer)
            EventBus.$emit(EVENTS.CUSTOMER_ADDED, {
              customer: newCustomer,
              total: this.customers.length
            })
            
            this.lastAddedCustomer = this.newCustomer.name
            
            // Прокрутка к началу таблицы для показа нового клиента
            this.$nextTick(() => {
              const tableBody = this.$refs.tableBody
              if (tableBody) {
                tableBody.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                })
              }
            })
          } else {
            await api.put(
              `/customers/${this.customers[this.editIndex].id}`,
              this.newCustomer
            )
            this.customers[this.editIndex] = { ...this.newCustomer, id: this.customers[this.editIndex].id }
            
            EventBus.$emit(EVENTS.CUSTOMER_UPDATED, {
              customer: { ...this.newCustomer, id: this.customers[this.editIndex].id },
              total: this.customers.length
            })
            
            this.lastAddedCustomer = this.newCustomer.name
          }
          
          this.resetForm()
          this.emitCustomersChanged()

          setTimeout(() => {
            this.lastAddedCustomer = null
          }, 3000)
        } catch (error) {
          console.error('Error saving customer:', error)
        } finally {
          this.saving = false
        }
      }
    },
    editCustomer(index) {
      this.editIndex = index
      this.newCustomer = { ...this.customers[index] }
      this.showForm = true
    },
    editCustomerInline(index) {
      this.editIndex = index
      this.newCustomer = { ...this.customers[index] }
      this.showForm = true
    },
    async deleteCustomer(index) {
      this.$set(this.deleting, index, true)
      try {
        const customerId = this.customers[index].id
        const customerName = this.customers[index].name
        
        await api.delete(`/customers/${customerId}`)
        
        EventBus.$emit(EVENTS.CUSTOMER_DELETED, {
          customerId,
          customerName,
          total: this.customers.length - 1
        })
        
        await this.fetchCustomers()
      } catch (error) {
        console.error('Error deleting customer:', error)
      } finally {
        this.$set(this.deleting, index, false)
      }
    },
    cancelEdit() {
      this.resetForm()
    },
    resetForm() {
      this.newCustomer = {
        name: '',
        phone: '',
        email: '',
        address: '',
        deals: '',
        date: ''
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
    isRecentDate(date) {
      if (!date) return false
      const customerDate = new Date(date)
      const now = new Date()
      const diffTime = Math.abs(now - customerDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30
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
    emitCustomersChanged() {
      EventBus.$emit(EVENTS.CUSTOMERS_CHANGED, {
        total: this.totalCustomers,
        active: this.activeCustomers,
        inactive: this.totalCustomers - this.activeCustomers,
        newToday: this.newToday,
        customers: this.customers
      })
    }
  },
  mounted() {
    this.fetchCustomers()
    this.initializeTableScroll()
  }
}
</script>

<style scoped>
.main-content {
  min-height: 1000px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  background: #faf9fb;
}

.customer-table-block {
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

.customer-table-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.customer-table-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}

.customer-title {
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

/* Customers Table Styles - matching Products styling */
.customers-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 600px;
  overflow: hidden;
}

.customers-table {
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateX(1px);
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

.customer-name {
  font-weight: 600;
  color: #1e293b;
}

.phone-text,
.email-text,
.address-text,
.deals-text {
  color: #000000;
  font-weight: 500;
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

.added-message {
  margin-top: 16px;
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

/* Responsive Design */
@media (max-width: 1200px) {
  .customer-table-block {
    width: 95%;
    margin-left: 2.5%;
    margin-right: 2.5%;
  }
  
  .search-input {
    margin-left: 20px !important;
  }
  
  .table-cell {
    padding: 12px 8px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .customer-title {
    font-size: 28px;
  }
  
  .customers-table {
    font-size: 12px;
  }
  
  .table-cell {
    padding: 10px 6px;
  }
  
  .datetime-full {
    font-size: 11px;
  }
}
</style>