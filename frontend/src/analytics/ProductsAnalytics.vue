<template>
  <div class="main-content">
    <div class="customer-table-block">
      <v-card flat>
        <v-card-text>
          <!-- Обычный режим (всегда отображается) -->
          <div :class="['analytics-layout', { 'chart-expanded': isChartExpanded }]">
            <div 
              v-if="!isCustomersExpanded" 
              :class="['chart-section', { 'expanded': isChartExpanded }]"
            >   
              
              
              <div class="chart-header">
                <div class="chart-title-section" style="position: relative; display: flex; justify-content: center; align-items: center; padding-left: 50px;">
                  <v-btn 
                    v-if="selectedProductForChart || dataType === 'registrations'"
                    icon
                    @click="selectedProductForChart ? clearProductSelection() : goBackToAnalytics()"
                    class="back-btn hover-lift"
                    style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
                  >
                    <v-icon>mdi-arrow-left</v-icon>
                  </v-btn>
                  <div style="text-align: center;">
                    <h1 class="chart-title">{{ getCurrentChartTitle() }}</h1>
                    <h4 class="chart-subtitle">{{ chartPeriodText }}</h4>
                  </div>
                </div>
              </div>
              
              <div class="chart-filters-with-stats">
                <div class="stats-container">
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ totalCustomers }}</div>
                    <div class="stat-label-filter">{{ selectedProductForChart ? $t('analytics.stats.totalSales') : $t('analytics.stats.totalProducts') }}</div>
                  </div>
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ newUsersThisPeriod }}</div>
                    <div class="stat-label-filter">{{ $t('analytics.stats.newInPeriod') }}</div>
                  </div>
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ averageNewUsers }}</div>
                    <div class="stat-label-filter">{{ $t('analytics.stats.averagePerDay') }}</div>
                  </div>
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ growthRate }}%</div>
                    <div class="stat-label-filter">{{ $t('analytics.stats.growth') }}</div>
                  </div>
                </div>
                
                <div class="filters-row">
                  <div class="time-filters">
                    <button 
                      v-for="filter in ['hour', 'day', 'week', 'month', 'year']"
                      :key="filter"
                      @click="timeFilter = filter"
                      :class="['filter-btn', { active: timeFilter === filter }]"
                    >
                      {{ $t(`analytics.timeFilters.${filter}`) }}
                    </button>
                  </div>
                  
                  <!-- Простой поиск продуктов -->
                  <div class="search-section">

                    
                    <!-- Поиск продукта для графика -->
                    <v-autocomplete
                      v-model="selectedProductForChart"
                      :items="autocompleteProducts"
                      :search-input.sync="productChartSearch"
                      item-text="name"
                      item-value="name"
                      :label="$t('analytics.charts.searchProducts')"
                      hide-details
                      outlined
                      rounded
                      class="customers-search-input"
                      style="position: absolute; right: 10px; width: 160px; z-index: 10;""
                      @change="onProductSelect"
                    >
                      <template v-slot:item="{ item }">
                        <v-list-item-content>
                          <v-list-item-title>{{ item.name }}</v-list-item-title>
                        </v-list-item-content>
                      </template>
                    </v-autocomplete>
                    
                    <!-- Кнопки фильтрации для выбранного продукта -->
                     <div v-if="selectedProductForChart" class="main-filter-buttons">
                       <button 
                         @click="setTransactionFilter('completed')" 
                         :class="['main-filter-btn', { 'active': transactionFilter === 'completed' }]"
                       >
                         {{ $t('analytics.dataTypes.completed') }}
                       </button>
                       <button 
                         @click="setTransactionFilter('returned')" 
                         :class="['main-filter-btn', { 'active': transactionFilter === 'returned' }]"
                       >
                         Returned
                       </button>
                     </div>
                    
                    <!-- Кнопка сброса выбора продукта -->
                    <v-btn
                      v-if="selectedProductForChart"
                      icon
                      small
                      color="grey"
                      @click="clearProductSelection"
                      title="Back to general chart"
                    >
                      
                    </v-btn>
                  </div>
                  
                </div>
              </div>
              
              <div class="chart-container">
                <div class="main-chart">
                <svg width="100%" height="400" viewBox="0 0 800 400" class="chart-svg">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#a302d4;stop-opacity:1" />
                      <stop offset="50%" style="stop-color:#7c3aed;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#5b21b6;stop-opacity:1" />
                    </linearGradient>
                    
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#a302d4;stop-opacity:0.3" />
                      <stop offset="100%" style="stop-color:#a302d4;stop-opacity:0.05" />
                    </linearGradient>
                    
                    <filter id="pointShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#a302d4" flood-opacity="0.3"/>
                    </filter>
                    
                    <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/> 
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <g class="grid">
                    <line v-for="line in gridLines" :key="line.id" 
                          :x1="line.x1" :y1="line.y1" 
                          :x2="line.x2" :y2="line.y2" 
                          stroke="#f1f5f9" 
                          stroke-width="1"
                          stroke-dasharray="2,2"/>
                  </g>
                  
                  <path v-if="userPath && userPoints.length > 0" 
                        :d="userPath + ` L ${userPoints[userPoints.length-1].x} 340 L ${userPoints[0].x} 340 Z`" 
                        fill="url(#areaGradient)" 
                        class="chart-area"/>
                  
                  <path :d="userPath" 
                        fill="none" 
                        stroke="url(#lineGradient)" 
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="chart-line"/>
                  
                  <g class="chart-points">
                    <circle v-for="(point, index) in userPoints" :key="index"
                            :cx="point.x" :cy="point.y" r="6"
                            fill="#ffffff" 
                            stroke="#a302d4" 
                            stroke-width="3"
                            filter="url(#pointShadow)"
                            @mouseover="showTooltip($event, point, index)"
                            @mouseleave="hideTooltip"
                            @click="openPointDetails(point, index)"
                            class="chart-point chart-point-stable chart-point-clickable"
                            :class="{ 'point-active': tooltip.show && tooltip.activeIndex === index }"/>
                  </g>
                  
                  <line v-if="tooltip.show && tooltip.hoverX" 
                        :x1="tooltip.hoverX" :y1="60" 
                        :x2="tooltip.hoverX" :y2="340" 
                        stroke="#a302d4" 
                        stroke-width="1" 
                        stroke-dasharray="4,4" 
                        opacity="0.6"
                        class="hover-line"/>
                </svg>
                
                <div class="axis-labels">
                  <div class="y-axis-labels">
                    <span class="y-label" style="top: 60px;">{{ maxChartValue }}</span>
                    <span class="y-label" style="top: 150px;">{{ Math.round(maxChartValue * 0.75) }}</span>
                    <span class="y-label" style="top: 200px;">{{ Math.round(maxChartValue * 0.5) }}</span>
                    <span class="y-label" style="top: 250px;">{{ Math.round(maxChartValue * 0.25) }}</span>
                    <span class="y-label" style="top: 340px;">0</span>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <div 
              v-if="!isChartExpanded" 
              :class="['customers-section', { 'hidden': isChartExpanded, 'expanded': isCustomersExpanded }]"
              :data-product-detail="selectedProductForDetail ? 'true' : null"
            >
              <div class="section-header" @click.stop="openCustomersSection" style="position: relative; display: flex; justify-content: center; align-items: center; padding: 16px 50px 16px 50px; overflow: visible;">
                <v-btn 
                  v-if="selectedCustomerForDetail || isCustomersExpanded"
                  icon
                  @click.stop="exitCustomerDetailView"
                  class="back-btn hover-lift mr-2"
                  style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div style="display: flex; align-items: center; justify-content: space-between; flex: 1;">
                  <h1 class="chart-title" @click="openCustomersSection" style="margin: 0;">
                    <v-icon v-if="selectedProductForDetail" style="margin-right: 8px;">mdi-package-variant</v-icon>
                    {{ selectedProductForDetail ? selectedProductForDetail.name : $t('analytics.productsList') }}
                  </h1>
                  <div v-if="selectedProductForDetail" style="display: flex; gap: 12px; align-items: center;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                      <span style="font-size: 14px; font-weight: bold;">{{ selectedProductForDetail.totalPurchases }}</span>
                      <span style="font-size: 12px; color: #666;">{{ $t('common.sold') }}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                      <span style="font-size: 14px; font-weight: bold;">{{ selectedProductForDetail.totalReturns || 0 }}</span>
                      <span style="font-size: 12px; color: #666;">{{ $t('analytics.dataTypes.returned') }}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                      <span style="font-size: 14px; font-weight: bold;">{{ selectedProductForDetail.stock || 0 }}</span>
                      <span style="font-size: 12px; color: #666;">{{ $t('common.stock') }}</span>
                    </div>
                  </div>
                </div>
                <v-text-field
                  v-if="isCustomersExpanded && !selectedCustomerForDetail && !selectedProductForDetail"
                  v-model="productSearch"
                  :placeholder="$t('analytics.searchProducts')"
                  hide-details
                  outlined
                  rounded
                  class="customers-search-input"
                  @click.stop
                  style="position: absolute; right: 10px; width: 160px; z-index: 10;"
                ></v-text-field>
              </div>
              
              <div class="customers-list" @click.stop @wheel="handleCustomerScroll" ref="customersList">
                <div 
                    v-for="product in selectedProductForDetail ? [selectedProductForDetail] : sortedProducts" 
                    :key="product.name" 
                    class="customer-item"
                    @click.stop="selectedProductForDetail ? null : openProductDetailView(product)"
                  >

                  <!-- Список продуктов -->
                  <div v-if="!selectedProductForDetail" class="customer-info" style="display: flex; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                      <div style="background-color: #f5f5f5; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                        <v-icon size="20" color="#666666">mdi-package-variant</v-icon>
                      </div>
                      <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #000000;">{{ product.name }}</h3>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center; margin-left: auto; margin-right: 20px;">
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">{{ product.totalPurchases || 0 }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('common.sold') }}</span>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">{{ product.totalReturns || 0 }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('analytics.dataTypes.returned') }}</span>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">{{ product.stock || 0 }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('common.stock') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Детали продукта - только таблица -->
                  <div v-if="selectedProductForDetail" class="product-detail-simple">
                    <div class="activity-table">
                      <div class="table-header">
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.dateAndTime') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.pieces') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.customer') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.description') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.amount') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.status') }}</div>
                      </div>
                      <div class="table-body" @wheel="handleTableScroll($event, 'activities')">
                        <div 
                          v-for="activity in selectedProductForDetail.allActivities" 
                          :key="activity.id"
                          class="table-row"
                          :class="{ 
                            'return': activity.type === 'return',
                            'returned': activity.status === 'returned',
                            'registration': activity.type === 'registration',
                            'clickable-purchase': activity.type === 'purchase' && activity.isGrouped && activity.status !== 'completed' && activity.status !== 'returned'
                          }"
                          @click="activity.type === 'purchase' && activity.isGrouped && activity.status !== 'completed' && activity.status !== 'returned' ? openPurchaseDetails(activity) : null"
                        >
                          <div class="table-cell">
                            <div class="datetime-full">
                              <div class="date-part">{{ formatDateOnly(activity.date) }}</div>
                              <div class="time-part">{{ formatTimeWithSeconds(activity.date) }}</div>
                            </div>
                          </div>
                          <div class="table-cell">
                            <span class="quantity-text">
                              <template v-if="activity.status === 'removed' && activity.quantity && activity.quantity > 0">-{{ activity.quantity }}</template>
                              <template v-else-if="activity.status === 'added' && activity.quantity && activity.quantity > 0">+{{ activity.quantity }}</template>
                              <template v-else>{{ activity.quantity && activity.quantity > 0 ? activity.quantity : '-' }}</template>
                            </span>
                          </div>
                          <div class="table-cell">
                            <div class="activity-description">
                              <div v-if="activity.customerName" class="product-name">{{ activity.customerName }}</div>
                              <div v-if="activity.reason" class="reason-text">{{ $t('analytics.customer.operationDescriptions.reason') }}: {{ getTranslatedReason(activity.reason) }}</div>
                            </div>
                          </div>
                          <div class="table-cell">
                            <div class="operation-description">
                              <span v-if="activity.description">{{ getTranslatedDescription(activity.description) }}</span>
                              <template v-else>
                                <span v-if="activity.type === 'purchase'" class="operation-type purchase">{{ $t('analytics.customer.operationDescriptions.productPurchase') }}</span>
                                <span v-else-if="activity.type === 'return'" class="operation-type return">
                                  {{ $t('analytics.customer.operationDescriptions.productReturn') }}: {{ getTranslatedReason(activity.reason || 'wrong_item') }}
                                </span>
                                <span v-else class="operation-type other">{{ activity.type }}</span>
                              </template>
                            </div>
                          </div>
                          <div class="table-cell">
                            <span v-if="activity.status === 'added' || activity.status === 'edit' || activity.status === 'removed'">-</span>
                            <span v-else-if="activity.amount && activity.amount !== 0" class="activity-amount" :class="{ negative: activity.amount < 0, positive: activity.amount > 0 }">
                              ${{ activity.amount.toLocaleString() }}
                            </span> 
                            <span v-else>-</span>
                          </div>
                          <div class="table-cell">
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
                    
                    <div v-if="!selectedProductForDetail.allActivities || selectedProductForDetail.allActivities.length === 0" class="no-data">
                      <v-icon size="48" color="#e5e7eb">mdi-history</v-icon>
                      <p>This product has no activity history</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <div v-if="tooltip.show" class="chart-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div class="tooltip-value">{{ tooltip.value }} {{ tooltip.tooltipText || 'users' }}</div>
    </div>
    
    <!-- Модальное окно деталей точки графика -->
    <div v-if="pointDetailsModal.show" class="modal-overlay" @click="closePointDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ getModalTitle() }}</h3>
            <p class="subtitle">{{ selectedProductForChart ? pointDetailsModal.usersList.length + ' ' + $t('analytics.modal.salesFound') : pointDetailsModal.usersList.length + ' ' + $t('analytics.modal.productsFound') }}</p>
          </div>
          <button @click="closePointDetails" class="close-btn">{{ $t('common.closeButton') }}</button>
        </div>
        
        <div class="modal-body">
          <div class="period-info-section">
            <div class="info-row">
              <span class="info-label">{{ $t('analytics.modal.period') }}</span>
              <span class="info-value">{{ pointDetailsModal.description }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ selectedProductForChart ? $t('analytics.modal.totalSales') : $t('analytics.modal.totalProducts') }}</span>
              <span class="info-value">{{ pointDetailsModal.usersList.length }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('analytics.modal.viewType') }}</span>
              <span class="info-value">{{ selectedProductForChart ? $t('analytics.modal.productChart') : $t('analytics.modal.productsOverview') }}</span>
            </div>
          </div>
          
          <div class="users-section">
            <div class="section-header">
                <h4 class="section-title">{{ selectedProductForChart ? (transactionFilter === 'returned' ? $t('analytics.dataTypes.returned') : $t('analytics.stats.totalSales')) : $t('navigation.products') }}</h4>
              </div>
            <div class="users-list" ref="usersListModal">
              <!-- Отображение для сделок по выбранному продукту -->
              <template v-if="selectedProductForChart">
                <div v-for="sale in filteredModalTransactions" :key="sale.date + sale.name" class="user-item" :class="{ 'return-item': sale.type === 'return' }" @click="openOrderDetails(sale)">
                  <div class="user-avatar" :class="{ 'return-avatar': sale.type === 'return' }">
                    <v-icon size="20" color="white">{{ sale.type === 'return' ? 'mdi-keyboard-return' : 'mdi-cart' }}</v-icon>
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ sale.name }}</div>
                    <div class="user-details">
                      <div class="detail-item">
                        <span class="icon"></span>
                        {{ $t('pages.orders.product') }}: {{ sale.productName }}
                      </div>
                      <div class="detail-item">
                        <span class="icon"></span>
                        {{ $t('pages.orders.date') }}: {{ formatDateOnly(sale.date) }}
                      </div>
                      <div class="detail-item" v-if="sale.type === 'purchase'">
                        <span class="icon"></span>
                        {{ $t('pages.orders.payment') }}: {{ sale.paymentMethod || $t('common.notAvailable') }}
                      </div>
                      <div class="detail-item" v-if="sale.type === 'return' && sale.reason">
                        <span class="icon"></span>
                        {{ $t('pages.return.returnReason') }}: {{ sale.reason }}
                      </div>
                    </div>
                  </div>
                  <div class="user-stats">
                    <div class="stat">
                      <span class="stat-value" :class="{ 'negative-value': sale.type === 'return' }">${{ sale.type === 'return' ? -(Math.abs(sale.total || 0)) : (sale.total || 0) }}</span>
                      <span class="stat-label">{{ sale.type === 'return' ? ($t('pages.return.title') || 'Refund') : $t('pages.orders.total') }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ sale.quantity || 1 }}</span>
                      <span class="stat-label">{{ $t('pages.orders.quantity') }}</span>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- Отображение для списка продуктов -->
              <template v-else>
                <div v-for="product in pointDetailsModal.usersList" :key="product.name" class="user-item" @click="showProductDetails(product)">
                  <div class="user-avatar">
                    <v-icon size="20" color="white">mdi-package-variant</v-icon>
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ product.name }}</div>
                    <div class="user-details">
                      <div class="detail-item">
                        <span class="icon"></span>
                        {{ dataType === 'registrations' && product.date ? formatDateOnly(product.date) : formatDateOnly(product.firstPurchaseDate) }}
                      </div>

                    </div>
                  </div>
                  <div class="user-stats">
                    <div v-if="dataType === 'registrations'" class="stat">
                      <span class="stat-value">{{ product.stock || 0 }}</span>
                      <span class="stat-label">{{ $t('pages.orders.quantity') }}</span>
                    </div>
                    
                    <div v-if="dataType === 'activity'" class="stat">
                      <span class="stat-value">${{ product.totalSalesInPeriod || 0 }}</span>
                      <span class="stat-label">{{ $t('analytics.stats.totalSales') }}</span>
                    </div>
                    <div v-if="dataType === 'activity'" class="stat">
                      <span class="stat-value">{{ product.salesCount || 0 }}</span>
                      <span class="stat-label">Sales Count</span>
                    </div>
                    <div v-if="dataType === 'activity'" class="stat">
                      <span class="stat-value">{{ product.totalReturns || 0 }}</span>
                      <span class="stat-label">{{ $t('analytics.dataTypes.returned') }}</span>
                    </div>
                    <div v-if="dataType === 'activity'" class="stat">
                      <span class="stat-value">${{ -product.returnedRevenue || 0 }}</span>
                      <span class="stat-label">{{ $t('pages.orders.totalRevenue') }}</span>
                    </div>
                  </div>
                </div>
              </template>
              
              <div v-if="selectedProductForChart && filteredTransactions.length === 0" class="no-users-message">
                <div class="no-results-icon"></div>
                <div class="no-results-text">
                  <strong>No {{ transactionFilter === 'all' ? 'transactions' : transactionFilter }} found</strong>
                  <p>There are no {{ transactionFilter === 'all' ? 'transactions' : transactionFilter }} for this product in the selected period</p>
                </div>
              </div>
              <div v-if="!selectedProductForChart && pointDetailsModal.usersList.length === 0" class="no-users-message">
                <div class="no-results-icon"></div>
                <div class="no-results-text">
                  <strong>No products found</strong>
                  <p>There are no products for the selected period</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="footer-info">
            <span class="period-summary">
            </span>
          </div>
          <div class="footer-buttons">
            <button @click="closePointDetails" class="confirm-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script>
