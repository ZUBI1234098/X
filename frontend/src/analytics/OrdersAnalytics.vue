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
                  v-if="dataType === 'quantity' || dataType === 'completed'"
                  icon
                  @click="dataType === 'completed' ? goBackToAnalytics() : exitChartExpandedMode()"
                  class="back-btn hover-lift"
                  style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                  <div style="text-align: center;">
                    <h1 class="chart-title">{{ getCurrentChartTitle() }}</h1>
                    <h4 class="chart-subtitle">{{ translatedChartPeriodText }}</h4>
                  </div>
                </div>
              </div>
              
              <div class="chart-filters-with-stats">
                <div class="stats-container">
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ totalOrders }}</div>
                    <div class="stat-label-filter">{{ $t('pages.orders.totalOrders') }}</div>
                  </div>
                  <div class="stat-card-filter">
                    <div class="stat-value-filter">{{ totalEarnings >= 0 ? totalEarnings.toFixed(2) : '-' + Math.abs(totalEarnings).toFixed(2) }}</div>
                    <div class="stat-label-filter">{{ $t('pages.orders.totalRevenue') }}</div>
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
                  
                  <div class="data-type-filters">
                    <button 
                      @click="dataType = 'completed'"
                      :class="['filter-btn', { active: dataType === 'completed' }]"
                    >
                      {{ $t('analytics.dataTypes.completed') }}
                    </button>
                    <button 
                      @click="dataType = 'returned'"
                      :class="['filter-btn', { active: dataType === 'returned' }]"
                    >
                      {{ $t('analytics.dataTypes.returned') }}
                    </button>
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
            >
              <div class="section-header" @click.stop="openCustomersSection" style="position: relative; display: flex; justify-content: center; align-items: center; padding: 16px 50px 16px 50px; overflow: visible;">
                <v-btn 
                  v-if="selectedOrderForDetail || isCustomersExpanded"
                  icon
                  @click.stop="exitCustomerDetailView"
                  class="back-btn hover-lift mr-2"
                  style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div style="display: flex; align-items: center; justify-content: center; flex: 1;">
                  <h1 class="chart-title" @click="openCustomersSection">
                  {{ selectedOrderForDetail ? $t('pages.orders.orderDetails') : $t('pages.orders.latestOrders') }}
                </h1>
                </div>
                <v-text-field
                  v-if="!selectedOrderForDetail && isCustomersExpanded"
                  v-model="searchQuery"
                  :placeholder="$t('pages.buy.searchByName') || $t('common.search')"
                  hide-details
                  outlined
                  rounded
                  class="customers-search-input"
                  @click.stop
                  style="position: absolute; right: 10px; width: 160px; z-index: 10;"
                ></v-text-field>
              </div>
              
              <div class="customers-list" @click.stop @wheel="handleCustomerScroll" ref="customersList">
                <!-- Новая таблица заказов -->
                <div v-if="!selectedOrderForDetail" class="orders-table-container">
                  <div class="orders-table">
                    <!-- Заголовок таблицы -->
                    <div class="table-header">
                      <div class="table-cell header-cell">{{ $t('pages.orders.orderId') }}</div>
                      <div class="table-cell header-cell">{{ $t('pages.orders.product') }}</div>
                      <div class="table-cell header-cell">{{ $t('pages.orders.date') }}</div>
                      <div class="table-cell header-cell">{{ $t('pages.orders.amount') }}</div>
                      <div class="table-cell header-cell">{{ $t('pages.orders.status') }}</div>
                    </div>
                    
                    <!-- Тело таблицы с прокруткой -->
                    <div class="table-body" @wheel="handleTableScroll">
                      <div 
                        v-for="(order, idx) in sortedOrders" 
                        :key="`${order.id || 'noid'}-${order.type || 'purchase'}-${new Date(order.date).getTime()}-${idx}`" 
                        class="table-row order-row"
                        @click.stop="openOrderDetailView(order)"
                      >
                        <div class="table-cell">
                          <div class="order-id-styled">
                            <span class="order-id-number">#{{ order.id }}</span>
                          </div>
                        </div>
                        
                        <div class="table-cell">
                          <div class="product-info">
                            <div class="product-name">{{ order.productName || $t('common.notAvailable') }}</div>
                            <div class="customer-name-small">{{ order.customerName || $t('common.notAvailable') }}</div>
                          </div>
                        </div>
                        
                        <div class="table-cell">
                          <div class="order-date">
                            <div class="date-main">{{ formatDateOnly(order.date || order.createdAt) }}</div>
                            <div class="date-time">{{ formatTimeOnly(order.date || order.createdAt) }}</div>
                          </div>
                        </div>
                        
                        <div class="table-cell">
                          <div class="order-amount" :class="{
                            'positive-amount': order.status === 'completed',
                            'negative-amount': order.status === 'returned'
                          }">
                            <span class="amount-sign">{{ order.status === 'returned' ? '-' : '+' }}</span>
                            <span class="amount-value">${{ Math.abs(parseFloat(order.total || 0)).toFixed(2) }}</span>
                          </div>
                        </div>
                        
                        <div class="table-cell">
                          <div class="order-status">
                            <v-chip 
                              x-small 
                              :color="order.status === 'returned' ? '#eab308' : '#10b981'"
                              :text-color="'white'"
                              class="status-chip-compact"
                            >
                              <v-icon left size="8">{{ order.status === 'returned' ? 'mdi-arrow-left' : 'mdi-check' }}</v-icon>
                              {{ order.status === 'returned' ? $t('analytics.dataTypes.returned') : $t('analytics.customer.orderStatus.completed') }}
                            </v-chip>
                          </div>
                        </div>
                        

                      </div>
                      
                      <!-- Сообщение об отсутствии данных -->
                      <div v-if="!sortedOrders || sortedOrders.length === 0" class="no-orders-row">
                        <div class="no-orders-content">
                          <v-icon size="48" color="#e5e7eb">mdi-shopping-outline</v-icon>
                          <p class="no-orders-text">{{ $t('pages.orders.noOrdersMessage') }}</p>
                          <p class="no-orders-subtext">{{ $t('pages.orders.ordersWillAppear') }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Детальная информация о заказе -->
                <div v-if="selectedOrderForDetail" class="order-details-view">
                  <div class="order-details-header">
                    <div class="order-header-info">
                      <h3 class="order-title">{{ $t('pages.orders.orderId') }} #{{ selectedOrderForDetail.id }}</h3>
                      <div class="order-meta">
                        <span class="order-date">{{ formatDateTime(selectedOrderForDetail.date || selectedOrderForDetail.createdAt) }}</span>
                        <div class="order-status-completed"></div>
                        <v-chip 
                          small 
                          :color="selectedOrderForDetail.status === 'returned' ? '#fbbf24' : '#51cf66'"
                          text-color="white"
                          class="status-chip-detail"
                        >
                          <v-icon left size="12">{{ selectedOrderForDetail.status === 'returned' ? 'mdi-arrow-left' : 'mdi-check' }}</v-icon>
                          {{ selectedOrderForDetail.status === 'returned' ? $t('analytics.dataTypes.returned') : $t('analytics.customer.orderStatus.completed') }}
                        </v-chip>
                      </div>
                      <!-- Добавляем имя клиента под статусом -->
                      <div class="customer-name-under-status">
                        {{ selectedOrderForDetail.customerName || $t('analytics.customer.tableHeaders.unknownCustomer') }}
                      </div>
                    </div>
                    
                    <div class="order-amount-large" :class="{
                      'positive-amount': selectedOrderForDetail.status !== 'returned',
                      'negative-amount': selectedOrderForDetail.status === 'returned'
                    }">
                      <span class="amount-sign-large">{{ selectedOrderForDetail.status === 'returned' ? '-' : '+' }}</span>
                      <span class="amount-value-large">${{ Math.abs(parseFloat(selectedOrderForDetail.total || 0)).toFixed(2) }}</span>
                    </div>
                  </div>
                  
                  <div class="order-details-content">
                    <div class="details-section">
                      <div class="order-info-container">
                        <h4 class="section-title">{{ $t('pages.orders.orderInformation') }}</h4>
                        
                        <!-- Если несколько товаров, показываем каждый в отдельном контейнере -->
                        <div v-if="selectedOrderForDetail.items && selectedOrderForDetail.items.length > 1">
                          <div v-for="(item, index) in selectedOrderForDetail.items" :key="index" class="order-card" style="margin-bottom: 12px;">
                            <div class="order-left">
                              <div class="product-icon-wrapper">
                                <v-icon size="28" color="white">mdi-package-variant</v-icon>
                              </div>
                              <div class="product-details">
                                <div class="product-name">{{ item.productName }}</div>
                              </div>
                            </div>
                            <div class="order-right">
                              <div class="order-info-item">
                                <div class="info-label">{{ $t('orders.quantity') }}</div>
                                <div class="info-value">{{ item.quantity }}</div>
                              </div>
                              <div class="order-info-item">
                                <div class="info-label">{{ $t('orders.amount') }}</div>
                                <div class="info-value">${{ item.total.toFixed(2) }}</div>
                              </div>
                              <div class="order-info-item" v-if="selectedOrderForDetail.paymentMethod && selectedOrderForDetail.status !== 'returned'">
                                <div class="info-label">{{ $t('orders.payment') }}</div>
                                <div class="info-value">{{ selectedOrderForDetail.paymentMethod }}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div v-else class="order-card">
                          <div class="order-left">
                            <div class="product-icon-wrapper">
                              <v-icon size="28" color="white">mdi-package-variant</v-icon>
                            </div>
                            <div class="product-details">
                              <div class="product-name">{{ selectedOrderForDetail.productName || $t('pages.orders.unknownProduct') }}</div>
                            </div>
                          </div>
                          <div class="order-right">
                            <div class="order-info-item">
                              <div class="info-label">{{ $t('pages.orders.quantity') }}</div>
                              <div class="info-value">{{ selectedOrderForDetail.quantity || 1 }}</div>
                            </div>
                            <div class="order-info-item" v-if="selectedOrderForDetail.paymentMethod && selectedOrderForDetail.status !== 'returned'">
                              <div class="info-label">{{ $t('pages.orders.payment') }}</div>
                              <div class="info-value">{{ selectedOrderForDetail.paymentMethod || $t('common.na') }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="details-section" v-if="selectedOrderForDetail.reason">
                      <h4 class="section-title">{{ $t('pages.orders.returnReason') }}</h4>
                      <div class="return-reason">
                        <p class="reason-text">{{ getReturnReasonText(selectedOrderForDetail.reason) }}</p>
                      </div>
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
      <div class="tooltip-value">{{ tooltip.value }} {{ tooltip.tooltipText || $t('analytics.charts.tooltip.users') }}</div>
    </div>
    
    <!-- Модальное окно деталей точки -->
    <div v-if="pointDetailsModal.show" class="modal-overlay" @click="closePointDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ $t('pages.orders.orderDetails') }}</h3>
          </div>
          <button @click="closePointDetails" class="close-btn">{{ $t('common.closeButton') }}</button>
        </div>
        
        <div class="modal-body">
          <div class="period-info-section">
            <div class="info-row">
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.orders.totalOrders') }}:</span>
              <span class="info-value">{{ pointDetailsModal.ordersList.length }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.orders.totalAmount') }}:</span>
              <span class="info-value">${{ getTotalAmount(pointDetailsModal.ordersList) }}</span>
            </div>
          </div>
          
          <div class="orders-section">
            <div class="section-header">
              <h4 class="section-title">{{ $t('pages.orders.latestOrders') }}</h4>
            </div>
            <div class="orders-list" ref="ordersListModal">
              <div v-for="(order, idx) in pointDetailsModal.ordersList" :key="`${order.id || 'noid'}-${order.type || 'purchase'}-${new Date(order.date).getTime()}-${idx}`" class="order-item" @click="selectOrderAndClose(order)">
                <div class="order-number">
                  #{{ order.id }}
                </div>
                <div class="order-info">
                  <div class="order-product">{{ order.productName }}</div>
                  <div class="order-details">
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ order.customerName || $t('common.notAvailable') }}
                    </div>
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ formatDate(order.date) }}
                    </div>
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ $t('pages.orders.quantity') }}: {{ order.quantity }}
                    </div>
                  </div>
                </div>
                <div class="order-stats">
                  <div class="stat">
                    <span class="stat-value" :class="{ 'negative-amount': order.status === 'returned' }">${{ Math.abs(parseFloat(order.total || 0)).toFixed(2) }}</span>
                    <span class="stat-label">{{ $t('pages.orders.total') }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value status-badge" :class="getStatusClass(order.status)">{{ order.status === 'returned' ? $t('analytics.dataTypes.returned') : $t('analytics.customer.orderStatus.completed') }}</span>
                    <span class="stat-label">{{ $t('pages.orders.status') }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="pointDetailsModal.ordersList.length === 0" class="no-orders-message">
                <div class="no-results-icon"></div>
                <div class="no-results-text">
                  <strong>{{ $t('pages.orders.noOrdersFound') }}</strong>
                  <p>{{ $t('analytics.charts.noData') }}</p>
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
              {{ $t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно деталей покупки -->
    <div v-if="purchaseDetailsModal.show" class="modal-overlay" @click="closePurchaseDetails">
      <div class="modal-content" >
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ $t('pages.orders.orderDetails') }}</h3>
            <p class="subtitle">{{ purchaseDetailsModal.items ? purchaseDetailsModal.items.length : 0 }} {{ $t('pages.buy.purchases') || $t('common.items') }}</p>
          </div>
          <button @click="closePurchaseDetails" class="close-btn">{{ $t('common.closeButton') }}</button>
        </div>
        
        <div class="modal-body">
          <div v-if="purchaseDetailsModal.purchase" class="purchase-info-section">
            <div class="info-row">
              <span class="info-label"> {{ $t('pages.products.analytics.firstSale') || $t('pages.orders.date') }}:</span>
              <span class="info-value">{{ formatDateTime(purchaseDetailsModal.purchase.date) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label"> {{ $t('pages.orders.payment') }}:</span>
              <v-chip 
                small 
                :color="getPaymentMethodColor(purchaseDetailsModal.purchase.paymentMethod)"
                :text-color="getPaymentMethodTextColor(purchaseDetailsModal.purchase.paymentMethod)"
              >
                <v-icon left size="14">{{ getPaymentMethodIcon(purchaseDetailsModal.purchase.paymentMethod) }}</v-icon>
                {{ getPaymentMethodText(purchaseDetailsModal.purchase.paymentMethod) }}
              </v-chip>
            </div>
            <div class="info-row">
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-header">
              <h4 class="section-title">{{ $t('pages.orders.latestOrders') }}</h4>
              <div class="scroll-buttons">
              </div>
            </div>
            <div class="items-list" ref="itemsList">
              <div v-for="(item, index) in purchaseDetailsModal.items" :key="item.id" class="item-row">
                <div class="item-number">{{ index + 1 }}</div>
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-details">{{ $t('pages.orders.quantity') }}: {{ item.quantity }}</div>
                </div>
                <div class="item-price">
                  ${{ item.total.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="footer-info">
              <span class="purchase-summary">
               {{ purchaseDetailsModal.items ? purchaseDetailsModal.items.length : 0 }} {{ $t('common.items') }} • {{ $t('pages.orders.total') }}: ${{ purchaseDetailsModal.purchase ? purchaseDetailsModal.purchase.amount.toLocaleString() : 0 }}
            </span>
          </div>
          <div class="footer-buttons">
            <button @click="closePurchaseDetails" class="confirm-btn">
              <span class="btn-icon"></span>
              {{ $t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'OrdersAnalytics',
  data() {
    return {
      timeFilter: 'day',
      chartPeriodText: '', // Будет обновлено в mounted
      
      isChartExpanded: false,
      
      dataType: 'completed',
      
      isCustomerDetailView: false,
    selectedCustomerForDetail: null,
    selectedOrderForDetail: null,
      
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
      
      sortBy: 'date',
      sortOptions: [
        { text: this.$t('pages.orders.byOrderAmount'), value: 'total' },
        { text: this.$t('pages.orders.byCustomerName'), value: 'customerName' },
        { text: this.$t('pages.orders.byProductName'), value: 'productName' },
        { text: this.$t('pages.orders.byOrderDate'), value: 'date' }
      ],
      
      orders: [], // Инициализируем как пустой массив
      
      pointDetailsModal: {
        show: false,
        date: null,
        period: '',
        newUsers: 0,
        usersList: [],
        index: null
      },
      
      purchaseDetailsModal: {
        show: false,
        purchase: null,
        items: []
      },
      
      activeCustomerTab: 0,
      purchaseDateMenu: false,
      purchaseDateFilter: null,
      activityDateMenu: false,
      
      updateInterval: null
    }
  },
  
  computed: {
    // Реактивные переводы
    translatedChartPeriodText() {
      const periods = {
        hour: this.$t('analytics.periods.last24Hours'),
        day: this.$t('analytics.periods.last30Days'),
        week: this.$t('analytics.periods.last12Weeks'),
        month: this.$t('analytics.periods.last12Months'),
        year: this.$t('analytics.periods.last5Years')
      };
      return periods[this.timeFilter] || this.$t('analytics.periods.last30Days');
    },
    
    // Получаем заказы за выбранный временной период
    ordersInPeriod() {
      if (!this.orders || !Array.isArray(this.orders)) return [];
      
      const now = new Date();
      const periods = {
        hour: 24,
        day: 30,
        week: 12,
        month: 12,
        year: 5
      };
      
      const count = periods[this.timeFilter] || 30;
      let startDate = new Date(now);
      
      switch (this.timeFilter) {
        case 'hour':
          startDate.setHours(now.getHours() - count);
          break;
        case 'day':
          startDate.setDate(now.getDate() - count);
          break;
        case 'week':
          startDate.setDate(now.getDate() - count * 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - count);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - count);
          break;
      }
      
      return this.orders.filter(order => {
        const orderDate = new Date(order.date || order.createdAt);
        return orderDate >= startDate && orderDate <= now;
      });
    },
    
    totalOrders() {
      const ordersInPeriod = this.ordersInPeriod;
      
      if (this.dataType === 'completed') {
        return ordersInPeriod.filter(order => order.status === 'completed').length;
      } else if (this.dataType === 'returned') {
        return ordersInPeriod.filter(order => order.status === 'returned').length;
      }
      return ordersInPeriod.length;
    },
    
    totalEarnings() {
      const ordersInPeriod = this.ordersInPeriod;
      let filteredOrders;
      
      if (this.dataType === 'completed') {
        filteredOrders = ordersInPeriod.filter(order => order.status === 'completed');
      } else if (this.dataType === 'returned') {
        filteredOrders = ordersInPeriod.filter(order => order.status === 'returned');
      } else {
        filteredOrders = ordersInPeriod;
      }
      
      if (filteredOrders.length === 0) return 0;
      
      const total = filteredOrders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total || 0);
        if (this.dataType === 'returned') {
          // Для возвратов показываем отрицательную сумму
          return sum - orderTotal; // Вычитаем положительную сумму для возвратов
        }
        return sum + orderTotal;
      }, 0);
      
      return total;
    },
    

    
    ordersThisPeriod() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
      return this.userPoints.reduce((sum, point) => sum + point.value, 0);
    },
    
    averageOrdersPerPeriod() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
      return Math.round(this.ordersThisPeriod / this.userPoints.length);
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
    filteredOrders() {
      if (!this.orders || !Array.isArray(this.orders)) return [];
      if (!this.searchQuery) {
        return this.orders;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.orders.filter(order => 
        (order.productName && order.productName.toLowerCase().includes(query)) ||
        (order.customerName && order.customerName.toLowerCase().includes(query))
      );
    },
    
    sortedOrders() {
      if (!this.filteredOrders || !Array.isArray(this.filteredOrders)) return [];
      const orders = [...this.filteredOrders];
      
      return orders.sort((a, b) => {
        switch (this.sortBy) {
          case 'customerName':
            return (a.customerName || '').localeCompare(b.customerName || '');
          case 'productName':
            return (a.productName || '').localeCompare(b.productName || '');
          case 'date':
            return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
          case 'total':
          default:
            return parseFloat(b.total || 0) - parseFloat(a.total || 0);
        }
      });
    },
    
    totalPurchases() {
      return this.filteredCustomers ? this.filteredCustomers.reduce((sum, customer) => sum + customer.purchasesCount, 0) : 0;
    },
    
    totalReturns() {
      return this.filteredCustomers ? this.filteredCustomers.reduce((sum, customer) => {
        return sum + (customer.returns ? customer.returns.length : 0)
      }, 0) : 0;
    }
  },
  
  async mounted() {
    this.initializeEmptyChart();
    await this.loadOrders();
    this.updateChartPeriodText(); // Обновляем текст периода
    
    // Слушаем изменения языка
    this.$watch('$i18n.locale', () => {
      this.updateTranslations();
    });
    
    // Автоматическое обновление каждую минуту
    this.updateInterval = setInterval(() => {
      this.generateChartData();
    }, 60000);
  },
  
  beforeDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },
  
  watch: {
    timeFilter() {
      this.generateChartData();
    },
    
    chartMode() {
      this.generateChartData();
      this.updateChartPeriodText();
    },
    
    dataType() {
      this.generateChartData();
    }
  },
  
  methods: {
    async loadOrders() {
      try {
        // Загружаем покупки, возвраты и продукты
        const [purchasesResponse, returnsResponse, productsResponse] = await Promise.all([
          api.get('/purchases'),
          api.get('/returns'),
          api.get('/products')
        ]);
        const purchases = purchasesResponse.data;
        const returns = returnsResponse.data;
        const products = productsResponse.data;
        if (purchases && returns && products) {
          
          // Группируем покупки по времени (с точностью до минуты)
          const groupedPurchases = {};
          purchases.forEach(purchase => {
            const purchaseTime = new Date(purchase.date);
            const timeKey = `${purchase.customerName}-${purchaseTime.getFullYear()}-${purchaseTime.getMonth()}-${purchaseTime.getDate()}-${purchaseTime.getHours()}-${purchaseTime.getMinutes()}`;
            
            if (!groupedPurchases[timeKey]) {
              groupedPurchases[timeKey] = {
                id: purchase.id,
                customerName: purchase.customerName,
                date: purchase.date,
                createdAt: purchase.createdAt,
                paymentMethod: purchase.paymentMethod,
                status: 'completed',
                type: 'purchase',
                items: [],
                total: 0
              };
            }
            
            groupedPurchases[timeKey].items.push({
              productName: purchase.productName,
              quantity: purchase.quantity || 1,
              total: purchase.total
            });
            groupedPurchases[timeKey].total += parseFloat(purchase.total || 0);
            
            // Обновляем название продукта для заказов с одним товаром
            if (groupedPurchases[timeKey].items.length === 1) {
              groupedPurchases[timeKey].productName = purchase.productName;
              groupedPurchases[timeKey].quantity = purchase.quantity || 1;
            } else {
              groupedPurchases[timeKey].productName = `${groupedPurchases[timeKey].items.length} ${this.$t('common.items')}`;
              groupedPurchases[timeKey].quantity = groupedPurchases[timeKey].items.reduce((sum, item) => sum + item.quantity, 0);
            }
          });
          
          const purchaseOrders = Object.values(groupedPurchases);
          
          // Создаем карту продуктов для быстрого поиска цены
          const productPriceMap = {};
          products.forEach(product => {
            productPriceMap[product.id] = product.price;
          });
          
          // Находим максимальный ID среди покупок для заказов
          const maxPurchaseId = Math.max(...purchases.map(p => p.id), 0);
          
          // Находим максимальный ID среди возвратов
          const maxReturnId = Math.max(...returns.map(r => r.id || 0), 0);
          
          // Преобразуем returns в формат orders с отдельными ID
          const returnOrders = returns.map((returnItem, index) => {
            const productPrice = productPriceMap[returnItem.productId] || 0;
            const returnTotal = productPrice * (returnItem.quantity || 1); // Положительная сумма для правильного отображения
            
            // Используем timestamp из product_activities для актуального времени возврата
            const returnDate = returnItem.timestamp || returnItem.date;
            
            return {
              id: returnItem.id || (maxReturnId + index + 1), // Используем оригинальный ID возврата
              customerName: returnItem.customerName,
              productName: returnItem.productName,
              total: returnTotal, // Положительная сумма для правильного отображения
              quantity: returnItem.quantity || 1,
              date: returnDate,
              createdAt: returnDate,
              paymentMethod: 'return',
              status: 'returned',
              type: 'return',
              reason: returnItem.reason
            };
          });
          
          // Объединяем все заказы
          this.orders = [...purchaseOrders, ...returnOrders].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          this.generateChartData();
        } else {
          console.error('Error loading orders');
          this.generateFallbackData();
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        this.generateFallbackData();
      }
    },
    
    async fetchCustomersData() {
      try {
        const [customersResponse, purchasesResponse] = await Promise.all([
          api.get('/customers'),
          api.get('/purchases')
        ])
        const customers = customersResponse.data
        const purchases = purchasesResponse.data
        if (customers && purchases) {
          this.processCustomersData(customers, purchases)
          
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
    
    processCustomersData(customers, purchases) {
      const purchasesByCustomer = {}
      purchases.forEach(purchase => {
        if (!purchasesByCustomer[purchase.customerName]) {
          purchasesByCustomer[purchase.customerName] = []
        }
        purchasesByCustomer[purchase.customerName].push(purchase)
      })
      
      this.customers = customers.map((customer, index) => {
        const customerPurchases = purchasesByCustomer[customer.name] || []
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
          returns: []
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
          title: itemsCount > 1 ? this.$t('pages.orders.purchaseItems', { count: itemsCount }) : this.$t('pages.orders.purchaseSingle', { product: firstItem.productName }),
          description: itemsCount > 1 ? this.$t('pages.orders.itemsPurchased', { count: itemsCount }) : this.$t('pages.orders.quantityLabel', { quantity: firstItem.quantity }),
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
            title: `Return: ${returnItem.productName}`,
            description: `Reason: ${returnItem.reason}`,
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
        title: this.$t('common.systemRegistration'),
        description: this.$t('common.customerCreatedAccount'),
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
    
    // Новые методы для работы с заказами
    getCustomerEmail(customerName) {
      if (!customerName) return this.$t('common.noEmail');
      return `${customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
    },
    
    formatDateOnly(dateString) {
      if (!dateString) return this.$t('common.notAvailable');
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },
    
    formatTimeOnly(dateString) {
      if (!dateString) return this.$t('common.notAvailable');
      const date = new Date(dateString);
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatDateTime(dateString) {
      if (!dateString) return this.$t('common.notAvailable') || 'No data';
      const date = new Date(dateString);
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: locale === 'en' // AM/PM только для английского языка
      });
    },
    
    openOrderDetailView(order) {
      // Аналогично openCustomerDetailView в UsersAnalytics
      const orderWithDetails = {
        ...order,
        // Добавляем дополнительную информацию если нужно
      };
      this.selectedOrderForDetail = orderWithDetails;
      
      // Открываем модальное окно с деталями заказа
      this.purchaseDetailsModal = {
        show: true,
        purchase: {
          date: order.date,
          paymentMethod: order.paymentMethod || 'unknown',
          amount: parseFloat(order.total || 0)
        },
        items: order.items || [{
          id: order.id,
          productName: order.productName,
          quantity: order.quantity || 1,
          total: parseFloat(order.total || 0)
        }]
      };
    },
    
    exitCustomerDetailView() {
      this.selectedOrderForDetail = null;
      this.isCustomersExpanded = false;
    },
    
    handleTableScroll(event) {
      // Обработка прокрутки таблицы
      event.stopPropagation();
    },
    
    handleCustomerScroll(event) {
      // Обработка прокрутки списка клиентов
      event.stopPropagation();
    },
    
    openCustomersSection() {
      if (!this.selectedOrderForDetail) {
        this.isCustomersExpanded = !this.isCustomersExpanded;
      }
    },
    
    generateFallbackData() {
      // Создаем тестовые данные заказов
      this.orders = [
        {
          id: 1,
          customerName: 'John Doe',
          productName: 'Laptop',
          total: 1200,
          quantity: 1,
          date: new Date(Date.now() - 86400000).toISOString(), // вчера
          status: 'completed'
        },
        {
          id: 2,
          customerName: 'Jane Smith',
          productName: 'Phone',
          total: 800,
          quantity: 1,
          date: new Date().toISOString(), // сегодня
          status: 'completed'
        }
      ];
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
      if (!this.orders || this.orders.length === 0) {
        this.generateFallbackData();
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

      // Генерируем данные от прошлого к настоящему
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
            const dayOfWeek = date.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            date.setDate(date.getDate() - daysToMonday);
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
        
        const endTime = this.getEndTime(new Date(date));
        let value = 0;
        
        // Filter orders by period and data type
        let filteredOrders = this.orders.filter(order => {
          const orderDate = new Date(order.date || order.createdAt);
          return orderDate >= date && orderDate < endTime;
        });
        
        // Filter by status depending on dataType
        if (this.dataType === 'completed') {
          filteredOrders = filteredOrders.filter(order => 
            order.status && order.status.toLowerCase() === 'completed'
          );
        } else if (this.dataType === 'returned') {
          filteredOrders = filteredOrders.filter(order => 
            order.status && order.status.toLowerCase() === 'returned'
          );
        }
        
        value = filteredOrders.length; // Подсчитываем количество заказов, а не продуктов
        
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
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      
      switch (this.timeFilter) {
        case 'hour':
          // Show actual time
          return date.toLocaleTimeString(locale, { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: locale === 'en' // AM/PM только для английского языка
          });
        case 'day':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          
          if (dateOnly.getTime() === today.getTime()) {
            return this.$t('analytics.charts.dates.today');
          } else if (dateOnly.getTime() === yesterday.getTime()) {
            return this.$t('analytics.charts.dates.yesterday');
          } else {
            return date.toLocaleDateString(locale, { 
              day: '2-digit', 
              month: '2-digit' 
            });
          }
        case 'week':
          return date.toLocaleDateString(locale, { 
            day: '2-digit', 
            month: '2-digit' 
          });
        case 'month':
          // Используем переводы для месяцев
          const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthKey = monthKeys[date.getMonth()];
          const monthName = this.$t(`analytics.charts.dates.months.${monthKey}`);
          return `${monthName} ${date.getFullYear()}`;
        case 'year':
          return date.getFullYear().toString();
        default:
          return date.toLocaleDateString(locale, { 
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
    
    // Метод для обновления всех переводов при смене языка
    updateTranslations() {
      console.log('Language changed to:', this.$i18n.locale);
      this.updateChartPeriodText();
      // Принудительно обновляем компонент
      this.$forceUpdate();
    },
    
    showTooltip(event, point, index) {
      const svgElement = event.target.closest('svg');
      const svgRect = svgElement.getBoundingClientRect();
      
      const tooltipX = svgRect.left + point.x;
      const tooltipY = svgRect.top + point.y;
      
      this.tooltip = {
        show: true,
        x: tooltipX,
        y: tooltipY,
        title: this.formatXAxisLabel(point),
        value: point.value,
        tooltipText: this.getTooltipText(),
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
    
    getTooltipText() {
      if (this.dataType === 'returned') {
        return this.$t('analytics.charts.tooltip.returns');
      }
      return this.$t('analytics.charts.tooltip.orders');
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
    
    openOrderDetailView(order) {
      if (!this.isCustomersExpanded) {
        this.isCustomersExpanded = true;
        this.selectedOrderForDetail = null;
        this.expandedCustomer = null;
        this.activeTab = 0;
      } else {
        // Если секция уже развернута, показываем детали конкретного заказа
        this.selectedOrderForDetail = order;
        this.expandedCustomer = null;
        this.activeTab = 0;
      }
    },
    
    selectOrderAndClose(order) {
      // Закрываем модальное окно точки
      this.closePointDetails();
      
      // Разворачиваем секцию заказов если она не развернута
      if (!this.isCustomersExpanded) {
        this.isCustomersExpanded = true;
      }
      
      // Показываем детали конкретного заказа
      this.selectedOrderForDetail = order;
      this.expandedCustomer = null;
      this.activeTab = 0;
    },
    
    exitCustomerDetailView() {
      if (this.selectedOrderForDetail) {
        // Если просматриваем детали заказа, возвращаемся к списку
        this.selectedOrderForDetail = null;
        this.expandedCustomer = null;
        this.activeCustomerTab = 0;
      } else if (this.isCustomersExpanded) {
        // Если просто развернута секция, сворачиваем её
        this.isCustomersExpanded = false;
        this.expandedCustomer = null;
      }
    },
    
    formatDateOnly(date) {
      if (!date) return this.$t('common.notAvailable')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    
    formatTimeWithSeconds(date) {
      if (!date) return this.$t('common.notAvailable')
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en'
      return new Date(date).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    
    getActivityIcon(type) {
      const icons = {
        purchase: 'mdi-shopping',
        return: 'mdi-keyboard-return',
        registration: 'mdi-account-plus',
        login: 'mdi-login'
      }
      return icons[type] || 'mdi-circle'
    },
    
    getActivityColor(type) {
      const colors = {
        purchase: '#10b981',
        return: '#ef4444',
        registration: '#3b82f6',
        login: '#f59e0b'
      }
      return colors[type] || '#6b7280'
    },
    
    openCustomersSection() {
      if (!this.isCustomersExpanded && !this.selectedCustomerForDetail) {
        this.isCustomersExpanded = true;
      }
    },
    
    openAllCustomers() {
      // Открываем список всех клиентов без выбора конкретного
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
    
    openPointDetails(point, index) {
      const timeSlot = this.getTimeSlotForPoint(point, index);
      let ordersList = [];
      let modalTitle = '';
      let modalDescription = '';
      
      // Получаем заказы за выбранный период с учетом текущего фильтра
      ordersList = this.getOrdersForPeriod(timeSlot.startTime, timeSlot.endTime);
      
      // Устанавливаем заголовок и описание - показываем все заказы (включая возвраты)
      modalTitle = this.$t('pages.orders.latestOrdersInPeriod');
      modalDescription = `${this.$t('pages.orders.allOrdersIncludingReturns')}: ${ordersList.length}`;
      
      this.pointDetailsModal = {
        show: true,
        date: point.date,
        period: this.formatPeriodText(timeSlot),
        newUsers: point.value,
        ordersList: ordersList,
        index: index,
        title: modalTitle,
        description: modalDescription
      };
      
      // Инициализируем скроллинг после открытия модального окна
      this.$nextTick(() => {
        this.initModalScroll();
      });
    },

    // Добавляем новый метод для получения заказов за период
    getOrdersForPeriod(startTime, endTime) {
      let filteredOrders = this.orders.filter(order => {
        const orderDate = new Date(order.date || order.createdAt);
        return orderDate >= startTime && orderDate < endTime;
      });
      
      // Применяем фильтрацию по dataType для модального окна
      if (this.dataType === 'completed') {
        filteredOrders = filteredOrders.filter(order => 
          order.status && order.status.toLowerCase() === 'completed'
        );
      } else if (this.dataType === 'returned') {
        filteredOrders = filteredOrders.filter(order => 
          order.status && order.status.toLowerCase() === 'returned'
        );
      }
      // Если dataType === 'all' или другой, показываем все заказы
      
      // Сортируем по дате: последние сверху (аналогично ProductsAnalytics)
      filteredOrders = filteredOrders.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
      });
      
      return filteredOrders;
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
          // Используем ту же логику, что и в generateChartData
          const weekIndex = count - 1 - index;
          date.setDate(date.getDate() - weekIndex * 7);
          const dayOfWeek = date.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          date.setDate(date.getDate() - daysToMonday);
          date.setHours(0, 0, 0, 0);
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
      
      const startTime = new Date(date);
      const endTime = this.getEndTime(new Date(date));
      
      
      return {
        startTime: startTime,
        endTime: endTime
      };
    },

    getUsersForPeriod(startTime, endTime) {
      return this.customers.filter(customer => {
        const firstPurchaseDate = new Date(customer.firstPurchase);
        return firstPurchaseDate >= startTime && firstPurchaseDate < endTime;
      });
    },

    formatPeriodText(timeSlot) {
      const start = timeSlot.startTime;
      const end = timeSlot.endTime;
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      
      switch (this.timeFilter) {
        case 'hour':
          return `${start.getHours()}:00 - ${end.getHours()}:00, ${start.toLocaleDateString(locale)}`;
        case 'day':
          return start.toLocaleDateString(locale);
        case 'week':
          return `${start.toLocaleDateString(locale)} - ${end.toLocaleDateString(locale)}`;
        case 'month':
          return start.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        case 'year':
          return start.getFullYear().toString();
        default:
          return start.toLocaleDateString(locale);
      }
    },
    
    closePointDetails() {
      this.removeScrollHandler();
      this.pointDetailsModal.show = false;
    },
    
    closePurchaseDetails() {
      this.purchaseDetailsModal.show = false;
    },
    
    formatDateTime(date) {
      if (!date) return this.$t('common.notAvailable') || 'No data';
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return new Date(date).toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: locale === 'en' // AM/PM только для английского языка
      });
    },
    
    getCurrentChartTitle() {
      if (this.dataType === 'completed') {
        return this.$t('analytics.dataTypes.completed') + ' ' + this.$t('navigation.orders');
      } else if (this.dataType === 'returned') {
        return this.$t('analytics.dataTypes.returned') + ' ' + this.$t('navigation.orders');
      }
      return this.$t('analytics.charts.ordersTitle');
    },
    
    exitChartExpandedMode() {
      if (this.pointDetailsModal.show) {
        this.pointDetailsModal.show = false;
      } else if (this.isChartExpanded) {
        this.isChartExpanded = false;
      } else {
        // Возврат к основному виду
        this.$router.go(-1);
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
        return this.$t('analytics.dataTypes.registrationsFor', { period: this.getRightPanelPeriodText() });
      } else {
        return this.$t('analytics.dataTypes.activitiesFor', { period: this.getRightPanelPeriodText() });
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
        const scrollAmount = event.deltaY * 0.5;
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
        'Москва, Россия',
        'Санкт-Петербург, Россия',
        'Новосибирск, Россия',
        'Екатеринбург, Россия',
        'Казань, Россия'
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
      if (activities.length === 0) return 'Нет активности'
      
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
      const categories = ['Электроника', 'Одежда', 'Дом и сад', 'Спорт', 'Книги']
      return categories[customer.id % categories.length]
    },

    getFavoriteCategoryCount(customer) {
      return Math.floor(customer.purchasesCount * 0.4) + 1
    },

    getLoyaltyStatus(customer) {
      if (customer.totalValue > 10000) return 'Платиновый'
      if (customer.totalValue > 5000) return 'Золотой'
      if (customer.totalValue > 2000) return 'Серебряный'
      return 'Бронзовый'
    },

    getLoyaltyPoints(customer) {
      return Math.floor(customer.totalValue * 0.1)
    },

    getMonthlyActivity(customer) {
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн']
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
        'Электроника': 'blue',
        'Одежда': 'pink',
        'Дом и сад': 'green',
        'Спорт': 'orange',
        'Книги': 'purple',
        'Общее': 'grey'
      }
      return colors[category] || 'grey'
    },

    getStatusColor(status) {
      const colors = {
        'Завершен': 'success',
        'В обработке': 'warning',
        'Отменен': 'error',
        'Доставлен': 'success'
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
      return 'Россия'
    },

    getCustomerCity(customer) {
      const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург']
      return cities[customer.id % cities.length]
    },

    getCustomerAddress(customer) {
      const streets = ['ул. Ленина', 'ул. Пушкина', 'пр. Мира', 'ул. Гагарина']
      const street = streets[customer.id % streets.length]
      const building = (customer.id % 100) + 1
      const apartment = (customer.id % 200) + 1
      return `${street}, д. ${building}, кв. ${apartment}`
    },

    getCustomerZipCode(customer) {
      return `${100000 + (customer.id % 99999)}`
    },

    getCustomerPaymentMethod(customer) {
      const methods = ['Visa', 'MasterCard', 'МИР', 'PayPal']
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
      return customer.totalValue > 1000 ? 'Активный' : 'Обычный'
    },

    getNewsletterStatus(customer) {
      return customer.id % 3 === 0 ? 'Подписан' : 'Не подписан'
    },

    viewPurchaseDetails(purchase) {
      // Логика для просмотра деталей покупки
      console.log('Просмотр деталей покупки:', purchase)
    },

    downloadInvoice(purchase) {
      // Логика для скачивания счета
      console.log('Скачивание счета:', purchase)
    },

    getPaymentMethodText(method) {
      const methods = {
        'card': this.$t('common.card'),
        'cash': this.$t('common.cash'), 
        'transfer': this.$t('common.transfer')
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

    handleTableScroll(event) {
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
    
    getTotalAmount(orders) {
      return orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()
    },
    
    formatDate(date) {
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    
    formatDateShort(dateString) {
      if (!dateString) return this.$t('common.notAvailable');
      const date = new Date(dateString);
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return date.toLocaleDateString(locale, { 
        month: 'short', 
        day: 'numeric' 
      });
    },
    
    formatDateTime(dateString) {
      if (!dateString) return this.$t('common.notAvailable') || 'No data';
      const date = new Date(dateString);
      const locale = this.$i18n && this.$i18n.locale ? this.$i18n.locale : 'en';
      return date.toLocaleString(locale, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: locale === 'en' // AM/PM только для английского языка
      });
    },
    
    getStatusClass(status) {
      const statusClasses = {
        'completed': 'status-completed',
        'returned': 'status-returned',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled',
        'processing': 'status-processing'
      }
      return statusClasses[status && status.toLowerCase()] || 'status-default'
    },
    
    openPurchaseDetails(activity) {
      if (activity.type === 'purchase' && activity.items) {
        this.purchaseDetailsModal.purchase = activity
        this.purchaseDetailsModal.items = activity.items
        this.purchaseDetailsModal.show = true
        
        // Добавляем обработчик прокрутки после рендера
        this.$nextTick(() => {
          this.addScrollHandler()
        })
      }
    },
    
    closePurchaseDetails() {
      this.removeScrollHandler()
      this.purchaseDetailsModal.show = false
      this.purchaseDetailsModal.purchase = null
      this.purchaseDetailsModal.items = []
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

    scrollOrdersUp() {
      const ordersListElement = this.$refs.ordersListModal;
      if (ordersListElement) {
        ordersListElement.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      }
    },

    scrollOrdersDown() {
      const ordersListElement = this.$refs.ordersListModal;
      if (ordersListElement) {
        ordersListElement.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
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

    showCustomerDetails(user) {
      // Закрываем модальное окно периода
      this.closePointDetails();
      
      // Находим полную информацию о клиенте
      const fullCustomer = this.customers.find(c => c.id === user.id);
      if (fullCustomer) {
        // Добавляем все активности клиента
        const customerWithActivities = {
          ...fullCustomer,
          allActivities: this.getAllActivities(fullCustomer)
        };
        
        // Показываем детали клиента
        this.selectedCustomerForDetail = customerWithActivities;
        this.isCustomersExpanded = true;
        this.expandedCustomer = null;
        this.activeTab = 0;
      }
    },

    // Функция инициализации скроллинга для модального окна
    initModalScroll() {
      const ordersListElement = this.$refs.ordersListModal;
      if (ordersListElement) {
        this.setupSmoothScroll(ordersListElement);
        this.setupDragScroll(ordersListElement);
      }
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

      const wheelHandler = (e) => {
        e.preventDefault();
        
        targetScrollTop += e.deltaY * speed;
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
        
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(smoothScroll);
        }
      };

      element.addEventListener('wheel', wheelHandler, { passive: false });
      
      // Сохраняем ссылку на обработчик для последующего удаления
      element._wheelHandler = wheelHandler;
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

      const mouseDownHandler = (e) => {
        isDown = true;
        element.style.cursor = 'grabbing';
        startY = e.pageY - element.offsetTop;
        scrollTop = element.scrollTop;
        cancelMomentumTracking();
      };

      const mouseLeaveHandler = () => {
        isDown = false;
        element.style.cursor = 'grab';
        beginMomentumTracking();
      };

      const mouseUpHandler = () => {
        isDown = false;
        element.style.cursor = 'grab';
        beginMomentumTracking();
      };

      const mouseMoveHandler = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const y = e.pageY - element.offsetTop;
        const walk = (y - startY) * sensitivity;
        const newScrollTop = scrollTop - walk;
        
        velocityY = element.scrollTop - newScrollTop;
        element.scrollTop = newScrollTop;
      };

      element.addEventListener('mousedown', mouseDownHandler);
      element.addEventListener('mouseleave', mouseLeaveHandler);
      element.addEventListener('mouseup', mouseUpHandler);
      element.addEventListener('mousemove', mouseMoveHandler);
      
      // Сохраняем ссылки на обработчики для последующего удаления
      element._mouseDownHandler = mouseDownHandler;
      element._mouseLeaveHandler = mouseLeaveHandler;
      element._mouseUpHandler = mouseUpHandler;
      element._mouseMoveHandler = mouseMoveHandler;
    },

    // Удаление обработчиков событий прокрутки
    removeScrollHandler() {
      const ordersListElement = this.$refs.ordersListModal;
      if (ordersListElement) {
        // Удаляем обработчики колесика мыши
        if (ordersListElement._wheelHandler) {
          ordersListElement.removeEventListener('wheel', ordersListElement._wheelHandler);
          delete ordersListElement._wheelHandler;
        }
        
        // Удаляем обработчики перетаскивания
        if (ordersListElement._mouseDownHandler) {
          ordersListElement.removeEventListener('mousedown', ordersListElement._mouseDownHandler);
          delete ordersListElement._mouseDownHandler;
        }
        if (ordersListElement._mouseLeaveHandler) {
          ordersListElement.removeEventListener('mouseleave', ordersListElement._mouseLeaveHandler);
          delete ordersListElement._mouseLeaveHandler;
        }
        if (ordersListElement._mouseUpHandler) {
          ordersListElement.removeEventListener('mouseup', ordersListElement._mouseUpHandler);
          delete ordersListElement._mouseUpHandler;
        }
        if (ordersListElement._mouseMoveHandler) {
          ordersListElement.removeEventListener('mousemove', ordersListElement._mouseMoveHandler);
          delete ordersListElement._mouseMoveHandler;
        }
        
        // Восстанавливаем курсор
        ordersListElement.style.cursor = 'default';
      }
    },

    selectOrderAndClose(order) {
      // Закрываем модальное окно точки
      this.closePointDetails();
      
      // Разворачиваем секцию заказов если она не развернута
      if (!this.isCustomersExpanded) {
        this.isCustomersExpanded = true;
      }
      
      // Показываем детали конкретного заказа
      this.selectedOrderForDetail = order;
      this.expandedCustomer = null;
      this.activeTab = 0;
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

    // Метод для перехода к Analytics.vue
    goBackToAnalytics() {
      this.$router.push('/analytics')
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
  grid-template-columns: 800px 500px;
  gap: 24px;
  margin-top: 20px;
  transition: grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.analytics-layout.chart-expanded {
  grid-template-columns: 1fr 0px;
  gap: 0;
}

.chart-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 5px 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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

.customers-section::before {
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

.chart-header h3::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #a302d4;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(163, 2, 212, 0.5);
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
  margin-left: 1px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  width: 630px;
  height: 800px;
  display: flex;
  flex-direction: column;
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
  height: 800px;
  border-radius: 16px;
  padding: 32px;
  background: white;
  z-index: 5;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: #a302d4;
}

.customers-section.hidden {
  opacity: 0;
  width: 0;
  padding: 0;
  margin: 0;
  border: none;
}

.customers-search-input.v-text-field--outlined .v-input__control {
  border-radius: 4px;
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

.customers-search-input .v-input__control {
  min-height: 40px;
  z-index: 10 !important;
}

.customers-search-input .v-text-field__details {
  display: none !important;
}

.customers-search-input .v-input__slot {
  border-radius: 25px !important;
}

.customers-search-input .v-text-field__slot input {
  border-radius: 25px !important;
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
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.compact-search {
  margin-bottom: 16px;
}

.customers-list {
  flex: 1;
  overflow-y: visible; /* Убираем скроллинг с внешнего контейнера */
  height: calc(100% - 40px); /* Адаптивная высота по колонке */
  margin-top: 5px;
  padding-top: 0;
  padding-right: 6px;
}

/* Скроллинг убран с внешнего контейнера - теперь только внутренний .orders-list */

/* Для развернутого режима */
.customers-section.expanded .customers-list {
  height: calc(100vh - 200px); /* Полная высота экрана минус отступы */
}

.customer-item {
  border-bottom: 1px solid #f3f4f6;
  padding: 3px 0;
  transition: all 0.3s ease;
  border-radius: 6px;
  margin: 1px 0;
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

.customer-item:hover::before {
  transform: scaleX(1);
}

.customer-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.customer-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1246af;
  font-weight: 600;
  font-size: 10px;
  flex-shrink: 0;
}

.customer-text-info { 
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 1px;
}

.customer-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 11px;
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.customer-email {
  color: #6b7280;
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.1;
}

.order-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}

.status-completed {
  color: #10b981;
}

.status-returned {
  color: #f59e0b;
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

.order-bottom-info {
  margin-top: 2px;
  padding-top: 2px;
  border-top: 1px solid #e5e7eb;
}

.order-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 10px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.1;
}

.stat-label {
  font-size: 8px;
  color: #6b7280;
  margin-top: 0;
  line-height: 1;
}

.status-badge {
  padding: 1px 4px;
  border-radius: 6px;
  font-size: 8px;
  font-weight: 500;
  line-height: 1;
}

.negative-amount {
  color: #ef4444;
}

.expand-icon-small {
  color: #9ca3af;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.expand-icon-small.expanded {
  transform: rotate(180deg);
}

.customer-details-compact {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  max-height: 600px; /* добавь эту строку */
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
  min-height: 80vh;
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
  position: relative;
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
  font-size: 12px;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
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

/* Стили для таблицы заказов */
.customers-section .table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 0.8fr 1fr 1fr;
  background: #f8f9fa;
  font-weight: 750;
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(30, 41, 59, 0.1);
  padding: 20px 0;
}

.customers-section .table-header .table-cell {
  padding: 0 20px;
  display: flex;
  align-items: center;
  color: #6c757d;
}

.customers-section .table-body {
  min-height: 600px;
  overflow-x: hidden;
  scroll-behavior: smooth;
  background: #ffffff;
}


.customers-section .table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 0.8fr 1fr 1fr;
  border-bottom: 1px solid rgba(30, 41, 59, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 80px;
  background: #ffffff;
  position: relative;
  cursor: pointer;
}

.customers-section .table-row:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.customers-section .table-cell {
  padding: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.customers-section .table-cell:last-child {
  border-right: none;
}

.customers-section .datetime-full {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customers-section .date-part {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.customers-section .time-part {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.customers-section .activity-description {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customers-section .product-name {
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  font-size: 15px;
}

.customers-section .description-text {
  font-size: 12px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
}

.customers-section .customer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customers-section .customer-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.customers-section .customer-email {
  font-size: 12px;
  color: #64748b;
}

.customers-section .quantity-value {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.customers-section .activity-amount.positive {
  color: #059669;
  font-weight: 700;
  font-size: 15px;
}

.customers-section .activity-amount.negative {
  color: #dc2626;
  font-weight: 700;
  font-size: 15px;
}

.customers-section .no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  background: #ffffff;
}

.customers-section .no-data p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 0.8fr 1fr 1fr 1fr;
  background: #f8f9fa; /* Серый фон для заголовков */
  font-weight: 750;
  font-size: 12px;
  color: #6c757d; /* Серый цвет текста заголовков */
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(30, 41, 59, 0.1);
  padding: 20px 0;
}

.table-header .table-cell {
  padding: 0 20px;
  display: flex;
  align-items: center;
  color: #6c757d; /* Серый цвет для текста заголовков */
}

/* Стили для прокрутки таблицы */
.table-body {
  max-height: 600px;
  overflow-y: auto;
  scroll-behavior: smooth;
  min-height: 650px;
  overflow-x: hidden;
  background: #ffffff;
}

/* Скрываем визуальный скроллбар но оставляем функциональность */
.table-body::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.table-body::-webkit-scrollbar-track {
  background: transparent;
}

.table-body::-webkit-scrollbar-thumb {
  background: transparent;
}


.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 0.8fr 1fr 1fr 1fr;
  border-bottom: 1px solid rgba(30, 41, 59, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 80px;
  background: #ffffff; /* Белый фон для строк с данными */
  position: relative;
}

.table-row:hover {
  background: #f8f9fa; /* Светло-серый фон при наведении */
  transform: translateX(2px);
}

.table-row.return-row:hover {
  background: rgba(239, 68, 68, 0.05); /* Слабый красный фон для возвратов */
}

.table-cell {
  padding: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.table-cell:last-child {
  border-right: none;
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

.negative-amount {
  color: #dc2626 !important;
}

.stat-value-small.negative-amount {
  color: #dc2626 !important;
  font-weight: 600;
}

.stat-value.negative-amount {
  color: #dc2626 !important;
  font-weight: 600;
}

.activity-timeline {
  max-height: 250px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  background: #ffffff;
  border-radius: 8px;
}

.no-data p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
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

.users-list {
  height: 200px;
  overflow-x: hidden;
  scroll-behavior: smooth;
  user-select: none; /* Предотвращаем выделение текста при перетаскивании */
  padding-bottom: 20px; /* Добавляем отступ снизу для списка */
}


/* Стили для улучшения UX при перетаскивании */
.users-list.dragging {
  cursor: grabbing !important;
}

.users-list.dragging .user-item {
  pointer-events: none;
}

.orders-section {
  padding: 20px 24px;
  padding-bottom: 100px;
}

.orders-list {
  max-height: 600px;
  overflow-y: auto;
  padding-bottom: 20px;
  scroll-behavior: smooth;
  position: relative;
}

.orders-list::-webkit-scrollbar {
  width: 8px;
}

.orders-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.orders-list::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(transparent, rgba(255,255,255,0.9));
  pointer-events: none;
}


.orders-list::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(transparent, rgba(255,255,255,0.9));
  pointer-events: none;
}


.order-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  background: #ffffff;
  margin-bottom: 4px;
  cursor: pointer;
}

.order-item:hover {
  background: #f8f9fa;
  border-color: #a302d4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.15);
}

.order-number {
  width: 45px;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-product {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  font-size: 14px;
}

.order-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.08);
  padding: 3px 6px;
  border-radius: 4px;
}

.icon {
  font-size: 11px;
}

.order-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-weight: 600;
  color: #059669;
  font-size: 13px;
}

.stat-label {
  display: block;
  font-size: 9px;
  color: #64748b;
  margin-top: 2px;
}

.status-badge {
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-completed {
  width: auto !important;
  background: #4CAF50 !important;
  color: black !important;
  border: none !important;
  font-size: 8px !important;
  padding: 1px 3px !important;
  border-radius: 3px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
}

.status-badge.status-returned {
  width: auto !important;
  background: #FFC107 !important;
  color: black !important;
  border: none !important;
  font-size: 8px !important;
  padding: 1px 3px !important;
  border-radius: 3px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-default {
  background: #f3f4f6;
  color: #374151;
}

.no-orders-message {
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
  max-height: 80vh;
  padding-bottom: 60px;
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

.orders-section {
  padding: 20px 0 40px 0;
}

.section-header {
  padding: 0 24px 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.orders-list {
  max-height: 440px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.orders-list::-webkit-scrollbar {
  width: 8px;
}

.orders-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  background: #ffffff;
  margin-bottom: 4px;
}

.order-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.order-number {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #a302d4, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.order-info {
  flex: 1;
}

.order-product {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.order-details {
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

.order-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-completed {
  background: #10b981;
  color: #000000;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-default {
  background: #f3f4f6;
  color: #374151;
}

.no-orders-message {
  text-align: center;
  padding: 40px 24px;
  color: #64748b;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-results-text strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
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
  
  .period-info-section {
    padding: 16px 20px;
  }
  
  .orders-section {
    padding: 16px 0 20px 0;
  }
  
  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
  }
  
  .order-number {
    align-self: flex-start;
  }
  
  .order-stats {
    align-self: flex-end;
    text-align: right;
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
  background: white;
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

/* Стили для имени клиента под статусом */
.customer-name-under-status {
  margin-top: -20px;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  

}

.order-header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding-bottom: 100px; /* Дополнительный отступ снизу */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin-bottom: 40px;
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
  transition: all 0.2s ease;
}

.scroll-btn:hover {
  background: #a302d4;
  color: white;
  transform: translateY(-1px);
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

/* Стили для простого списка продуктов */
.products-simple-list {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.product-item-simple {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(30, 41, 59, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: #ffffff;
}

.product-item-simple:last-child {
  border-bottom: none;
}

.product-item-simple:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.product-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.product-name-simple {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.product-arrow {
  margin-left: 12px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.product-item-simple:hover .product-arrow {
  opacity: 1;
}

/* Стили для детального просмотра заказа */
.order-details-view {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
}

.order-detail-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(30, 41, 59, 0.1);
}

.order-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.order-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.info-value.amount.positive {
  color: #059669;
  font-size: 16px;
}

.info-value.amount.negative {
  color: #dc2626;
  font-size: 16px;
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
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value {
    text-align: left;
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

/* Стили для новой таблицы заказов */
.orders-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Скрытие колонок когда не в Latest Orders режиме */
.customers-section:not(.expanded) .table-cell:nth-child(1),
.customers-section:not(.expanded) .table-cell:nth-child(3) {
  display: none;
}

/* Адаптация ширины оставшихся колонок */
.customers-section:not(.expanded) .table-cell:nth-child(2) {
  flex: 4;
  text-align: left;
  padding-right: 16px;
}

.customers-section:not(.expanded) .table-cell:nth-child(4) {
  flex: 3;
  text-align: center;
  padding: 0 16px;
}

.customers-section:not(.expanded) .table-cell:nth-child(5) {
  flex: 5;
  text-align: center;
  padding-left: 20 90px;
}

.customers-section:not(.expanded) .table-cell {
  padding: 8px 12px;
}



.orders-table-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table-head {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.orders-table-head th {
  padding: 4px 8px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table-body {
  display: block;
  width: 100%;
}


.orders-table-body tr {
  display: table;
  width: 100%;
  table-layout: fixed;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.orders-table-body tr:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.orders-table-body td {
  padding: 8px 12px;
  vertical-align: middle;
  font-size: 12px;
  color: #374151;
}

.order-id-styled {
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-id-number {
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #a302d4;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  margin: 0;
}

.customer-name-small {
  color: #6b7280;
  font-size: 13px;
  margin: 0;
  font-weight: 500;
}

.order-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-main {
  font-weight: 500;
  color: #374151;
}

.date-time {
  color: #6b7280;
  font-size: 10px;
}

.order-amount {
  font-weight: 100;
  font-size: 14px;
}

.amount-positive {
  color: #10b981;
}

.amount-negative {
  color: #ef4444;
}

/* Цвета для цены в зависимости от статуса */
.positive-amount {
  color: #10b981 !important;
}

.negative-amount {
  color: #ef4444 !important;
}

.order-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-returned {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-completed .status-icon {
  background: #10b981;
}

.status-returned .status-icon {
  background: #f59e0b;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #a302d4;
  color: #a302d4;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(163, 2, 212, 0.2);
}

.view-btn {
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  color: white;
  border: none;
}

.view-btn:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}

.status-chip-compact {
  font-size: 9px !important;
  height: 20px !important;
  min-width: 70px !important;
}

.status-chip-compact .v-chip__content {
  padding: 0 6px !important;
  font-weight: 500 !important;
}

/* Стили для детального просмотра заказа */
.order-details-overlay {
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.order-details-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.order-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.order-details-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
  transform: scale(1.1);
}

.order-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.order-amount-large {
  text-align: center;
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.amount-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.order-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f3f4f6;
}

.section-title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.section-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.return-reason {
  grid-column: 1 / -1;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.return-reason .info-label {
  color: #92400e;
}

.return-reason .info-value {
  color: #78350f;
  font-style: italic;
}

/* Стили для колонки Amount в обычном режиме */
.customers-section .table-cell:nth-child(4) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 50px;
}

/* Стили для колонки Status в обычном режиме */
.customers-section .table-cell:nth-child(5) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 100px;
}

/* Стили для расширенного режима */
.customers-section.expanded .table-cell:nth-child(4) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 100px;
}

.customers-section.expanded .table-cell:nth-child(5) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 200px;
}

.customers-section.expanded .orders-table {
  margin-left: 0px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .orders-table-head th,
  .orders-table-body td {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .order-details-modal {
    margin: 20px;
    padding: 20px;
  }
  
  .order-meta,
  .section-content {
    grid-template-columns: 1fr;
  }
  
  .amount-value {
    font-size: 24px;
  }
}



.order-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  margin-top: 16px;
}

.order-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.product-icon-wrapper {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.product-icon-wrapper .v-icon {
  color: white !important;
}

.product-details {
  flex: 1;
}

.product-name {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.product-id {
  color: white;
  background: #8b5cf6;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
  font-family: 'Courier New', Consolas, monospace;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.section-title-with-id {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.order-id-badge {
  color: white;
  background: #8b5cf6;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: 'Courier New', Consolas, monospace;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.order-right {
  display: flex;
  gap: 24px;
  align-items: center;
}

.order-info-item {
  text-align: center;
  min-width: 80px;
}

.order-info-item .info-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.order-info-item .info-value {
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

/* Стили для секций деталей заказа */
.details-section {
  margin-top: 10px;
}

.order-right {
  display: flex;
  gap: 24px;
  align-items: center;
}

/* Адаптивность для order-card */
@media (max-width: 768px) {
  .order-card {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .order-right {
    width: 100%;
    justify-content: space-around;
  }
  
  .order-info-item {
    min-width: auto;
  }
}

.payment-info-card {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
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
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value {
    text-align: left;
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

/* Стили для новой таблицы заказов */
.orders-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Скрытие колонок когда не в Latest Orders режиме */
.customers-section:not(.expanded) .table-cell:nth-child(1),
.customers-section:not(.expanded) .table-cell:nth-child(3) {
  display: none;
}

/* Адаптация ширины оставшихся колонок */
.customers-section:not(.expanded) .table-cell:nth-child(2) {
  flex: 4;
  text-align: left;
  padding-right: 16px;
}

.customers-section:not(.expanded) .table-cell:nth-child(4) {
  flex: 3;
  text-align: center;
  padding: 0 16px;
}

.customers-section:not(.expanded) .table-cell:nth-child(5) {
  flex: 5;
  text-align: center;
  padding-left: 20 90px;
}

.customers-section:not(.expanded) .table-cell {
  padding: 8px 12px;
}



.orders-table-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table-head {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.orders-table-head th {
  padding: 4px 8px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table-body {
  display: block;
  width: 100%;
}


.orders-table-body tr {
  display: table;
  width: 100%;
  table-layout: fixed;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.orders-table-body tr:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.orders-table-body td {
  padding: 8px 12px;
  vertical-align: middle;
  font-size: 12px;
  color: #374151;
}

.order-id-styled {
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-id-number {
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #a302d4;
  box-shadow: 0 2px 8px rgba(163, 2, 212, 0.3);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  margin: 0;
}

.customer-name-small {
  color: #6b7280;
  font-size: 13px;
  margin: 0;
  font-weight: 500;
}

.order-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-main {
  font-weight: 500;
  color: #374151;
}

.date-time {
  color: #6b7280;
  font-size: 10px;
}

.order-amount {
  font-weight: 100;
  font-size: 14px;
}

.amount-positive {
  color: #10b981;
}

.amount-negative {
  color: #ef4444;
}

/* Цвета для цены в зависимости от статуса */
.positive-amount {
  color: #10b981 !important;
}

.negative-amount {
  color: #ef4444 !important;
}

.order-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-returned {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-completed .status-icon {
  background: #10b981;
}

.status-returned .status-icon {
  background: #f59e0b;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #a302d4;
  color: #a302d4;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(163, 2, 212, 0.2);
}

.view-btn {
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  color: white;
  border: none;
}

.view-btn:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(163, 2, 212, 0.3);
}

.status-chip-compact {
  font-size: 9px !important;
  height: 20px !important;
  min-width: 70px !important;
}

.status-chip-compact .v-chip__content {
  padding: 0 6px !important;
  font-weight: 500 !important;
}

/* Стили для детального просмотра заказа */
.order-details-overlay {
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.order-details-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.order-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.order-details-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
  transform: scale(1.1);
}

.order-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.order-amount-large {
  text-align: center;
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.amount-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.order-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f3f4f6;
}

.section-title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a302d4 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.section-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.return-reason {
  grid-column: 1 / -1;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.return-reason .info-label {
  color: #92400e;
}

.return-reason .info-value {
  color: #78350f;
  font-style: italic;
}

/* Стили для колонки Amount в обычном режиме */
.customers-section .table-cell:nth-child(4) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 50px;
}

/* Стили для колонки Status в обычном режиме */
.customers-section .table-cell:nth-child(5) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 100px;
}

/* Стили для расширенного режима */
.customers-section.expanded .table-cell:nth-child(4) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 100px;
}

.customers-section.expanded .table-cell:nth-child(5) {
  text-align: right;
  margin-left: auto;
  justify-content: flex-end;
  padding-left: 200px;
}

.customers-section.expanded .orders-table {
  margin-left: 0px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .orders-table-head th,
  .orders-table-body td {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .order-details-modal {
    margin: 20px;
    padding: 20px;
  }
  
  .order-meta,
  .section-content {
    grid-template-columns: 1fr;
  }
  
  .amount-value {
    font-size: 24px;
  }
}



.order-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  margin-top: 16px;
}

.order-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.product-icon-wrapper {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.product-icon-wrapper .v-icon {
  color: white !important;
}

.product-details {
  flex: 1;
}

.product-name {
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.product-id {
  color: white;
  background: #8b5cf6;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
  font-family: 'Courier New', Consolas, monospace;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.section-title-with-id {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.order-id-badge {
  color: white;
  background: #8b5cf6;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: 'Courier New', Consolas, monospace;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.order-right {
  display: flex;
  gap: 24px;
  align-items: center;
}

.order-info-item {
  text-align: center;
  min-width: 80px;
}

.order-info-item .info-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.order-info-item .info-value {
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
}

/* Стили для секций деталей заказа */
.details-section {
  margin-top: 10px;
}

.order-right {
  display: flex;
  gap: 24px;
  align-items: center;
}

/* Адаптивность для order-card */
@media (max-width: 768px) {
  .order-card {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .order-right {
    width: 100%;
    justify-content: space-around;
  }
  
  .order-info-item {
    min-width: auto;
  }
}

.payment-info-card {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

/* Стили для кнопок действий с заказами */
.order-actions-and-amount {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.edit-btn {
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
}

.action-btn .v-icon {
  transition: all 0.2s ease;
}

.action-btn:hover .v-icon {
  transform: scale(1.1);
}

.save-btn {
  background: rgba(16, 185, 129, 0.1) !important;
  border: 1px solid rgba(16, 185, 129, 0.2) !important;
}

.save-btn:hover {
  background: rgba(16, 185, 129, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
}

.cancel-btn {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
}

.inline-edit-field {
  font-size: 14px !important;
}

.inline-edit-field .v-input__control {
  min-height: 32px !important;
}

.inline-edit-field .v-text-field__details {
  display: none !important;
}

.product-name-edit {
  min-width: 200px;
}

.customer-name-edit {
  min-width: 150px;
  margin-top: -20px;
}

.quantity-edit {
  min-width: 60px;
}

/* Стили для кнопок действий внутри карточек заказов */
.order-card-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: 16px;
}

.order-card-actions .action-btn {
  width: 32px !important;
  height: 32px !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

.order-card-actions .edit-btn {
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
}

.order-card-actions .edit-btn:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3) !important;
}

.order-card-actions .delete-btn {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
}

.order-card-actions .delete-btn:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3) !important;
}

/* Адаптивность для кнопок действий */
@media (max-width: 768px) {
  .order-actions-and-amount {
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
  }
  
  .order-action-buttons {
    order: 2;
  }
  
  .order-amount-large {
    order: 1;
  }
}

/* Адаптивность для кнопок внутри карточек */
@media (max-width: 768px) {
  .order-card-actions {
    margin-left: 0;
    margin-top: 12px;
    justify-content: center;
  }
  
  .order-right {
    flex-wrap: wrap;
  }
}

/* Добавляем стили для inline-редактирования */
.inline-edit-field {
  margin-top: 4px;
  max-width: 150px;
}

.product-name-edit {
  max-width: 200px;
  font-size: 16px;
  font-weight: 500;
}

.customer-name-edit {
  max-width: 180px;
  margin-top: 8px;
}

.save-btn {
  background-color: #f0fdf4 !important;
}

.cancel-btn {
  background-color: #f9fafb !important;
}

.order-card-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
</style>