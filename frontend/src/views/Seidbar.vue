<template>
  <div class="seidbar">
    <router-link class="Crm" id="crm" to="/home">SAS</router-link>
    <router-link to="/home"><v-icon class="icon" large>mdi-home</v-icon></router-link>
    <router-link to="/customer"><v-icon class="icon" large>mdi-account</v-icon></router-link>
    <router-link to="/product"><v-icon class="icon" large>mdi-package-variant</v-icon></router-link>
    <router-link to="/analytics"><v-icon class="icon" large>mdi-chart-line</v-icon></router-link>
    <router-link to="/tasks"><v-icon class="icon" large>mdi-note-text</v-icon></router-link>
    <router-link v-if="isOwner" to="/team" title="Сотрудники"><v-icon class="icon" large>mdi-account-group</v-icon></router-link>

    <div class="bottom-buttons">
      <button class="action-btn buy-btn" :class="{ 'active': isActive('/buy') }" @click="handleBuy">{{ $t('navigation.buy') }}</button>
      <button class="action-btn return-btn" :class="{ 'active': isActive('/return') }" @click="handleReturn">{{ $t('navigation.return') }}</button>
      <button class="action-btn expenses-btn" @click="handleExpenses">{{ $t('navigation.expenses') }}</button>
    </div>
  </div>
</template>

<script>
import { getAuthUser } from '@/services/api'
import { EventBus, EVENTS } from '@/utils/EventBus.js'

export default {
  name: 'Seidbar',
  data() {
    return {}
  },
  computed: {
    isOwner() {
      const u = getAuthUser()
      return u && u.isOwner === true
    },
    canManageTeam() {
      const u = getAuthUser()
      return u && u.isOwner && u.accountType === 'business'
    }
  },
  methods: {
    isActive(path) {
      const currentPath = this.$route.path;
      return currentPath === path;
    },
    handleBuy() {
      this.$router.push('/buy');
    },
    handleReturn() {
      this.$router.push('/return');
    },
    handleExpenses() {
      // Отправляем событие для открытия диалога добавления расхода
      EventBus.$emit(EVENTS.OPEN_ADD_EXPENSE_DIALOG);
    },
    handleNavigation(route) {
      if (route) {
        this.$router.push(route);
      }
    }
  }
}
</script>

<style scoped>
.active-page {
  color: #fff;
  background: #3a3a3a;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  text-align: center;
}

.Crm {
  color: #ffffff;
  background: #272727;
  font-size: 30px;
  text-align: center;
  margin-top: 0;
  width: 100%;
  padding: 10px 0;
  text-decoration: none;
  display: block;
}

.seidbar {
  background-color: #272727;
  padding: 20px;
  width: 120px !important;
  height: 1200px !important;
  border-right: 1px solid #000000;
  position: relative;
}

.icon {
  margin-left: 23px;
  margin-bottom: 20px;
  color: #ffffff;
  font-size: 20px;
  text-align: center;
  margin-top: 30px;
}

/* Подсветка активной страницы - только белый цвет */
.router-link-active .icon {
  color: #ffffff !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.bottom-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 80px;
  margin-left: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 12px;
}

.buy-btn {
  margin-top: 30px;
  margin-right: 10px;
  background-color: #27ae60;
  font-size: 13px;
}

.buy-btn:hover {
  background-color: #229954;
}

.return-btn {
  margin-right: 10px;
  background-color: #f1c40f;
  color: #2c3e50;
  font-size: 13px;
}

.return-btn:hover {
  background-color: #f39c12;
}

.expenses-btn {
  margin-right: 10px;
  background-color: #3498db;
  color: #ffffff;
  font-size: 13px;
}

.expenses-btn:hover {
  background-color: #2980b9;
}

/* Подсветка активных кнопок Buy и Return */
.buy-btn.active {
  background-color: #2ecc71 !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.8);
  transform: scale(1.05);
}

.return-btn.active {
  background-color: #f39c12 !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(243, 156, 18, 0.8);
  transform: scale(1.05);
}

</style>