import { EventBus, EVENTS } from '@/utils/EventBus.js'
import api from '@/services/api'

export default {
  name: 'ProductsAnalytics',
  data() {
    return {
      timeFilter: 'day',
      chartPeriodText: '',
      
      // Debounce для предотвращения частых обновлений
      updateTimeout: null,
      
      chartMode: 'registrations',
      chartModes: [
        { value: 'registrations', text: 'Registrations', icon: 'mdi-account-plus' },
        { value: 'activity', text: 'Activity', icon: 'mdi-chart-line' }
      ],
      
      isChartExpanded: false,
      
      dataType: 'registrations',
      
      isCustomerDetailView: false,
      selectedCustomerForDetail: null,
      selectedProductForDetail: null,
      
      gridLines: [],
      userPath: '',
      userPoints: [],
      xAxisLabels: [],
      
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        title: '',
        value: '',
        activeIndex: null,
        hoverX: null
      },
      
      maxChartValue: 0,
      
      searchQuery: '',
      expandedCustomer: null,
      activeTab: 0,
      
      isCustomersExpanded: false,
      
      dateFilter: null,
      datePickerMenu: false,
      
      sortBy: 'purchasesCount',
      sortOptions: [
        { text: 'By total revenue', value: 'totalValue' },
        { text: 'By units sold', value: 'purchasesCount' },
        { text: 'By product name', value: 'name' },
        { text: 'By first sale', value: 'firstPurchase' }
      ],
      
      transactionFilter: 'completed',
      
      customers: [],
    allPurchases: [],
    allReturns: [],
    allProducts: [],
    productActivities: [],
      
      pointDetailsModal: {
        show: false,
        date: null,
        period: '',
        newUsers: 0,
        usersList: [],
        index: null
      },
      

      
      selectedOrderForDetail: null,
      
      // Новые данные для профессионального интерфейса
      activeCustomerTab: 0,
      purchaseDateMenu: false,
      purchaseDateFilter: null,
      activityDateMenu: false,
      
      // Интервал для автоматического обновления
      updateInterval: null,
      
      // Для панелей детального просмотра продукта
      expandedPanel: null, // 'activity' или 'analytics'
      
      // Данные для графика продукта
      productGridLines: [],
      productChartPath: '',
      productChartPoints: [],
      
      // Простой поиск продуктов
      productSearch: '',
      
      // Выбранный продукт для отображения в графике
      selectedProductForChart: null,
      productChartSearch: '', // Поиск для autocomplete
      
    }
  },
  
  computed: {
    totalCustomers() {
      if (this.selectedProductForChart) {
        // Для выбранного продукта показываем общее количество продаж
        const productSales = this.allPurchases.filter(purchase => 
          purchase.productName === this.selectedProductForChart
        );
        return productSales.reduce((sum, sale) => sum + (sale.quantity || 1), 0);
      }
      return this.productsList.length;
    },
    
    
    newUsersThisPeriod() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
      if (this.selectedProductForChart) {
        // Для выбранного продукта показываем продажи за период
        return this.userPoints.reduce((sum, point) => sum + point.value, 0);
      }
      return this.userPoints.reduce((sum, point) => sum + point.value, 0);
    },
    
    averageNewUsers() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
      if (this.selectedProductForChart) {
        // Для выбранного продукта показываем среднее количество продаж в день
        return Math.round(this.newUsersThisPeriod / this.userPoints.length);
      }
      return Math.round(this.newUsersThisPeriod / this.userPoints.length);
    },
    
    growthRate() {
      if (!this.userPoints || this.userPoints.length < 2) return 0;
      const firstHalf = this.userPoints.slice(0, Math.floor(this.userPoints.length / 2));
      const secondHalf = this.userPoints.slice(Math.floor(this.userPoints.length / 2));
      
      const firstHalfSum = firstHalf.reduce((sum, point) => sum + point.value, 0);
      const secondHalfSum = secondHalf.reduce((sum, point) => sum + point.value, 0);
      
      if (firstHalfSum === 0) return secondHalfSum > 0 ? 100 : 0;
      return Math.round(((secondHalfSum - firstHalfSum) / firstHalfSum) * 100);
    },
    
    // Вычисляемые свойства для фильтрации транзакций
    allTransactions() {
      return this.pointDetailsModal.usersList || [];
    },
    
    completedTransactions() {
      return this.allTransactions.filter(transaction => transaction.type !== 'return');
    },
    
    returnedTransactions() {
      return this.allTransactions.filter(transaction => transaction.type === 'return');
    },
    
    filteredTransactions() {
      switch (this.transactionFilter) {
        case 'completed':
          return this.completedTransactions;
        case 'returned':
          return this.returnedTransactions;
        default:
          return this.allTransactions;
      }
    },
    
    filteredModalTransactions() {
      const modalData = this.pointDetailsModal.usersList || [];
      if (!this.selectedProductForChart) {
        return modalData;
      }
      
      switch (this.transactionFilter) {
        case 'completed':
          return modalData.filter(item => item.type !== 'return');
        case 'returned':
          return modalData.filter(item => item.type === 'return');
        default:
          return modalData;
      }
    },
    


    filteredCustomers() {
      if (!this.searchQuery) {
        return this.customers
      }
      
      const query = this.searchQuery.toLowerCase()
      return this.customers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(query)
        const emailMatch = customer.email.toLowerCase().includes(query)
        
        const purchaseMatch = customer.purchases.some(purchase => 
          purchase.productName.toLowerCase().includes(query)
        )
        
        const returnMatch = customer.returns && customer.returns.some(returnItem => 
          returnItem.productName.toLowerCase().includes(query)
        )
        
        return nameMatch || emailMatch || purchaseMatch || returnMatch
      })
    },
    
    sortedCustomers() {
      const customers = [...this.filteredCustomers]
      
      return customers.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'firstPurchase':
            return new Date(a.firstPurchase) - new Date(b.firstPurchase)
          case 'purchasesCount':
            return b.purchasesCount - a.purchasesCount
          case 'totalValue':
          default:
            return b.totalValue - a.totalValue
        }
      })
    },
    
    totalPurchases() {
      return this.filteredCustomers.reduce((sum, customer) => sum + customer.purchasesCount, 0)
    },
    
    totalReturns() {
      return this.filteredCustomers.reduce((sum, customer) => {
        return sum + (customer.returns ? customer.returns.length : 0)
      }, 0)
    },
    
    totalRevenue() {
      return this.filteredCustomers.reduce((sum, customer) => sum + customer.totalValue, 0)
    },
    
    // Neue computed property für Produkte
    productsList() {
      console.log('ProductsList computed - allProducts:', this.allProducts && this.allProducts.length);
      const productsMap = {}
      
      // Сначала добавляем все товары из справочника, чтобы показывать их даже без покупок
      if (this.allProducts && this.allProducts.length > 0) {
        console.log('Processing allProducts:', this.allProducts.slice(0, 3));
        this.allProducts.forEach(p => {
          if (!productsMap[p.name]) {
            productsMap[p.name] = {
              id: p.id,
              name: p.name,
              totalPurchases: 0,
              totalRevenue: 0,
              customers: new Set(),
              lastPurchaseDate: null,
              firstPurchaseDate: p.date ? new Date(p.date) : null,
              totalReturns: 0,
              returnedRevenue: 0,
              stock: p.stock || 0
            }
          }
        })
      }
      
      // Sammle alle Produkte direkt aus allen Käufen
      if (this.allPurchases && this.allPurchases.length > 0) {
        this.allPurchases.forEach(purchase => {
          const productName = purchase.productName
          if (!productsMap[productName]) {
            productsMap[productName] = {
              name: productName,
              totalPurchases: 0,
              totalRevenue: 0,
              customers: new Set(),
              lastPurchaseDate: null,
              firstPurchaseDate: null,
              stock: 0
            }
          }
          
          productsMap[productName].totalPurchases += purchase.quantity || 1
          productsMap[productName].totalRevenue += purchase.total
          if (purchase.customerName) {
            productsMap[productName].customers.add(purchase.customerName)
          }
          
          const purchaseDate = new Date(purchase.date)
          if (!productsMap[productName].lastPurchaseDate || purchaseDate > productsMap[productName].lastPurchaseDate) {
            productsMap[productName].lastPurchaseDate = purchaseDate
          }
          if (!productsMap[productName].firstPurchaseDate || purchaseDate < productsMap[productName].firstPurchaseDate) {
            productsMap[productName].firstPurchaseDate = purchaseDate
          }
        })
      }
      
      // Добавляем данные о возвратах для каждого продукта
      if (this.allReturns && this.allReturns.length > 0) {
        this.allReturns.forEach(returnItem => {
          // Находим продукт по productId или productName
          const productData = this.allProducts.find(p => p.id === returnItem.productId || p.name === returnItem.productName)
          const productName = productData ? productData.name : returnItem.productName
          
          if (productsMap[productName]) {
            if (!productsMap[productName].totalReturns) {
              productsMap[productName].totalReturns = 0
              productsMap[productName].returnedRevenue = 0
            }
            productsMap[productName].totalReturns += returnItem.quantity || 1
            
            // Используем цену продукта для расчета суммы возврата
            const unitPrice = productData ? productData.price : 0
            productsMap[productName].returnedRevenue += (returnItem.quantity || 1) * unitPrice
          }
        })
      }
      
      // Konvertiere zu Array und füge zusätzliche Eigenschaften hinzu
      const products = Object.values(productsMap).map(product => ({
        ...product,
        customersCount: product.customers.size,
        averageRevenue: product.totalPurchases > 0 ? (product.totalRevenue / product.totalPurchases) : 0,
        totalReturns: product.totalReturns || 0,
        returnedRevenue: product.returnedRevenue || 0,
        netRevenue: product.totalRevenue - (product.returnedRevenue || 0)
      }))
      
      console.log('Total products found:', products.length)
      console.log('All purchases count:', this.allPurchases ? this.allPurchases.length : 0)
      
      return products
    },
    
    filteredProducts() {
      if (!this.productSearch) {
        return this.productsList
      }
      
      const searchLower = this.productSearch.toLowerCase()
      
      return this.productsList.filter(product => {
        // Поиск по названию
        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower)
        
        // Поиск по ID 
        const idMatch = product.id && product.id.toString().includes(searchLower)
        
        // Поиск в оригинальных данных продукта (категория, описание, штрихкод)
        const originalProduct = this.allProducts && this.allProducts.find(p => p.id === product.id)
        const categoryMatch = originalProduct && originalProduct.category && originalProduct.category.toLowerCase().includes(searchLower)
        const descriptionMatch = originalProduct && originalProduct.description && originalProduct.description.toLowerCase().includes(searchLower)
        const barcodeMatch = originalProduct && originalProduct.barcode && originalProduct.barcode.toLowerCase().includes(searchLower)
        
        return nameMatch || idMatch || categoryMatch || descriptionMatch || barcodeMatch
      })
    },

    // Фильтрованные продукты для autocomplete
    autocompleteProducts() {
      if (!this.productChartSearch || this.productChartSearch.length < 1) {
        return this.productsList.slice(0, 10); // Показываем первые 10 продуктов
      }
      
      const searchLower = this.productChartSearch.toLowerCase();
      
      return this.productsList.filter(product => {
        // Поиск по названию
        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower);
        
        // Поиск по ID 
        const idMatch = product.id && product.id.toString().includes(searchLower);
        
        // Поиск в оригинальных данных продукта
        const originalProduct = this.allProducts && this.allProducts.find(p => p.id === product.id);
        const categoryMatch = originalProduct && originalProduct.category && originalProduct.category.toLowerCase().includes(searchLower);
        const barcodeMatch = originalProduct && originalProduct.barcode && originalProduct.barcode.toLowerCase().includes(searchLower);
        
        return nameMatch || idMatch || categoryMatch || barcodeMatch;
      }).slice(0, 20); // Ограничиваем до 20 результатов
    },
    
