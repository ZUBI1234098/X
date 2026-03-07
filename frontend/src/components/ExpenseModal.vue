<template>
  <div>
    <!-- Диалог добавления расхода -->
    <div v-if="showDialog" class="modal-overlay" @click="closeDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ $t('pages.expenses.addExpense') }}</h3>
            <p class="subtitle">{{ $t('pages.expenses.expenseDetails') }}</p>
          </div>
          <button @click="closeDialog" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('pages.expenses.description') }}</label>
            <input 
              v-model="expenseForm.description" 
              type="text" 
              :placeholder="$t('pages.expenses.placeholders.enterDescription')"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>{{ $t('pages.expenses.category') }}</label>
            <select v-model="expenseForm.category" class="form-select">
              <option value="">{{ $t('pages.expenses.placeholders.selectCategory') }}</option>
              <option value="Business">{{ $t('pages.expenses.categories.business') }}</option>
              <option value="Personal">{{ $t('pages.expenses.categories.personal') }}</option>
              <option value="Office Supplies">{{ $t('pages.expenses.categories.officeSupplies') }}</option>
              <option value="Travel">{{ $t('pages.expenses.categories.travel') }}</option>
              <option value="Marketing">{{ $t('pages.expenses.categories.marketing') }}</option>
              <option value="Utilities">{{ $t('pages.expenses.categories.utilities') }}</option>
              <option value="Other">{{ $t('pages.expenses.categories.other') }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>{{ $t('pages.expenses.amount') }}</label>
            <input 
              v-model.number="expenseForm.amount" 
              type="number" 
              step="0.01"
              :placeholder="$t('pages.expenses.amount')"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>{{ $t('pages.expenses.date') }}</label>
            <input 
              v-model="expenseForm.date" 
              type="date"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDialog" class="cancel-btn">
            {{ $t('common.cancel') }}
          </button>
          <button @click="saveExpense" class="confirm-btn" :disabled="saving">
            {{ saving ? $t('common.loading') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'ExpenseModal',
  data() {
    return {
      showDialog: false,
      saving: false,
      expenseForm: {
        description: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      }
    }
  },
  mounted() {
    // Слушаем событие открытия диалога
    EventBus.$on(EVENTS.OPEN_ADD_EXPENSE_DIALOG, this.openDialog)
  },
  beforeDestroy() {
    // Отписываемся от события
    EventBus.$off(EVENTS.OPEN_ADD_EXPENSE_DIALOG, this.openDialog)
  },
  methods: {
    openDialog() {
      this.showDialog = true
      // Блокируем прокрутку фона
      document.body.classList.add('modal-open')
    },
    
    closeDialog() {
      this.showDialog = false
      // Разблокируем прокрутку фона
      document.body.classList.remove('modal-open')
      this.resetForm()
    },
    
    resetForm() {
      this.expenseForm = {
        description: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      }
    },
    
    async saveExpense() {
      if (!this.expenseForm.description || !this.expenseForm.amount) {
        alert(this.$t('pages.expenses.placeholders.fillRequiredFields'))
        return
      }
      
      this.saving = true
      
      try {
        const expense = {
          description: this.expenseForm.description,
          category: this.expenseForm.category,
          amount: parseFloat(this.expenseForm.amount),
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
        
        const api = (await import('@/services/api')).default
        const response = await api.post('/expenses', expense)
        if (response.data) {
          // Уведомляем о успешном добавлении (без popup)
          EventBus.$emit('expense-added', expense)
          this.closeDialog()
        } else {
          throw new Error('Failed to save expense')
        }
      } catch (error) {
        console.error('Error saving expense:', error)
        alert(this.$t('pages.expenses.error'))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.header-content h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  background: #3b82f6;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #2563eb;
}

.confirm-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Блокировка прокрутки фона */
body.modal-open {
  overflow: hidden !important;
}
</style>
