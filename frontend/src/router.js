import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Customer from './views/Customer.vue'
import CustomersNex from './views/CustomersNex.vue'
import Product from './views/Product.vue'
import ProductsNex from './views/ProductsNex.vue'
import Settings from './views/Settings.vue'
import SettingsNex from './views/SettingsNex.vue'
import Tasks from './views/Tasks.vue'
import Analytics from './analytics/Analytics.vue'
import AnalyticsNex from './views/AnalyticsNex.vue'
import RevenueAnalytics from './analytics/RevenueAnalytics.vue'
import OrdersAnalytics from './analytics/OrdersAnalytics.vue'
import ProductsAnalytics from './analytics/ProductsAnalytics.vue'
import UsersAnalytics from './analytics/UsersAnalytics.vue'
import UsersChartDetail from './analytics/UsersChartDetail.vue'
import ExpensesAnalytics from './analytics/ExpensesAnalytics.vue'
import ActivityChart from './components/ActivityChart.vue'
import RevenueChart from './components/RevenueChart.vue'
import UsersChart from './components/UsersChart.vue'
import BuyPage from './views/BuyPage.vue'
import ReturnPage from './views/ReturnPage.vue'
import Team from './views/Team.vue'
import EmployeesNex from './views/EmployeesNex.vue'
import Orders from './views/Orders.vue'
import ReturnsAnalytics from './analytics/ReturnsAnalytics.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import VerifyEmail from './views/VerifyEmail.vue'
import Landing from './views/Landing.vue'
import { getAuthToken } from './services/api'

Vue.use(Router)

const router = new Router({
    mode: 'history',
    routes: [
        { path: '/login', component: Login, meta: { guest: true } },
        { path: '/register', component: Register, meta: { guest: true } },
        { path: '/verify-email', component: VerifyEmail, meta: { guest: true } },
        { path: '/landing', component: Landing, meta: { guest: true } },
        { path: '/', component: Landing, meta: { guest: true } },
        { path: '/home', component: Home, meta: { requiresAuth: true } },
        { path: '/customer', component: CustomersNex, meta: { requiresAuth: true } },
        { path: '/customers', component: CustomersNex, meta: { requiresAuth: true } },
        { path: '/product', component: ProductsNex, meta: { requiresAuth: true } },
        { path: '/products', component: ProductsNex, meta: { requiresAuth: true } },
        { path: '/orders', component: Orders, meta: { requiresAuth: true } },
        { path: '/settings', component: SettingsNex, meta: { requiresAuth: true } },
        { path: '/tasks', component: Tasks, meta: { requiresAuth: true } },
        { path: '/analytics', component: AnalyticsNex, meta: { requiresAuth: true } },
        { path: '/analytics/revenue', component: RevenueAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/orders', component: OrdersAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/users', component: UsersAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/customers', component: UsersAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/users/detail', component: UsersChartDetail, meta: { requiresAuth: true } },
        { path: '/analytics/buy', component: ProductsAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/products', component: ProductsAnalytics, meta: { requiresAuth: true } },
        { path: '/analytics/returns', component: ReturnsAnalytics, meta: { requiresAuth: true } },
        { path: '/activityChart', component: ActivityChart, meta: { requiresAuth: true } },
        { path: '/revenueChart', component: RevenueChart, meta: { requiresAuth: true } },
        { path: '/usersChart', component: UsersChart, meta: { requiresAuth: true } },
        { path: '/analytics/expenses', component: ExpensesAnalytics, meta: { requiresAuth: true } },
        { path: '/buy', component: BuyPage, meta: { requiresAuth: true } },
        { path: '/return', component: ReturnPage, meta: { requiresAuth: true } },
        { path: '/team', component: EmployeesNex, meta: { requiresAuth: true } }
    ]
})

router.beforeEach((to, from, next) => {
  const token = getAuthToken()
  if (to.meta.requiresAuth) {
    if (!token) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    // Проверка срока действия токена — не отправлять истёкший токен на API
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    } catch (e) {
      // невалидный токен — очищаем и редирект на логин
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    next()
  } else if (to.meta.guest && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 >= Date.now()) {
        next({ path: '/home' })
        return
      }
    } catch (e) {}
    next()
  } else {
    next()
  }
})

export default router