sortedProducts() {
  const products = [...this.filteredProducts]
  return products.sort((a, b) => {
    switch (this.sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'firstPurchase': return new Date(a.firstPurchaseDate) - new Date(b.firstPurchaseDate)
      case 'purchasesCount': return b.totalPurchases - a.totalPurchases
      case 'totalValue':
      default: return b.totalRevenue - a.totalRevenue
    }
  })
},
currentProductStock() {
  if (!this.selectedProductForDetail) return null
  const byId = (this.allProducts && this.selectedProductForDetail.id)
    ? this.allProducts.find(p => p.id === this.selectedProductForDetail.id)
    : null
  if (byId && byId.stock !== undefined && byId.stock !== null) return byId.stock
  const byName = this.allProducts
    ? this.allProducts.find(p => p.name === this.selectedProductForDetail.name)
    : null
  return (byName && byName.stock !== undefined && byName.stock !== null) ? byName.stock : null
},
  
  },
  mounted() {
  this.initializeEmptyChart();
  this.fetchCustomersData();
  this.loadAllProductActivities();
  this.updateChartPeriodText();
    // Если пришли из AI с запросом продукта
    if (this.$route && this.$route.query) {
      const q = this.$route.query.q
      const aiOpen = this.$route.query.aiOpenProduct === '1'
      if (q) {
        this.isCustomersExpanded = true
        this.productSearch = String(q)
        // Ждём загрузки данных и затем ищем более умно
        const tryOpen = async () => {
          const query = String(q).trim()
          let candidate = null
          // Поиск по ID
          const id = parseInt(query, 10)
          if (!isNaN(id)) {
            candidate = (this.productsList || []).find(p => p.id === id)
          }
          // Строгое совпадение по полному имени (без частичных)
          if (!candidate) {
            candidate = (this.productsList || []).find(p => (p.name || '').toLowerCase() === query.toLowerCase())
          }
          if (candidate) {
            await this.openProductDetailView(candidate)
          }
        }
        // Несколько попыток, чтобы дождаться fetch
        setTimeout(tryOpen, 150)
        setTimeout(tryOpen, 400)
        setTimeout(async () => {
          await tryOpen()
          // Если и после попыток ничего не найдено — сообщаем ассистенту
          const query = String(q).trim()
          const id = parseInt(query, 10)
          const exact = (this.productsList || []).find(p => (!isNaN(id) && p.id === id) || ((p.name || '').toLowerCase() === query.toLowerCase()))
          if (!exact) {
            EventBus.$emit('AI_FEEDBACK', { message: 'Такой продукт не найден' })
          }
        }, 900)
      }
      // Альтернатива: если пришло имя точного продукта — показать график по нему
      if (aiOpen && q) {
        const exact = (this.productsList || []).find(p => String(p.id) === q || (p.name && p.name.toLowerCase() === String(q).toLowerCase()))
        if (exact) {
          this.selectedProductForChart = exact.name
          this.generateProductChartData()
        }
      }
    }
    
    // Автоматическое обновление каждую минуту для актуальных данных
    this.updateInterval = setInterval(() => {
      this.generateChartData();
        }, 1000); 

    // Подписка на изменения продуктов, чтобы обновлять аналитику/детали сразу после правок
    if (EventBus) {
      // Подписываемся только на общее событие изменения продуктов для избежания дублей
      EventBus.$on(EVENTS.PRODUCTS_CHANGED, this.onProductsChanged)
      EventBus.$on('PRODUCT_ACTIVITY_ADDED', this.onProductActivityAdded)
      // Подписка на AI-поиск на лету, если уже на этой странице
      EventBus.$on('AI_SEARCH_PRODUCTS', async ({ query, aiOpenProduct }) => {
        try {
          this.isCustomersExpanded = true
          this.productSearch = String(query || '')
          // Пытаемся найти и открыть
          const id = parseInt(String(query), 10)
          let candidate = this.filteredProducts && this.filteredProducts[0]
          if (!candidate && !isNaN(id)) {
            candidate = (this.productsList || []).find(p => p.id === id)
          }
          if (!candidate) {
            const tokens = String(query).toLowerCase().split(/\s+/).filter(Boolean)
            candidate = (this.productsList || []).find(p => {
              const orig = (this.allProducts || []).find(op => op.id === p.id) || {}
              const hay = [p.name, p.id, orig.category, orig.description, orig.barcode]
                .map(x => (x == null ? '' : String(x).toLowerCase()))
                .join(' ')
              return tokens.every(t => hay.includes(t))
            })
          }
          if (candidate) {
            await this.openProductDetailView(candidate)
          }
          if (String(aiOpenProduct) === '1') {
            const exact = (this.productsList || []).find(p => String(p.id) === String(query) || (p.name && p.name.toLowerCase() === String(query).toLowerCase()))
            if (exact) {
              this.selectedProductForChart = exact.name
              this.generateProductChartData()
            }
          }
        } catch (e) {
          console.error('AI_SEARCH_PRODUCTS handler error:', e)
        }
      })
    }
  },
  
  beforeDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    // Отписываемся от событий
    if (EventBus) {
      EventBus.$off(EVENTS.PRODUCTS_CHANGED, this.onProductsChanged)
      EventBus.$off('PRODUCT_ACTIVITY_ADDED', this.onProductActivityAdded)
    }
  },
  
  watch: {
    timeFilter() {
      this.generateChartData();
      this.updateChartPeriodText();
    },
    
    chartMode() {
      this.generateChartData();
      this.updateChartPeriodText();
    },
    
    dataType() {
      this.generateChartData();
    },
    
    '$i18n.locale'() {
      this.updateChartPeriodText();
    }
  },
  
  methods: {
    // Метод для установки фильтра транзакций и обновления графика
    setTransactionFilter(filter) {
      this.transactionFilter = filter;
      // Обновляем график при изменении фильтра
      if (this.selectedProductForChart) {
        this.generateProductChartData();
      }
    },
    
async loadAllProductActivities() {
  try {
    const response = await api.get('/product-activities');
    if (response.data) {
      this.productActivities = response.data;
    } else {
      console.error(this.$t('pages.products.analytics.errorLoadingActivities'));
    }
  } catch (error) {
    console.error(this.$t('pages.products.analytics.errorLoadingActivities'), error);
  }
},

    // Выбор продукта для графика
    onProductSelect() {
      console.log('Product selected for chart:', this.selectedProductForChart);
      if (this.selectedProductForChart) {
        this.generateProductChartData();
      } else {
        this.generateChartData();
      }
    },

    // Очистка выбора продукта
    clearProductSelection() {
      this.selectedProductForChart = null;
      this.productChartSearch = '';
      this.transactionFilter = 'completed'; // Сброс фильтра транзакций
      this.generateChartData(); // Возврат к общему графику
    },

    // Возврат к главной странице аналитики
    goBackToAnalytics() {
      this.$router.push('/analytics');
    },

    // Генерация данных графика для выбранного продукта
    generateProductChartData() {
      if (!this.selectedProductForChart) {
        this.generateChartData();
        return;
      }

      const now = new Date();
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };

      const count = periods[this.timeFilter] || 30;
      const timeSlots = [];

      // Генерируем временные слоты
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        
        switch (this.timeFilter) {
          case 'hour':
            date.setHours(now.getHours() - i);
            date.setMinutes(0, 0, 0);
            break;
          case 'day':
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);
            break;
          case 'week':
            date.setDate(now.getDate() - i * 7);
            date.setHours(0, 0, 0, 0);
            break;
          case 'month':
            date.setMonth(now.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
          case 'year':
            date.setFullYear(now.getFullYear() - i);
            date.setMonth(0, 1);
            date.setHours(0, 0, 0, 0);
            break;
        }
        
        timeSlots.push({
          date: new Date(date),
          value: 0
        });
      }

      // Подсчитываем продажи выбранного продукта по периодам с учетом фильтра
      if (this.allPurchases && (this.transactionFilter === 'all' || this.transactionFilter === 'completed')) {
        this.allPurchases.forEach(purchase => {
          if (purchase.productName === this.selectedProductForChart) {
            const purchaseDate = new Date(purchase.date);
            
            for (let slot of timeSlots) {
              const slotStart = new Date(slot.date);
              const slotEnd = this.getEndTime(slotStart);
              
              if (purchaseDate >= slotStart && purchaseDate < slotEnd) {
                slot.value += 1; // Считаем количество транзакций, а не количество товаров
                break;
              }
            }
          }
        });
      }
      
      // Подсчитываем возвраты выбранного продукта по периодам с учетом фильтра
      if (this.allReturns && (this.transactionFilter === 'all' || this.transactionFilter === 'returned')) {
        this.allReturns.forEach(returnItem => {
          if (returnItem.productName === this.selectedProductForChart) {
            const returnDate = new Date(returnItem.date);
            
            for (let slot of timeSlots) {
              const slotStart = new Date(slot.date);
              const slotEnd = this.getEndTime(slotStart);
              
              if (returnDate >= slotStart && returnDate < slotEnd) {
                slot.value += 1; // Считаем количество транзакций, а не количество товаров
                break;
              }
            }
          }
        });
      }

      console.log('Product chart data:', timeSlots);
      this.generateSVGElements(timeSlots);
      this.updateChartPeriodText();
    },

    // Вспомогательный метод для получения конечного времени слота
    getEndTime(startTime) {
      const endTime = new Date(startTime);
      
      switch (this.timeFilter) {
        case 'hour':
          endTime.setHours(endTime.getHours() + 1);
          break;
        case 'day':
          endTime.setDate(endTime.getDate() + 1);
          break;
        case 'week':
          endTime.setDate(endTime.getDate() + 7);
          break;
        case 'month':
          endTime.setMonth(endTime.getMonth() + 1);
          break;
        case 'year':
          endTime.setFullYear(endTime.getFullYear() + 1);
          break;
      }
      
      return endTime;
    },
    
    async fetchCustomersData() {
      try {
        const [customersResponse, purchasesResponse, returnsResponse, productsResponse] = await Promise.all([
          api.get('/customers'),
          api.get('/purchases'),
          api.get('/returns'),
          api.get('/products')
        ])
        
        const customers = customersResponse.data
        const purchases = purchasesResponse.data
        const returns = returnsResponse.data
        const products = productsResponse.data
        if (customers && purchases) {
          this.processCustomersData(customers, purchases, returns, products)
          
          this.generateChartData()
        } else {
          console.error('Error loading data')
          this.generateFallbackData()
        }
      } catch (error) {
        console.error('Error loading data:', error)
        this.generateFallbackData()
      }
    },
    
    processCustomersData(customers, purchases, returns, products) {
      console.log('Processing data - Products:', products && products.length, products && products.slice(0, 3));
      console.log('Processing data - Purchases:', purchases && purchases.length);
      console.log('Processing data - Returns:', returns && returns.length);
      
      // Сохраняем все данные для обработки продуктов
      // Нормализуем имена продуктов в покупках/возвратах по текущему справочнику товаров
      const productsById = {}
      const productsByName = {}
      products.forEach(p => { productsById[p.id] = p; productsByName[p.name] = p })
      const normalizedPurchases = purchases.map(p => {
        const prod = (p.productId && productsById[p.productId]) || productsByName[p.productName]
        return prod ? { ...p, productName: prod.name } : p
      })
      const normalizedReturns = returns.map(r => {
        const prod = (r.productId && productsById[r.productId]) || productsByName[r.productName]
        return prod ? { ...r, productName: prod.name } : r
      })

      this.allPurchases = normalizedPurchases
      this.allReturns = normalizedReturns
      this.allProducts = products
      
      console.log('After processing - allProducts:', this.allProducts && this.allProducts.length);
      
      const purchasesByCustomer = {}
      normalizedPurchases.forEach(purchase => {
        if (!purchasesByCustomer[purchase.customerName]) {
          purchasesByCustomer[purchase.customerName] = []
        }
        purchasesByCustomer[purchase.customerName].push(purchase)
      })
      
      const returnsByCustomer = {}
      normalizedReturns.forEach(returnItem => {
        if (!returnsByCustomer[returnItem.customerName]) {
          returnsByCustomer[returnItem.customerName] = []
        }
        returnsByCustomer[returnItem.customerName].push(returnItem)
      })
      
      this.customers = customers.map((customer, index) => {
        const customerPurchases = purchasesByCustomer[customer.name] || []
        const customerReturns = returnsByCustomer[customer.name] || []
        const totalValue = customerPurchases.reduce((sum, p) => sum + p.total, 0)
        const avgPurchase = customerPurchases.length > 0 ? totalValue / customerPurchases.length : 0
        
        const purchasesWithTime = customerPurchases.map(p => {
          return {
            ...p,
            id: p.id,
            date: new Date(p.date),
            productName: p.productName,
            quantity: p.quantity,
            total: p.total,
            paymentMethod: p.paymentMethod || this.getRandomPaymentMethod() // Добавляем способ оплаты
          }
        })
        
        const returnsWithTime = customerReturns.map(r => {
          return {
            ...r,
            id: r.id,
            date: new Date(r.date),
            productName: r.productName,
            amount: r.amount,
            reason: r.reason
          }
        })
        
        const purchaseDates = purchasesWithTime.map(p => p.date)
        const firstPurchase = purchaseDates.length > 0 ? new Date(Math.min(...purchaseDates)) : new Date()
        const lastPurchase = purchaseDates.length > 0 ? new Date(Math.max(...purchaseDates)) : new Date()
        
        return {
          id: index + 1,
          name: customer.name,
          email: customer.email || `${customer.name.toLowerCase().replace(' ', '.')}@email.com`,
          purchasesCount: purchasesWithTime.length,
          totalValue: totalValue,
          avgPurchase: avgPurchase,
          firstPurchase: firstPurchase,
          lastPurchase: lastPurchase,
          purchases: purchasesWithTime.sort((a, b) => b.date - a.date),
          returns: returnsWithTime.sort((a, b) => b.date - a.date)
        }
      })
    },
    
    getAllActivities(customer) {
      const activities = []
      
      // Группируем покупки по дате и времени (с точностью до минуты)
      const groupedPurchases = {}
      customer.purchases.forEach(purchase => {
        const purchaseTime = new Date(purchase.date)
        // Группируем по дате и времени с точностью до минуты
        const timeKey = `${purchaseTime.getFullYear()}-${purchaseTime.getMonth()}-${purchaseTime.getDate()}-${purchaseTime.getHours()}-${purchaseTime.getMinutes()}`
        
        if (!groupedPurchases[timeKey]) {
          groupedPurchases[timeKey] = {
            date: purchaseTime,
            items: [],
            totalAmount: 0,
            paymentMethod: purchase.paymentMethod
          }
        }
        
        groupedPurchases[timeKey].items.push(purchase)
        groupedPurchases[timeKey].totalAmount += purchase.total
      })
      
      // Создаем активности для сгруппированных покупок
      Object.values(groupedPurchases).forEach(group => {
        const itemsCount = group.items.length
        const firstItem = group.items[0]
        
        activities.push({
          id: `purchase-group-${group.date.getTime()}`,
          type: 'purchase',
          title: itemsCount > 1 ? `${this.$t('analytics.customer.operationDescriptions.productPurchase')} (${itemsCount} ${this.$t('common.items')})` : `${this.$t('analytics.customer.operationDescriptions.productPurchase')}: ${firstItem.productName}`,
          description: itemsCount > 1 ? `${itemsCount} ${this.$t('common.items')} ${this.$t('analytics.customer.operationDescriptions.productPurchase')}` : `${this.$t('pages.orders.quantity')}: ${firstItem.quantity}`,
          date: group.date,
          amount: group.totalAmount,
          paymentMethod: group.paymentMethod,
          items: group.items, // Добавляем все товары для модального окна
          isGrouped: itemsCount > 1
        })
      })
      
      if (customer.returns) {
        customer.returns.forEach(returnItem => {
          activities.push({
            id: returnItem.id,
            type: 'return',
            title: `${this.$t('analytics.customer.operationDescriptions.productReturn')}: ${returnItem.productName}`,
            description: `${this.$t('analytics.customer.operationDescriptions.reason')}: ${this.getTranslatedReason(returnItem.reason)}`,
            date: returnItem.date,
            amount: -returnItem.amount
          })
        })
      }
      
      const registrationDate = new Date(customer.firstPurchase)
      registrationDate.setDate(registrationDate.getDate() - 1)
      activities.push({
        id: 'registration',
        type: 'registration',
        title: this.$t('analytics.customer.operationDescriptions.systemRegistration'),
        description: this.$t('analytics.customer.operationDescriptions.customerCreatedAccount'),
        date: registrationDate
      })
      
      return activities.sort((a, b) => b.date - a.date)
    },
    
    getFilteredPurchases(purchases) {
      if (!this.dateFilter) {
        return purchases
      }
      
      const filterDate = new Date(this.dateFilter)
      return purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.date)
        return purchaseDate.toDateString() === filterDate.toDateString()
      })
    },
    
    getFilteredReturns(returns) {
      if (!this.dateFilter || !returns) {
        return returns || []
      }
      
      const filterDate = new Date(this.dateFilter)
      return returns.filter(returnItem => {
        const returnDate = new Date(returnItem.date)
        return returnDate.toDateString() === filterDate.toDateString()
      })
    },
    
    generateFallbackData() {
      this.customers = [];
      this.initializeEmptyChart();
    },
    
    initializeEmptyChart() {
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      const now = new Date();
      
      const emptyData = Array.from({ length: count }, (_, i) => {
        const date = new Date(now);
        
        switch (this.timeFilter) {
          case 'hour':
            date.setHours(date.getHours() - (count - 1 - i));
            date.setMinutes(0, 0, 0);
            break;
          case 'day':
            date.setDate(date.getDate() - (count - 1 - i));
            date.setHours(0, 0, 0, 0);
            break;
          case 'week':
            date.setDate(date.getDate() - (count - 1 - i) * 7);
            date.setHours(0, 0, 0, 0);
            break;
          case 'month':
            date.setMonth(date.getMonth() - (count - 1 - i));
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
          case 'year':
            date.setFullYear(date.getFullYear() - (count - 1 - i));
            date.setMonth(0, 1);
            date.setHours(0, 0, 0, 0);
            break;
        }
        
        return {
          date: new Date(date),
          value: 0
        };
      });
      
      this.generateSVGElements(emptyData);
      this.updateChartPeriodText();
    },
    
    generateChartData() {
      // Если выбран продукт, генерируем график для продукта
      if (this.selectedProductForChart) {
        this.generateProductChartData();
        return;
      }
      
      if (!this.customers || this.customers.length === 0) {
        this.generateFallbackData();
        return;
      }

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };

      const count = periods[this.timeFilter] || 30;
      const timeSlots = [];

      // Генерируем данные от прошлого к настоящему
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        
        switch (this.timeFilter) {
          case 'hour':
            // Показываем последние 24 часа до текущего момента
            date.setHours(now.getHours() - i);
            date.setMinutes(0, 0, 0);
            break;
          case 'day':
            // Показываем последние 30 дней до сегодня
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);
            break;
          case 'week':
            // Показываем последние 12 недель
            date.setDate(now.getDate() - i * 7);
            const dayOfWeek = date.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            date.setDate(date.getDate() - daysToMonday);
            date.setHours(0, 0, 0, 0);
            break;
          case 'month':
            // Показываем последние 12 месяцев
            date.setMonth(now.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
          case 'year':
            // Показываем последние 5 лет
            date.setFullYear(now.getFullYear() - i);
            date.setMonth(0, 1);
            date.setHours(0, 0, 0, 0);
            break;
        }
        
        const endTime = this.getEndTime(new Date(date));
        let value = 0;
        
        // Если выбран конкретный продукт, считаем только его продажи
        if (this.selectedProductForChart) {
          // Логика уже обрабатывается в generateProductChartData
          value = 0;
        } else if (this.dataType === 'registrations') {
          value = this.getProductRegistrationsForPeriod(date, endTime);
        } else if (this.dataType === 'activity') {
          value = this.getProductActivityForPeriod(date, endTime);
        }
        
        timeSlots.push({
          date: new Date(date),
          value: value
        });
      }

      const maxValue = Math.max(...timeSlots.map(slot => slot.value), 1);
      this.generateSVGElements(timeSlots, maxValue);
      this.updateChartPeriodText();
    },

    getEndTime(startDate) {
      const endDate = new Date(startDate);
      
      switch (this.timeFilter) {
        case 'hour':
          endDate.setHours(endDate.getHours() + 1);
          break;
        case 'day':
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'week':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'month':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'year':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      
      return endDate;
    },
    
    generateSVGElements(data) {
      const width = 800
      const height = 400
      const padding = 60
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2
      
      this.gridLines = []
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        this.gridLines.push({
          id: `h-${i}`,
          x1: padding,
          y1: y,
          x2: width - padding,
          y2: y
        })
      }
      
      for (let i = 0; i <= data.length - 1; i += Math.ceil(data.length / 6)) {
        const x = padding + (chartWidth / (data.length - 1)) * i
        this.gridLines.push({
          id: `v-${i}`,
          x1: x,
          y1: padding,
          x2: x,
          y2: height - padding
        })
      }
      
      const maxValue = Math.max(...data.map(d => d.value))
      const minValue = Math.min(...data.map(d => d.value))
      const valueRange = maxValue - minValue || 1
      
      this.maxChartValue = maxValue
      
      this.userPoints = data.map((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight
        
        return {
          x,
          y,
          value: point.value,
          date: point.date
        }
      })
      
      this.userPath = this.userPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')
      
      this.xAxisLabels = data.map(point => this.formatXAxisLabel(point))
    },
    
    formatXAxisLabel(dataPoint, index) {
      const date = new Date(dataPoint.date);
      const now = new Date();
      
      switch (this.timeFilter) {
        case 'hour':
          // Show actual time
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
          });
        case 'day':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          
          if (dateOnly.getTime() === today.getTime()) {
            return this.$t('analytics.dates.today');
          } else if (dateOnly.getTime() === yesterday.getTime()) {
            return this.$t('analytics.dates.yesterday');
          } else {
            return date.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en', { 
              day: '2-digit', 
              month: '2-digit' 
            });
          }
        case 'week':
          return date.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en', { 
            day: '2-digit', 
            month: '2-digit' 
          });
        case 'month':
          const months = [
            this.$t('analytics.dates.months.jan'),
            this.$t('analytics.dates.months.feb'),
            this.$t('analytics.dates.months.mar'),
            this.$t('analytics.dates.months.apr'),
            this.$t('analytics.dates.months.may'),
            this.$t('analytics.dates.months.jun'),
            this.$t('analytics.dates.months.jul'),
            this.$t('analytics.dates.months.aug'),
            this.$t('analytics.dates.months.sep'),
            this.$t('analytics.dates.months.oct'),
            this.$t('analytics.dates.months.nov'),
            this.$t('analytics.dates.months.dec')
          ];
          return `${months[date.getMonth()]} ${date.getFullYear()}`;
        case 'year':
          return date.getFullYear().toString();
        default:
          return date.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en', { 
            day: '2-digit', 
            month: '2-digit' 
          });
      }
    },
    
    updateChartPeriodText() {
      const periods = {
        hour: this.$t('analytics.periods.last24Hours'),
        day: this.$t('analytics.periods.last30Days'),
        week: this.$t('analytics.periods.last12Weeks'),
        month: this.$t('analytics.periods.last12Months'),
        year: this.$t('analytics.periods.last5Years')
      };
      
      this.chartPeriodText = periods[this.timeFilter] || this.$t('analytics.periods.last30Days');
    },
    
    showTooltip(event, point, index) {
      // Получаем позицию SVG контейнера
      const svgElement = event.target.closest('svg');
      const svgRect = svgElement.getBoundingClientRect();
      
      // Вычисляем абсолютные координаты tooltip
      const tooltipX = svgRect.left + point.x;
      const tooltipY = svgRect.top + point.y;
      
      this.tooltip = {
        show: true,
        x: tooltipX,
        y: tooltipY,
        title: this.formatXAxisLabel(point),
        value: point.value,
        tooltipText: this.selectedProductForChart ? (this.transactionFilter === 'returned' ? this.$t('analytics.charts.tooltip.returns') : this.$t('analytics.modal.sales')) : (this.dataType === 'registrations' ? this.$t('analytics.modal.productsFound') : (this.transactionFilter === 'completed' ? this.$t('analytics.charts.tooltip.orders') : (this.transactionFilter === 'returned' ? this.$t('analytics.charts.tooltip.returns') : this.$t('analytics.modal.sales')))),
        activeIndex: index,
        hoverX: point.x
      };
    },
    
    hideTooltip() {
      this.tooltip = {
        show: false,
        x: 0,
        y: 0,
        title: '',
        value: '',
        activeIndex: null,
        hoverX: null
      };
    },
    
    toggleCustomerDetails(customerId) {
      if (this.expandedCustomer === customerId) {
        this.expandedCustomer = null;
      } else {
        this.expandedCustomer = customerId;
      }
      this.activeTab = 0;
      this.dateFilter = null;
    },
    
    openCustomerDetailView(customer) {
      if (!this.isCustomersExpanded) {

        this.isCustomersExpanded = true;
        this.selectedCustomerForDetail = null;
        this.expandedCustomer = null;
        this.activeTab = 0;
      } else {
        // Если секция уже развернута, показываем детали конкретного клиента
        const customerWithActivities = {
          ...customer,
          allActivities: this.getAllActivities(customer)
        };
        this.selectedCustomerForDetail = customerWithActivities;
        this.expandedCustomer = null;
        this.activeTab = 0;
      }
    },
    
    async openProductDetailView(product) {
      if (!this.isCustomersExpanded) {
        this.isCustomersExpanded = true;
      }
      
      // Создаем детальную информацию о продукте с покупками
      const activities = await this.getProductActivities(product);
      // Находим актуальные данные продукта, чтобы проставить корректный id и имя
      const resolved = this.allProducts.find(p => p.name === product.name) || product
      const productWithDetails = {
        ...product,
        id: resolved.id || product.id,
        name: resolved.name || product.name,
        allActivities: activities
      };
      
      this.selectedProductForDetail = productWithDetails;
      this.initializeProductChart();
      console.log('Product clicked:', product.name, 'Activities:', productWithDetails.allActivities.length);
    },
    
    async getProductActivities(product) {
      const activities = []
      
      // Определяем идентификатор и имя продукта
      const productId = product && product.id ? product.id : null
      const productName = typeof product === 'string' ? product : product.name;
      
      console.log('Getting activities for product:', productName)
      console.log('All purchases:', this.allPurchases)
      
      // Добавляем дату создания/добавления товара
      const productData = this.allProducts.find(p => (productId ? p.id === productId : p.name === productName))
      if (productData && productData.date) {
        activities.push({
          type: 'added',
          date: productData.date,
          description: this.$t('analytics.customer.operationDescriptions.productAdded'),
          amount: null,
          paymentMethod: null,
          status: 'completed',
          customerName: 'System',
          quantity: null
        })
      }
      
      // Получаем операции с запасами
      if (productData && productData.id) {
        try {
          const response = await api.get(`/stock-operations/product/${productData.id}`)
          const stockOperations = response.data
          if (stockOperations && stockOperations.length) {
            console.log('Stock operations for product:', product.name, stockOperations)
            
            stockOperations.forEach(operation => {
              activities.push({
                type: 'stock_operation',
                date: operation.date,
                description: `${this.$t('analytics.customer.operationDescriptions.stockOperation')} ${operation.operation_type}: ${operation.reason || this.$t('analytics.customer.operationDescriptions.noReasonSpecified')}`,
                amount: null,
                paymentMethod: null,
                status: 'completed',
                customerName: 'System',
                quantity: operation.quantity,
                operationType: operation.operation_type,
                notes: operation.notes
              })
            })
          } else {
            console.log('No stock operations found for product:', product.name)
          }
        } catch (error) {
          console.error('Error fetching stock operations:', error)
        }

        // Загружаем пользовательские активности по продукту (added/edit из Product.vue)
        try {
          const actRes = await api.get(`/product-activities/product/${productData.id}`)
          const productActivities = actRes.data
          if (productActivities && productActivities.length) {
            productActivities.forEach(a => {
              activities.push({
                type: a.type || a.status || 'activity',
                status: a.status,
                date: a.timestamp || a.date,
                description: a.description,
                amount: a.amount || null,
                customerName: a.customerName || '-',
                quantity: a.quantity || 0
              })
            })
          } else {
            // Fallback: грузим все активности и фильтруем по имени
            const allActRes = await api.get('/product-activities')
            const allActs = allActRes.data || []
            allActs.filter(a => a.productName === productData.name).forEach(a => {
                activities.push({
                  type: a.type || a.status || 'activity',
                  status: a.status,
                  date: a.timestamp || a.date,
                  description: a.description,
                  amount: a.amount || null,
                  customerName: a.customerName || '-',
                  quantity: a.quantity || 0
                })
              })
          }
        } catch (e) {
          console.error('Error fetching product activities:', e)
          try {
            const allActRes = await api.get('/product-activities')
            const allActs = allActRes.data || []
            allActs.filter(a => a.productName === productData.name).forEach(a => {
              activities.push({
                type: a.type || a.status || 'activity',
                status: a.status,
                date: a.timestamp || a.date,
                description: a.description,
                amount: a.amount || null,
                customerName: a.customerName || '-',
                quantity: a.quantity || 0
              })
            })
          } catch (ignored) {}
        }
      }
      
      // Добавляем покупки - проверяем разные форматы данных
      let productPurchases = []
      
      if (this.allPurchases && this.allPurchases.length > 0) {
        // Проверяем формат с items
        productPurchases = this.allPurchases.filter(purchase => {
          if (purchase.items && Array.isArray(purchase.items)) {
            return purchase.items.some(item => item.name === product.name || item.productName === product.name)
          }
          // Проверяем прямое соответствие по productName
          return purchase.productName === product.name
        })
        
        console.log('Found purchases for product:', product.name, productPurchases)
      }
      
      productPurchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          // Формат с items
          const item = purchase.items.find(item => item.name === product.name || item.productName === product.name)
          if (item) {
            activities.push({
              type: 'purchase',
              date: purchase.date,
              description: this.$t('analytics.customer.operationDescriptions.productPurchase'),
              amount: (item.price || item.total || 0) * (item.quantity || 1),
              paymentMethod: purchase.paymentMethod,
              status: purchase.status || 'completed',
              customerName: purchase.customerName,
              quantity: item.quantity || 1
            })
          }
        } else if (purchase.productName === product.name) {
          // Прямой формат
          activities.push({
            type: 'purchase',
            date: purchase.date,
            description: this.$t('analytics.customer.operationDescriptions.productPurchase'),
            amount: purchase.total || purchase.price || 0,
            paymentMethod: purchase.paymentMethod,
            status: purchase.status || 'completed',
            customerName: purchase.customerName,
            quantity: purchase.quantity || 1
          })
        }
      })
      
      // Добавляем возвраты
      const productReturns = this.allReturns.filter(returnItem => 
        returnItem.productId === product.id || returnItem.productName === product.name
      )
      
      productReturns.forEach(returnItem => {
        activities.push({
          type: 'return',
          date: returnItem.date,
          description: `${this.$t('analytics.customer.operationDescriptions.productReturn')}: ${this.getTranslatedReason(returnItem.reason || 'noReasonSpecified')}`,
          amount: -(returnItem.quantity * (productData && productData.price ? productData.price : 0)),
          paymentMethod: null,
          status: 'returned',
          customerName: returnItem.customerName,
          quantity: returnItem.quantity,
          notes: returnItem.notes
        })

      })
      
      console.log('Total activities for product:', product.name, activities.length)
      
      // Сортируем по дате (новые сначала)
      return activities.sort((a, b) => new Date(b.date) - new Date(a.date))
    },
    
    exitCustomerDetailView() {
        this.clearSearch();
      
      if (this.selectedCustomerForDetail) {
        // Если просматриваем детали клиента, возвращаемся к списку
        this.selectedCustomerForDetail = null;
        this.expandedCustomer = null;
        this.activeCustomerTab = 0;
      } else if (this.selectedProductForDetail) {
        // Если просматриваем детали продукта, возвращаемся к списку
        this.selectedProductForDetail = null;
      } else if (this.isCustomersExpanded) {
        // Если просто развернута секция, сворачиваем её
        this.isCustomersExpanded = false;
        this.expandedCustomer = null;
      }
    },
    
    formatDateOnly(date) {
      if (!date) return this.$t('analytics.noData')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    
    formatTimeWithSeconds(date) {
      if (!date) return this.$t('common.noData')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    
    getActivityIcon(type) {
      switch(type) {
        case 'purchase': return 'mdi-cart'
        case 'return': return 'mdi-keyboard-return'
        case 'added': return 'mdi-plus-circle'
        default: return 'mdi-circle'
      }
    },
    
    getActivityColor(type) {
      switch(type) {
        case 'purchase': return '#10b981'
        case 'return': return '#ef4444'
        case 'added': return '#3b82f6'
        default: return '#6b7280'
      }
    },
    
    openCustomersSection() {
      if (!this.isCustomersExpanded && !this.selectedCustomerForDetail) {
        this.isCustomersExpanded = true;
      }
    },
    
    openAllCustomers() {
      this.isCustomersExpanded = true;
      this.selectedCustomerForDetail = null;
      this.expandedCustomer = null;
      this.activeTab = 0;
    },
    
    toggleCustomersExpanded() {
      this.isCustomersExpanded = !this.isCustomersExpanded;
    },
    
    exitCustomersExpandedMode() {
      this.isCustomersExpanded = false;
      this.expandedCustomer = null;
    },

    clearSearch() {
      this.productSearch = '';
    },
    
    openPointDetails(point, index) {
      // Сохраняем текущий фильтр при открытии модального окна
      // this.transactionFilter остается без изменений
      
      const timeSlot = this.getTimeSlotForPoint(point, index);
      console.log('=== DEBUG INFO ===');
      console.log('TimeSlot for point:', timeSlot);
      console.log('TimeFilter:', this.timeFilter);
      console.log('TransactionFilter:', this.transactionFilter);
      console.log('SelectedProductForChart:', this.selectedProductForChart);
      console.log('AllPurchases count:', this.allPurchases ? this.allPurchases.length : 0);
      console.log('AllReturns count:', this.allReturns ? this.allReturns.length : 0);
      console.log('Point value:', point.value);
      console.log('Point date:', point.date);
      console.log('==================');
      let usersList = [];
      let modalTitle = '';
      let modalDescription = '';
      
      if (this.selectedProductForChart) {
        let purchases = [];
        let returns = [];
        
        // Для конкретного продукта показываем его продажи в периоде с учетом фильтра
        if (this.allPurchases && (this.transactionFilter === 'all' || this.transactionFilter === 'completed')) {
          console.log('Filtering purchases for product:', this.selectedProductForChart);
          console.log('Time range:', timeSlot.startTime, 'to', timeSlot.endTime);
          
          const filteredPurchases = this.allPurchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            const isCorrectProduct = purchase.productName === this.selectedProductForChart;
            const isInTimeRange = purchaseDate >= timeSlot.startTime && purchaseDate < timeSlot.endTime;
            
            console.log('Purchase:', purchase.productName, 'Date:', purchase.date, 'InRange:', isInTimeRange, 'CorrectProduct:', isCorrectProduct);
            
            return isCorrectProduct && isInTimeRange;
          });
          
          console.log('Filtered purchases count:', filteredPurchases.length);
          
          purchases = filteredPurchases.map(purchase => ({
            name: purchase.customerName || 'Unknown Customer',
            productName: purchase.productName,
            quantity: purchase.quantity || 1,
            total: purchase.total,
            date: purchase.date,
            paymentMethod: purchase.paymentMethod,
            type: 'purchase'
          }));
        }
        
        // Добавляем возвраты для выбранного продукта в периоде с учетом фильтра
        if (this.allReturns && (this.transactionFilter === 'all' || this.transactionFilter === 'returned')) {
          returns = this.allReturns.filter(returnItem => {
            const returnDate = new Date(returnItem.date);
            return returnItem.productName === this.selectedProductForChart &&
                   returnDate >= timeSlot.startTime && 
                   returnDate < timeSlot.endTime;
          }).map(returnItem => {
            const product = this.allProducts.find(p => p.name === returnItem.productName);
            const price = product ? product.price : 0;
            return {
              name: returnItem.customerName || 'Unknown Customer',
              productName: returnItem.productName,
              quantity: returnItem.quantity || 1,
              total: -(returnItem.quantity * price),
              date: returnItem.date,
              paymentMethod: null,
              type: 'return',
              reason: returnItem.reason
            };
          });
        }
        
        // Объединяем покупки и возвраты
        usersList = [...purchases, ...returns];
        console.log('Selected product purchases:', purchases.length, 'returns:', returns.length, 'total usersList:', usersList.length);
        modalTitle = `${this.selectedProductForChart} ${this.$t('analytics.modal.sales')} & ${this.$t('analytics.modal.returned')} ${this.$t('analytics.modal.period')}`;
        
        // Формируем описание в зависимости от фильтра
        if (this.transactionFilter === 'completed') {
          modalDescription = `${this.$t('analytics.modal.sales')}: ${purchases.length}`;
        } else if (this.transactionFilter === 'returned') {
          modalDescription = `${this.$t('analytics.modal.returned')}: ${returns.length}`;
        } else {
          modalDescription = `${this.$t('analytics.modal.sales')}: ${purchases.length}, ${this.$t('analytics.modal.returned')}: ${returns.length}`;
        }
      } else if (this.dataType === 'registrations') {
        usersList = this.getProductsForPeriod(timeSlot.startTime, timeSlot.endTime);
        modalTitle = `${this.$t('analytics.modal.newProducts')} ${this.$t('analytics.modal.period')}`;
        modalDescription = `${this.$t('analytics.modal.newProducts')}: ${point.value}`;
      } else if (this.dataType === 'activity') {
        usersList = this.getActiveProductsForPeriod(timeSlot.startTime, timeSlot.endTime);
        modalTitle = `${this.$t('navigation.products')} ${this.$t('analytics.modal.sales')} ${this.$t('analytics.modal.period')}`;
        modalDescription = `${this.$t('analytics.stats.totalSales')}: ${point.value}`;
      }
      
      // Сортировка по дате: последние сверху
      usersList = usersList.sort((a, b) => {
        const ad = new Date(a.date || a.lastPurchaseDate || a.firstPurchaseDate || 0)
        const bd = new Date(b.date || b.lastPurchaseDate || b.firstPurchaseDate || 0)
        return bd - ad
      })
      
      this.pointDetailsModal = {
        show: true,
        date: point.date,
        period: this.formatPeriodText(timeSlot),
        newUsers: point.value,
        usersList: usersList,
        index: index,
        title: modalTitle,
        description: modalDescription
      };
      
      // Инициализируем скроллинг после открытия модального окна
      this.initModalScroll();
    },

    getTimeSlotForPoint(point, index) {
      const now = new Date();
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      const date = new Date(now);
      
      console.log('getTimeSlotForPoint - index:', index, 'timeFilter:', this.timeFilter, 'count:', count);
      
      switch (this.timeFilter) {
        case 'hour':
          date.setHours(date.getHours() - (count - 1 - index));
          date.setMinutes(0, 0, 0);
          break;
        case 'day':
          date.setDate(date.getDate() - (count - 1 - index));
          date.setHours(0, 0, 0, 0);
          break;
        case 'week':
          date.setDate(date.getDate() - (count - 1 - index) * 7);
          const dayOfWeek = date.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          date.setDate(date.getDate() - daysToMonday);
          date.setHours(0, 0, 0, 0);
          console.log('Week calculation - original date:', new Date(date.getTime() + (count - 1 - index) * 7 * 24 * 60 * 60 * 1000), 'adjusted date:', date);
          break;
        case 'month':
          date.setMonth(date.getMonth() - (count - 1 - index));
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - (count - 1 - index));
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          break;
      }
      
      const endTime = this.getEndTime(new Date(date));
      console.log('getTimeSlotForPoint result - startTime:', date, 'endTime:', endTime);
      
      return {
        startTime: new Date(date),
        endTime: endTime
      };
    },

    getProductsForPeriod(startTime, endTime) {
      // Для режима "registrations" показываем продукты, добавленные в систему
      if (this.dataType === 'registrations') {
        if (!this.allProducts || this.allProducts.length === 0) {
          return [];
        }
        
        return this.allProducts.filter(product => {
          if (!product.date) return false;
          const createdDate = new Date(product.date);
          return createdDate >= startTime && createdDate < endTime;
        }).map(product => {
          // Дополняем данными из productsList если есть
          const productFromList = this.productsList.find(p => p.id === product.id || p.name === product.name);
          return {
            ...product,
            totalPurchases: productFromList && productFromList.totalPurchases || 0,
            totalRevenue: productFromList && productFromList.totalRevenue || 0,
            customersCount: productFromList && productFromList.customers && productFromList.customers.size || 0,
            firstPurchaseDate: productFromList && productFromList.firstPurchaseDate,
            lastPurchaseDate: productFromList && productFromList.lastPurchaseDate,
            totalReturns: productFromList && productFromList.totalReturns || 0,
            returnedRevenue: productFromList && productFromList.returnedRevenue || 0,
            stock: productFromList && productFromList.stock || product.stock || 0,
            price: product.price || 0
          };
        });
      } else {
        // Для режима "activity" показываем продукты по первой продаже
        return this.productsList.filter(product => {
          const firstSaleDate = new Date(product.firstPurchaseDate);
          return firstSaleDate >= startTime && firstSaleDate < endTime;
        });
      }
    },

    getProductRegistrationsForPeriod(startTime, endTime) {
      // Ищем продукты, которые были добавлены в систему в данном периоде
      if (!this.allProducts || this.allProducts.length === 0) {
        return 0;
      }
      
      return this.allProducts.filter(product => {
        if (!product.date) return false;
        const createdDate = new Date(product.date);
        return createdDate >= startTime && createdDate < endTime;
      }).length;
    },

    getProductActivityForPeriod(startTime, endTime) {
      let totalActivity = 0;
      
      // Подсчитываем покупки
      if (this.allPurchases && (this.transactionFilter === 'all' || this.transactionFilter === 'completed')) {
        const purchasesCount = this.allPurchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          return purchaseDate >= startTime && purchaseDate < endTime;
        }).length;
        totalActivity += purchasesCount;
      }
      
      // Подсчитываем возвраты
      if (this.allReturns && (this.transactionFilter === 'all' || this.transactionFilter === 'returned')) {
        const returnsCount = this.allReturns.filter(returnItem => {
          const returnDate = new Date(returnItem.date);
          return returnDate >= startTime && returnDate < endTime;
        }).length;
        totalActivity += returnsCount;
      }
      
      return totalActivity;
    },

    getActiveProductsForPeriod(startTime, endTime) {
      const activeProducts = [];
      
      this.productsList.forEach(product => {
        let productTransactions = [];
        
        // Добавляем покупки если фильтр позволяет
        if (this.allPurchases && (this.transactionFilter === 'all' || this.transactionFilter === 'completed')) {
          const productSales = this.allPurchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchase.productName === product.name && 
                   purchaseDate >= startTime && 
                   purchaseDate < endTime;
          });
          productTransactions = productTransactions.concat(productSales.map(sale => ({ ...sale, type: 'purchase' })));
        }
        
        // Добавляем возвраты если фильтр позволяет
        if (this.allReturns && (this.transactionFilter === 'all' || this.transactionFilter === 'returned')) {
          const productReturns = this.allReturns.filter(returnItem => {
            const returnDate = new Date(returnItem.date);
            return returnItem.productName === product.name && 
                   returnDate >= startTime && 
                   returnDate < endTime;
          });
          productTransactions = productTransactions.concat(productReturns.map(returnItem => ({ ...returnItem, type: 'return' })));
        }
        
        if (productTransactions.length > 0) {
          const totalSalesInPeriod = productTransactions.reduce((sum, transaction) => {
            if (transaction.type === 'return') {
              return sum - (transaction.total || 0); // Вычитаем возвраты
            }
            return sum + (transaction.total || 0);
          }, 0);
          
          activeProducts.push({
            ...product,
            periodSales: productTransactions,
            salesCount: productTransactions.length,
            totalSalesInPeriod: totalSalesInPeriod
          });
        }
      });
      
      return activeProducts;
    },

    formatPeriodText(timeSlot) {
      const start = timeSlot.startTime;
      const end = timeSlot.endTime;
      
      switch (this.timeFilter) {
        case 'hour':
          return `${start.getHours()}:00 - ${end.getHours()}:00, ${start.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en')}`;
        case 'day':
          return start.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en');
        case 'week':
          return `${start.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en')} - ${end.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en')}`;
        case 'month':
          return start.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en', { month: 'long', year: 'numeric' });
        case 'year':
          return start.getFullYear().toString();
        default:
          return start.toLocaleDateString(this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en');
      }
    },
    
    closePointDetails() {
      this.pointDetailsModal.show = false;
    },
    

    
    formatDateTime(date) {
      if (!date) return this.$t('common.noData');
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    },
    
    getCurrentChartTitle() {
      if (this.selectedProductForChart) {
        const filterText = this.transactionFilter === 'completed' ? this.$t('analytics.dataTypes.completed') + ' Sales' : this.$t('analytics.dataTypes.returned');
        return `${this.selectedProductForChart} ${filterText}`;
      }
      return this.dataType === 'registrations' ? this.$t('analytics.dataTypes.registrations') + ' ' + this.$t('navigation.products') : this.$t('analytics.dataTypes.activity') + ' ' + this.$t('navigation.products');
    },
    
    getModalTitle() {
      if (this.transactionFilter === 'completed') {
        return this.$t('analytics.modal.sales');
      } else if (this.transactionFilter === 'returned') {
        return this.$t('analytics.modal.returned');
      }
      return this.pointDetailsModal.title;
    },
    
    exitChartExpandedMode() {
      if (this.pointDetailsModal.show) {
        this.pointDetailsModal.show = false;
      } else if (this.isChartExpanded) {
        this.isChartExpanded = false;
      } else if (this.dataType === 'registrations') {
        // Очищаем поиск при возврате назад
        this.clearSearch();
        // Возврат на предыдущую страницу откуда пришел пользователь
        this.$router.go(-1);
      } else if (this.dataType === 'activity') {
        // Очищаем поиск при возврате к основному виду
        this.clearSearch();
        // Возврат к основному виду для customers activity
        this.dataType = 'registrations';
      }
    },
    
    generateExpandedChartData() {
      this.generateChartData();
    },
    
    getActivityForPeriod(startTime, endTime) {
      let activityCount = 0;
      
      this.customers.forEach(customer => {
        if (customer.purchases) {
          activityCount += customer.purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= startTime && purchaseDate < endTime;
          }).length;
        }
        
        if (customer.returns) {
          activityCount += customer.returns.filter(returnItem => {
            const returnDate = new Date(returnItem.date);
            return returnDate >= startTime && returnDate < endTime;
          }).length;
        }
      });
      
      return activityCount;
    },
    
    getActiveUsersForPeriod(startTime, endTime) {
      const activeUsers = [];
      
      this.customers.forEach(customer => {
        let hasActivity = false;
        let activities = [];
        let totalSpentInPeriod = 0; // Добавляем подсчет суммы
        
        if (customer.purchases) {
          const periodPurchases = customer.purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= startTime && purchaseDate < endTime;
          });
          
          if (periodPurchases.length > 0) {
            hasActivity = true;
            activities.push(...periodPurchases.map(p => ({ type: 'purchase', ...p })));
            // Рассчитываем общую сумму покупок в периоде
            totalSpentInPeriod = periodPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
          }
        }
        
        if (customer.returns) {
          const periodReturns = customer.returns.filter(returnItem => {
            const returnDate = new Date(returnItem.date);
            return returnDate >= startTime && returnDate < endTime;
          });
          
          if (periodReturns.length > 0) {
            hasActivity = true;
            activities.push(...periodReturns.map(r => ({ type: 'return', ...r })));
          }
        }
        
        if (hasActivity) {
          activeUsers.push({
            ...customer,
            periodActivities: activities,
            activityCount: activities.length,
            totalSpentInPeriod: totalSpentInPeriod // Добавляем сумму в периоде
          });
        }
      });
      
      return activeUsers;
    },
    
    getRightPanelValue() {
      if (this.rightPanelDataType === 'registration') {
        return this.getRegistrationsForPeriod();
      } else {
        return this.getActivityForRightPanel();
      }
    },
    
    getRightPanelLabel() {
      if (this.rightPanelDataType === 'registration') {
        return `Registrations for ${this.getRightPanelPeriodText()}`;
      } else {
        return `Activities for ${this.getRightPanelPeriodText()}`;
      }
    },
    
    getRightPanelPeriodText() {
      const periods = {
        hour: 'hour',
        day: 'day',
        week: 'week'
      };
      return periods[this.rightPanelTimeFilter] || 'day';
    },
    
    getRegistrationsForPeriod() {
      const now = new Date();
      const startTime = new Date(now);
      
      switch (this.rightPanelTimeFilter) {
        case 'hour':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case 'day':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(startTime.getDate() - 7);
          break;
      }
      
      return this.customers.filter(customer => {
        const firstPurchaseDate = new Date(customer.firstPurchase);
        return firstPurchaseDate >= startTime && firstPurchaseDate <= now;
      }).length;
    },
    
    getActivityForRightPanel() {
      const now = new Date();
      const startTime = new Date(now);
      
      switch (this.rightPanelTimeFilter) {
        case 'hour':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case 'day':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(startTime.getDate() - 7);
          break;
      }
      
      return this.getActivityForPeriod(startTime, now);
    },
    
    toggleCustomersExpanded() {
      this.isCustomersExpanded = !this.isCustomersExpanded;
    },
    
    exitCustomersExpandedMode() {
      this.isCustomersExpanded = false;
      this.expandedCustomer = null;
    },

    handleCustomerScroll(event) {
      event.preventDefault();
      const container = this.$refs.customersList;
      if (container) {
        // Более плавная прокрутка с меньшим шагом
        const scrollAmount = event.deltaY * 0.8;
        container.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    },

    // НОВЫЕ МЕТОДЫ ДЛЯ ПРОФЕССИОНАЛЬНОГО ИНТЕРФЕЙСА
    getCustomerPhone(customer) {
      const phones = [
        '+7 (999) 123-45-67',
        '+7 (985) 234-56-78',
        '+7 (926) 345-67-89',
        '+7 (903) 456-78-90',
        '+7 (916) 567-89-01'
      ]
      return phones[customer.id % phones.length]
    },

    getCustomerLocation(customer) {
      const locations = [
        this.$t('pages.products.analytics.locations.moscow'),
        this.$t('pages.products.analytics.locations.spb'),
        this.$t('pages.products.analytics.locations.novosibirsk'),
        this.$t('pages.products.analytics.locations.ekaterinburg'),
        this.$t('pages.products.analytics.locations.kazan')
      ]
      return locations[customer.id % locations.length]
    },

    getCustomerReturnRate(customer) {
      const returns = this.getCustomerReturns(customer)
      return customer.purchasesCount > 0 ? returns.length / customer.purchasesCount : 0
    },

    getCustomerReturns(customer) {
      return customer.returns || [] // Возвращаем только реальные возвраты или пустой массив
    },

    getCustomerLifetime(customer) {
      const registrationDate = new Date(customer.firstPurchase)
      const now = new Date()
      const diffTime = Math.abs(now - registrationDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 30) {
        return `${diffDays} дней`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months} мес.`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${years} лет`
      }
    },

    getLastActivity(customer) {
      const activities = this.getAllActivities(customer)
      if (activities.length === 0) return this.$t('pages.products.analytics.noActivity')
      
      const lastActivity = activities[0] // Уже отсортированы по дате
      return lastActivity.title
    },

    getLastActivityTime(customer) {
      const activities = this.getAllActivities(customer)
      if (activities.length === 0) return ''
      
      const lastActivity = activities[0]
      const now = new Date()
      const activityDate = new Date(lastActivity.date)
      const diffTime = Math.abs(now - activityDate)
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) {
        return `${diffHours} часов назад`
      } else {
        const diffDays = Math.ceil(diffHours / 24)
        return `${diffDays} дней назад`
      }
    },

    getFavoriteCategory(customer) {
      const categories = [
        this.$t('pages.products.analytics.categories.electronics'),
        this.$t('pages.products.analytics.categories.clothing'),
        this.$t('pages.products.analytics.categories.homeGarden'),
        this.$t('pages.products.analytics.categories.sports'),
        this.$t('pages.products.analytics.categories.books')
      ]
      return categories[customer.id % categories.length]
    },

    getFavoriteCategoryCount(customer) {
      return Math.floor(customer.purchasesCount * 0.4) + 1
    },

    getLoyaltyStatus(customer) {
      if (customer.totalValue > 10000) return this.$t('pages.products.analytics.loyaltyStatus.platinum')
      if (customer.totalValue > 5000) return this.$t('pages.products.analytics.loyaltyStatus.gold')
      if (customer.totalValue > 2000) return this.$t('pages.products.analytics.loyaltyStatus.silver')
      return this.$t('pages.products.analytics.loyaltyStatus.bronze')
    },

    getLoyaltyPoints(customer) {
      return Math.floor(customer.totalValue * 0.1)
    },

    getMonthlyActivity(customer) {
      const months = [
        this.$t('pages.products.analytics.months.jan'),
        this.$t('pages.products.analytics.months.feb'),
        this.$t('pages.products.analytics.months.mar'),
        this.$t('pages.products.analytics.months.apr'),
        this.$t('pages.products.analytics.months.may'),
        this.$t('pages.products.analytics.months.jun')
      ]
      const maxValue = customer.totalValue
      
      return months.map((name, index) => {
        const value = Math.floor(Math.random() * maxValue * 0.3) + 100
        return {
          name,
          value,
          percentage: (value / maxValue) * 100
        }
      })
    },

    getRecentTransactions(customer) {
      const transactions = []
      
      // Добавляем покупки
      customer.purchases.slice(0, 3).forEach(purchase => {
        transactions.push({
          id: purchase.id,
          type: 'purchase',
          title: purchase.productName,
          date: purchase.date,
          amount: purchase.total
        })
      })
      
      // Добавляем возвраты
      const returns = this.getCustomerReturns(customer)
      returns.slice(0, 2).forEach(returnItem => {
        transactions.push({
          id: returnItem.id,
          type: 'return',
          title: `Возврат: ${returnItem.productName}`,
          date: returnItem.date,
          amount: -returnItem.amount
        })
      })
      
      return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    },

    getCategoryColor(category) {
      const colors = {
        [this.$t('pages.products.analytics.categories.electronics')]: 'blue',
        [this.$t('pages.products.analytics.categories.clothing')]: 'pink',
        [this.$t('pages.products.analytics.categories.homeGarden')]: 'green',
        [this.$t('pages.products.analytics.categories.sports')]: 'orange',
        [this.$t('pages.products.analytics.categories.books')]: 'purple',
        'Общее': 'grey' // Оставляем как есть, так как это системное название
      }
      return colors[category] || 'grey'
    },

    getStatusColor(status) {
      const colors = {
        [this.$t('pages.products.analytics.orderStatus.completed')]: 'success',
        [this.$t('pages.products.analytics.orderStatus.processing')]: 'warning',
        [this.$t('pages.products.analytics.orderStatus.cancelled')]: 'error',
        [this.$t('pages.products.analytics.orderStatus.delivered')]: 'success'
      }
      return colors[status] || 'success'
    },

    getCustomerBirthday(customer) {
      const year = 1980 + (customer.id % 30)
      const month = (customer.id % 12) + 1
      const day = (customer.id % 28) + 1
      return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
    },

    getCustomerCountry(customer) {
      return this.$t('pages.products.analytics.country')
    },

    getCustomerCity(customer) {
      const cities = [
        this.$t('pages.products.analytics.cities.moscow'),
        this.$t('pages.products.analytics.cities.spb'),
        this.$t('pages.products.analytics.cities.novosibirsk'),
        this.$t('pages.products.analytics.cities.ekaterinburg')
      ]
      return cities[customer.id % cities.length]
    },

    getCustomerAddress(customer) {
      const streets = [
        this.$t('pages.products.analytics.streets.lenin'),
        this.$t('pages.products.analytics.streets.pushkin'),
        this.$t('pages.products.analytics.streets.peace'),
        this.$t('pages.products.analytics.streets.gagarin')
      ]
      const street = streets[customer.id % streets.length]
      const building = (customer.id % 100) + 1
      const apartment = (customer.id % 200) + 1
      return `${street}, д. ${building}, кв. ${apartment}`
    },

    getCustomerZipCode(customer) {
      return `${100000 + (customer.id % 99999)}`
    },

    getCustomerPaymentMethod(customer) {
      const methods = [
        this.$t('pages.products.analytics.paymentMethods.visa'),
        this.$t('pages.products.analytics.paymentMethods.mastercard'),
        this.$t('pages.products.analytics.paymentMethods.mir'),
        this.$t('pages.products.analytics.paymentMethods.paypal')
      ]
      return methods[customer.id % methods.length]
    },

    getCustomerCardLast4(customer) {
      return `${1000 + (customer.id % 9000)}`
    },

    getCustomerCardExpiry(customer) {
      const month = (customer.id % 12) + 1
      const year = 2025 + (customer.id % 5)
      return `${month.toString().padStart(2, '0')}/${year}`
    },

    getLastLoginDate(customer) {
      const now = new Date()
      const daysAgo = customer.id % 30
      const loginDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      return this.formatDateOnly(loginDate)
    },

    getAccountStatus(customer) {
      return customer.totalValue > 1000 ? this.$t('pages.products.analytics.accountStatus.active') : this.$t('pages.products.analytics.accountStatus.regular')
    },

    getNewsletterStatus(customer) {
      return customer.id % 3 === 0 ? this.$t('pages.products.analytics.newsletterStatus.subscribed') : this.$t('pages.products.analytics.newsletterStatus.notSubscribed')
    },

    viewPurchaseDetails(purchase) {
      // Логика для просмотра деталей покупки
      console.log(this.$t('pages.products.analytics.actions.viewPurchaseDetails'), purchase)
    },

    downloadInvoice(purchase) {
      // Логика для скачивания счета
      console.log(this.$t('pages.products.analytics.actions.downloadInvoice'), purchase)
    },

    getPaymentMethodText(method) {
      const methods = {
        'card': 'Card',
        'cash': 'Cash', 
        'transfer': 'Transfer'
      };
      return methods[method] || method || 'Not specified';
    },
    
    getPaymentMethodColor(method) {
      const colors = {
        'card': 'blue',
        'cash': 'green',
        'transfer': 'purple'
      };
      return colors[method] || 'grey';
    },
    
    getPaymentMethodTextColor(method) {
      return 'white';
    },
    
    getPaymentMethodIcon(method) {
      const icons = {
        'card': 'mdi-credit-card',
        'cash': 'mdi-cash',
        'transfer': 'mdi-bank-transfer'
      };
      return icons[method] || 'mdi-help-circle';
    },
    
    getPaymentMethodChipClass(method) {
      if (method === 'cash' || method === 'card') {
        return 'payment-method-chip-small';
      }
      return '';
    },

    handleTableScroll(event, tableType = 'purchases') {
      event.preventDefault();
      const container = event.target.closest('.table-body');
      if (container) {
        const scrollAmount = event.deltaY * 0.8;
        container.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    },

    getRandomPaymentMethod() {
      const methods = ['card', 'cash', 'transfer']
      return methods[Math.floor(Math.random() * methods.length)]
    },
    


    // Добавьте эти новые методы:
    addScrollHandler() {
      const modalBody = document.querySelector('.modal-body')
      if (modalBody) {
        modalBody.addEventListener('wheel', this.forceScroll, { passive: false })
        modalBody.addEventListener('mousewheel', this.forceScroll, { passive: false })
        modalBody.addEventListener('DOMMouseScroll', this.forceScroll, { passive: false })
      }
    },

    removeScrollHandler() {
      const modalBody = document.querySelector('.modal-body')
      if (modalBody) {
        modalBody.removeEventListener('wheel', this.forceScroll)
        modalBody.removeEventListener('mousewheel', this.forceScroll)
        modalBody.removeEventListener('DOMMouseScroll', this.forceScroll)
      }
    },

    forceScroll(event) {
      event.preventDefault()
      event.stopPropagation()
      
      const target = event.currentTarget
      const delta = event.deltaY || event.wheelDelta || event.detail
      
      // Принудительно прокручиваем
      if (delta > 0) {
        target.scrollTop += 50
      } else {
        target.scrollTop -= 50
      }
      
      return false
    },

    scrollUp() {
      const modalBody = document.querySelector('.modal-body')
      if (modalBody) {
        modalBody.scrollTop -= 100
      }
    },

    scrollDown() {
      const modalBody = document.querySelector('.modal-body')
      if (modalBody) {
        modalBody.scrollTop += 100
      }
    },

    getCustomerInitials(name) {
      if (!name) return '?';
      return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
    },

    async showProductDetails(product) {
      // Закрываем модальное окно периода
      this.closePointDetails();
      
      // Находим полную информацию о продукте
      const fullProduct = this.productsList.find(p => p.name === product.name);
      if (fullProduct) {
        // Добавляем все активности продукта
        const activities = await this.getProductActivities(fullProduct);
        const productWithActivities = {
          ...fullProduct,
          allActivities: activities
        };
        
        // Показываем детали продукта
        this.selectedProductForDetail = productWithActivities;
        this.isCustomersExpanded = true;
        this.expandedCustomer = null;
        this.activeTab = 0;
      }
    },

    // Функция инициализации скроллинга для модального окна
    initModalScroll() {
      this.$nextTick(() => {
        const usersListElement = this.$refs.usersListModal;
        if (usersListElement) {
          this.setupSmoothScroll(usersListElement);
          this.setupDragScroll(usersListElement);
        }
      });
    },

    // Плавный скроллинг с колесиком мыши
    setupSmoothScroll(element) {
      let targetScrollTop = element.scrollTop;
      let isScrolling = false;
      const smoothness = 0.15;
      const speed = 1.5;

      function smoothScroll() {
        const currentScrollTop = element.scrollTop;
        const delta = targetScrollTop - currentScrollTop;
        
        if (Math.abs(delta) > 0.5) {
          element.scrollTop += delta * smoothness;
          requestAnimationFrame(smoothScroll);
        } else {
          element.scrollTop = targetScrollTop;
          isScrolling = false;
        }
      }

      element.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        targetScrollTop += e.deltaY * speed;
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
        
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(smoothScroll);
        }
      }, { passive: false });
    },

    // Скроллинг перетаскиванием мыши
    setupDragScroll(element) {
      let isDown = false;
      let startY;
      let scrollTop;
      let velocityY = 0;
      let momentumID = 0;
      const momentum = 0.95;
      const sensitivity = 1.2;

      element.style.cursor = 'grab';

      function beginMomentumTracking() {
        cancelMomentumTracking();
        momentumID = requestAnimationFrame(momentumLoop);
      }

      function cancelMomentumTracking() {
        cancelAnimationFrame(momentumID);
      }

      function momentumLoop() {
        element.scrollTop += velocityY;
        velocityY *= momentum;
        
        if (Math.abs(velocityY) > 0.5) {
          momentumID = requestAnimationFrame(momentumLoop);
        }
      }

      element.addEventListener('mousedown', (e) => {
        isDown = true;
        element.style.cursor = 'grabbing';
        startY = e.pageY - element.offsetTop;
        scrollTop = element.scrollTop;
        cancelMomentumTracking();
      });

      element.addEventListener('mouseleave', () => {
        isDown = false;
        element.style.cursor = 'grab';
        beginMomentumTracking();
      });

      element.addEventListener('mouseup', () => {
        isDown = false;
        element.style.cursor = 'grab';
        beginMomentumTracking();
      });

      element.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const y = e.pageY - element.offsetTop;
        const walkY = (y - startY) * sensitivity;
        
        const prevScrollTop = element.scrollTop;
        element.scrollTop = scrollTop - walkY;
        
        velocityY = element.scrollTop - prevScrollTop;
      });
    },

    getActivityChipColor(activity) {
      if (activity.type === 'purchase') return '#4CAF50'
      if (activity.type === 'return') return '#FFC107'
      if (activity.status === 'returned') return '#FFC107'
      if (activity.status === 'added') return '#FF9800'
      if (activity.status === 'removed') return '#ef4444'
      if (activity.status === 'edit') return '#6366f1'
      return '#2196F3'
    },

    getActivityChipTextColor(activity) {
      if (activity.type === 'purchase' || activity.type === 'return' || activity.status === 'returned') return 'black'
      return 'white'
    },

    getActivityChipText(activity) {
      if (activity.type === 'purchase') return this.$t('analytics.customer.tableHeaders.completed')
      if (activity.type === 'return') return this.$t('analytics.customer.tableHeaders.returned')
      if (activity.status === 'returned') return this.$t('analytics.customer.tableHeaders.returned')
      if (activity.status === 'added') return this.$t('analytics.customer.tableHeaders.added')
      if (activity.status === 'removed') return this.$t('analytics.customer.tableHeaders.removed')
      if (activity.status === 'edit' || activity.status === 'edited') return this.$t('analytics.customer.tableHeaders.edited')
      if (activity.status === 'completed') return this.$t('analytics.customer.tableHeaders.completed')
      if (activity.status === 'processing') return this.$t('analytics.customer.tableHeaders.processing')
      if (activity.status === 'cancelled') return this.$t('analytics.customer.tableHeaders.cancelled')
      if (activity.status === 'delivered') return this.$t('analytics.customer.tableHeaders.delivered')
      if (activity.status === 'registered') return this.$t('analytics.customer.tableHeaders.registered')
      return activity.status ? String(activity.status).charAt(0).toUpperCase() + String(activity.status).slice(1) : this.$t('aiAssistant.customerCreatedAccount')
    },

    getTranslatedReason(reason) {
      if (!reason) return this.$t('analytics.customer.operationDescriptions.noReasonSpecified')
      
      // Проверяем, есть ли перевод для этой причины
      const translatedReason = this.$t(`analytics.customer.returnReasons.${reason}`)
      if (translatedReason && translatedReason !== `analytics.customer.returnReasons.${reason}`) {
        return translatedReason
      }
      
      // Если перевода нет, возвращаем оригинальную причину с заглавной буквы
      return String(reason).charAt(0).toUpperCase() + String(reason).slice(1).replace(/_/g, ' ')
    },

    getTranslatedDescription(description) {
      if (!description) return description
      
      // Список паттернов для перевода
      const patterns = [
        { pattern: /^Product added$/i, key: 'productAdded' },
        { pattern: /^Edited: Price$/i, key: 'editedPrice' },
        { pattern: /^Edited: Description$/i, key: 'editedDescription' },
        { pattern: /^Edited: Category$/i, key: 'editedCategory' },
        { pattern: /^Stock added: \+(\d+)$/i, key: 'stockAdded' },
        { pattern: /^Stock adjusted: ([\+\-]?\d+)$/i, key: 'stockAdjusted' },
        { pattern: /^Return: defective$/i, key: 'returnDefective' },
        { pattern: /^Return: wrong_item$/i, key: 'returnWrongItem' },
        { pattern: /^Return: customer_request$/i, key: 'returnCustomerRequest' },
        { pattern: /^Return: damaged$/i, key: 'returnDamaged' },
        { pattern: /^Return: not_satisfied$/i, key: 'returnNotSatisfied' }
      ]
      
      for (const { pattern, key } of patterns) {
        if (pattern.test(description)) {
          const translated = this.$t(`analytics.customer.activityDescriptions.${key}`)
          if (translated && translated !== `analytics.customer.activityDescriptions.${key}`) {
            // Для Stock операций нужно сохранить числа
            if (key === 'stockAdded' || key === 'stockAdjusted') {
              const match = description.match(pattern)
              if (match) {
                return translated.replace(/\d+/, match[1])
              }
            }
            return translated
          }
        }
      }
      
      return description
    },

    async onProductsChanged() {
      // Очищаем предыдущий таймер если он есть
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout)
      }
      
      // Устанавливаем новый таймер с debounce 500ms
      this.updateTimeout = setTimeout(async () => {
        // Обновляем базовые данные
        await this.fetchCustomersData()
        await this.loadAllProductActivities()
        // Если открыт детальный просмотр — обновляем активности для выбранного товара
        if (this.selectedProductForDetail) {
          const updatedProduct = this.allProducts.find(p => p.id === this.selectedProductForDetail.id) || this.selectedProductForDetail
          const activities = await this.getProductActivities(updatedProduct)
          this.selectedProductForDetail = { ...updatedProduct, allActivities: activities }
        }
      }, 500)
    },

    onProductActivityAdded(activity) {
      // Отключено, чтобы избежать дублей. История обновляется из сервера в onProductsChanged/getProductActivities
      return
    },

    // Генерация графика при открытии детального просмотра продукта
    initializeProductChart() {
      this.$nextTick(() => {
        this.generateProductChart()
      })
    },

    generateProductChart() {
      if (!this.selectedProductForDetail) return

      const productName = this.selectedProductForDetail.name
      const productPurchases = this.allPurchases.filter(purchase => 
        purchase.productName === productName
      )

      // Группируем покупки по дням за последние 30 дней
      const now = new Date()
      const days = 30
      const salesData = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const daySales = productPurchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date)
          return purchaseDate >= date && purchaseDate < nextDay
        })
        
        salesData.push({
          date: new Date(date),
          value: daySales.length
        })
      }

      this.generateProductSVGElements(salesData)
    },

    generateProductSVGElements(data) {
      const width = 500
      const height = 300
      const padding = 40
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2

      // Генерируем сетку
      this.productGridLines = []
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i
        this.productGridLines.push({
          id: `h-${i}`,
          x1: padding,
          y1: y,
          x2: width - padding,
          y2: y
        })
      }

      for (let i = 0; i <= data.length - 1; i += Math.ceil(data.length / 6)) {
        const x = padding + (chartWidth / (data.length - 1)) * i
        this.productGridLines.push({
          id: `v-${i}`,
          x1: x,
          y1: padding,
          x2: x,
          y2: height - padding
        })
      }

      const maxValue = Math.max(...data.map(d => d.value), 1)
      const minValue = Math.min(...data.map(d => d.value))
      const valueRange = maxValue - minValue || 1

      // Генерируем точки графика
      this.productChartPoints = data.map((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight

        return {
          x,
          y,
          value: point.value,
          date: point.date
        }
      })

      // Генерируем путь линии
      this.productChartPath = this.productChartPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')
    },

    // Методы для подсчета активностей
    getPurchaseActivitiesCount() {
      if (!this.selectedProductForDetail || !this.selectedProductForDetail.allActivities) return 0
      return this.selectedProductForDetail.allActivities.filter(activity => 
        activity.type === 'purchase'
      ).length
    },

    getReturnActivitiesCount() {
      if (!this.selectedProductForDetail || !this.selectedProductForDetail.allActivities) return 0
      return this.selectedProductForDetail.allActivities.filter(activity => 
        activity.type === 'return'
      ).length
    },

    // Метод для открытия деталей заказа
    openOrderDetails(sale) {
      // Создаем объект заказа с деталями
      const orderWithDetails = {
        ...sale,
        // Добавляем дополнительную информацию если нужно
      };
      this.selectedOrderForDetail = orderWithDetails;
      

    }

  }
  }

