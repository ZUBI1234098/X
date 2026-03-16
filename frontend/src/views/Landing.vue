<template>
  <div class="nexcrm-root landing-wrap">
    <div class="nc-bg-pattern" />
    <nav class="nc-nav" :class="{ sc: scrolled }">
      <div class="nc-nav-inner">
        <span class="nc-logo">NexCRM</span>
        <div class="nc-nav-links">
          <button type="button" class="nc-nlink" @click="scrollTo('features')">Features</button>
          <button type="button" class="nc-nlink" @click="scrollTo('analytics')">Analytics</button>
          <button type="button" class="nc-nlink" @click="scrollTo('pricing')">Pricing</button>
        </div>
        <div class="nc-nav-actions">
          <router-link to="/login" class="nc-btn nc-btn-g nc-nav-btn">Sign in</router-link>
          <router-link to="/register" class="nc-btn nc-btn-p nc-nav-btn">Start free</router-link>
        </div>
      </div>
    </nav>

    <section class="nc-hero">
      <div class="nc-orb nc-o1" />
      <div class="nc-orb nc-o2" />
      <div class="nc-dots" />
      <div class="nc-hgrid">
        <div class="nc-fu">
          <h1 class="nc-hero-title">
            Управляйте всем <span class="nc-gtx">бизнесом</span> в одной CRM системе
          </h1>
          <p class="nc-hero-desc">
            CRM система, которая показывает кто купил товар, когда купил, кто продал, когда завершилась транзакция и как развивается ваш бизнес.
          </p>
          <div class="nc-hero-btns">
            <router-link to="/register" class="nc-btn nc-btn-p nc-hero-cta">Start for $39 / month</router-link>
            <button type="button" class="nc-btn nc-btn-g nc-hero-demo">
              <span class="nc-play-icon">&#9654;</span>
              Watch Demo
            </button>
          </div>
          <div class="nc-hero-trust">
            <div class="nc-avatars">
              <div v-for="(c, i) in avatarColors" :key="i" class="nc-av" :style="{ background: c }" />
            </div>
            <div>
              <div class="nc-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p class="nc-trust-text">Trusted by <strong>2,400+</strong> businesses</p>
            </div>
          </div>
        </div>
        <div class="nc-fl nc-hero-widget">
          <NexCrmMiniCrm />
        </div>
      </div>
    </section>

    <section id="analytics" class="nc-sec nc-sec-gradient">
      <div class="nc-con">
        <div class="nc-sec-head">
          <p class="nc-stag">Analytics</p>
          <h2 class="nc-stit">Полная <span class="nc-gtx">аналитика пользователей</span></h2>
        </div>
        <div class="nc-tcol">
          <div class="nc-card nc-gcard nc-panel">
            <p class="nc-panel-title">User Growth</p>
            <p class="nc-panel-sub">Новые и активные пользователи</p>
            <NexCrmUserGrowthChart />
            <div class="nc-panel-stats">
              <div v-for="s in userGrowthStats" :key="s.l" class="nc-stat-item">
                <p class="nc-stat-label">{{ s.l }}</p>
                <p class="nc-stat-value" :style="{ color: s.c }">{{ s.v }}</p>
              </div>
            </div>
          </div>
          <div class="nc-sec-content">
            <h3 class="nc-sec-h3">Понимайте рост своего бизнеса</h3>
            <p class="nc-sec-p">Отслеживайте новых пользователей, активных клиентов и общий рост бизнеса с наглядными графиками.</p>
            <ul class="nc-feature-list">
              <li v-for="f in analyticsFeatures" :key="f"> <span class="nc-check" /> {{ f }}</li>
            </ul>
            <NexCrmMiniCrm />
          </div>
        </div>
      </div>
    </section>

    <section class="nc-sec">
      <div class="nc-con">
        <div class="nc-tcol">
          <div class="nc-card nc-gcard nc-panel">
            <p class="nc-panel-title">Order Analytics</p>
            <p class="nc-panel-sub">Продажи, доход и транзакции</p>
            <NexCrmOrdersChart />
            <div class="nc-panel-stats">
              <div v-for="s in orderStats" :key="s.l" class="nc-stat-item">
                <p class="nc-stat-label">{{ s.l }}</p>
                <p class="nc-stat-value" :style="{ color: s.c }">{{ s.v }}</p>
              </div>
            </div>
          </div>
          <div class="nc-sec-content">
            <h3 class="nc-sec-h3">Контроль каждого заказа</h3>
            <p class="nc-sec-p">Видите количество продаж, доход и успешные транзакции в одном месте.</p>
            <NexCrmMiniCrm />
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="nc-sec">
      <div class="nc-con">
        <div class="nc-sec-head">
          <p class="nc-stag">Features</p>
          <h2 class="nc-stit">Всё для управления <span class="nc-gtx">вашим бизнесом</span></h2>
        </div>
        <div class="nc-fgrid">
          <div v-for="f in features" :key="f.title" class="nc-card nc-gcard nc-feature-card" @mouseenter="hoverCard($event, true)" @mouseleave="hoverCard($event, false)">
            <div class="nc-feature-icon" v-html="f.icon" />
            <h3 class="nc-feature-title">{{ f.title }}</h3>
            <p class="nc-feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="nc-sec nc-sec-gradient">
      <div class="nc-con">
        <div class="nc-sec-head"><h2 class="nc-stit">Управление <span class="nc-gtx">командой</span></h2></div>
        <div class="nc-egrid">
          <div v-for="(e, i) in employees" :key="e.id" class="nc-card nc-gcard nc-employee-card" @mouseenter="hoverCard($event, true)" @mouseleave="hoverCard($event, false)">
            <div class="nc-employee-header">
              <div class="nc-employee-av" :style="avStyle(i)">{{ e.av }}</div>
              <div>
                <p class="nc-employee-name">{{ e.name }}</p>
                <p class="nc-employee-role">{{ e.role }}</p>
              </div>
            </div>
            <div class="nc-employee-stats">
              <div v-for="s in [{ l: 'Sales', v: e.sales, c: 'var(--nc-tx)' }, { l: 'Revenue', v: e.rev, c: 'var(--nc-p)' }, { l: 'Growth', v: e.gr, c: '#4ade80' }]" :key="s.l" class="nc-em-stat">
                <p class="nc-stat-label">{{ s.l }}</p>
                <p class="nc-stat-value" :style="{ color: s.c }">{{ s.v }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="nc-sec">
      <div class="nc-con">
        <div class="nc-sec-head">
          <p class="nc-stag">Pricing</p>
          <h2 class="nc-stit">Один простой <span class="nc-gtx">тариф</span></h2>
        </div>
        <div class="nc-pricing-card nc-gcard">
          <div class="nc-pricing-glow" />
          <span class="nc-badge nc-badge-p">Most Popular</span>
          <h3 class="nc-pricing-title">CRM PRO</h3>
          <div class="nc-pricing-price">
            <span class="nc-price-num">$39</span>
            <span class="nc-price-period">/month</span>
          </div>
          <ul class="nc-pricing-features">
            <li v-for="f in pricingFeatures" :key="f"><span class="nc-check" /> {{ f }}</li>
          </ul>
          <router-link to="/register" class="nc-btn nc-btn-p nc-pricing-cta">Start using CRM &#8594;</router-link>
          <p class="nc-pricing-hint">No credit card required &#183; Cancel anytime</p>
        </div>
      </div>
    </section>

    <footer class="nc-footer">
      <p class="nc-footer-logo">NexCRM</p>
      <p class="nc-footer-copy">&#169; 2024 NexCRM. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import NexCrmMiniCrm from '@/components/nexcrm/NexCrmMiniCrm.vue'
import NexCrmUserGrowthChart from '@/components/nexcrm/NexCrmUserGrowthChart.vue'
import NexCrmOrdersChart from '@/components/nexcrm/NexCrmOrdersChart.vue'

const IC = {
  pr: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  or: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  em: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  dl: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  an: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  db: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
}

export default {
  name: 'Landing',
  components: { NexCrmMiniCrm, NexCrmUserGrowthChart, NexCrmOrdersChart },
  data() {
    return {
      scrolled: false,
      avatarColors: ['#8739f9', '#6366f1', '#a855f7', '#7c3aed'],
      userGrowthStats: [
        { l: 'New Users', v: '+67', c: '#8739f9' },
        { l: 'Active Users', v: '264', c: '#6366f1' },
        { l: 'Growth', v: '+34%', c: '#4ade80' }
      ],
      orderStats: [
        { l: 'Total Orders', v: '187', c: '#8739f9' },
        { l: 'Revenue', v: '$51.2K', c: '#6366f1' },
        { l: 'Transactions', v: '98%', c: '#4ade80' }
      ],
      analyticsFeatures: [
        'Новые пользователи в реальном времени',
        'Активность существующих клиентов',
        'Метрики удержания и оттока'
      ],
      features: [
        { icon: IC.pr, title: 'Управление продуктами', desc: 'Добавляйте, редактируйте и отслеживайте все товары с обновлениями в реальном времени.' },
        { icon: IC.or, title: 'История продаж', desc: 'Видно кто купил, когда купил, какой товар. Полная история транзакций под рукой.' },
        { icon: IC.em, title: 'Управление сотрудниками', desc: 'Добавляйте команду, назначайте роли и отслеживайте индивидуальные показатели продаж.' },
        { icon: IC.dl, title: 'Контроль транзакций', desc: 'Мониторинг статуса платежа, времени покупки и данных клиента для каждой транзакции.' },
        { icon: IC.an, title: 'Аналитика бизнеса', desc: 'Графики дохода, рост продаж и статистика клиентов — понимайте куда движется бизнес.' },
        { icon: IC.db, title: 'Единый Dashboard', desc: 'Все метрики бизнеса в одном красивом дашборде. Видите всё, понимаете всё.' }
      ],
      employees: [
        { id: 1, name: 'Alex Morgan', role: 'Sales Lead', sales: 142, rev: '$58,400', av: 'AM', gr: '+23%' },
        { id: 2, name: 'Sarah Chen', role: 'Account Manager', sales: 98, rev: '$41,200', av: 'SC', gr: '+18%' },
        { id: 3, name: 'Mike Davis', role: 'Sales Rep', sales: 76, rev: '$32,100', av: 'MD', gr: '+12%' },
        { id: 4, name: 'Emma Wilson', role: 'Sales Rep', sales: 61, rev: '$26,800', av: 'EW', gr: '+9%' }
      ],
      pricingFeatures: [
        'Полное управление продуктами', 'Управление заказами', 'Аналитика продаж', 'Управление сотрудниками',
        'Статистика клиентов', 'Dashboard аналитики', 'Безлимитные транзакции', 'Поддержка 24/7'
      ]
    }
  },
  mounted() {
    window.addEventListener('scroll', () => { this.scrolled = window.scrollY > 20 })
  },
  methods: {
    scrollTo(id) {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    hoverCard(e, enter) {
      e.currentTarget.style.transform = enter ? 'translateY(-6px)' : ''
    },
    avStyle(i) {
      const h1 = 260 + i * 20
      const h2 = 280 + i * 20
      return {
        background: `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 60%, 40%))`
      }
    }
  }
}
</script>

<style scoped>
.landing-wrap {
  min-height: 100vh;
  overflow-x: hidden;
}

.nc-bg-pattern {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

.nc-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  transition: all 0.3s;
}

.nc-nav.sc {
  background: rgba(11, 11, 15, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--nc-br);
}

.nc-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nc-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
}

.nc-nav-links {
  display: flex;
  gap: 32px;
}

.nc-nlink {
  color: var(--nc-tx2);
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: color 0.2s;
}

.nc-nlink:hover {
  color: #fff;
}

.nc-nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nc-nav-btn {
  padding: 10px 20px;
  font-size: 14px;
  text-decoration: none;
}

.nc-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 100px 40px 80px;
}

