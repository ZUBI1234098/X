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
                    v-if="dataType === 'registrations' || dataType === 'activity'"
                    icon
                    @click="exitChartExpandedMode"
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
                    <div class="stat-label-filter">{{ $t('analytics.stats.totalCustomers') }}</div>
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
                  
                  <div class="data-type-filters">
                    <button 
                      @click="dataType = 'registrations'"
                      :class="['filter-btn', { active: dataType === 'registrations' }]"
                    >
                      {{ $t('analytics.dataTypes.registrations') }}
                    </button>
                    <button 
                      @click="dataType = 'activity'"
                      :class="['filter-btn', { active: dataType === 'activity' }]"
                    >
                      {{ $t('analytics.dataTypes.activity') }}
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
                  v-if="selectedCustomerForDetail || isCustomersExpanded"
                  icon
                  @click.stop="exitCustomerDetailView"
                  class="back-btn hover-lift mr-2"
                  style="position: absolute; left: 10px; top: calc(50% - 8px); transform: translateY(-50%); transition: transform 0.2s ease, box-shadow 0.2s ease;"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div style="display: flex; align-items: center; justify-content: center; flex: 1;">
                  <h1 class="chart-title" @click="openCustomersSection">
                    {{ $t('analytics.customer.customersList') }}
                  </h1>
                </div>
                <v-text-field
                  v-if="isCustomersExpanded && !selectedCustomerForDetail"
                  v-model="searchQuery"
                  :placeholder="$t('common.search')"
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
                    v-for="customer in selectedCustomerForDetail ? [selectedCustomerForDetail] : sortedCustomers.slice(0, isCustomersExpanded ? sortedCustomers.length : 20)" 
                    :key="customer.id" 
                    class="customer-item"
                    :class="{ 'no-hover': selectedCustomerForDetail }"
                    @click.stop="openCustomerDetailView(customer)"
                  >
                  <div v-if="!selectedCustomerForDetail" class="customer-info" style="display: flex; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                      <div style="background-color: #f5f5f5; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                        <v-icon size="20" color="#666666">mdi-account</v-icon>
                      </div>
                      <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #000000;">{{ customer.name }}</h3>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center; margin-left: auto; margin-right: 20px;">
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">{{ customer.purchasesCount || 0 }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('analytics.customer.purchases') }}</span>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">{{ customer.returns ? customer.returns.length : 0 }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('analytics.customer.returns') }}</span>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="font-size: 14px; font-weight: bold;">${{ (customer.totalValue || 0).toLocaleString() }}</span>
                        <span style="font-size: 12px; color: #666;">{{ $t('analytics.customer.total') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Детали клиента - только таблица в стиле ProductsAnalytics -->
                  <div v-if="selectedCustomerForDetail" class="product-detail-simple">
                    <div class="activity-table">
                      <div class="table-header">
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.dateAndTime') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.pieces') }}</div>
                        <div class="table-cell">{{ $t('pages.orders.product') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.description') }}</div>
                        <div class="table-cell">{{ $t('pages.orders.payment') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.amount') }}</div>
                        <div class="table-cell">{{ $t('analytics.customer.tableHeaders.status') }}</div>
                      </div>
                      <div class="table-body" @wheel="handleTableScroll($event, 'activities')">
                        <div 
                          v-for="activity in selectedCustomerForDetail.allActivities" 
                          :key="activity.id"
                          class="table-row"
                          :class="{ 
                            'return': activity.type === 'return',
                            'returned': activity.status === 'returned',
                            'registration': activity.type === 'registration',
                            'clickable-purchase': activity.type === 'purchase' && activity.isGrouped
                          }"
                          @click="activity.type === 'purchase' && activity.isGrouped ? openPurchaseDetails(activity) : null"
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
                              <template v-else-if="activity.quantity && activity.quantity > 0">{{ activity.quantity }}</template>
                              <template v-else-if="activity.type === 'return' && activity.quantity && activity.quantity > 0">-{{ activity.quantity }}</template>
                              <template v-else-if="activity.type === 'purchase'">{{ activity.quantity || 1 }}</template>
                              <template v-else>-</template>
                            </span>
                          </div>
                          <div class="table-cell">
                            <div class="activity-description">
                              <div class="product-name">{{ activity.productName || '-' }}</div>
                            </div>
                          </div>
                          <div class="table-cell">
                            <div class="operation-description">
                              <span v-if="activity.type === 'purchase'" class="operation-type purchase">{{ $t('pages.buy.title') }}</span>
                              <span v-else-if="activity.type === 'return'" class="operation-type return">
                                {{ getReturnReasonTranslation(activity.reason) }}
                                <div v-if="activity.notes" class="return-notes">{{ activity.notes }}</div>
                              </span>
                              <span v-else-if="activity.type === 'registration'" class="operation-type registration">{{ $t('common.customerCreatedAccount') }}</span>
                              <span v-else class="operation-type other">{{ activity.type }}</span>
                            </div>
                          </div>
                          <div class="table-cell">
                            <span v-if="activity.type === 'purchase' && activity.paymentMethod" class="payment-method">
                              {{ getPaymentMethodText(activity.paymentMethod) }}
                            </span>
                            <span v-else-if="activity.type === 'return'">-</span>
                            <span v-else-if="activity.type === 'registration'">-</span>
                            <span v-else>-</span>
                          </div>
                          <div class="table-cell">
                            <span v-if="activity.status === 'added' || activity.status === 'edit' || activity.status === 'removed'">-</span>
                            <span v-else-if="activity.amount && activity.amount !== 0" class="activity-amount" :class="{ negative: activity.amount < 0, positive: activity.amount > 0 }">
                              ${{ activity.amount.toLocaleString() }}
                            </span> 
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
                    
                    <div v-if="!selectedCustomerForDetail.allActivities || selectedCustomerForDetail.allActivities.length === 0" class="no-data">
                      <v-icon size="48" color="#e5e7eb">mdi-history</v-icon>
                      <p>У этого клиента нет истории активности</p>
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
      <div class="tooltip-value">{{ tooltip.value }} {{ tooltip.tooltipText }}</div>
    </div>
    
    <!-- Модальное окно деталей точки графика -->
    <div v-if="pointDetailsModal.show" class="modal-overlay" @click="closePointDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ pointDetailsModal.title }}</h3>
            <p class="subtitle">{{ pointDetailsModal.usersList.length }} {{ $t('analytics.modal.customersFound') }}</p>
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
              <span class="info-label">{{ $t('analytics.modal.totalCustomers') }}</span>
              <span class="info-value">{{ pointDetailsModal.usersList.length }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('analytics.modal.dataType') }}</span>
              <span class="info-value">{{ dataType === 'registrations' ? $t('analytics.modal.newRegistrations') : $t('analytics.modal.userActivity') }}</span>
            </div>
          </div>
          
          <div class="users-section">
            <div class="section-header">
              <h4 class="section-title">{{ $t('analytics.customer.customerList') }}</h4>
            </div>
            <div class="users-list" ref="usersListModal">
              <div v-for="user in pointDetailsModal.usersList" :key="user.id" class="user-item" @click="showCustomerDetails(user)">
                <div class="user-avatar">
                  {{ getCustomerInitials(user.name) }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <!-- Показываем контактную информацию только для регистраций -->
                  <div v-if="dataType === 'registrations'" class="user-details">
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ user.email || $t('analytics.modal.noEmail') }}
                    </div>
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ user.phone || $t('analytics.modal.noPhone') }}
                    </div>
                    <div class="detail-item">
                      <span class="icon"></span>
                      {{ user.address || $t('analytics.modal.noAddress') }}
                    </div>
                  </div>
                </div>
                <!-- Показываем статистику только для активности -->
                <div v-if="dataType === 'activity'" class="user-stats">
                  <div class="stat">
                    <span class="stat-value">${{ user.totalSpentInPeriod || 0 }}</span>
                    <span class="stat-label">{{ $t('analytics.modal.spentInPeriod') }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ user.activityCount || 0 }}</span>
                    <span class="stat-label">{{ $t('analytics.modal.activities') }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="pointDetailsModal.usersList.length === 0" class="no-users-message">
                <div class="no-results-icon"></div>
                <div class="no-results-text">
                  <strong>{{ $t('analytics.modal.noCustomersFound') }}</strong>
                  <p>{{ $t('analytics.modal.noCustomersMessage') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="footer-info">
            <span class="period-summary">
               {{ $t('analytics.modal.period') }} {{ pointDetailsModal.description }} 
            </span>
          </div>
          <div class="footer-buttons">
            <button @click="closePointDetails" class="confirm-btn">
              {{ $t('analytics.modal.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно деталей покупки -->
    <div v-if="purchaseDetailsModal.show" class="modal-overlay" @click="closePurchaseDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <h3>{{ $t('pages.orders.orderDetails') }}</h3>
            <p class="subtitle">{{ purchaseDetailsModal.items ? purchaseDetailsModal.items.length : 0 }} {{ $t('common.items') }}</p>
          </div>
          <button @click="closePurchaseDetails" class="close-btn">{{ $t('common.closeButton') }}</button>
        </div>
        
        <div class="modal-body">
          <div v-if="purchaseDetailsModal.purchase" class="purchase-info-section">
            <div class="info-row">
              <span class="info-label">{{ $t('pages.orders.date') }}:</span>
              <span class="info-value">{{ formatDateTime(purchaseDetailsModal.purchase.date) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('pages.orders.payment') }}:</span>
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
              <h4 class="section-title">{{ $t('pages.orders.itemsPurchased', { count: purchaseDetailsModal.items ? purchaseDetailsModal.items.length : 0 }) }}</h4>
              <div class="scroll-buttons">
              </div>
            </div>
            <div class="items-list" ref="itemsList">
              <div v-for="(item, index) in purchaseDetailsModal.items" :key="item.id" class="item-row">
                <div class="item-number">{{ index + 1 }}</div>
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-details">{{ $t('pages.orders.quantityLabel', { quantity: item.quantity }) }}</div>
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
              {{ $t('analytics.modal.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>


/* Стили таблицы */
.activity-table {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.table-header {
  display: flex;
  position: sticky;
  top: 0;
  background: #e9ecef;
  z-index: 10;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
  height: 50px;
}

.table-header .table-cell {
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #495057;
}

.table-header .table-cell:last-child {
  text-align: center;
  padding-right: 0px;
}

.table-body {
  overflow-y: auto;
  height: 600px;
  background: #ffffff;
}

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
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 40px;
  align-items: center;
}


.table-row.return {
  background: #fff9c4; /* Желтый фон для возвратов */
}

.table-row.returned {
  background: #fff9c4; /* Желтый фон для статуса returned */
}

.table-cell {
  flex: 1;
  padding: 8px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 1.5;
  min-height: 40px;
}

.table-cell:nth-child(1) {
  margin-left: 0px;
}

.table-cell:nth-child(2) {
  margin-left: 0px;
}

.table-cell:nth-child(3) {
  margin-left: 0px;
}

.table-cell:nth-child(4) {
  margin-left: 0px;
}

.table-cell:nth-child(5) {
  margin-left: 0px;
}

.table-cell:nth-child(6) {
  margin-left: 0px;
}

.table-cell:nth-child(7) {
  margin-left: 0px;
  text-align: center;
}

.table-cell:last-child {
  border-right: none;
  text-align: center;
  padding-right: 0px;
}

.datetime-full {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-part {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.time-part {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.quantity-text {
  font-weight: 600;
  color: #1e293b;
}

.activity-description {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.return-notes {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  font-style: italic;
  font-weight: 400;
}

.reason-text {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

.operation-description {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.operation-type {
  font-weight: 500;
  font-size: 13px;
}

.operation-type.purchase {
  color: #059669;
}

.operation-type.return {
  color: #dc2626;
}

.operation-type.other {
  color: #6366f1;
}

.activity-amount {
  font-weight: 600;
  font-size: 14px;
}

.activity-amount.positive {
  color: #059669;
}

.activity-amount.negative {
  color: #dc2626;
}

.status-chip-large {
  min-width: 80px;
  font-weight: 600;
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

.clickable-purchase {
  cursor: pointer;
}

/* Основные стили для детальной информации о клиенте */
.product-detail-simple {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Отключаем hover эффекты только для таблицы в детальной информации о клиенте */
.product-detail-simple .table-row {
  transition: none !important;

}

.product-detail-simple .table-row:hover {
  background: #ffffff !important;
  transform: none !important;
}

.product-detail-simple .table-row.return:hover {
  background: rgba(239, 68, 68, 0.05) !important;
  transform: none !important;
}

.product-detail-simple .clickable-purchase {
  cursor: default !important;
}

.product-detail-simple .clickable-purchase:hover {
  background: #ffffff !important;
}

/* Убираем линии в ячейках таблицы детальной информации */
.product-detail-simple .table-cell {
  border-bottom: none !important;
}

.product-detail-simple .table-cell:nth-child(3),
.product-detail-simple .table-cell:nth-child(4) {
  text-align: left !important;
}

.product-detail-simple .table-header .table-cell:nth-child(3),
.product-detail-simple .table-header .table-cell:nth-child(4) {
  text-align: left !important;
}

.product-detail-simple .table-header {
  background: #e9ecef !important;
}

.product-detail-simple .table-header .table-cell {
  color: #495057 !important;
}

.product-detail-simple .table-body {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

.product-detail-simple .activity-table {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Отключаем hover эффекты для customer-item в детальной информации */
.product-detail-simple .customer-item {
  transition: none !important;
}

.product-detail-simple .customer-item:hover {
  border-color: initial !important;
  transform: none !important;
  box-shadow: none !important;
  background: initial !important;
  border: initial !important;
  border-radius: initial !important;
}

.product-detail-simple .customer-item:hover::before {
  transform: none !important;
}

.product-detail-simple .customer-item-expanded:hover {
  border-color: initial !important;
  box-shadow: none !important;
  transform: none !important;
}

/* Отключаем hover для customer-item который содержит детальную информацию */
.customer-item:has(.product-detail-simple) {
  transition: none !important;
}

.customer-item:has(.product-detail-simple):hover {
  border-color: initial !important;
  transform: none !important;
  box-shadow: none !important;
  background: initial !important;
  border: initial !important;
  border-radius: initial !important;
}

.customer-item:has(.product-detail-simple):hover::before {
  transform: none !important;
}

/* Альтернативный способ - отключаем hover когда есть selectedCustomerForDetail */
.customers-list:has(.product-detail-simple) .customer-item:hover {
  border-color: initial !important;
  transform: none !important;
  box-shadow: none !important;
  background: initial !important;
  border: initial !important;
  border-radius: initial !important;
}

.customers-list:has(.product-detail-simple) .customer-item:hover::before {
  transform: none !important;
}

/* Самое надежное решение - класс no-hover */
.customer-item.no-hover {
  transition: none !important;
  cursor: default !important;
  border-bottom: none !important;
}

.customer-item.no-hover:hover {
  border-color: initial !important;
  transform: none !important;
  box-shadow: none !important;
  background: initial !important;
  border: initial !important;
  border-radius: initial !important;
}

.customer-item.no-hover:hover::before {
  transform: none !important;
}

/* Убираем линию сверху в детальной информации */
.customer-item.no-hover::before {
  display: none !important;
}

.product-detail-simple::before {
  display: none !important;
}


</style>

<script>
import api from '@/services/api'
import { EventBus } from '@/utils/EventBus'
export default {
  name: 'UsersAnalytics',
  data() {
    return {
      timeFilter: 'day',
      chartPeriodText: '',
      
      chartMode: 'registrations',
      chartModes: [
        { value: 'registrations', text: 'Registrations', icon: 'mdi-account-plus' },
        { value: 'activity', text: 'Activity', icon: 'mdi-chart-line' }
      ],
      
      isChartExpanded: false,
      
      dataType: 'registrations',
      
      isCustomerDetailView: false,
      selectedCustomerForDetail: null,
      
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
      
      sortBy: 'totalValue',
      sortOptions: [
        { text: this.$t('analytics.customer.byPurchaseAmount'), value: 'totalValue' },
        { text: this.$t('analytics.customer.byPurchaseCount'), value: 'purchasesCount' },
        { text: this.$t('analytics.customer.byName'), value: 'name' },
        { text: this.$t('analytics.customer.byRegistrationDate'), value: 'registrationDate' },
        { text: this.$t('analytics.customer.byLastActivity'), value: 'lastPurchase' }
      ],
      
      customers: [],
      
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
      
      // Новые данные для профессионального интерфейса
      activeCustomerTab: 0,
      purchaseDateMenu: false,
      purchaseDateFilter: null,
      activityDateMenu: false,
      
      // Интервал для автоматического обновления
      updateInterval: null
    }
  },
  
  computed: {
    totalCustomers() {
      return this.customers.length;
    },
    
    newUsersThisPeriod() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
      return this.userPoints.reduce((sum, point) => sum + point.value, 0);
    },
    
    averageNewUsers() {
      if (!this.userPoints || this.userPoints.length === 0) return 0;
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
          case 'registrationDate':
            return new Date(a.registrationDate || a.firstPurchase) - new Date(b.registrationDate || b.firstPurchase)
          case 'lastPurchase':
            return new Date(b.lastPurchase) - new Date(a.lastPurchase)
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
    }
  },
  
  mounted() {
    this.initializeEmptyChart();
    this.updateChartPeriodText();
    this.fetchCustomersData();
    
    // Автоматическое обновление каждую минуту для актуальных данных
    this.updateInterval = setInterval(() => {
      this.generateChartData();
    }, 60000); // Обновляем каждую минуту
    // Подписка на AI-поиск клиентов
    if (EventBus) {
      EventBus.$on('AI_SEARCH_CUSTOMERS', ({ query }) => {
        try {
          this.isCustomersExpanded = true;
          this.selectedCustomerForDetail = null;
          this.searchQuery = String(query || '');

          // Через тик — попытаться открыть точного клиента
          this.$nextTick(() => {
            const q = this.searchQuery.trim().toLowerCase();
            if (!q) return;
            const exact = (this.customers || []).find(c => (c.name || '').toLowerCase() === q);
            if (exact) {
              // Открываем детальный просмотр клиента
              this.openCustomerDetailView(exact);
            } else {
              // Сообщаем AI, что клиент не найден
              try {
                if (window && window.EventBus) {
                  window.EventBus.$emit && window.EventBus.$emit('AI_FEEDBACK', { message: 'Клиент не найден' })
                }
              } catch (e) {}
            }
          });
        } catch (e) {
          console.warn('AI_SEARCH_CUSTOMERS handler error:', e);
        }
      })
    }

    // Обработка query-параметра ?q= при переходе навигацией
    const routeQuery = this.$route && this.$route.query ? this.$route.query.q : null;
    if (routeQuery) {
      // Даем данным загрузиться
      setTimeout(() => {
        this.applyCustomerQuery(String(routeQuery))
      }, 700)
    }
  },
  
  beforeDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (EventBus) {
      EventBus.$off('AI_SEARCH_CUSTOMERS')
    }
  },

  watch: {
    ...{
      '$route.query.q'(val) {
        if (val) {
          this.applyCustomerQuery(String(val))
        }
      }
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
    },
    
    '$i18n.locale'() {
      // Обновляем модальное окно при смене языка
      if (this.pointDetailsModal.show) {
        this.updatePointDetailsModal();
      }
    }
  },
  
  methods: {
    applyCustomerQuery(query) {
      try {
        this.isCustomersExpanded = true;
        this.selectedCustomerForDetail = null;
        this.searchQuery = String(query || '');

        // Через тик — попытаться открыть точного клиента
        this.$nextTick(() => {
          const q = this.searchQuery.trim().toLowerCase();
          if (!q) return;
          const exact = (this.customers || []).find(c => (c.name || '').toLowerCase() === q);
          if (exact) {
            this.openCustomerDetailView(exact);
          }
        });
      } catch (e) {
        console.warn('applyCustomerQuery error:', e);
      }
    },
    async fetchCustomersData() {
      try {
        const [customersResponse, purchasesResponse, returnsResponse] = await Promise.all([
          api.get('/customers'),
          api.get('/purchases'),
          api.get('/returns')
        ])
        
        const customers = customersResponse.data
        const purchases = purchasesResponse.data
        const returns = returnsResponse.data
        if (customers && purchases) {
          this.processCustomersData(customers, purchases, returns)
          
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
    
    processCustomersData(customers, purchases, returns) {
      const purchasesByCustomer = {}
      purchases.forEach(purchase => {
        if (!purchasesByCustomer[purchase.customerName]) {
          purchasesByCustomer[purchase.customerName] = []
        }
        purchasesByCustomer[purchase.customerName].push(purchase)
      })
      
      const returnsByCustomer = {}
      returns.forEach(returnItem => {
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
            date: new Date(r.timestamp || r.date),
            productName: r.productName,
            quantity: r.quantity,
            reason: r.reason,
            notes: r.notes || '',
            amount: r.amount ? -Math.abs(r.amount) : 0
          }
        })
        
        const purchaseDates = purchasesWithTime.map(p => p.date)
        const returnDates = returnsWithTime.map(r => r.date)
        const allDates = [...purchaseDates, ...returnDates]
        
        const firstPurchase = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date()
        const lastPurchase = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
        // Дата регистрации клиента (из API), иначе — дата первой активности
        const registrationDate = customer.date
          ? new Date(customer.date)
          : (allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date())
        
        return {
          id: index + 1,
          name: customer.name,
          email: customer.email || `${customer.name.toLowerCase().replace(' ', '.')}@email.com`,
          purchasesCount: purchasesWithTime.length,
          totalValue: totalValue,
          avgPurchase: avgPurchase,
          firstPurchase: firstPurchase,
          lastPurchase: lastPurchase,
          registrationDate: registrationDate,
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
          title: itemsCount > 1 ? `Покупка (${itemsCount} товаров)` : `Покупка: ${firstItem.productName}`,
          description: itemsCount > 1 ? `${itemsCount} товаров куплено` : `Количество: ${firstItem.quantity}`,
          productName: firstItem.productName,
          quantity: firstItem.quantity, // Добавляем количество товара
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
            title: this.getReturnReasonTranslation(returnItem.reason),
            description: this.getReturnReasonTranslation(returnItem.reason),
            reason: returnItem.reason,
            quantity: returnItem.quantity,
            productName: returnItem.productName,
            notes: returnItem.notes,
            date: new Date(returnItem.date),
            amount: returnItem.amount ? -Math.abs(returnItem.amount) : 0
          })
        })
      }
      
      const regDate = new Date(customer.registrationDate || customer.firstPurchase)
      activities.push({
        id: 'registration',
        type: 'registration',
        title: this.$t('common.systemRegistration'),
        description: this.$t('common.customerCreatedAccount'),
        date: regDate
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
        
        if (this.dataType === 'registrations') {
          value = this.customers.filter(customer => {
            const regDate = new Date(customer.registrationDate || customer.firstPurchase);
            return regDate >= date && regDate < endTime;
          }).length;
        } else if (this.dataType === 'activity') {
          value = this.getActivityForPeriod(date, endTime);
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
    
    getCurrentLocale() {
      // Получаем текущую локаль из i18n
      const locale = this.$i18n.locale;
      const localeMap = {
        'ru': 'ru-RU',
        'en': 'en-US', 
        'de': 'de-DE'
      };
      return localeMap[locale] || 'en-US';
    },

    getMonthTranslation(monthIndex) {
      const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      return this.$t(`analytics.dates.months.${monthKeys[monthIndex]}`);
    },

    formatXAxisLabel(dataPoint, index) {
      const date = new Date(dataPoint.date);
      const now = new Date();
      const locale = this.getCurrentLocale();
      
      switch (this.timeFilter) {
        case 'hour':
          // Show actual time
          return date.toLocaleTimeString(locale, { 
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
          const monthTranslation = this.getMonthTranslation(date.getMonth());
          return `${monthTranslation} ${date.getFullYear()}`;
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
        tooltipText: this.dataType === 'registrations' ? this.$t('analytics.charts.tooltip.registrations') : this.$t('analytics.charts.tooltip.activities'),
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
    
    exitCustomerDetailView() {
      if (this.selectedCustomerForDetail) {
        // Если просматриваем детали клиента, возвращаемся к списку
        this.selectedCustomerForDetail = null;
        this.expandedCustomer = null;
        this.activeCustomerTab = 0;
      } else if (this.isCustomersExpanded) {
        // Если просто развернута секция, сворачиваем её
        this.isCustomersExpanded = false;
        this.expandedCustomer = null;
      }
    },
    
    formatDateOnly(date) {
      if (!date) return 'No data'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    
    formatTimeWithSeconds(date) {
      if (!date) return 'No data'
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },

    getActivityChipColor(activity) {
      if (activity.type === 'purchase') return '#4CAF50'
      if (activity.type === 'return') return '#FFC107'
      if (activity.status === 'added') return '#FF9800'
      if (activity.status === 'removed') return '#ef4444'
      if (activity.status === 'edit') return '#6366f1'
      return '#2196F3'
    },

    getActivityChipTextColor(activity) {
      if (activity.type === 'purchase' || activity.type === 'return') return 'black'
      return 'white'
    },

    getActivityChipText(activity) {
      if (activity.type === 'purchase') return this.$t('analytics.customer.tableHeaders.completed')
      if (activity.type === 'return') return this.$t('analytics.customer.tableHeaders.returned')
      if (activity.status === 'added') return this.$t('analytics.customer.tableHeaders.added')
      if (activity.status === 'removed') return this.$t('analytics.customer.tableHeaders.removed')
      if (activity.status === 'edit') return this.$t('analytics.customer.tableHeaders.edited')
      return activity.status ? String(activity.status).charAt(0).toUpperCase() + String(activity.status).slice(1) : this.$t('analytics.customer.tableHeaders.registered')
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
      let usersList = [];
      let modalTitle = '';
      let modalDescription = '';
      
      if (this.dataType === 'registrations') {
        usersList = this.getUsersForPeriod(timeSlot.startTime, timeSlot.endTime);
        modalTitle = this.$t('analytics.modal.registrationsInPeriod');
        modalDescription = `${this.$t('analytics.modal.newUsers')}: ${point.value}`;
      } else if (this.dataType === 'activity') {
        usersList = this.getActiveUsersForPeriod(timeSlot.startTime, timeSlot.endTime);
        modalTitle = this.$t('analytics.modal.activityInPeriod');
        modalDescription = `${this.$t('analytics.modal.totalActivities')}: ${point.value}`;
      }
      
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
      
      return {
        startTime: new Date(date),
        endTime: this.getEndTime(new Date(date))
      };
    },

    getUsersForPeriod(startTime, endTime) {
      return this.customers.filter(customer => {
        const regDate = new Date(customer.registrationDate || customer.firstPurchase);
        return regDate >= startTime && regDate < endTime;
      });
    },

    formatPeriodText(timeSlot) {
      const start = timeSlot.startTime;
      const end = timeSlot.endTime;
      const locale = this.getCurrentLocale();
      
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
      this.pointDetailsModal.show = false;
    },
    
    closePurchaseDetails() {
      this.purchaseDetailsModal.show = false;
    },
    
    updatePointDetailsModal() {
      // Обновляем переводы в модальном окне при смене языка
      if (this.pointDetailsModal.show && this.pointDetailsModal.index !== null) {
        const point = this.userPoints[this.pointDetailsModal.index];
        if (point) {
          const timeSlot = this.getTimeSlotForPoint(point, this.pointDetailsModal.index);
          let modalTitle = '';
          let modalDescription = '';
          
          if (this.dataType === 'registrations') {
            modalTitle = this.$t('analytics.modal.registrationsInPeriod');
            modalDescription = `${this.$t('analytics.modal.newUsers')}: ${point.value}`;
          } else if (this.dataType === 'activity') {
            modalTitle = this.$t('analytics.modal.activityInPeriod');
            modalDescription = `${this.$t('analytics.modal.totalActivities')}: ${point.value}`;
          }
          
          this.pointDetailsModal.title = modalTitle;
          this.pointDetailsModal.description = modalDescription;
          this.pointDetailsModal.period = this.formatPeriodText(timeSlot);
        }
      }
    },
    
    formatDateTime(date) {
      if (!date) return this.$t('common.notAvailable');
      const locale = this.getCurrentLocale();
      return new Date(date).toLocaleString(locale, {
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
      return this.dataType === 'registrations' ? this.$t('analytics.dataTypes.registrations') + ' ' + this.$t('navigation.users') : this.$t('analytics.dataTypes.activity') + ' ' + this.$t('navigation.users');
    },
    
    exitChartExpandedMode() {
      if (this.pointDetailsModal.show) {
        this.pointDetailsModal.show = false;
      } else if (this.isChartExpanded) {
        this.isChartExpanded = false;
      } else if (this.dataType === 'registrations') {
        // Возврат на предыдущую страницу откуда пришел пользователь
        this.$router.go(-1);
      } else if (this.dataType === 'activity') {
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
        return `Регистрации за ${this.getRightPanelPeriodText()}`;
      } else {
        return `Активности за ${this.getRightPanelPeriodText()}`;
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
        const regDate = new Date(customer.registrationDate || customer.firstPurchase);
        return regDate >= startTime && regDate <= now;
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
      const registrationDate = new Date(customer.registrationDate || customer.firstPurchase)
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

    getReturnReasonTranslation(reason) {
      if (!reason) return this.$t('pages.return.wrongItem') // Дефолтная причина если не указана
      const reasonMap = {
        'defective': this.$t('pages.return.defective'),
        'wrong_item': this.$t('pages.return.wrongItem'),
        'customer_request': this.$t('pages.return.customerRequest'),
        'damaged': this.$t('pages.return.damaged'),
        'not_satisfied': this.$t('pages.return.notSatisfied')
      }
      return reasonMap[reason] || reason
    },

    getLastActivity(customer) {
      const activities = this.getAllActivities(customer)
      if (activities.length === 0) return this.$t('analytics.customer.noActivity')
      
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
        this.$t('analytics.customer.categories.electronics'),
        this.$t('analytics.customer.categories.clothing'),
        this.$t('analytics.customer.categories.homeGarden'),
        this.$t('analytics.customer.categories.sports'),
        this.$t('analytics.customer.categories.books')
      ]
      return categories[customer.id % categories.length]
    },

    getFavoriteCategoryCount(customer) {
      return Math.floor(customer.purchasesCount * 0.4) + 1
    },

    getLoyaltyStatus(customer) {
      if (customer.totalValue > 10000) return this.$t('analytics.customer.loyaltyStatus.platinum')
      if (customer.totalValue > 5000) return this.$t('analytics.customer.loyaltyStatus.gold')
      if (customer.totalValue > 2000) return this.$t('analytics.customer.loyaltyStatus.silver')
      return this.$t('analytics.customer.loyaltyStatus.bronze')
    },

    getLoyaltyPoints(customer) {
      return Math.floor(customer.totalValue * 0.1)
    },

    getMonthlyActivity(customer) {
      const months = [
        this.$t('analytics.customer.months.jan'),
        this.$t('analytics.customer.months.feb'),
        this.$t('analytics.customer.months.mar'),
        this.$t('analytics.customer.months.apr'),
        this.$t('analytics.customer.months.may'),
        this.$t('analytics.customer.months.jun')
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
          title: this.getReturnReasonTranslation(returnItem.reason),
          date: new Date(returnItem.date),
          amount: returnItem.amount ? -Math.abs(returnItem.amount) : 0
        })
      })
      
      return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    },

    getCategoryColor(category) {
      const colors = {
        [this.$t('analytics.customer.categories.electronics')]: 'blue',
        [this.$t('analytics.customer.categories.clothing')]: 'pink',
        [this.$t('analytics.customer.categories.homeGarden')]: 'green',
        [this.$t('analytics.customer.categories.sports')]: 'orange',
        [this.$t('analytics.customer.categories.books')]: 'purple',
        'Общее': 'grey'
      }
      return colors[category] || 'grey'
    },

    getStatusColor(status) {
      const colors = {
        [this.$t('analytics.customer.orderStatus.completed')]: 'success',
        [this.$t('analytics.customer.orderStatus.processing')]: 'warning',
        [this.$t('analytics.customer.orderStatus.cancelled')]: 'error',
        [this.$t('analytics.customer.orderStatus.delivered')]: 'success'
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
      return this.$t('analytics.customer.country')
    },

    getCustomerCity(customer) {
      const cities = [
        this.$t('analytics.customer.cities.moscow'),
        this.$t('analytics.customer.cities.spb'),
        this.$t('analytics.customer.cities.novosibirsk'),
        this.$t('analytics.customer.cities.ekaterinburg')
      ]
      return cities[customer.id % cities.length]
    },

    getCustomerAddress(customer) {
      const streets = [
        this.$t('analytics.customer.streets.lenin'),
        this.$t('analytics.customer.streets.pushkin'),
        this.$t('analytics.customer.streets.peace'),
        this.$t('analytics.customer.streets.gagarin')
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
        this.$t('analytics.customer.paymentMethods.visa'),
        this.$t('analytics.customer.paymentMethods.mastercard'),
        this.$t('analytics.customer.paymentMethods.mir'),
        this.$t('analytics.customer.paymentMethods.paypal')
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
      return customer.totalValue > 1000 ? this.$t('analytics.customer.accountStatus.active') : this.$t('analytics.customer.accountStatus.regular')
    },

    getNewsletterStatus(customer) {
      return customer.id % 3 === 0 ? this.$t('analytics.customer.newsletterStatus.subscribed') : this.$t('analytics.customer.newsletterStatus.notSubscribed')
    },

    viewPurchaseDetails(purchase) {
      // Логика для просмотра деталей покупки
      console.log(this.$t('analytics.customer.actions.viewPurchaseDetails') + ':', purchase)
    },

    downloadInvoice(purchase) {
      // Логика для скачивания счета
      console.log(this.$t('analytics.customer.actions.downloadInvoice') + ':', purchase)
    },

    getPaymentMethodText(method) {
      const methods = {
        'card': this.$t('common.card'),
        'cash': this.$t('common.cash'), 
        'transfer': this.$t('common.transfer')
      };
      return methods[method] || method || this.$t('common.notAvailable');
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
  overflow-y: visible; /* Убираем скроллинг с внешнего контейнера */
  height: calc(100% - 60px); /* Адаптивная высота по колонке */
  margin-top: 8px;
  padding-top: 0;
  padding-right: 8px;
}

/* Скроллинг убран с внешнего контейнера - теперь только внутренние элементы */

/* Для развернутого режима */
.customers-section.expanded .customers-list {
  height: calc(100vh - 200px); /* Полная высота экрана минус отступы */
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
  display: none;
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
  display: none;
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

.customer-details-compact {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  max-height: 600px; /* добавь эту строку */
  overflow-y: auto;  /* добавь эту строку */
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


.table-header .table-cell {
  padding: 0 20px;
  display: flex;
  align-items: center;
  color: #6c757d; /* Серый цвет для текста заголовков */
}

.table-body {
  max-height: 535px;
  min-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  background: #ffffff;
}

/* Улучшенные стили для скроллбара */
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

.users-list {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  user-select: none; /* Предотвращаем выделение текста при перетаскивании */
  padding-bottom: 20px; /* Добавляем отступ снизу для списка */
}

/* Стили скроллбара для списка пользователей */
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
  padding: 20px 0 40px 0;
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
  padding-bottom: 20px;
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
  background: linear-gradient(135deg, #a302d4, #7c3aed);
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

/* Стили для способа оплаты в таблице активностей */
.payment-method {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
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
</style>