</script>
<style scoped>
.app-bar {
  width: 100%;
  height: 80px;
  background: #ffffff;
  color: #000000;
  align-items: center;
  padding-left: 20px;
  box-sizing: border-box;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}

.app-bar h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.home-color {
  color: #a3a3a3;
}

.chart-title {
  font-size: 28px;
  color: #000000;
  margin: 0 0 5px 0;
  text-align: center;
  font-weight: 700;
  z-index: 10;
  position: relative;
  line-height: 1.4; /* Добавляем достаточную высоту строки для отображения нижних частей букв */
  overflow: visible; /* Убеждаемся, что текст не обрезается */
}

.company-email {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
  font-weight: 400;
}

.customer-email-header {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
  font-weight: 400;
  text-align: center;
}

.chart-subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin: 0 0 20px 0;
  text-align: center;
  z-index: 10;
  position: relative;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.chart-title-section {
  flex: 1;
  min-width: 200px;
  overflow: visible; /* Убеждаемся, что содержимое не обрезается */
  padding: 8px 0; /* Добавляем отступы для предотвращения обрезания */
}

.chart-mode-selector {
  display: flex;
  align-items: center;
}

.mode-toggle {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.mode-btn {
  margin: 0 2px;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.mode-btn.v-btn--active {
  background: #a302d4 !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.mode-btn:not(.v-btn--active) {
  background: transparent;
  color: #6c757d;
}

.mode-btn:not(.v-btn--active):hover {
  background: #e9ecef;
  color: #495057;
}

.chart-mode-selector-expanded {
  margin-bottom: 16px;
}

.mode-toggle-expanded {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.mode-toggle-expanded .v-btn {
  border-radius: 10px !important;
  margin: 4px;
  text-transform: none;
  font-weight: 600;
  font-size: 14px;
  min-width: 140px;
  padding: 12px 20px;
}

.mode-toggle-expanded .v-btn--active {
  background: linear-gradient(135deg, #a302d4, #7c3aed) !important;
  color: white !important;
  box-shadow: 0 4px 16px rgba(163, 2, 212, 0.4);
}

.chart-filters-with-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.stats-container {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-card-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  text-align: center;
  transition: all 0.2s;
  min-width: 0;
}

.stat-card-filter:hover {
  background: #f8f9fa;
  border-color: #007bff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.stat-value-filter {
  font-size: 16px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 2px;
  line-height: 1.2;
}

.stat-label-filter {
  font-size: 10px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.time-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e9ecef;
}

.filter-btn.active {
  background: #a302d4;
  color: white;
  border-color: #a302d4;
}

.chart-period {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
  font-weight: 400;
}

.chart-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f1f5f9;
}

.analytics-layout {
  display: grid;
  grid-template-columns: 500px 500px;
  gap: 24px;
  margin-top: 20px;
  transition: grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  overflow: visible;
}

.analytics-layout.chart-expanded {
  grid-template-columns: 1fr 0px;
  gap: 0;
}

.chart-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 5px 32px;
  border: 1px solid rgba(163, 2, 212, 0.1);
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.chart-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(163, 2, 212, 0.2);
  border-color: #a302d4;
}

.expand-chart-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(163, 2, 212, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.8);
  z-index: 10;
}

.chart-section:hover .expand-chart-btn {
  opacity: 1;
  transform: scale(1);
}

.expand-chart-btn:hover {
  background: rgba(163, 2, 212, 0.2);
  transform: scale(1.1);
}

.close-expanded-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-expanded-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}