.nc-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
}

.nc-o1 {
  width: 600px;
  height: 600px;
  top: -200px;
  left: -200px;
  background: radial-gradient(circle, #8739f9, transparent);
  animation: nc-orb1 10s ease-in-out infinite;
}

.nc-o2 {
  width: 400px;
  height: 400px;
  bottom: 0;
  right: -100px;
  background: radial-gradient(circle, #6366f1, transparent);
  animation: nc-orb2 14s ease-in-out infinite;
}

.nc-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(135, 57, 249, 0.12) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}

@keyframes nc-orb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, -40px) scale(1.1); }
  66% { transform: translate(-40px, 60px) scale(0.9); }
}

@keyframes nc-orb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-60px, 40px) scale(0.9); }
  66% { transform: translate(40px, -60px) scale(1.1); }
}

.nc-hgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

.nc-hero-title {
  font-size: clamp(38px, 5vw, 62px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 24px;
}

.nc-hero-desc {
  font-size: clamp(16px, 2vw, 19px);
  color: var(--nc-tx2);
  line-height: 1.7;
  margin-bottom: 40px;
  max-width: 500px;
}

.nc-hero-btns {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.nc-hero-cta {
  font-size: 16px;
  padding: 16px 32px;
  text-decoration: none;
}

.nc-hero-demo {
  font-size: 16px;
  padding: 16px 28px;
}

.nc-play-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--nc-p);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nc-hero-trust {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
}

.nc-avatars {
  display: flex;
}

.nc-av {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--nc-bg);
  margin-left: -8px;
}

