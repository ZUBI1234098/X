<template>
  <transition name="success-overlay">
    <div v-if="visible" class="success-overlay" @click="hide">
      <div class="success-card" :class="'success-card--' + (type || 'purchase')" @click.stop>
        <div class="success-icon-wrap">
          <div class="circle-wrap">
            <svg class="checkmark" viewBox="0 0 52 52">
              <circle class="circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <div class="success-title">{{ title }}</div>
        <div class="success-subtitle">{{ subtitle }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
import { EventBus, EVENTS } from '@/utils/EventBus.js'

const DURATION_MS = 2200

export default {
  name: 'SuccessAnimation',
  data() {
    return {
      visible: false,
      type: null,
      hideTimer: null
    }
  },
  computed: {
    title() {
      if (!this.type) return ''
      const key = `common.successAnimation.${this.type}Title`
      return this.$t(key)
    },
    subtitle() {
      if (!this.type) return ''
      const key = `common.successAnimation.${this.type}Subtitle`
      return this.$t(key)
    }
  },
  mounted() {
    EventBus.$on(EVENTS.SUCCESS_ANIMATION, this.show)
  },
  beforeDestroy() {
    EventBus.$off(EVENTS.SUCCESS_ANIMATION, this.show)
    if (this.hideTimer) clearTimeout(this.hideTimer)
  },
  methods: {
    show(payload) {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer)
        this.hideTimer = null
      }
      this.type = (payload && payload.type) || 'purchase'
      this.visible = true
      this.hideTimer = setTimeout(() => {
        this.visible = false
        this.hideTimer = null
      }, DURATION_MS)
    },
    hide() {
      if (this.hideTimer) clearTimeout(this.hideTimer)
      this.visible = false
      this.hideTimer = null
    }
  }
}
</script>

<style scoped>
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.success-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 48px;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  animation: success-card-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-icon-wrap {
  margin-bottom: 20px;
}

.circle-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.checkmark {
  width: 80px;
  height: 80px;
}

.circle {
  stroke: #22c55e;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: circle-draw 0.5s ease-out 0.15s forwards;
}

.check {
  stroke: #22c55e;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: check-draw 0.35s ease-out 0.5s forwards;
}

/* Добавлено — везде зелёный */
.success-card--purchase .circle,
.success-card--purchase .check,
.success-card--expense .circle,
.success-card--expense .check,
.success-card--customerAdd .circle,
.success-card--customerAdd .check,
.success-card--productAdd .circle,
.success-card--productAdd .check,
.success-card--taskAdd .circle,
.success-card--taskAdd .check,
.success-card--employeeAdd .circle,
.success-card--employeeAdd .check {
  stroke: #22c55e;
}

/* Изменено — везде жёлтый */
.success-card--return .circle,
.success-card--return .check,
.success-card--customerEdit .circle,
.success-card--customerEdit .check,
.success-card--productEdit .circle,
.success-card--productEdit .check,
.success-card--taskEdit .circle,
.success-card--taskEdit .check,
.success-card--employeeEdit .circle,
.success-card--employeeEdit .check {
  stroke: #eab308;
}

/* Удаление — в стиле сайта (фиолетовый #a302d4) */
.success-card--customerDelete .circle,
.success-card--customerDelete .check,
.success-card--productDelete .circle,
.success-card--productDelete .check,
.success-card--taskDelete .circle,
.success-card--taskDelete .check,
.success-card--employeeDelete .circle,
.success-card--employeeDelete .check {
  stroke: #a302d4;
}
.success-card--customerDelete,
.success-card--productDelete,
.success-card--taskDelete,
.success-card--employeeDelete {
  box-shadow: 0 25px 60px rgba(163, 2, 212, 0.25);
  border: 1px solid rgba(163, 2, 212, 0.2);
}

.success-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.success-subtitle {
  font-size: 15px;
  color: #6b7280;
}

@keyframes circle-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes check-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes success-card-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-overlay-enter-active {
  animation: overlay-in 0.3s ease-out;
}

.success-overlay-leave-active {
  animation: overlay-out 0.25s ease-in;
}

@keyframes overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