.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a302d4, #7c3aed, #5b21b6);
  border-radius: 16px 16px 0 0;
}


.chart-header {
  margin-top: 10px;
  margin-bottom: -10px;
}

.chart-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}


.main-chart {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-svg {
  border-radius: 8px;
  background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
}

.chart-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 2s ease-in-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.chart-area {
  opacity: 0;
  animation: fadeInArea 1.5s ease-in-out 0.5s forwards;
}

@keyframes fadeInArea {
  to {
    opacity: 1;
  }
}

.chart-point {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.chart-point-clickable {
  cursor: pointer;
}

.chart-point-clickable:hover {
  stroke-width: 4;
  r: 8;
}

.chart-point:hover {
  r: 8;
  filter: url(#pointGlow);
  transform: scale(1.2);
}

.chart-point.point-active {
  r: 8;
  fill: #a302d4;
  stroke: #ffffff;
  stroke-width: 4;
  filter: url(#pointGlow);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.chart-point-stable {
  transform-origin: center;
  transition: none !important;
  animation: none !important;
}

.chart-point-stable:hover {
  transform: none !important;
  r: 6 !important;
}

.chart-point-stable.point-active {
  transform: none !important;
  filter: url(#pointGlow) !important;
}

.chart-points circle {
  transition: none;
  transform: none;
  animation: none;
}

.hover-line {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.6;
  }
}

.axis-labels {
  position: relative;
  margin-top: 16px;
}

.x-axis-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 60px;
}

.x-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  min-width: 60px;
}

.y-axis-labels {
  position: absolute;
  left: 20px;
  top: -400px;
  height: 400px;
}

.y-label {
  position: absolute;
  right: 100%;
  margin-right: 12px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.customers-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  border: 1px solid rgba(163, 2, 212, 0.1);
  position: relative;
  overflow: hidden;
  width: 630px;
  height: 800px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  cursor: pointer;
}

.customers-section.expanded {
  position: fixed;
  top: 508px;
  right: 900px;
  transform: translate(50%, -50%);
  width: 1650px !important;
  min-height: 800px;
  border-radius: 16px;
  padding: 32px;
  overflow-y: auto;
  background: white;
  z-index: 1000;
  animation: slideToLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

@keyframes slideToLeft {
  from {
    transform: translate(100%, -50%);
    opacity: 0;
  }
  to {
    transform: translate(50%, -50%);
    opacity: 1;
  }
}

.customers-section:hover:not(.expanded) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(163, 2, 212, 0.2);
  border-color: #a302d4;
}

.customers-section.hidden {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
  border: none;
}



.customers-search-input.v-text-field--outlined fieldset {
  border-color: #dee2e6;
}

.customers-search-input.v-text-field--outlined:hover fieldset {
  border-color: #a302d4;
}

.customers-search-input.v-text-field--outlined.v-input--is-focused fieldset {
  border-color: #a302d4;
  border-width: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
  z-index: 5;
  overflow: visible;
}

.section-header .chart-title {
  font-size: 28px;
  color: #000000;
  margin: 0;
  text-align: center;
  font-weight: 700;
  line-height: 1.2;
  z-index: 10;
  position: relative;
  flex: 1;
  transform: translateY(-7px);
}

.customers-search-input {
  max-width: 200px;
  min-width: 200px;
  z-index: 10 !important;
}



.customers-search-input .v-text-field__details {
  display: none !important;
}





.customers-search-input fieldset {
  border-radius: 25px !important;
}

.back-btn {
  background-color: rgba(163, 2, 212, 0.1);
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 1;
}

.back-btn:hover {
  background-color: rgba(163, 2, 212, 0.2);
  transform: scale(1.1);
}

.back-btn .v-icon {
  color: #a302d4;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(163, 2, 212, 0.3);
  z-index: 10;
}

.back-btn {
  background-color: rgba(163, 2, 212, 0.1);
  border-radius: 50%;
  z-index: 5;
  margin: 4px 0; /* Добавляем отступы сверху и снизу */
}

.back-btn:hover {
  background-color: rgba(163, 2, 212, 0.2);
  z-index: 10;
}

/* Обновляем контейнеры для обеспечения видимости кнопки */
.chart-title-section {
  padding: 8px 0; /* Добавляем отступы сверху и снизу */
  overflow: visible; /* Убеждаемся, что содержимое не обрезается */
}

.section-header {
  padding: 8px 0; /* Добавляем отступы сверху и снизу */
  overflow: visible; /* Убеждаемся, что содержимое не обрезается */
}

.section-title { 
  margin-bottom: 40px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.compact-search {
  margin-bottom: 16px;
}

.customers-list {
  flex: 1;
  overflow-y: auto; /* Включаем скроллинг для списка товаров */
  height: calc(100% - 60px); /* Адаптивная высота по колонке */
  margin-top: 8px;
  padding-top: 0;
  padding-right: 8px;
  scrollbar-width: thin; /* Тонкий скроллбар для Firefox */
  scrollbar-color: rgba(128, 128, 128, 0.4) transparent; /* Серый цвет скроллбара */
}

/* Стили скроллбара для WebKit браузеров (Chrome, Safari) */
.customers-list::-webkit-scrollbar {
  width: 6px;
}

.customers-list::-webkit-scrollbar-track {
  background: transparent;
}

.customers-list::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.4);
  border-radius: 3px;
}

.customers-list::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.6);
}

