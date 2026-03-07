import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #8739f9;
      --primary-dim: rgba(135,57,249,0.15);
      --primary-glow: rgba(135,57,249,0.4);
      --bg: #0b0b0f;
      --bg2: #12121a;
      --bg3: #1a1a26;
      --text: #ffffff;
      --text2: #9ca3af;
      --border: rgba(135,57,249,0.2);
      --glass: rgba(255,255,255,0.03);
      --radius: 16px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    h1,h2,h3,h4,h5,h6 { font-family: 'Syne', sans-serif; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 3px; }

    /* Noise overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
      opacity: 0.4;
    }

    .btn-primary {
      background: linear-gradient(135deg, #8739f9, #6020d0);
      color: #fff;
      border: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
      letter-spacing: 0.01em;
    }
    .btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--primary-glow); }
    .btn-primary:hover::before { opacity: 1; }

    .btn-ghost {
      background: transparent;
      color: var(--text2);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 14px 28px;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      letter-spacing: 0.01em;
    }
    .btn-ghost:hover { border-color: var(--primary); color: var(--text); background: var(--primary-dim); }

    .glass-card {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .gradient-text {
      background: linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #8739f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .gradient-border {
      position: relative;
    }
    .gradient-border::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(135,57,249,0.6), rgba(135,57,249,0.1), rgba(135,57,249,0.4));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px var(--primary-glow); }
      50% { box-shadow: 0 0 40px var(--primary-glow), 0 0 80px rgba(135,57,249,0.2); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes orb-move {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(60px, -40px) scale(1.1); }
      66% { transform: translate(-40px, 60px) scale(0.9); }
    }

    .fade-up { animation: fadeUp 0.7s ease forwards; }
    .fade-in { animation: fadeIn 0.5s ease forwards; }

    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

    /* Orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
      pointer-events: none;
    }
    .orb-purple { background: radial-gradient(circle, #8739f9, transparent); animation: orb-move 10s ease-in-out infinite; }
    .orb-indigo { background: radial-gradient(circle, #6366f1, transparent); animation: orb-move 14s ease-in-out infinite reverse; }

    /* Tooltip */
    .recharts-tooltip-wrapper .recharts-default-tooltip {
      background: var(--bg2) !important;
      border: 1px solid var(--border) !important;
      border-radius: 10px !important;
      font-family: 'DM Sans', sans-serif !important;
      color: var(--text) !important;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-grid { grid-template-columns: 1fr !important; }
      .features-grid { grid-template-columns: 1fr 1fr !important; }
      .sidebar { display: none !important; }
      .main-content { margin-left: 0 !important; }
    }
    @media (max-width: 480px) {
      .features-grid { grid-template-columns: 1fr !important; }
    }

    /* Status badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-green { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
    .badge-yellow { background: rgba(234,179,8,0.15); color: #facc15; border: 1px solid rgba(234,179,8,0.2); }
    .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .badge-blue { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
    .badge-purple { background: rgba(135,57,249,0.15); color: #c084fc; border: 1px solid rgba(135,57,249,0.2); }

    /* Table */
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; color: var(--text2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
    tr:hover td { background: rgba(135,57,249,0.04); }

    /* Input */
    .input {
      width: 100%;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 13px 16px;
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      outline: none;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); }
    .input::placeholder { color: var(--text2); }

    label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: var(--text2); }
  `}</style>
);

// ── DATA ──────────────────────────────────────────────────────────────────────
const revenueData = [
  { m: "Jan", revenue: 12400, orders: 48, customers: 32 },
  { m: "Feb", revenue: 18200, orders: 67, customers: 45 },
  { m: "Mar", revenue: 15800, orders: 55, customers: 38 },
  { m: "Apr", revenue: 24600, orders: 89, customers: 61 },
  { m: "May", revenue: 21300, orders: 76, customers: 54 },
  { m: "Jun", revenue: 31200, orders: 112, customers: 78 },
  { m: "Jul", revenue: 28900, orders: 98, customers: 71 },
  { m: "Aug", revenue: 38400, orders: 134, customers: 96 },
  { m: "Sep", revenue: 35100, orders: 121, customers: 88 },
  { m: "Oct", revenue: 42800, orders: 156, customers: 112 },
  { m: "Nov", revenue: 39500, orders: 143, customers: 104 },
  { m: "Dec", revenue: 51200, orders: 187, customers: 138 },
];

const userGrowthData = [
  { week: "W1", new: 24, active: 89 },
  { week: "W2", new: 31, active: 108 },
  { week: "W3", new: 28, active: 124 },
  { week: "W4", new: 44, active: 156 },
  { week: "W5", new: 39, active: 178 },
  { week: "W6", new: 52, active: 203 },
  { week: "W7", new: 48, active: 231 },
  { week: "W8", new: 67, active: 264 },
];

const employees = [
  { id: 1, name: "Alex Morgan", role: "Sales Lead", sales: 142, revenue: "$58,400", avatar: "AM", growth: "+23%" },
  { id: 2, name: "Sarah Chen", role: "Account Manager", sales: 98, revenue: "$41,200", avatar: "SC", growth: "+18%" },
  { id: 3, name: "Mike Davis", role: "Sales Rep", sales: 76, revenue: "$32,100", avatar: "MD", growth: "+12%" },
  { id: 4, name: "Emma Wilson", role: "Sales Rep", sales: 61, revenue: "$26,800", avatar: "EW", growth: "+9%" },
];

const products = [
  { id: 1, name: "Enterprise Suite", price: "$299/mo", date: "2024-01-15", status: "Active", sales: 48 },
  { id: 2, name: "Starter Plan", price: "$39/mo", date: "2024-02-01", status: "Active", sales: 234 },
  { id: 3, name: "Pro Addon", price: "$79/mo", date: "2024-02-20", status: "Active", sales: 112 },
  { id: 4, name: "API Access", price: "$49/mo", date: "2024-03-05", status: "Paused", sales: 67 },
];

const orders = [
  { id: "#ORD-001", product: "Enterprise Suite", customer: "John Smith", employee: "Alex Morgan", date: "2024-12-01", price: "$299", status: "Completed" },
  { id: "#ORD-002", product: "Starter Plan", customer: "Anna Lee", employee: "Sarah Chen", date: "2024-12-02", price: "$39", status: "Completed" },
  { id: "#ORD-003", product: "Pro Addon", customer: "David Park", employee: "Mike Davis", date: "2024-12-02", price: "$79", status: "Pending" },
  { id: "#ORD-004", product: "API Access", customer: "Lisa Brown", employee: "Emma Wilson", date: "2024-12-03", price: "$49", status: "Completed" },
  { id: "#ORD-005", product: "Enterprise Suite", customer: "Tom Clark", employee: "Alex Morgan", date: "2024-12-03", price: "$299", status: "Failed" },
  { id: "#ORD-006", product: "Starter Plan", customer: "Maria Garcia", employee: "Sarah Chen", date: "2024-12-04", price: "$39", status: "Completed" },
];

const customers = [
  { id: 1, name: "John Smith", email: "john@example.com", product: "Enterprise Suite", date: "Dec 1, 2024", spent: "$897", orders: 3 },
  { id: 2, name: "Anna Lee", email: "anna@example.com", product: "Starter Plan", date: "Dec 2, 2024", spent: "$156", orders: 4 },
  { id: 3, name: "David Park", email: "david@example.com", product: "Pro Addon", date: "Dec 2, 2024", spent: "$237", orders: 3 },
  { id: 4, name: "Lisa Brown", email: "lisa@example.com", product: "API Access", date: "Dec 3, 2024", spent: "$196", orders: 4 },
  { id: 5, name: "Maria Garcia", email: "maria@example.com", product: "Starter Plan", date: "Dec 4, 2024", spent: "$117", orders: 3 },
];

// ── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    products: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    orders: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    customers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    employees: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    analytics: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A9 9 0 0 0 12 3v0A9 9 0 1 0 12 21v0a9 9 0 0 0 7.07-16.07z"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    dollar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    logo: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="url(#lg)"/><path d="M10 20L16 8L22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17H20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#8739f9"/><stop offset="1" stopColor="#5b21b6"/></linearGradient></defs></svg>,
  };
  return icons[name] || null;
};

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a26", border: "1px solid rgba(135,57,249,0.3)", borderRadius: 10, padding: "10px 16px" }}>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.name === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

// ── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, change, icon, color = "#8739f9" }) => (
  <div className="glass-card gradient-border" style={{ padding: "20px 24px", transition: "all 0.3s", cursor: "default" }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(135,57,249,0.15)`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne, sans-serif" }}>{value}</p>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(135,57,249,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#8739f9" }}>
        <Icon name={icon} size={20} />
      </div>
    </div>
    <span style={{ fontSize: 12, color: change?.startsWith("+") ? "#4ade80" : "#f87171", fontWeight: 600 }}>
      {change}
    </span>
    <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 6 }}>vs last month</span>
  </div>
);