.nc-av:first-child { margin-left: 0; }

.nc-stars {
  color: #facc15;
  font-size: 13px;
  margin-bottom: 2px;
}

.nc-trust-text {
  font-size: 13px;
  color: var(--nc-tx2);
}

.nc-hero-widget {
  animation-delay: 0.2s;
}

.nc-sec {
  padding: 100px 0;
  position: relative;
  z-index: 1;
}

.nc-sec-gradient {
  background: linear-gradient(180deg, transparent, rgba(135, 57, 249, 0.04), transparent);
}

.nc-con {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.nc-sec-head {
  text-align: center;
  margin-bottom: 60px;
}

.nc-sec-head .nc-stit { margin-bottom: 0; }

.nc-stag {
  color: var(--nc-p);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.nc-stit {
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.nc-tcol {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.nc-panel {
  padding: 28px;
}

.nc-panel-title {
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  margin-bottom: 4px;
}

.nc-panel-sub {
  color: var(--nc-tx2);
  font-size: 13px;
  margin-bottom: 20px;
}

.nc-panel-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.nc-stat-item .nc-stat-label { color: var(--nc-tx2); font-size: 12px; margin-bottom: 2px; }
.nc-stat-item .nc-stat-value { font-weight: 700; font-size: 18px; font-family: 'Syne', sans-serif; }

.nc-sec-content .nc-sec-h3 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.nc-sec-p {
  color: var(--nc-tx2);
  line-height: 1.7;
  margin-bottom: 32px;
}

.nc-feature-list {
  list-style: none;
  margin-bottom: 32px;
  padding: 0;
}

.nc-feature-list li {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 4px;
  color: var(--nc-tx2);
  font-size: 15px;
}

.nc-check {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--nc-pd);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nc-p);
  flex-shrink: 0;
}

.nc-check::after {
  content: '✓';
}

.nc-fgrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.nc-feature-card {
  padding: 28px;
  transition: all 0.3s;
  cursor: default;
}

.nc-feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(135, 57, 249, 0.3), rgba(135, 57, 249, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nc-p);
  margin-bottom: 20px;
}

.nc-feature-icon >>> svg { display: block; }

.nc-feature-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 10px;
}

