<template>
  <div class="main-content">
    <div class="tasks-table-block">
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
            <span class="tasks-title" style="margin: 0;">Tasks</span>
          </div>
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
            + Add Task
          </v-btn>
        </v-card-title>

            <v-card-text>
          <div class="tasks-table-container">
            <div class="tasks-table">
              <div class="table-header">
                <div class="table-cell" style="flex: 0 0 60px;"> id</div>
                <div class="table-cell">Title</div>
                <div class="table-cell">Category</div>
                <div class="table-cell">Priority</div>
                <div class="table-cell">Status</div>
                <div class="table-cell"> Date</div>
                <div class="table-cell">Description</div>
                <div class="table-cell">Actions</div>
              </div>
              
              <!-- Сообщение если нет задач - показываем сверху -->
              <div v-if="filteredTasks.length === 0 && !showForm" class="no-data-message">
                <v-icon size="48" color="#e5e7eb">mdi-clipboard-text-outline</v-icon>
                <p>No tasks found</p>
              </div>
              
              <div class="table-body" ref="tableBody">
                <!-- Форма добавления/редактирования -->
                <div v-if="showForm" class="table-row edit-row">
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                    <span style="color: #666; font-size: 12px;">New</span>
                  </div>
                  <div class="table-cell">
                      <v-text-field
                        v-model="newTask.title"
                      placeholder="Task Title" 
                      dense
                        outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                      <v-select
                        v-model="newTask.category"
                        :items="categories"
                      placeholder="Category" 
                      dense
                        outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                      <v-select
                        v-model="newTask.priority"
                        :items="priorities"
                      placeholder="Priority" 
                      dense
                        outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-checkbox 
                      v-model="newTask.completed"
                        dense
                      hide-details
                      class="inline-checkbox"
                    />
                  </div>
                  <div class="table-cell">
                      <v-text-field
                        v-model="newTask.dueDate"
                        type="date"
                      dense
                        outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell">
                    <v-text-field 
                      v-model="newTask.description" 
                      placeholder="Description" 
                        dense
                        outlined
                      hide-details
                      class="inline-input"
                    />
                  </div>
                  <div class="table-cell actions-cell">
                    <v-btn icon @click="saveTask" :loading="saving" small color="green">
                      <v-icon size="20">mdi-check</v-icon>
                      </v-btn>
                    <v-btn icon @click="cancelEdit" small color="red">
                      <v-icon size="20">mdi-close</v-icon>
                      </v-btn>
          </div>
        </div>

                <!-- Строки данных -->
                <div 
                  v-for="(task, index) in filteredTasks" 
                  :key="task.id || index"
                  class="table-row"
                >
                  <div class="table-cell" style="flex: 0 0 60px; justify-content: center;">
                    <span style="color: #666; font-weight: 500;">{{ index + 1 }}</span>
                  </div>
                  <div class="table-cell">
                    <div class="task-title" :class="{ 'completed-text': task.completed }">{{ task.title }}</div>
                  </div>
                  <div class="table-cell">
              <v-chip
                      v-if="task.category"
                      :color="getCategoryColor(task.category)"
                text-color="white"
                small
                      class="category-chip"
              >
                      {{ task.category }}
              </v-chip>
              <span v-else class="text-grey">-</span>
                  </div>
                  <div class="table-cell">
                    <v-chip 
                      :color="getPriorityColor(task.priority)"
                      text-color="white" 
                      small
                      class="priority-chip"
                    >
                      {{ task.priority }}
                    </v-chip>
                  </div>
                  <div class="table-cell">
                    <v-chip 
                      :color="task.completed ? '#4caf50' : '#ffc107'"
                      text-color="white" 
                      small
                      class="status-chip"
                    >
                      {{ task.completed ? 'Completed' : 'Pending' }}
                    </v-chip>
                  </div>
                  <div class="table-cell">
                    <span v-if="task.dueDate" class="date-text">
                      {{ formatDate(task.dueDate) }}
              </span>
              <span v-else class="text-grey">-</span>
                  </div>
                  <div class="table-cell">
                    <span class="description-text">{{ task.description || '-' }}</span>
                  </div>
                  <div class="table-cell actions-cell">
                    <v-btn icon @click="toggleTask(task)" small>
                      <v-icon :color="task.completed ? 'green' : 'amber'" size="20">
                        {{ task.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </v-btn>
                    <v-btn v-if="isOwner" icon @click="editTaskInline(index)" small>
                      <v-icon size="20">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn v-if="isOwner" icon @click="deleteTask(index)" :loading="deleting[index]" small>
                      <v-icon color="red" size="20">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { EventBus, EVENTS } from '@/utils/EventBus.js'
import { getAuthUser } from '@/services/api'

const TASKS_KEY = 'tasks-list';

export default {
  name: 'TasksPage',
  data() {
    return {
      search: '',
      showForm: false,
      editIndex: null,
      saving: false,
      deleting: {},
      newTask: {
        title: '',
        description: '',
        category: null,
        priority: 'Medium',
        dueDate: null,
        completed: false
      },
      tasks: [],
      canScrollUp: false,
      canScrollDown: false,
      categories: ['Work', 'Personal', 'Study', 'Home', 'Health'],
      priorities: ['Low', 'Medium', 'High', 'Critical']
    }
  },
  computed: {
    isOwner() {
      const u = getAuthUser()
      return u && u.isOwner === true
    },
    totalTasks() {
      return this.tasks.length
    },
    completedTasks() {
      return this.tasks.filter(task => task.completed).length
    },
    pendingTasks() {
      return this.tasks.filter(task => !task.completed).length
    },
    overdueTasks() {
      return this.tasks.filter(task => this.isOverdue(task.dueDate) && !task.completed).length
    },
    highPriorityTasks() {
      return this.tasks.filter(task => task.priority === 'High' || task.priority === 'Critical').length
    },
    filteredTasks() {
      if (!this.search) return this.tasks
      
      const searchLower = this.search.toLowerCase()
      
      return this.tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchLower)
        const descriptionMatch = task.description && task.description.toLowerCase().includes(searchLower)
        const categoryMatch = task.category && task.category.toLowerCase().includes(searchLower)
        const priorityMatch = task.priority && task.priority.toLowerCase().includes(searchLower)
        const statusMatch = (task.completed ? 'completed' : 'pending').includes(searchLower)
        const formattedDate = this.formatDate(task.dueDate).toLowerCase()
        const dateMatch = formattedDate.includes(searchLower)
        
        return titleMatch || descriptionMatch || categoryMatch || priorityMatch || statusMatch || dateMatch
      })
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
          tableBody.addEventListener('wheel', this.handleTableWheel, { passive: false })
          tableBody.addEventListener('scroll', this.updateScrollIndicators)
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
      
      const canScrollUp = container.scrollTop > 0
      const canScrollDown = container.scrollTop < (container.scrollHeight - container.clientHeight)
      
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

    saveTasks() {
      localStorage.setItem(TASKS_KEY, JSON.stringify(this.tasks));
    },
    
    loadTasks() {
      const saved = localStorage.getItem(TASKS_KEY);
      if (saved) {
        this.tasks = JSON.parse(saved);
      } else {
        this.tasks = [
          {
            id: 1,
            title: 'Complete project',
            description: 'Finalize all project components',
            category: 'Work',
            priority: 'High',
            dueDate: '2024-12-31',
            completed: false
          },
          {
            id: 2,
            title: 'Buy groceries',
            description: 'Milk, bread, eggs',
            category: 'Personal',
            priority: 'Medium',
            dueDate: '2024-12-25',
            completed: true
          }
        ];
      }
    },
    
    startAdd() {
      this.newTask = {
        title: '',
        description: '',
        category: null,
        priority: 'Medium',
        dueDate: null,
        completed: false
      }
      this.editIndex = null
      this.showForm = true
    },
    
    async saveTask() {
      if (this.newTask.title) {
        this.saving = true
        try {
          const taskData = {
            title: this.newTask.title || '',
            description: this.newTask.description || '',
            category: this.newTask.category || null,
            priority: this.newTask.priority || 'Medium',
            dueDate: this.newTask.dueDate || null,
            completed: this.newTask.completed || false
          }

          let response
          if (this.editIndex === null) {
            const newTask = { ...taskData, id: Date.now() }
            this.tasks.unshift(newTask)
            EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'taskAdd' })
            
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
            this.tasks[this.editIndex] = { ...taskData, id: this.tasks[this.editIndex].id }
            EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'taskEdit' })
          }
          
          this.resetForm()
          this.saveTasks()
          this.emitTasksChanged()
        } catch (error) {
          console.error('Error saving task:', error)
        } finally {
          this.saving = false
        }
      }
    },
    
    editTaskInline(index) {
      this.editIndex = index
      this.newTask = { ...this.tasks[index] }
      this.showForm = true
    },
    
    async deleteTask(index) {
      this.$set(this.deleting, index, true)
      try {
        const taskId = this.tasks[index].id
        const taskTitle = this.tasks[index].title
        
        this.tasks.splice(index, 1)
        this.saveTasks()
        this.emitTasksChanged()
        EventBus.$emit(EVENTS.SUCCESS_ANIMATION, { type: 'taskDelete' })
      } catch (error) {
        console.error('Error deleting task:', error)
      } finally {
        this.$set(this.deleting, index, false)
      }
    },

    toggleTask(task) {
      task.completed = !task.completed
      this.saveTasks()
      this.emitTasksChanged()
    },
    
    cancelEdit() {
      this.resetForm()
    },
    
    resetForm() {
      this.newTask = {
        title: '',
        description: '',
        category: null,
        priority: 'Medium',
        dueDate: null,
        completed: false
      }
      this.editIndex = null
      this.showForm = false
    },

    getCategoryColor(category) {
      const colors = {
        'Work': 'green',
        'Personal': 'green',
        'Study': 'green',
        'Home': 'green',
        'Health': 'green'
      };
      return colors[category] || 'green';
    },

    getPriorityColor(priority) {
      const colors = {
        'Low': '#4CAF50',
        'Medium': '#FF9800',
        'High': '#F44336',
        'Critical': '#D32F2F'
      };
      return colors[priority] || '#757575';
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      }
      return new Date(dateString).toLocaleDateString('en-US', options)
    },

    isOverdue(dateString) {
      if (!dateString) return false
      const dueDate = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate < today
    },

    emitTasksChanged() {
      EventBus.$emit('TASKS_CHANGED', {
        totalTasks: this.totalTasks,
        tasksData: this.getTasksDataForChart()
      });
    },

    getTasksDataForChart() {
      const weeklyData = Array(7).fill(0)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      this.tasks.forEach(task => {
        let taskDate
        if (task.dueDate) {
          taskDate = new Date(task.dueDate)
        } else {
          taskDate = new Date(task.id)
        }
        
        const daysDiff = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0 && daysDiff < 7) {
          weeklyData[6 - daysDiff]++
        }
      })
      
      return weeklyData
    }
  },
  mounted() {
    this.loadTasks()
    this.initializeTableScroll()
    this.emitTasksChanged()
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

.tasks-table-block {
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

.tasks-table-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}

.tasks-table-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}