/* Скроллинг убран с внешнего контейнера - теперь только внутренние элементы */


.customers-section.expanded .customers-list {
  height: calc(100vh - 200px); 
  overflow-y: auto; /* Включаем скроллинг для расширенного режима */
}

.customer-item {
  border-bottom: 1px solid #f3f4f6;
  padding: 12px 0;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin: 4px 0;
  position: relative;
  overflow: hidden;
}

.customer-item::before {
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

.customer-item:hover {
  border-color: #a302d4;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(163, 2, 212, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #a302d4;
  border-radius: 12px;
}


.customers-section[data-product-detail] .customer-item::before {
  display: none;
}

.customers-section[data-product-detail] .customer-item:hover {
  border-color: initial;
  transform: none;
  box-shadow: none;
  background: initial;
  border: initial;
  border-radius: initial;
}

.customer-item:hover::before {
  transform: scaleX(1);
}

.customer-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s ease;
}

.customer-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1246af;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.customer-text-info { 
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-email {
  color: #6b7280;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-stats-compact {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stat-value-small {
  font-weight: 600;
  color: #1f2937;
  font-size: 12px;
}

.stat-label-small {
  color: #6b7280;
  font-size: 10px;
}

.expand-icon-small {
  color: #9ca3af;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.expand-icon-small.expanded {
  transform: rotate(180deg);
}

.show-more {
  color: #a302d4;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.show-more:hover {
  background-color: #f3f4f6;
}

.chart-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -8px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 2px;
}

