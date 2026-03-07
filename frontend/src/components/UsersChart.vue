<template>
  <div class="main-content">
    <div class="customer-table-block">
      <v-card flat>
        <v-card-title style="display: flex; justify-content: space-between; align-items: center;">
          <span class="customer-title" style="margin: 0;">Customers</span>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search"
            hide-details
            outlined
            class="search-input"
            style="max-width: 300px; margin: 0 24px; flex: 1; text-align: center;"
          ></v-text-field>
          <v-btn color="#a302d4" dark class="add-btn" @click="startAdd" style="margin-left: auto;">
            + Add Customer
          </v-btn>
        </v-card-title>

        <!-- Форма добавления/редактирования клиента -->
        <v-expand-transition>
          <div v-show="showForm" class="form-container">
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.name" 
                      label="Name" 
                      outlined
                      dense
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.phone" 
                      label="Phone Number" 
                      outlined
                      dense
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.email" 
                      label="Email" 
                      outlined
                      dense
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.address" 
                      label="Address" 
                      outlined
                      dense
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.deals" 
                      label="Deals" 
                      outlined
                      dense
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field 
                      v-model="newCustomer.date" 
                      label="Date" 
                      type="date" 
                      outlined
                      dense
                      :append-icon="null" 
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-btn 
                      color="#a302d4" 
                      dark 
                      class="add-btn mr-3" 
                      @click="saveCustomer"
                      :loading="saving"
                    >
                      {{ editIndex === null ? 'Save Customer' : 'Update Customer' }}
                    </v-btn>
                    <v-btn 
                      outlined 
                      class="cancel-btn" 
                      @click="cancelEdit"
                    >
                      Cancel
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
          </div>
        </v-expand-transition>

        <v-card-text>
          <!-- Статистика клиентов -->
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-number">{{ totalCustomers }}</div>
              <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ activeCustomers }}</div>
              <div class="stat-label">Active</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ newToday }}</div>
              <div class="stat-label">New Today</div>
            </div>
          </div>

          <v-data-table 
            :headers="headers" 
            :items="customers" 
            :search="search" 
            class="elevation-1 custom-table"
            no-data-text="No customers found" 
            :items-per-page="10" 
            show-current-page 
            :footer-props="{
              'items-per-page-options': [],
              showFirstLastPage: true
            }"
          >
            <template v-slot:item.actions="{ item, index }">
              <v-btn v-if="isOwner" icon @click="editCustomer(index)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn v-if="isOwner" icon @click="deleteCustomer(index)" :loading="deleting[index]">
                <v-icon color="red">mdi-delete</v-icon>
              </v-btn>
            </template>
            
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
          </v-data-table>

          <div v-if="lastAddedCustomer" class="added-message">
            <v-alert type="success" dismissible @input="lastAddedCustomer = null">
              Customer "{{ lastAddedCustomer }}" was successfully saved
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
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Phone', value: 'phone' },
        { text: 'Email', value: 'email' },
        { text: 'Address', value: 'address' },
        { text: 'Deals', value: 'deals' },
        { text: 'Date', value: 'date' },
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
      // Клиенты считаются активными если у них есть deals или недавняя дата
      return this.customers.filter(customer => {
        const hasDeals = customer.deals && customer.deals !== ''
        const recentDate = customer.date && this.isRecentDate(customer.date)
        return hasDeals || recentDate
      }).length
    },
    newToday() {
      const today = new Date().toISOString().split('T')[0]
      return this.customers.filter(customer => customer.date === today).length
    }
  },
  methods: {
    async fetchCustomers() {
      try {
        const res = await api.get('/customers')
        this.customers = res.data
        
        // Отправляем событие об изменении клиентов
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
        date: new Date().toISOString().split('T')[0] // Сегодняшняя дата по умолчанию
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
            // Добавление нового клиента
            response = await api.post('/customers', this.newCustomer)
            
            // Отправляем событие о добавлении
            EventBus.$emit(EVENTS.CUSTOMER_ADDED, {
              customer: { ...this.newCustomer, id: response.data.id },
              total: this.customers.length + 1
            })
            
            this.lastAddedCustomer = this.newCustomer.name
          } else {
            // Обновление существующего клиента
            await api.put(
              `/customers/${this.customers[this.editIndex].id}`,
              this.newCustomer
            )
            
            // Отправляем событие об обновлении
            EventBus.$emit(EVENTS.CUSTOMER_UPDATED, {
              customer: { ...this.newCustomer, id: this.customers[this.editIndex].id },
              total: this.customers.length
            })
            
            this.lastAddedCustomer = this.newCustomer.name
          }
          
          this.resetForm()
          await this.fetchCustomers()

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
    async deleteCustomer(index) {
      const customerName = this.customers[index].name
      if (!confirm(this.$t('common.confirmDeleteItem', { name: customerName }))) return

      this.$set(this.deleting, index, true)
      try {
        const customerId = this.customers[index].id
        
        await api.delete(`/customers/${customerId}`)
        
        // Отправляем событие об удалении
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
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      return new Date(date).toLocaleDateString('en-US', options)
    },
    isRecentDate(date) {
      if (!date) return false
      const customerDate = new Date(date)
      const now = new Date()
      const diffTime = Math.abs(now - customerDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30 // Считаем активными клиентов за последние 30 дней
    },
    emitCustomersChanged() {
      // Отправляем общее событие об изменении клиентов с полной статистикой
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
  }
}
</script>

<style scoped>
.main-content {
  min-height: 100vh !important;
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
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(163, 2, 212, 0.07);
  padding: 32px;
  margin-bottom: 40px;
}

.customer-title {
  font-size: 34px;
  color: #000000;
  font-weight: bold;
  margin-right: 40px;
  min-width: 180px;
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

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: flex-start;
}

.stat-card {
  background: linear-gradient(135deg, #a302d4 0%, #8a02b0 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  min-width: 150px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(163, 2, 212, 0.2);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-table .v-data-table-header th,
.custom-table .v-data-table__wrapper td {
  min-width: 160px;
  padding-left: 12px;
  text-align: left;
  white-space: nowrap;

  text-overflow: ellipsis;
}

.added-message {
  margin-top: 16px;
}
</style>