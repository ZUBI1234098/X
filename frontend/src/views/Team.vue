<template>
  <div class="main-content">
    <div class="team-table-block">
      <v-card flat>
        <v-card-title style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <v-btn icon @click="goBack" class="back-btn" color="#a302d4">
              <v-icon size="24">mdi-arrow-left</v-icon>
            </v-btn>
            <span class="page-title" style="margin: 0;">{{ $t('navigation.team') }}</span>
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
          <v-btn v-if="isOwner" color="#a302d4" dark class="add-btn" @click="startAdd" style="margin-left: auto;">
            {{ $t('pages.team.addEmployee') }}
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="team-table-container">
            <div class="team-table">
              <div class="table-header">
                <div class="table-cell" style="flex: 0 0 60px;">#</div>
                <div class="table-cell">{{ $t('pages.team.displayName') }}</div>
                <div class="table-cell">{{ $t('pages.team.email') }}</div>
                <div class="table-cell">{{ $t('pages.team.dateAdded') }}</div>
                <div class="table-cell">{{ $t('pages.team.actions') }}</div>
              </div>

              <div v-if="filteredEmployees.length === 0 && !showForm" class="no-data-message">
                <v-icon size="48" color="#e5e7eb">mdi-account-group</v-icon>
                <p>{{ $t('pages.team.noEmployeesFound') }}</p>
              </div>

              <div class="table-body" ref="tableBody">
                <div v-if="showForm" class="table-row edit-row">
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                    <span style="color: #666; font-size: 12px;">{{ $t('pages.team.new') }}</span>
                  </div>
                  <div class="table-cell">
                    <v-text-field v-model="newEmployee.displayName" :placeholder="$t('pages.team.placeholder.displayName')" dense outlined hide-details class="inline-input" />
                  </div>
                  <div class="table-cell">
                    <v-text-field v-model="newEmployee.email" :placeholder="$t('pages.team.placeholder.email')" dense outlined hide-details class="inline-input" :readonly="editIndex !== null" />
                  </div>
                  <div class="table-cell">
                    <v-text-field v-model="newEmployee.password" :placeholder="editIndex !== null ? $t('pages.team.placeholder.passwordOptional') : $t('pages.team.placeholder.password')" type="password" dense outlined hide-details class="inline-input" />
                  </div>
                  <div class="table-cell actions-cell">
                    <v-btn icon @click="saveEmployee" :loading="saving" small color="green"><v-icon size="20">mdi-check</v-icon></v-btn>
                    <v-btn icon @click="cancelEdit" small color="red"><v-icon size="20">mdi-close</v-icon></v-btn>
                  </div>
                </div>

                <div v-for="(emp, index) in filteredEmployees" :key="emp.id" class="table-row table-row--clickable" @click="showEmployeeAnalytics(emp)">
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;"><span style="color: #666; font-weight: 500;">{{ index + 1 }}</span></div>
                  <div class="table-cell"><div class="employee-name">{{ emp.displayName || '-' }}</div></div>
                  <div class="table-cell"><span class="email-text">{{ emp.email || '-' }}</span></div>
                  <div class="table-cell">
                    <template v-if="emp.createdAt">
                      <div class="datetime-full">
                        <div class="date-part">{{ formatDateOnly(emp.createdAt) }}</div>
                        <div class="time-part">{{ formatTimeWithSeconds(emp.createdAt) }}</div>
                      </div>
                    </template>
                    <span v-else class="text-grey">-</span>
                  </div>
                  <div class="table-cell actions-cell" @click.stop>
                    <v-btn v-if="isOwner" icon @click.stop="showEmployeeAnalytics(emp)" small :title="$t('pages.team.analytics.title')"><v-icon color="#a302d4" size="20">mdi-chart-line</v-icon></v-btn>
                    <v-btn v-if="isOwner" icon @click.stop="editEmployeeInline(index)" small><v-icon size="20">mdi-pencil</v-icon></v-btn>
                    <v-btn v-if="isOwner" icon @click.stop="deleteEmployee(index)" :loading="deleting[index]" small><v-icon color="red" size="20">mdi-delete</v-icon></v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="lastAddedName" class="added-message">
            <v-alert type="success" dismissible @input="lastAddedName = null">{{ $t('pages.team.employeeSaved', { name: lastAddedName }) }}</v-alert>
          </div>
          <div v-if="lastEditMessage" class="added-message">
            <v-alert type="success" dismissible @input="lastEditMessage = null">{{ lastEditMessage }}</v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Модальное окно — детальная информация о сотруднике -->
    <div v-if="analyticsModal.show" class="modal-overlay" @click="closeAnalyticsModal">
      <div class="modal-content modal-content--employee-detail" @click.stop>
        <div class="employee-detail-header-bar">
          <h3 class="employee-detail-page-title">{{ $t('pages.team.analytics.title') }}</h3>
          <button @click="closeAnalyticsModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="analyticsModal.loading" class="activity-loading">
            <v-progress-circular indeterminate color="#a302d4" size="48"></v-progress-circular>
            <p>{{ $t('common.loading') }}</p>
          </div>
          <template v-else>
            <div class="employee-header-detail">
              <div class="employee-avatar-large">{{ (analyticsModal.employee && analyticsModal.employee.displayName) ? (analyticsModal.employee.displayName.trim()[0] || '?').toUpperCase() : '?' }}</div>
              <div class="employee-info-detail">
                <h2 class="employee-name-detail">{{ analyticsModal.employee ? analyticsModal.employee.displayName : '-' }}</h2>
                <p class="employee-email-detail">{{ analyticsModal.employee ? analyticsModal.employee.email : '' }}</p>
                <div class="employee-stats-detail">
                  <div class="stat-item"><span class="stat-value">{{ (analyticsModal.purchases || []).length }}</span><span class="stat-label">{{ $t('pages.team.analytics.purchases') }}</span></div>
                  <div class="stat-item"><span class="stat-value">{{ (analyticsModal.returns || []).length }}</span><span class="stat-label">{{ $t('pages.team.analytics.returns') }}</span></div>
                  <div class="stat-item"><span class="stat-value">{{ (analyticsModal.expenses || []).length }}</span><span class="stat-label">{{ $t('pages.team.analytics.expenses') }}</span></div>
                </div>
              </div>
            </div>
            <div class="employee-details-content">
              <!-- Единая таблица активностей как в аналитике пользователя -->
              <div class="activity-table-wrap">
                <div class="activity-table">
                  <div class="activity-table-header">
                    <div class="activity-table-cell">{{ $t('analytics.customer.tableHeaders.dateAndTime') }}</div>
                    <div class="activity-table-cell">{{ $t('analytics.customer.tableHeaders.pieces') }}</div>
                    <div class="activity-table-cell">{{ $t('pages.orders.product') }}</div>
                    <div class="activity-table-cell">{{ $t('analytics.customer.tableHeaders.description') }}</div>
                    <div class="activity-table-cell">{{ $t('pages.orders.payment') }}</div>
                    <div class="activity-table-cell">{{ $t('analytics.customer.tableHeaders.amount') }}</div>
                    <div class="activity-table-cell">{{ $t('analytics.customer.tableHeaders.status') }}</div>
                  </div>
                  <div class="activity-table-body">
                    <div
                      v-for="activity in employeeAllActivities"
                      :key="activity.id"
                      class="activity-table-row"
                      :class="{ 'expense-row': activity.type === 'expense' }"
                    >
                      <div class="activity-table-cell">
                        <div class="datetime-full">
                          <div class="date-part">{{ formatDateOnlyTable(activity.date) }}</div>
                          <div class="time-part">{{ formatTimeWithSecondsTable(activity.date) }}</div>
                        </div>
                      </div>
                      <div class="activity-table-cell">
                        <span class="quantity-text">
                          <template v-if="activity.type === 'purchase'">{{ activity.quantity || 1 }}</template>
                          <template v-else-if="activity.type === 'return'">-{{ activity.quantity || 0 }}</template>
                          <template v-else>-</template>
                        </span>
                      </div>
                      <div class="activity-table-cell">
                        <div class="activity-description">
                          <div class="product-name">{{ activity.productName || '-' }}</div>
                        </div>
                      </div>
                      <div class="activity-table-cell">
                        <div class="operation-description">
                          <span v-if="activity.type === 'purchase'" class="operation-type purchase">{{ $t('pages.buy.title') }}</span>
                          <span v-else-if="activity.type === 'return'" class="operation-type return">
                            {{ getReturnReasonTranslation(activity.reason) }}
                            <div v-if="activity.notes" class="return-notes">{{ activity.notes }}</div>
                          </span>
                          <span v-else-if="activity.type === 'expense'" class="operation-type expense">{{ (activity.category && activity.category !== '-') ? activity.category : '-' }}</span>
                          <span v-else class="operation-type other">{{ activity.type }}</span>
                        </div>
                      </div>
                      <div class="activity-table-cell">
                        <span v-if="activity.type === 'purchase' && activity.paymentMethod" class="payment-method">
                          {{ getPaymentMethodText(activity.paymentMethod) }}
                        </span>
                        <span v-else>-</span>
                      </div>
                      <div class="activity-table-cell">
                        <span v-if="activity.amount != null && activity.amount !== 0" class="activity-amount" :class="{ negative: activity.amount < 0, positive: activity.amount > 0 }">
                          ${{ Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                        </span>
                        <span v-else>-</span>
                      </div>
                      <div class="activity-table-cell">
                        <v-chip
                          small
                          :color="getActivityChipColor(activity)"
                          :text-color="getActivityChipTextColor(activity)"
                          class="status-chip-large"
                        >
                          {{ getActivityChipText(activity) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!employeeAllActivities.length" class="no-data">
                  <v-icon size="48" color="#e5e7eb">mdi-history</v-icon>
                  <p>{{ $t('pages.team.analytics.noData') }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="modal-footer"><button @click="closeAnalyticsModal" class="confirm-btn">{{ $t('common.close') }}</button></div>
      </div>
    </div>
  </div>
</template>

<script>
import api, { getAuthUser } from '@/services/api'
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'Team',
  data() {
    return {
      search: '',
      showForm: false,
      editIndex: null,
      saving: false,
      deleting: {},
      newEmployee: { displayName: '', email: '', password: '' },
      employees: [],
      lastAddedName: null,
      lastEditMessage: null,
      analyticsModal: { show: false, employee: null, purchases: [], returns: [], expenses: [], loading: false }
    }
  },
  computed: {
    isOwner() {
      const u = getAuthUser()
      return u && u.isOwner === true
    },
    filteredEmployees() {
      if (!this.search) return this.employees
      const q = this.search.toLowerCase()
      return this.employees.filter(emp => (emp.displayName || '').toLowerCase().includes(q) || (emp.email || '').toLowerCase().includes(q))
    },
    employeeAllActivities() {
      const activities = []
      const purchases = this.analyticsModal.purchases || []
      const returns = this.analyticsModal.returns || []
      const expenses = this.analyticsModal.expenses || []
      purchases.forEach(p => {
        activities.push({
          id: 'p-' + p.id,
          type: 'purchase',
          date: p.date,
          quantity: p.quantity,
          productName: p.productName,
          customerName: p.customerName,
          amount: parseFloat(p.total) || 0,
          paymentMethod: p.paymentMethod,
          reason: null,
          notes: p.notes
        })
      })
      returns.forEach(r => {
        activities.push({
          id: 'r-' + r.id,
          type: 'return',
          date: r.date,
          quantity: r.quantity,
          productName: r.productName,
          customerName: r.customerName,
          amount: r.amount ? -Math.abs(parseFloat(r.amount)) : 0,
          paymentMethod: null,
          reason: r.reason,
          notes: r.notes
        })
      })
      expenses.forEach(e => {
        activities.push({
          id: 'e-' + e.id,
          type: 'expense',
          date: e.date,
          quantity: null,
          productName: e.description || '-',
          category: e.category,
          amount: parseFloat(e.amount) || 0,
          paymentMethod: null,
          reason: null,
          notes: null
        })
      })
      // По дате: новые сверху
      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  },
  watch: { '$i18n.locale'() { this.$forceUpdate() } },
  methods: {
    goBack() { this.$router.go(-1) },
    async fetchEmployees() {
      try {
        const res = await api.get('/team')
        this.employees = (res.data.employees || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      } catch (err) {
        console.error('Error fetching team:', err)
        this.employees = []
      }
    },
    startAdd() { this.newEmployee = { displayName: '', email: '', password: '' }; this.editIndex = null; this.showForm = true },
    async saveEmployee() {
      const isEdit = this.editIndex !== null
      const emailNorm = (this.newEmployee.email || '').trim().toLowerCase()
      const nameNorm = (this.newEmployee.displayName || '').trim() || emailNorm.split('@')[0] || 'Сотрудник'
      if (!emailNorm && !isEdit) { this.lastEditMessage = (this.$t('pages.team.placeholder.email') || 'Email') + ' — обязательно'; return }
      if (!isEdit && (!this.newEmployee.password || String(this.newEmployee.password).length < 6)) { this.lastEditMessage = this.$t('pages.team.placeholder.password'); return }
      this.saving = true
      try {
        if (!isEdit) {
          await api.post('/team', { email: emailNorm, displayName: nameNorm, password: String(this.newEmployee.password) })
          await this.fetchEmployees()
          EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'employeeAdd' })
          this.lastAddedName = nameNorm
        } else {
          const emp = this.employees[this.editIndex]
          const body = { displayName: nameNorm || emp.displayName }
          if (emailNorm) body.email = emailNorm
          if (this.newEmployee.password && String(this.newEmployee.password).trim().length >= 6) body.password = String(this.newEmployee.password).trim()
          await api.put(`/team/${emp.id}`, body)
          await this.fetchEmployees()
          this.lastEditMessage = this.$t('pages.team.employeeSaved', { name: nameNorm || emp.displayName })
          this.resetForm()
          this.$nextTick(() => EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'employeeEdit' }))
        }
        setTimeout(() => { this.lastAddedName = null; this.lastEditMessage = null }, 3000)
      } catch (err) {
        this.lastEditMessage = (err.response && err.response.data && err.response.data.error) || err.message
        setTimeout(() => { this.lastEditMessage = null }, 4000)
      } finally { this.saving = false }
    },
    editEmployeeInline(index) {
      const emp = this.employees[index]
      this.editIndex = index
      this.newEmployee = { displayName: emp.displayName || '', email: emp.email || '', password: '' }
      this.showForm = true
    },
    async deleteEmployee(index) {
      this.$set(this.deleting, index, true)
      try {
        await api.delete(`/team/${this.employees[index].id}`)
        this.employees.splice(index, 1)
        EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'employeeDelete' })
      } catch (err) { console.error('Error deleting employee:', err) }
      finally { this.$set(this.deleting, index, false) }
    },
    cancelEdit() { this.resetForm() },
    resetForm() { this.newEmployee = { displayName: '', email: '', password: '' }; this.editIndex = null; this.showForm = false },
    formatDateOnly(date) { if (!date) return ''; return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
    formatTimeWithSeconds(date) { if (!date) return ''; return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) },
    parseActivityDate(date) {
      if (!date) return null
      const s = String(date).trim()
      if (!s) return null
      let normalized = s.includes(' ') && !s.includes('T') ? s.replace(' ', 'T') : s
      // Время с сервера в UTC; если нет Z или ±offset — дополняем Z, чтобы отобразить в локальной таймзоне
      if (/T\d{1,2}:\d{2}/.test(normalized) && !/Z|[+-]\d{2}:?\d{2}$/.test(normalized)) normalized = normalized + 'Z'
      const d = new Date(normalized)
      return isNaN(d.getTime()) ? null : d
    },
    formatDateOnlyTable(date) { const d = this.parseActivityDate(date); if (!d || isNaN(d.getTime())) return '-'; return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) },
    // Реальное время в локальной таймзоне пользователя (возвраты и расходы)
    formatTimeWithSecondsTable(date) {
      const d = this.parseActivityDate(date)
      if (!d || isNaN(d.getTime())) return '00:00:00'
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz })
    },
    formatDateTime(date) { if (!date) return '-'; return new Date(date).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    getReturnReasonTranslation(reason) {
      if (!reason) return this.$t('pages.return.wrongItem')
      const reasonMap = {
        defective: this.$t('pages.return.defective'),
        wrong_item: this.$t('pages.return.wrongItem'),
        customer_request: this.$t('pages.return.customerRequest'),
        damaged: this.$t('pages.return.damaged'),
        not_satisfied: this.$t('pages.return.notSatisfied')
      }
      return reasonMap[reason] || reason
    },
    getPaymentMethodText(method) {
      const methods = { card: this.$t('common.card'), cash: this.$t('common.cash'), transfer: this.$t('common.transfer') }
      return methods[method] || method || this.$t('common.notAvailable')
    },
    getActivityChipColor(activity) {
      if (activity.type === 'purchase') return '#4CAF50'
      if (activity.type === 'return') return '#FFC107'
      if (activity.type === 'expense') return '#9C27B0'
      return '#2196F3'
    },
    getActivityChipTextColor(activity) {
      if (activity.type === 'purchase' || activity.type === 'return') return 'black'
      return 'white'
    },
    getActivityChipText(activity) {
      if (activity.type === 'purchase') return this.$t('analytics.customer.tableHeaders.completed')
      if (activity.type === 'return') return this.$t('analytics.customer.tableHeaders.returned')
      if (activity.type === 'expense') return this.$t('analytics.customer.tableHeaders.expense')
      return activity.type || '-'
    },
    async showEmployeeAnalytics(emp) {
      this.analyticsModal.show = true
      this.analyticsModal.employee = emp
      this.analyticsModal.purchases = []
      this.analyticsModal.returns = []
      this.analyticsModal.expenses = []
      this.analyticsModal.loading = true
      try {
        const res = await api.get(`/team/${emp.id}/activity`)
        this.analyticsModal.purchases = res.data.purchases || []
        this.analyticsModal.returns = res.data.returns || []
        this.analyticsModal.expenses = res.data.expenses || []
      } catch (err) { console.error('Error loading employee activity:', err); this.analyticsModal.purchases = []; this.analyticsModal.returns = []; this.analyticsModal.expenses = [] }
      finally { this.analyticsModal.loading = false }
    },
    closeAnalyticsModal() { this.analyticsModal.show = false; this.analyticsModal.employee = null; this.analyticsModal.purchases = []; this.analyticsModal.returns = []; this.analyticsModal.expenses = [] }
  },
  mounted() { this.fetchEmployees() }
}
</script>