// ── MINI VIDEO MOCK ───────────────────────────────────────────────────────────
const VideoDemoMock = ({ label = "CRM Demo" }) => (
  <div className="gradient-border" style={{
    borderRadius: 20,
    overflow: "hidden",
    background: "var(--bg2)",
    position: "relative",
    aspectRatio: "16/10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "float 5s ease-in-out infinite"
  }}>
    {/* Fake screen content */}
    <div style={{ position: "absolute", inset: 0, padding: 20, overflow: "hidden" }}>
      {/* Fake sidebar */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 52, background: "rgba(135,57,249,0.08)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 14 }}>
        {["dashboard","products","orders","customers","analytics"].map(ic => (
          <div key={ic} style={{ width: 32, height: 32, borderRadius: 8, background: ic === "dashboard" ? "var(--primary)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: ic === "dashboard" ? "#fff" : "var(--text2)" }}>
            <Icon name={ic} size={14} />
          </div>
        ))}
      </div>
      {/* Fake content */}
      <div style={{ marginLeft: 60 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["$51.2K", "187 Orders", "138 Users"].map((v, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(135,57,249,0.1)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 9, color: "var(--text2)" }}>{["Revenue","Orders","Customers"][i]}</p>
              <p style={{ fontSize: 11, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(135,57,249,0.08)", borderRadius: 8, padding: 10, border: "1px solid var(--border)", height: 80 }}>
          <p style={{ fontSize: 9, color: "var(--text2)", marginBottom: 8 }}>Revenue Chart</p>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={revenueData.slice(6)}>
              <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8739f9" stopOpacity={0.3}/><stop offset="95%" stopColor="#8739f9" stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="revenue" stroke="#8739f9" fill="url(#cg2)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    {/* Play button overlay */}
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s", cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.2)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}>
      <div className="animate-pulse-glow" style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="play" size={18} />
      </div>
    </div>
  </div>
);

// ── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const features = [
    { icon: "products", title: "Product Management", desc: "Add, edit and track all your products in one beautiful interface with real-time inventory updates." },
    { icon: "orders", title: "Sales History", desc: "See exactly who bought what, when, and who sold it. Full transaction history at a glance." },
    { icon: "employees", title: "Employee Management", desc: "Add your team, assign roles, and track individual performance metrics and sales stats." },
    { icon: "dollar", title: "Transaction Control", desc: "Monitor payment status, purchase timing, and customer details for every single transaction." },
    { icon: "analytics", title: "Business Analytics", desc: "Revenue charts, sales growth stats, and customer analytics that show exactly where you're heading." },
    { icon: "dashboard", title: "Unified Dashboard", desc: "All your business metrics in one stunning dashboard. See everything, understand everything." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px",
        background: scrolled ? "rgba(11,11,15,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 72,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>NexCRM</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Features", "Analytics", "Pricing"].map(item => (
            <button key={item}
              onClick={() => {
                const el = document.getElementById(item.toLowerCase());
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{ color: "var(--text2)", background: "none", border: "none", fontSize: 15, fontWeight: 500, transition: "color 0.2s", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
              onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "var(--text2)"}>
              {item}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 14 }} onClick={() => onNavigate("login")}>Sign in</button>
          <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }} onClick={() => onNavigate("register")}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", padding: "100px 40px 80px" }}>
        {/* Orbs */}
        <div className="orb orb-purple" style={{ width: 600, height: 600, top: -200, left: -200 }} />
        <div className="orb orb-indigo" style={{ width: 400, height: 400, bottom: 0, right: -100 }} />
        {/* Grid dots bg */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(135,57,249,0.12) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.5 }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>


          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div style={{ animation: "fadeUp 0.7s ease 0.1s both" }}>
              <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24 }}>
                Управляйте всем{" "}
                <span className="gradient-text">бизнесом</span>
                {" "}в одной CRM системе
              </h1>
              <p style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "var(--text2)", lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
                CRM система, которая показывает кто купил товар, когда купил, кто продал, когда завершилась транзакция и как развивается ваш бизнес.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ fontSize: 16, padding: "16px 32px" }} onClick={() => onNavigate("register")}>
                  Start for $39 / month
                </button>
                <button className="btn-ghost" style={{ fontSize: 16, padding: "16px 28px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="play" size={12} />
                  </div>
                  Watch Demo
                </button>
              </div>
              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 48 }}>
                <div style={{ display: "flex" }}>
                  {["#a", "#b", "#c", "#d"].map((c, i) => (
                    <div key={c} style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${260 + i * 15}, 70%, 55%)`, border: "2px solid var(--bg)", marginLeft: i > 0 ? -10 : 0 }} />
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", color: "#facc15", gap: 2, marginBottom: 2 }}>
                    {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={14} />)}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text2)" }}>Trusted by <strong style={{ color: "var(--text)" }}>2,400+</strong> businesses</p>
                </div>
              </div>
            </div>

            <div style={{ animation: "fadeUp 0.7s ease 0.25s both" }}>
              <VideoDemoMock label="CRM Hero Demo" />
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS SECTION */}
      <section id="analytics" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ color: "var(--primary)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Analytics</p>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Полная <span className="gradient-text">аналитика пользователей</span>
          </h2>
        </div>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div className="glass-card gradient-border" style={{ padding: 28 }}>
            <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 4 }}>User Growth</p>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 24 }}>Новые и активные пользователи</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8739f9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8739f9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="cg3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="active" name="active" stroke="#6366f1" fill="url(#cg3)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="new" name="new" stroke="#8739f9" fill="url(#cg1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              {[{ label: "New Users", value: "+67", color: "#8739f9" }, { label: "Active Users", value: "264", color: "#6366f1" }, { label: "Growth", value: "+34%", color: "#4ade80" }].map(s => (
                <div key={s.label}>
                  <p style={{ color: "var(--text2)", fontSize: 12 }}>{s.label}</p>
                  <p style={{ color: s.color, fontWeight: 700, fontSize: 18, fontFamily: "Syne, sans-serif" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Понимайте рост своего бизнеса</h3>
            <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 32 }}>Отслеживайте новых пользователей, активных клиентов и общий рост бизнеса с помощью наглядных графиков в реальном времени.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["Новые пользователи в реальном времени", "Активность существующих клиентов", "Метрики удержания и оттока"].map(f => (
                <div key={f} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--primary-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                    <Icon name="check" size={14} />
                  </div>
                  <span style={{ color: "var(--text2)", fontSize: 15 }}>{f}</span>
                </div>
              ))}
            </div>
            <VideoDemoMock />
          </div>
        </div>
      </section>

      {/* ORDERS ANALYTICS */}
      <section style={{ padding: "100px 40px", background: "linear-gradient(180deg, transparent, rgba(135,57,249,0.04), transparent)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div className="glass-card gradient-border" style={{ padding: 28 }}>
              <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 4 }}>Order Analytics</p>
              <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 24 }}>Продажи, доход и транзакции</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData.slice(6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" name="orders" fill="#8739f9" radius={[6,6,0,0]} fillOpacity={0.85} />
                  <Bar dataKey="customers" name="customers" fill="#6366f1" radius={[6,6,0,0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                {[{ label: "Total Orders", value: "187", color: "#8739f9" }, { label: "Revenue", value: "$51.2K", color: "#6366f1" }, { label: "Transactions", value: "98%", color: "#4ade80" }].map(s => (
                  <div key={s.label}>
                    <p style={{ color: "var(--text2)", fontSize: 12 }}>{s.label}</p>
                    <p style={{ color: s.color, fontWeight: 700, fontSize: 18, fontFamily: "Syne, sans-serif" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Контроль каждого заказа</h3>
              <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 32 }}>Видите количество продаж, доход и успешные транзакции в одном месте. Никаких сюрпризов.</p>
              <VideoDemoMock />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ color: "var(--primary)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Всё для управления <span className="gradient-text">вашим бизнесом</span>
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 17, marginTop: 16, maxWidth: 500, margin: "16px auto 0" }}>CRM помогает полностью контролировать бизнес от первой продажи до масштабирования.</p>
        </div>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card gradient-border" style={{ padding: 28, transition: "all 0.3s", cursor: "default", animationDelay: `${i * 0.1}s` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(135,57,249,0.15)"; e.currentTarget.style.borderColor = "rgba(135,57,249,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = ""; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(135,57,249,0.3), rgba(135,57,249,0.08))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", marginBottom: 20 }}>
                <Icon name={f.icon} size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EMPLOYEES SECTION */}
      <section style={{ padding: "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em" }}>Управление <span className="gradient-text">командой</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {employees.map((emp, i) => (
            <div key={emp.id} className="glass-card gradient-border" style={{ padding: 24, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(135,57,249,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, hsl(${260 + i*20},70%,50%), hsl(${280 + i*20},60%,40%))`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "white" }}>{emp.avatar}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{emp.name}</p>
                  <p style={{ color: "var(--text2)", fontSize: 13 }}>{emp.role}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ label: "Sales", value: emp.sales }, { label: "Revenue", value: emp.revenue }, { label: "Growth", value: emp.growth }].map(s => (
                  <div key={s.label} style={{ background: "rgba(135,57,249,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                    <p style={{ color: "var(--text2)", fontSize: 11, marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontWeight: 700, fontSize: 15, fontFamily: "Syne, sans-serif", color: s.label === "Growth" ? "#4ade80" : "var(--text)" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em" }}>Пример <span className="gradient-text">интерфейса CRM</span></h2>
        </div>
        <div className="glass-card gradient-border" style={{ padding: 24, borderRadius: 24 }}>
          <div style={{ display: "flex", gap: 20 }}>
            {/* Sidebar */}
            <div style={{ width: 180, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14 }}>NexCRM</span>
              </div>
              {[["dashboard","Dashboard"],["products","Products"],["orders","Orders"],["customers","Customers"],["employees","Employees"],["analytics","Analytics"],["settings","Settings"]].map(([ic, label], idx) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 2, background: idx === 0 ? "var(--primary)" : "transparent", color: idx === 0 ? "#fff" : "var(--text2)", cursor: "pointer", transition: "all 0.2s", fontSize: 13, fontWeight: 500 }}>
                  <Icon name={ic} size={15} />
                  {label}
                </div>
              ))}
            </div>
            {/* Main */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[{ label: "Revenue", value: "$51.2K", icon: "dollar" }, { label: "Orders", value: "187", icon: "orders" }, { label: "Customers", value: "138", icon: "customers" }].map(s => (
                  <div key={s.label} style={{ background: "rgba(135,57,249,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text2)", fontSize: 12, marginBottom: 6 }}>{s.label}</p>
                    <p style={{ fontWeight: 800, fontSize: 22, fontFamily: "Syne, sans-serif" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(135,57,249,0.05)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Revenue — 2024</p>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={revenueData}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8739f9" stopOpacity={0.4}/><stop offset="95%" stopColor="#8739f9" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#8739f9" fill="url(#pg)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "var(--primary)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>Один простой <span className="gradient-text">тариф</span></h2>
          <div className="gradient-border" style={{ background: "var(--bg2)", borderRadius: 24, padding: 40, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(135,57,249,0.2), transparent)", filter: "blur(40px)" }} />
            <div className="badge badge-purple" style={{ marginBottom: 20 }}>Most Popular</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>CRM PRO</h3>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 32 }}>
              <span style={{ fontSize: 56, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "var(--primary)" }}>$39</span>
              <span style={{ color: "var(--text2)", fontSize: 17 }}>/month</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36, textAlign: "left" }}>
              {["Полное управление продуктами","Управление заказами","Аналитика продаж","Управление сотрудниками","Статистика клиентов","Dashboard аналитики","Безлимитные транзакции","Поддержка 24/7"].map(f => (
                <div key={f} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--primary-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                    <Icon name="check" size={12} />
                  </div>
                  <span style={{ fontSize: 15, color: "var(--text2)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: "16px" }} onClick={() => onNavigate("register")}>
              Start using CRM →
            </button>
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 16 }}>No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>NexCRM</span>
        </div>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>© 2024 NexCRM. All rights reserved.</p>
      </footer>
    </div>
  );
};

// ── AUTH PAGES ────────────────────────────────────────────────────────────────
const AuthPage = ({ mode, onNavigate, onAuth }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (mode === "register" && !form.name) return setError("Enter your name");
    if (!form.email) return setError("Enter your email");
    if (!form.password || form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onAuth({ name: form.name || form.email.split("@")[0], email: form.email });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div className="orb orb-purple" style={{ width: 500, height: 500, top: -200, left: -200 }} />
      <div className="orb orb-indigo" style={{ width: 400, height: 400, bottom: -100, right: -100 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(135,57,249,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="glass-card gradient-border" style={{ width: "100%", maxWidth: 420, padding: "48px 40px", position: "relative", zIndex: 1, animation: "fadeUp 0.6s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 15 }}>
            {mode === "register" ? "Start managing your business today" : "Sign in to your CRM workspace"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {mode === "register" && (
            <div>
              <label>Full name</label>
              <input className="input" placeholder="Alex Morgan" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
          )}
          <div>
            <label>Email address</label>
            <input className="input" placeholder="alex@company.com" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label>Password</label>
            <input className="input" placeholder="••••••••" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {error && <p style={{ color: "#f87171", fontSize: 14, background: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
          <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: 16, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handle} disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin-slow 0.8s linear infinite" }} />
                {mode === "register" ? "Creating workspace..." : "Signing in..."}
              </>
            ) : mode === "register" ? "Create account & workspace →" : "Sign in →"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, color: "var(--text2)", fontSize: 14 }}>
          {mode === "register" ? "Already have an account? " : "No account? "}
          <button onClick={() => onNavigate(mode === "register" ? "login" : "register")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
            {mode === "register" ? "Sign in" : "Create one free"}
          </button>
        </p>
        <button onClick={() => onNavigate("landing")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, margin: "16px auto 0" }}>
          ← Back to home
        </button>
      </div>
    </div>
  );
};

// ── CRM DASHBOARD ─────────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout }) => {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [productList, setProductList] = useState(products);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", status: "Active" });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "products", label: "Products", icon: "products" },
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "customers", label: "Customers", icon: "customers" },
    { id: "employees", label: "Employees", icon: "employees" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const Sidebar = ({ mobile }) => (
    <div style={{
      width: mobile ? "100%" : 220,
      background: "var(--bg2)",
      borderRight: "1px solid var(--border)",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "20px 14px",
      position: mobile ? "relative" : "fixed",
      left: 0, top: 0, bottom: 0,
      zIndex: 200,
      overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 }}>
        
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 17 }}>NexCRM</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "var(--text2)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 8, marginBottom: 8 }}>Menu</p>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, marginBottom: 2, border: "none",
              background: page === item.id ? "var(--primary)" : "transparent",
              color: page === item.id ? "#fff" : "var(--text2)",
              cursor: "pointer", fontSize: 14, fontFamily: "DM Sans, sans-serif", fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (page !== item.id) { e.currentTarget.style.background = "rgba(135,57,249,0.1)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (page !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; }}}>
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #8739f9, #6020d0)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{user.name[0]?.toUpperCase()}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</p>
            <p style={{ color: "var(--text2)", fontSize: 11 }}>Admin</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}>
          Sign out
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (page === "dashboard") return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "var(--text2)", marginTop: 4 }}>Welcome back, {user.name} 👋</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Revenue" value="$51.2K" change="+34%" icon="dollar" />
          <StatCard label="Orders" value="187" change="+12%" icon="orders" />
          <StatCard label="Customers" value="138" change="+28%" icon="customers" />
          <StatCard label="Employees" value="4" change="+1" icon="employees" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          <div className="glass-card gradient-border" style={{ padding: 24 }}>
            <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 4 }}>Revenue Overview</p>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>Annual revenue performance</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8739f9" stopOpacity={0.4}/><stop offset="95%" stopColor="#8739f9" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#8739f9" fill="url(#rg)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card gradient-border" style={{ padding: 24 }}>
            <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 20 }}>Recent Activity</p>
            {orders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{o.customer}</p>
                  <p style={{ color: "var(--text2)", fontSize: 12 }}>{o.product}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{o.price}</p>
                  <span className={`badge badge-${o.status === "Completed" ? "green" : o.status === "Pending" ? "yellow" : "red"}`} style={{ fontSize: 10, padding: "2px 8px" }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (page === "products") return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div><h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Products</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>{productList.length} products total</p></div>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "10px 20px" }} onClick={() => setProductModal(true)}>
            <Icon name="plus" size={16} /> Add Product
          </button>
        </div>
        {productModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <div className="glass-card gradient-border" style={{ width: 400, padding: 32, animation: "fadeUp 0.3s ease both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Add Product</h3>
                <button onClick={() => setProductModal(false)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><Icon name="close" size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div><label>Product name</label><input className="input" placeholder="Enterprise Suite" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label>Price</label><input className="input" placeholder="$99/mo" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
                <div><label>Status</label>
                  <select className="input" value={newProduct.status} onChange={e => setNewProduct(p => ({ ...p, status: e.target.value }))}>
                    <option>Active</option><option>Paused</option>
                  </select>
                </div>
                <button className="btn-primary" style={{ width: "100%", padding: "14px" }} onClick={() => {
                  if (!newProduct.name || !newProduct.price) return;
                  setProductList(p => [...p, { id: Date.now(), name: newProduct.name, price: newProduct.price, date: new Date().toISOString().split("T")[0], status: newProduct.status, sales: 0 }]);
                  setProductModal(false); setNewProduct({ name: "", price: "", status: "Active" });
                }}>Add Product</button>
              </div>
            </div>
          </div>
        )}
        <div className="glass-card gradient-border" style={{ overflow: "hidden" }}>
          <table>
            <thead><tr><th>Name</th><th>Price</th><th>Sales</th><th>Date Added</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {productList.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>{p.price}</td>
                  <td>{p.sales}</td>
                  <td style={{ color: "var(--text2)" }}>{p.date}</td>
                  <td><span className={`badge badge-${p.status === "Active" ? "green" : "yellow"}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ background: "rgba(135,57,249,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--primary)", cursor: "pointer" }}><Icon name="edit" size={14} /></button>
                      <button onClick={() => setProductList(l => l.filter(x => x.id !== p.id))} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#f87171", cursor: "pointer" }}><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (page === "orders") return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}>Orders</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>{orders.length} total orders</p></div>
        <div className="glass-card gradient-border" style={{ overflow: "hidden" }}>
          <table>
            <thead><tr><th>Order</th><th>Product</th><th>Customer</th><th>Employee</th><th>Date</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ color: "var(--text2)", fontSize: 13 }}>{o.id}</td>
                  <td style={{ fontWeight: 500 }}>{o.product}</td>
                  <td>{o.customer}</td>
                  <td style={{ color: "var(--text2)" }}>{o.employee}</td>
                  <td style={{ color: "var(--text2)" }}>{o.date}</td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>{o.price}</td>
                  <td><span className={`badge badge-${o.status === "Completed" ? "green" : o.status === "Pending" ? "yellow" : "red"}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (page === "customers") return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}>Customers</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>{customers.length} customers</p></div>
        <div className="glass-card gradient-border" style={{ overflow: "hidden" }}>
          <table>
            <thead><tr><th>Customer</th><th>Email</th><th>Last Product</th><th>Date</th><th>Total Spent</th><th>Orders</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #8739f9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{c.name[0]}</div><span style={{ fontWeight: 500 }}>{c.name}</span></div></td>
                  <td style={{ color: "var(--text2)" }}>{c.email}</td>
                  <td>{c.product}</td>
                  <td style={{ color: "var(--text2)" }}>{c.date}</td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>{c.spent}</td>
                  <td><span className="badge badge-blue">{c.orders} orders</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (page === "employees") return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}>Employees</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>{employees.length} team members</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {employees.map((emp, i) => (
            <div key={emp.id} className="glass-card gradient-border" style={{ padding: 24, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(135,57,249,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, hsl(${260 + i*20},70%,50%), hsl(${280 + i*20},60%,40%))`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{emp.avatar}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</p>
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>{emp.role}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[{ label: "Sales", value: emp.sales, color: "var(--text)" }, { label: "Revenue", value: emp.revenue, color: "var(--primary)" }, { label: "Growth", value: emp.growth, color: "#4ade80" }].map(s => (
                  <div key={s.label} style={{ background: "rgba(135,57,249,0.08)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                    <p style={{ color: "var(--text2)", fontSize: 11, marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontWeight: 700, fontSize: 14, fontFamily: "Syne, sans-serif", color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (page === "analytics") return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}>Analytics</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>Business performance overview</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard label="Annual Revenue" value="$310.4K" change="+42%" icon="dollar" />
          <StatCard label="Total Orders" value="1,086" change="+28%" icon="orders" />
          <StatCard label="Customers" value="807" change="+31%" icon="customers" />
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="glass-card gradient-border" style={{ padding: 28 }}>
            <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 4 }}>Revenue Chart</p>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>Monthly revenue for 2024</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8739f9" stopOpacity={0.4}/><stop offset="95%" stopColor="#8739f9" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#8739f9" fill="url(#ag)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="glass-card gradient-border" style={{ padding: 28 }}>
              <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 20 }}>Orders Chart</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" name="orders" fill="#8739f9" radius={[4,4,0,0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card gradient-border" style={{ padding: 28 }}>
              <p style={{ fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: 20 }}>Customer Growth</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="m" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="customers" name="customers" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );

    if (page === "settings") return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1><p style={{ color: "var(--text2)", marginTop: 4 }}>Manage your workspace</p></div>
        <div style={{ display: "grid", gap: 20, maxWidth: 600 }}>
          {[{ title: "Profile", fields: [{ label: "Full name", val: user.name }, { label: "Email", val: user.email }] }, { title: "Workspace", fields: [{ label: "Workspace name", val: `${user.name}'s CRM` }, { label: "Plan", val: "CRM PRO — $39/mo" }] }].map(section => (
            <div key={section.title} className="glass-card gradient-border" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>{section.title}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {section.fields.map(f => (
                  <div key={f.label}><label>{f.label}</label><input className="input" defaultValue={f.val} readOnly={f.label === "Plan"} /></div>
                ))}
              </div>
              {section.title !== "Workspace" && <button className="btn-primary" style={{ marginTop: 20, padding: "10px 20px", fontSize: 14 }}>Save changes</button>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ width: 220, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile header */}
      <div style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "var(--bg2)", borderBottom: "1px solid var(--border)", zIndex: 100, alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}
        id="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16 }}>NexCRM</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}>
          <Icon name={sidebarOpen ? "close" : "menu"} size={22} />
        </button>
      </div>

      {/* Main content */}
      <div className="main-content" style={{ flex: 1, marginLeft: 220, padding: "32px", maxWidth: "100%", overflowX: "hidden" }}>
        <div style={{ maxWidth: 1100 }}>
          {renderContent()}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-header { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-top: 80px !important; }
          .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);

  const navigate = (p) => setPage(p);
  const handleAuth = (u) => { setUser(u); setPage("dashboard"); };
  const handleLogout = () => { setUser(null); setPage("landing"); };

  return (
    <>
      <GlobalStyle />
      {page === "landing" && <LandingPage onNavigate={navigate} />}
      {page === "register" && <AuthPage mode="register" onNavigate={navigate} onAuth={handleAuth} />}
      {page === "login" && <AuthPage mode="login" onNavigate={navigate} onAuth={handleAuth} />}
      {page === "dashboard" && user && <Dashboard user={user} onLogout={handleLogout} />}
    </>
  );
}
