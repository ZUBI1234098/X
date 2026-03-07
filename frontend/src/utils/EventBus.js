
import Vue from 'vue'

export const EventBus = new Vue()

export const EVENTS = {
  // Customer events
  CUSTOMER_ADDED: 'customer_added',
  CUSTOMER_UPDATED: 'customer_updated',
  CUSTOMER_DELETED: 'customer_deleted',
  CUSTOMERS_CHANGED: 'customers_changed',
  
  // Product events
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCTS_CHANGED: 'products_changed',
  PRODUCT_ERROR: 'product_error',
  
  // Order events
  ORDER_CHANGED: 'order_changed',
  
  // Expense events
  OPEN_ADD_EXPENSE_DIALOG: 'open_add_expense_dialog',

  // Success animation (purchase / return / expense)
  SUCCESS_ANIMATION: 'success_animation',
  
  // Voice Assistant events
  VOICE_STATUS_CHANGED: 'voice-status-changed',
  VOICE_COMMAND_RECOGNIZED: 'voice-command-recognized',
  VOICE_COMMAND_EXECUTED: 'voice-command-executed',
  VOICE_ERROR: 'voice-error'
}