.nc-feature-desc {
  color: var(--nc-tx2);
  font-size: 14px;
  line-height: 1.65;
}

.nc-egrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.nc-employee-card {
  padding: 24px;
  transition: all 0.3s;
}

.nc-employee-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.nc-employee-av {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.nc-employee-name { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
.nc-employee-role { color: var(--nc-tx2); font-size: 13px; margin: 0; }

.nc-employee-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.nc-em-stat {
  background: rgba(135, 57, 249, 0.08);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

.nc-em-stat .nc-stat-label { font-size: 11px; margin-bottom: 2px; }
.nc-em-stat .nc-stat-value { font-size: 14px; }

.nc-pricing-card {
  max-width: 460px;
  margin: 0 auto;
  text-align: center;
  background: var(--nc-bg2);
  border-radius: 24px;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.nc-pricing-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(135, 57, 249, 0.2), transparent);
  filter: blur(40px);
}

.nc-pricing-card .nc-badge { margin-bottom: 20px; }

.nc-pricing-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
}

.nc-pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 32px;
}

.nc-price-num {
  font-size: 56px;
  font-weight: 800;
  font-family: 'Syne', sans-serif;
  color: var(--nc-p);
}

.nc-price-period {
  color: var(--nc-tx2);
  font-size: 17px;
}

.nc-pricing-features {
  list-style: none;
  text-align: left;
  margin-bottom: 36px;
  padding: 0;
}

.nc-pricing-features li {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--nc-tx2);
  font-size: 15px;
}

.nc-pricing-cta {
  width: 100%;
  justify-content: center;
  font-size: 16px;
  padding: 16px;
  text-decoration: none;
}

.nc-pricing-hint {
  color: var(--nc-tx2);
  font-size: 13px;
  margin-top: 16px;
}

.nc-footer {
  border-top: 1px solid var(--nc-br);
  padding: 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.nc-footer-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 12px;
}

.nc-footer-copy {
  color: var(--nc-tx2);
  font-size: 14px;
  margin: 0;
}

@media (max-width: 900px) {
  .nc-hgrid, .nc-tcol { grid-template-columns: 1fr; }
  .nc-fgrid { grid-template-columns: 1fr 1fr; }
  .nc-nav-links { display: none; }
}

@media (max-width: 540px) {
  .nc-fgrid { grid-template-columns: 1fr; }
  .nc-con { padding: 0 20px; }
  .nc-hero { padding: 100px 20px 60px; }
  .nc-sec { padding: 60px 0; }
}
</style>
