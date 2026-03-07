const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let authDb = null;

function getAuthDb() {
  if (!authDb) {
    const dbPath = path.join(__dirname, '..', 'auth.db');
    authDb = new sqlite3.Database(dbPath);
  }
  return authDb;
}

function initAuthDb(callback) {
  const db = getAuthDb();
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        accountType TEXT NOT NULL CHECK(accountType IN ('individual', 'business')),
        displayName TEXT NOT NULL,
        companyName TEXT,
        inn TEXT,
        emailVerified INTEGER DEFAULT 0,
        verificationToken TEXT,
        verificationTokenExpires TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `);
    db.run(`ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN verificationToken TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN verificationTokenExpires TEXT`, () => {});
    db.run(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        dbPath TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS tenant_members (
        tenantId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (tenantId, userId),
        FOREIGN KEY (tenantId) REFERENCES tenants(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `, (err) => {
      if (callback) callback(err);
    });
  });
}

module.exports = { getAuthDb, initAuthDb };