<style scoped>
.main-content { min-height: 1000px !important; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; box-sizing: border-box; background: #faf9fb; }
.team-table-block { margin-top: 40px; margin-left: 40px; margin-right: 40px; width: 1660px; background: linear-gradient(135deg, #fff 0%, #f8fafc 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 32px; margin-bottom: 40px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
.team-table-block::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6); border-radius: 16px 16px 0 0; }
.page-title { font-size: 34px; color: #000; font-weight: bold; margin-right: 40px; min-width: 180px; }
.back-btn { transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(163,2,212,0.2); }
.back-btn:hover { transform: translateX(-2px); box-shadow: 0 4px 12px rgba(163,2,212,0.3); }
.search-input { margin-left: 380px !important; border-radius: 45px !important; }
.add-btn { margin-bottom: 5px; width: 200px; height: 50px !important; border-radius: 40px !important; box-shadow: 2px 2px 8px rgba(163,2,212,0.08); margin-top: 16px; }
.added-message { margin-top: 16px; }
.team-table-container { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 600px; overflow: hidden; }
.team-table { height: 100%; display: flex; flex-direction: column; }
.table-body { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; max-height: calc(600px - 50px); }
.table-header { display: flex; background: #ececec; color: #374151; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; min-height: 50px; }
.table-header .table-cell { padding: 16px 12px; flex: 1; text-align: left; border-right: 1px solid rgba(255,255,255,0.2); }
.table-header .table-cell:last-child { border-right: none; }
.table-row { display: flex; border-bottom: 1px solid #f1f5f9; transition: all 0.2s ease; background: #fff; }
.table-row:hover { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); transform: translateX(2px); }
.table-row--clickable { cursor: pointer; }
.table-row--clickable:hover .employee-name { color: #a302d4; }
.table-cell { padding: 16px 12px; flex: 1; display: flex; align-items: center; font-size: 14px; color: #334155; border-right: 1px solid #f1f5f9; }
.table-cell:last-child { border-right: none; }
.employee-name { font-weight: 600; color: #1e293b; }
.email-text { color: #64748b; font-size: 14px; }
.datetime-full { display: flex; flex-direction: column; gap: 2px; }
.date-part { font-weight: 600; color: #1e293b; font-size: 13px; }
.time-part { color: #1e293b; font-size: 15px; font-weight: 500; }
.actions-cell { justify-content: center; gap: 4px; }
.no-data-message { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #64748b; background: #f8f9fa; border-radius: 8px; margin: 16px 0; border: 1px solid #e9ecef; }
.no-data-message p { margin-top: 16px; font-size: 16px; font-weight: 500; color: #6c757d; }
.table-body::-webkit-scrollbar { width: 8px; }
.table-body::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 4px; }
.table-body::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
.inline-input { margin: 0 !important; padding: 0 !important; }
.inline-input .v-input__control { min-height: 32px !important; }
.inline-input .v-text-field__details { display: none !important; }
.edit-row .table-cell { padding: 8px 4px !important; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: #fff; border-radius: 16px; width: 90%; max-width: 700px; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(163,2,212,0.2); display: flex; flex-direction: column; }
.modal-content--employee-detail { max-width: 720px; }
.modal-content::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #a302d4, #7c3aed); border-radius: 16px 16px 0 0; }
.employee-detail-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.employee-detail-page-title { margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; }
.close-btn { background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
.modal-body { padding: 24px; overflow: hidden; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.activity-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: #64748b; }
.activity-loading p { margin-top: 12px; }
.employee-header-detail { display: flex; align-items: center; gap: 24px; margin-bottom: 28px; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; border: 1px solid #e2e8f0; }
.employee-avatar-large { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #a302d4, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 32px; flex-shrink: 0; }
.employee-info-detail { flex: 1; min-width: 0; }
.employee-name-detail { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1f2937; }
.employee-email-detail { color: #6b7280; font-size: 16px; margin: 0 0 16px 0; }
.employee-stats-detail { display: flex; gap: 32px; }
.employee-stats-detail .stat-item { display: flex; flex-direction: column; align-items: flex-start; }
.employee-stats-detail .stat-value { font-size: 24px; font-weight: 700; color: #a302d4; margin-bottom: 4px; }
.employee-stats-detail .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
.employee-details-content { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.details-section { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
.details-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.details-section .section-title { margin: 0 0 14px 0; font-size: 16px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.activity-empty { font-size: 13px; color: #94a3b8; padding: 12px 0; }
.detail-cards { display: flex; flex-direction: column; gap: 12px; }
.detail-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; }
.detail-card--purchase { border-left: 4px solid #22c55e; }
.detail-card--return { border-left: 4px solid #f97316; }
.detail-card--expense { border-left: 4px solid #a855f7; }
.detail-card-header { padding: 10px 14px; font-weight: 600; font-size: 13px; color: #1e293b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.detail-card-body { padding: 12px 14px; }
.detail-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 4px 0; font-size: 13px; }
.detail-label { color: #64748b; flex-shrink: 0; min-width: 120px; }
.detail-value { color: #1e293b; text-align: right; word-break: break-word; }
.detail-value--sum { font-weight: 600; color: #0f766e; }

/* Таблица активностей — ползунок только у таблицы */
.activity-table-wrap { margin-top: 0; position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.activity-table { display: flex; flex-direction: column; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; flex: 1; min-height: 0; }
.activity-table-header { display: flex; background: #e9ecef; color: #495057; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; min-height: 44px; flex-shrink: 0; }
.activity-table-header .activity-table-cell { padding: 10px 8px; flex: 1; display: flex; align-items: center; border-right: 1px solid #dee2e6; }
.activity-table-header .activity-table-cell:last-child { border-right: none; justify-content: center; }
.activity-table-body { flex: 1; min-height: 180px; overflow-y: auto; overflow-x: hidden; background: #fff; }
.activity-table-body::-webkit-scrollbar { width: 8px; }
.activity-table-body::-webkit-scrollbar-track { background: #e5e7eb; border-radius: 4px; }
.activity-table-body::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
.activity-table-body::-webkit-scrollbar-thumb:hover { background: #6b7280; }
.activity-table-row { display: flex; border-bottom: 1px solid #eee; min-height: 44px; align-items: center; transition: background 0.2s; }
.activity-table-row:hover { background: #f8fafc; }
.activity-table-row.return { background: #fff9c4; }
.activity-table-row.returned { background: #fff9c4; }
.activity-table-row.expense-row { background: #f3e8ff; }
.activity-table-cell { flex: 1; padding: 8px; font-size: 13px; display: flex; align-items: center; min-width: 0; border-right: 1px solid #f1f5f9; }
.activity-table-cell:last-child { border-right: none; justify-content: center; }
.activity-table .datetime-full { flex-direction: column; gap: 1px; }
.activity-table .date-part { font-weight: 600; font-size: 12px; color: #1e293b; }
.activity-table .time-part { font-size: 12px; color: #64748b; }
.quantity-text { font-weight: 500; }
.activity-description .product-name { font-weight: 500; color: #334155; word-break: break-word; }
.operation-description { font-size: 12px; }
.operation-type { font-weight: 500; }
.operation-type.purchase { color: #059669; }
.operation-type.return { color: #dc2626; }
.operation-type.expense { color: #7c3aed; margin-left: 48px; }
.operation-type.other { color: #6366f1; }
.return-notes { font-size: 11px; color: #64748b; margin-top: 2px; }
.activity-amount.positive { color: #059669; font-weight: 600; }
.activity-amount.negative { color: #dc2626; font-weight: 600; }
.status-chip-large { min-width: 70px; font-weight: 600; font-size: 11px; }
.no-data { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: #94a3b8; }
.no-data p { margin-top: 12px; font-size: 14px; }

.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.modal-footer .confirm-btn { padding: 8px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #a302d4, #7c3aed); color: #fff; font-weight: 500; cursor: pointer; }
@media (max-width: 1200px) { .team-table-block { width: 95%; margin-left: 2.5%; margin-right: 2.5%; } .search-input { margin-left: 20px !important; } }
@media (max-width: 768px) { .page-title { font-size: 28px; } }
</style>
