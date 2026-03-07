const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const tenantDbs = {};

function getTenantDbPath(tenantId) {
  return path.join(__dirname, 'data', `tenant_${tenantId}.db`);
}

function getTenantDb(tenantId) {
  if (!tenantId) return null;
  if (tenantDbs[tenantId]) return tenantDbs[tenantId];
  const dbPath = getTenantDbPath(tenantId);
  if (!fs.existsSync(dbPath)) return null;
  const db = new sqlite3.Database(dbPath);
  tenantDbs[tenantId] = db;
  return db;
}

function runTenantSchema(db, callback) {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT, address TEXT, deals TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, category TEXT, stock INTEGER, description TEXT, date TEXT, minStock INTEGER DEFAULT 10, barcode TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER, productName TEXT, customerName TEXT, quantity INTEGER, unitPrice REAL, total REAL, paymentMethod TEXT, notes TEXT, date TEXT, createdByUserId INTEGER)`);
    db.run(`CREATE TABLE IF NOT EXISTS returns (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER, productName TEXT, customerName TEXT, quantity INTEGER, reason TEXT, notes TEXT, date TEXT, createdByUserId INTEGER, createdAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, amount REAL, category TEXT, date TEXT, createdByUserId INTEGER, createdAt TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS product_activities (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER, productName TEXT, customerName TEXT, quantity INTEGER, description TEXT, amount REAL, status TEXT, date TEXT, timestamp TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT, rating TEXT, lastOrder TEXT, products TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, status TEXT, date TEXT, createdAt TEXT)`);
    db.run(`ALTER TABLE purchases ADD COLUMN createdByUserId INTEGER`, () => {});
    db.run(`ALTER TABLE returns ADD COLUMN createdByUserId INTEGER`, () => {});
    db.run(`ALTER TABLE expenses ADD COLUMN createdByUserId INTEGER`, () => {});
    if (callback) callback(null);
  });
}

function createTenantDb(tenantId, callback) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = getTenantDbPath(tenantId);
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return callback(err);
    tenantDbs[tenantId] = db;
    runTenantSchema(db, callback);
  });
}

module.exports = { getTenantDb, createTenantDb };