.tooltip-value {
  font-size: 11px;
  opacity: 0.9;
}

.expanded-layout {
  display: block;
  margin-top: 20px;
}

.customers-section-expanded {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  min-height: 70vh;
}

.expanded-search {
  max-width: 400px;
}

.expanded-filters {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.customers-list-expanded {
  max-height: none;
  overflow-y: visible;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.customer-item-expanded {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  background: white;
  padding: 16px;
}

.customer-item-expanded:hover {
  border-color: #a302d4;
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.15);
  transform: translateY(-2px);
}

.expand-btn {
  color: #6b7280;
  transition: color 0.2s ease;
}

.expand-btn:hover {
  color: #a302d4;
}

.back-btn {
  background-color: rgba(163, 2, 212, 0.1);
  border-radius: 50%;
  color: #6b7280;
  transition: color 0.2s ease;
}

.back-btn:hover {
  background-color: rgba(163, 2, 212, 0.2);
  color: #a302d4;
}

.chart-expanded-layout {
  display: block;
  margin-top: 20px;
  width: 100%;
  max-width: none;
}

.chart-section-expanded {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 300px;
  width: 100%;
  margin: 0;
} 

.main-content .analytics-layout {
  grid-template-columns: 1000px 300px;

}
.main-content{
  margin-left: 60px;
  width: 1700px;
  height: 100vh;
  margin-top: 10px;
  margin-bottom: 1px;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.customer-table-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.customer-table-block .v-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.customer-table-block .v-card-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px !important;
}

.main-content .chart-expanded-layout {
  display: block !important;
  grid-template-columns: none !important;
  width: 1000px !important;
  max-width: 1000px !important;
  margin: 0 !important;
}

.chart-expanded-layout ~ .customers-section {
  display: none;
}

.chart-expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.chart-expanded-title {
  display: flex;
  align-items: center;
}

.chart-expanded-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.chart-expanded-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.chart-filters-expanded {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.filter-btn-expanded {
  padding: 10px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 80px;
}

.filter-btn-expanded:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.filter-btn-expanded.active {
  background: #a302d4;
  color: white;
  border-color: #a302d4;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.chart-container-expanded {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #f1f5f9;
}

.chart-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s ease;
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

.main-chart-expanded {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.chart-svg-expanded {
  border-radius: 12px;
  background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
}

.axis-labels-expanded {
  position: relative;
  margin-top: 20px;
}

.x-axis-labels-expanded {
  display: flex;
  justify-content: space-between;
  padding: 0 80px;
}

.x-label-expanded {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
}

.y-axis-labels-expanded {
  position: absolute;
  left: 24px;
  top: -500px;
  height: 500px;
}

.y-label-expanded {
  position: absolute;
  right: 100%;
  margin-right: 16px;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  border: 1px solid #f1f5f9;
}

@media (max-width: 1024px) {
  .analytics-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-expanded-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .chart-stats-overlay {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-section.expanded {
    transform: scale(1.15);
  }
}

@media (max-width: 768px) {
  .stats-container {
    flex-wrap: wrap;
  }
  
  .stat-card-filter {
    flex: 1 1 calc(50% - 4px);
    min-width: calc(50% - 4px);
  }
  
  .time-filters {
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px;
  }
  
  .filter-btn {
    flex: 1;
    min-width: calc(20% - 6px);
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .customers-list-expanded {
    grid-template-columns: 1fr;
  }
  
  .expanded-filters {
    flex-direction: column;
  }
  
  .analytics-layout {
    margin-top: 16px;
  }
  
  .chart-section,
  .customers-section,
  .customers-section-expanded {
    padding: 16px;
  }
  
  .chart-stats-row {
    grid-template-columns: 1fr;
  }
  
  .chart-filters-expanded {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .filter-btn-expanded {
    min-width: 60px;
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-mode-selector {
    justify-content: center;
  }
  
  .mode-btn {
    font-size: 11px;
    padding: 6px 10px;
  }
  
  .mode-toggle-expanded .v-btn {
    font-size: 11px;
    min-width: 80px;
    padding: 8px 12px;
  }
  
  .chart-section-expanded {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-stats-overlay {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .chart-section.expanded {
    transform: scale(1.05);
  }
  
  .stat-value-overlay {
    font-size: 18px;
  }
  
  .stat-label-overlay {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .stat-card-filter {
    flex: 1 1 100%;
  }
  
  .stat-value-filter {
    font-size: 14px;
  }
  
  .stat-label-filter {
    font-size: 9px;
  }
}

.details-tabs {
  margin-top: 16px;
}

.details-tabs-nav {
  margin-bottom: 16px;
}

.details-tabs-nav .v-tab {
  font-size: 12px;
  padding: 8px 12px;
  min-width: auto;
}

.purchases-history,
.returns-history,
.activity-history {
  padding: 16px;
  border-radius: 8px;
  
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.date-filter {
  width: 200px;
}

.date-filter .v-text-field {
  font-size: 1px;
}

.purchases-table,
.returns-table {
  background: transparent; /* Полностью убираем фон */
  border-radius: 12px;
  overflow: hidden;
  border: none; /* Убираем границы */
  width: 100%;
  min-height: 500px; /* Увеличиваем минимальную высоту */
}

.activity-table {
  display: flex;
  flex-direction: column;
  height: 600px; /* ограничение по высоте для скролла */
  border: 1px solid #ddd;
  border-radius: 8px;
}

.activity-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-text {
  font-weight: 500;
}

.activity-description {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name {
  font-weight: 500;
  color: #1f2937;
}

.description-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.reason-text {
  color: #ef4444;
  font-size: 0.875rem;
}

.activity-id {
  color: #9ca3af;
  font-size: 0.75rem;
}

.activity-amount.positive {
  color: #10b981;
}

.activity-amount.negative {
  color: #ef4444;
}

.table-header {
  display: flex;
  position: sticky;
  top: 0;
  background: #e9ecef; /* Более темный серый фон для заголовков */
  z-index: 10;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
  color: #495057; /* Более темный серый цвет текста заголовков */
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
}

.table-header .table-cell {
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  color: #495057; /* Более темный серый цвет для текста заголовков */
}

.table-header .table-cell:last-child {
  text-align: right;
  padding-right: 80px; /* Увеличен отступ для заголовка Status */
}

.table-body {
  overflow-y: auto;
  height: 600px;
  background: #ffffff;
}

/* Улучшенные стили для скроллбара - серый цвет */
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
  transition: all 0.3s ease;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #ffffff; /* Белый фон для строк с данными */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-row.return {
  background: #fffbeb; /* Очень мягкий желтый фон для возвратов */
}

.table-row.returned {
  background: #fffbeb; /* Очень мягкий желтый фон для статуса returned */
}

.table-row:hover {
  background: #f8f9fa; /* Светло-серый фон при наведении */
  transform: translateX(2px);
}

.table-row.return:hover {
  background: #fef3c7; /* Более темный желтый при наведении */
  transform: translateX(2px);
}

.table-row.returned:hover {
  background: #fef3c7; /* Более темный желтый при наведении */
  transform: translateX(2px);
}

.table-row.return-row:hover {
  background: rgba(239, 68, 68, 0.05); /* Слабый красный фон для возвратов */
}

.table-cell {
  flex: 1;
  padding: 8px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  display: flex;
  align-items: center;
  line-height: 1.5;
}
.table-cell:nth-child(1) {
  margin-left: 20px;
}
.table-cell:nth-child(2) {
  margin-left: 80px;
}
.table-cell:nth-child(3) {
  margin-left: 80px;
}
.table-cell:nth-child(4) {
  margin-left: 100px;
}
.table-cell:nth-child(5) {
  margin-left: 60px;
}

.table-cell:nth-child(6) {
  margin-left: 00px;
}
.table-cell:last-child {
  border-right: none;
  text-align: right;
  padding-right: 80px; /* Уменьшен отступ для Status */
}

.datetime-full {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Увеличиваем промежуток */
}

.date-part {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.time-part {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Увеличиваем промежуток */
}

.product-name {
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  font-size: 15px;
}

.product-id {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.amount-positive {
  color: #059669;
  font-weight: 700;
  font-size: 15px;
}

.amount-negative {
  color: #dc2626;
  font-weight: 700;
  font-size: 15px;
}

.activity-timeline {
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-item.purchase .activity-icon {
  background: #dcfce7;
}

.activity-item.return .activity-icon {
  background: #fee2e2;
}

.activity-item.registration .activity-icon {
  background: #dbeafe;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 13px;
  margin-bottom: 4px;
}

.activity-datetime {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.activity-description {
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 4px;
}

.activity-amount {
  font-weight: 600;
  font-size: 12px;
  color: #059669;
}

.activity-amount.negative {
  color: #dc2626;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.no-data p {
  margin-top: 16px;
  font-size: 14px;
}

.chart-point-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-point-clickable:hover {
  stroke-width: 4;
  r: 8;
}

.period-details {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.detail-row {
  margin-bottom: 8px;
  font-size: 16px;
}


.users-list::-webkit-scrollbar {
  width: 8px;
}

.users-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.users-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.users-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Стили для улучшения UX при перетаскивании */
.users-list.dragging {
  cursor: grabbing !important;
}

.users-list.dragging .user-item {
  pointer-events: none;
}

.user-item-modal {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
}

.user-avatar-modal {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.user-info-modal {
  flex: 1;
}

.user-name-modal {
  font-weight: 600;
  margin-bottom: 4px;
}

.user-email-modal {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 4px;
}

.user-date-modal {
  color: #28a745;
  font-size: 12px;
}

.user-stats-modal {
  display: flex;
  gap: 16px;
}

.stat-modal {
  text-align: center;
}

.stat-value-modal {
  display: block;
  font-weight: 600;
  color: #007bff;
}

.stat-label-modal {
  font-size: 12px;
  color: #6c757d;
}

.no-users-message {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* Modal styles - взято из BuyPage.vue */
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
  max-height: none;
  overflow: visible;
  padding-bottom: 20px;
}

.period-info-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
}

.users-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(163, 2, 212, 0.1);
  box-shadow: 0 4px 20px rgba(163, 2, 212, 0.1);
  position: relative;
  overflow: hidden;
}


.section-header {
  padding: 0 24px 16px;
}

.section-title {
  margin-bottom: 40px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-list {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  user-select: none; /* Предотвращаем выделение текста при перетаскивании */
  padding-bottom: 20px; /* Добавляем отступ снизу для списка */
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  background: #ffffff;
  margin-bottom: 4px;
}

.user-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d1d5db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}


.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.user-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.icon {
  font-size: 12px;
}

.user-stats {
  display: flex;
  gap: 16px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-weight: 600;
  color: #a302d4;
  font-size: 16px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

/* Стили для возвратов */
.return-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.return-item:hover {
  background: #f3f4f6;
}

.return-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(226, 226, 226) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.negative-value {
  color: #ef4444 !important;
}

.no-users-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  text-align: center;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-results-text {
  color: #64748b;
}

.no-results-text strong {
  color: #1e293b;
  display: block;
  margin-bottom: 8px;
}

.no-results-text p {
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

.period-summary {
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.btn-icon {
  font-size: 12px;
}

/* Responsive для модального окна деталей точки */
@media (max-width: 768px) {
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .user-avatar {
    align-self: center;
    margin-right: 0;
  }
  
  .user-stats {
    align-self: stretch;
    flex-direction: row;
    justify-content: space-around;
  }
  
  .stat {
    align-items: center;
  }
}

.filters-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.data-type-filters {
  display: flex;
  gap: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.data-type-filters .filter-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  min-width: 80px;
}

.data-type-filters .filter-btn:hover {
  background: #e9ecef;
}

.data-type-filters .filter-btn.active {
  background: #a302d4;
  color: white;
  border-color: #a302d4;
}

/* Простой поиск продуктов */
.search-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-search-field {
  max-width: 300px;
}

.product-select-field {
  max-width: 250px;
}

.selected-product-icon {
  color: #1976d2;
}

.selected-product-name {
  flex: 1;
  font-weight: 500;
  color: #1976d2;
}

.clear-product-btn {
  background: transparent !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .data-type-filters {
    width: 100%;
    justify-content: center;
  }
}
.customer-detail-full {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.customer-header-detail {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.customer-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 32px;
}

.customer-info-detail h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.customer-email-detail {
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 16px;
}

.customer-stats-detail {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #a302d4;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.details-tabs-full {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.details-tabs-nav-full {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.customer-detail-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
/* ПРОФЕССИОНАЛЬНЫЕ СТИЛИ ДЛЯ ДЕТАЛЬНОГО ПРОСМОТРА */
.customer-profile-header {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  margin-bottom: 24px;
}

.profile-avatar-section {
  position: relative;
}

.customer-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-status {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar-status.online {
  background: #10b981;
}

.profile-info-section {
  flex: 1;
}

.customer-name-section {
  margin-bottom: 16px;
}

.customer-name {
  font-size: 20px;
  font-weight: 700;
}

.customer-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.customer-contact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.profile-stats-section {
  min-width: 300px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  display: block;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.customer-tabs-navigation {
  margin-bottom: 24px;
}

.customer-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.customer-tabs-content {
  min-height: 500px;
}

/* Стили для вкладки Обзор */
.overview-section {
  padding: 24px;
}

.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.quick-stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.quick-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-stat-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.stat-main {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.stat-sub {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.activity-chart-section {
  margin-bottom: 32px;
}

.activity-chart-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.monthly-activity-chart {
  display: flex;
  gap: 12px;
  align-items: end;
  height: 200px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.month-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: end;
  margin-bottom: 8px;
}

.activity-bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #8b5cf6);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  transition: all 0.3s ease;
}

.month-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.month-value {
  font-size: 11px;
  color: #9ca3af;
}

.recent-transactions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.recent-transactions h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.transaction-item:hover {
  background: #f3f4f6;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(226, 226, 226) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.transaction-date {
  font-size: 12px;
  color: #6b7280;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 700;
}

.transaction-amount.purchase {
  color: #10b981;
}

.transaction-amount.return {
  color: #ef4444;
}

/* Стили для улучшенных таблиц */
.purchases-table-enhanced,
.returns-table-enhanced {
  
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-row.enhanced {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.table-row.enhanced:hover {
  background: #f9fafb;
}

.datetime-enhanced {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-info-enhanced {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.product-sku,
.return-id {
  font-size: 12px;
  color: #6b7280;
}

.amount-enhanced {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.amount-enhanced.positive {
  color: #10b981;
}

.amount-enhanced.negative {
  color: #ef4444;
}

.return-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #f59e0b;
}

.processing-time {
  font-size: 12px;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

/* Стили для улучшенной активности */
.activity-filters-enhanced {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.filter-chips-enhanced {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activity-filter-chip {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb !important;
}

.activity-filter-chip.active {
  background: #3b82f6 !important;
  color: white !important;
  border-color: #3b82f6 !important;
}

.timeline-container-enhanced {
  position: relative;
  padding-left: 40px;
}

.timeline-line-enhanced {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e5e7eb, transparent);
}

.timeline-item-enhanced {
  position: relative;
  margin-bottom: 32px;
}

.timeline-icon-enhanced {
  position: absolute;
  left: -28px;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.timeline-content-enhanced {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.activity-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.activity-title-enhanced {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.activity-time-enhanced {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
}

.activity-time-enhanced .date {
  display: block;
  font-weight: 600;
}

.activity-time-enhanced .time {
  display: block;
  margin-top: 2px;
}

.activity-description-enhanced {
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 12px;
}

.activity-amount-enhanced {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.activity-amount-enhanced.positive {
  background: #d1fae5;
  color: #065f46;
}

.activity-amount-enhanced.negative {
  background: #fee2e2;
  color: #991b1b;
}

.details-grid-enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.detail-item-enhanced {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.detail-label-enhanced {
  font-weight: 500;
  color: #6b7280;
}

.detail-value-enhanced {
  font-weight: 600;
  color: #111827;
  text-align: right;
}

.purchase-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px 120px 120px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  align-items: center;
}

/* Добавляем CSS order для изменения порядка колонок */
.purchase-row .purchase-cell:nth-child(1) {
  order: 1; /* Date and Time */
}

.purchase-row .purchase-cell:nth-child(2) {
  order: 2; /* pieces */
}

.purchase-row .purchase-cell:nth-child(3) {
  order: 3; /* Customer */
}

.purchase-row .purchase-cell:nth-child(4) {
  order: 4; /* Description */
}

.purchase-row .purchase-cell:nth-child(5) {
  order: 5; /* Amount */
}

.purchase-row .purchase-cell:nth-child(6) {
  order: 6; /* Status - перемещаем в конец */
}

/* Стили для профиля */
.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.info-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.info-card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.info-card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  text-align: right;
}

.no-data-illustration {
  text-align: center;
  padding: 64px 32px;
  color: #6b7280;
}

.no-data-illustration h3 {
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.no-data-illustration p {
  margin: 0;
  font-size: 14px;
}

.payment-method-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-chip {
  font-weight: 500;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  min-width: 80px;
}

.payment-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.payment-chip .v-icon {
  margin-right: 4px;
}

/* Стили для payment method chip */
.payment-method-chip {
  font-weight: 500;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  min-width: 80px;
}

.payment-method-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.payment-method-chip .v-icon {
  margin-right: 4px;
}

/* Меньшие чипы для cash и card */
.payment-method-chip-small {
  min-width: 60px !important;
  height: 24px !important;
  font-size: 11px !important;
  padding: 0 8px !important;
}

.payment-method-chip-small .v-icon {
  font-size: 12px !important;
  margin-right: 2px !important;
}



.clickable-purchase {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-purchase:hover {
  background-color: #f5f5f5;
}

/* Стили модального окна деталей покупки */
.purchase-info-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.info-value.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #a302d4;
}

.items-section {
  padding: 20px 24px;
  padding-bottom: 100px; 
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin-bottom: 80px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.scroll-buttons {
  display: flex;
  gap: 4px;
}

.scroll-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #a302d4;
  background: white;
  color: #a302d4;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.scroll-btn:hover {
  background: #a302d4;
  color: white;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.item-row:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #a302d4;
}

.item-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-details {
  color: #64748b;
  font-size: 12px;
}

.item-price {
  font-weight: 600;
  color: #059669; /* Изменяем на зеленый цвет как у activity-amount */
  font-size: 16px;
}

.footer-info {
  flex: 1;
}

.purchase-summary {
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

.btn-icon {
  font-size: 12px;
}

/* Принудительно показываем скроллбар - серый цвет */
.modal-body::-webkit-scrollbar {
  width: 8px;
  display: block;
}

.modal-body::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.modal-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-top: 1px solid #e2e8f0;
}

.clickable-purchase {
  cursor: pointer;
}

.clickable-purchase:hover {
  background-color: #f5f5f5;
}

/* Предотвращаем прокрутку фона */
body.modal-open {
  overflow: hidden !important;
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
  
  .purchase-info-section {
    padding: 16px 20px;
  }
  
  .items-section {
    padding: 16px 20px;
  }
  
  .item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .item-number {
    align-self: flex-start;
  }
  
  .item-price {
    align-self: flex-end;
    font-size: 18px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .footer-buttons {
    justify-content: center;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .customer-profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .monthly-activity-chart {
    flex-direction: column;
    height: auto;
    gap: 8px;
  }
  
  .profile-info-grid {
    grid-template-columns: 1fr;
  }
}

/* Стили для детального просмотра продукта - горизонтальный layout */ 
.product-detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 20px 0;
}


.left-panel, .right-panel {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 500px;
  display: flex;
  flex-direction: column;
}

.left-panel:hover, .right-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(163, 2, 212, 0.15);
  border-color: #a302d4;
}

.panel-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffffff20, #ffffff40, #ffffff20);
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-content {
  padding: 24px;
  flex: 1;
  background: #ffffff;
  overflow-y: auto;
}

/* Стили для статистики продукта */
.product-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.product-stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
}

.product-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.15);
  border-color: #a302d4;
}

.stat-value-product {
  font-size: 24px;
  font-weight: 700;
  color: #a302d4;
  margin-bottom: 4px;
}

.stat-label-product {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Стили для графика продукта */
.product-chart-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.chart-title-small {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.product-chart-svg {
  border-radius: 6px;
  background: #ffffff;
}

/* Responsive для панелей */
@media (max-width: 1200px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .left-panel, .right-panel {
    height: 450px;
  }
}

@media (max-width: 768px) {
  .product-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .panel-content {
    padding: 16px;
  }
  
  .panel-header {
    padding: 16px 20px;
  }
  
  .panel-title {
    font-size: 18px;
  }
  
  .stat-value-product {
    font-size: 20px;
  }
  
  .panel-stats {
    gap: 12px;
  }
  
  .stat-item {
    font-size: 11px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .product-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .panel-header {
    padding: 12px 16px;
  }
  
  .panel-title {
    font-size: 16px;
  }
  
  .panel-stats {
    flex-direction: column;
    gap: 8px;
  }
}

/* Стили для кнопок фильтрации */
.filter-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  position: relative;
  left: -100px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.filter-btn.active {
  background: #a302d4;
  border-color: #a302d4;
  color: #ffffff;
}

.filter-btn.active:hover {
  background: #8b02b8;
  border-color: #8b02b8;
}

@media (max-width: 768px) {
  .filter-buttons {
    gap: 6px;
  }
  
  .filter-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
}

/* Стили для кнопок фильтрации в основном интерфейсе */
.main-filter-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  position: relative;
  left: -150px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.main-filter-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 60px;
}

.main-filter-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.main-filter-btn.active {
  background: #a302d4;
  border-color: #a302d4;
  color: #ffffff;
}

.main-filter-btn.active:hover {
  background: #8b02b8;
  border-color: #8b02b8;
}

@media (max-width: 768px) {
  .main-filter-buttons {
    margin-left: 100px;
    gap: 4px;
  }
  
  .main-filter-btn {
    padding: 3px 8px;
    font-size: 10px;
    min-width: 50px;
  }
}
</style>