.tasks-title {
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

/* Tasks Table Styles */
.tasks-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 600px;
  overflow: hidden;
}

.tasks-table {
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
  transform: translateX(2px);
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

.task-title {
  font-weight: 600;
  color: #1e293b;
}

.completed-text {
  text-decoration: line-through;
  color: #6b7280;
}

.description-text {
  color: #64748b;
  font-size: 13px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overdue-text {
  color: #dc2626;
  font-weight: 600;
}

.date-text {
  color: #000000;
  font-weight: 500;
}

.actions-cell {
  justify-content: center;
  gap: 4px;
}

.category-chip {
  font-weight: 500 !important;
  font-size: 12px !important;
}

.priority-chip,
.status-chip {
  font-weight: 500 !important;
  font-size: 12px !important;
}

.status-chip.v-chip--color-amber {
  background-color: #ffc107 !important;
  color: white !important;
}

.status-chip.v-chip--color-green {
  background-color: #4caf50 !important;
  color: white !important;
}

/* Стили для иконок статуса */
.v-icon[color="amber"] {
  color: #ffc107 !important;
}

.v-icon[color="green"] {
  color: #4caf50 !important;
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

.inline-checkbox {
  margin: 0 !important;
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

/* Responsive Design */
@media (max-width: 1200px) {
  .tasks-table-block {
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
  
  .description-text {
    max-width: 150px;
  }
}

@media (max-width: 768px) {
  .tasks-title {
    font-size: 28px;
  }
  
  .tasks-table {
    font-size: 12px;
  }
  
  .table-cell {
    padding: 10px 6px;
  }
  
  .description-text {
    max-width: 100px;
  }
}
</style>