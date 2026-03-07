require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');

const { getAuthDb, initAuthDb } = require('./db/auth');
const { createTenantDb, getTenantDb } = require('./tenantManager');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');
const { sendVerificationCodeEmail } = require('./services/emailService');

const app = express();
app.use(cors());
app.use(bodyParser.json());

initAuthDb((err) => {
  if (err) console.error('Auth DB init error:', err.message);
});

// === AUTH API (регистрируем ДО authMiddleware, чтобы body был уже распарсен) ===
app.post('/api/auth/register', (req, res) => {
  const body = req.body || {};
  if (Object.keys(body).length === 0) {
    return res.status(400).json({ error: 'Не получены данные. Отправьте email, пароль, тип аккаунта и имя (или название компании).' });
  }
  const email = body.email != null ? String(body.email).trim() : '';
  const password = body.password;
  const accountType = body.accountType;
  let displayName = body.displayName != null ? String(body.displayName).trim() : '';
  const companyName = body.companyName != null ? String(body.companyName).trim() || null : null;
  const inn = body.inn != null ? String(body.inn).trim() || null : null;
  if (!email) {
    return res.status(400).json({ error: 'Укажите email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Укажите пароль' });
  }
  if (!accountType || !['individual', 'business'].includes(accountType)) {
    return res.status(400).json({ error: 'Выберите тип аккаунта: Физическое лицо или Бизнес' });
  }
  if (!displayName) {
    displayName = email.split('@')[0] || 'User';
  }
  const authDb = getAuthDb();
  const emailNorm = email.trim().toLowerCase();
  authDb.get('SELECT id, emailVerified FROM users WHERE email = ?', [emailNorm], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing && existing.emailVerified === 1) {
      return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }
    bcrypt.hash(password, 10, (hashErr, passwordHash) => {
      if (hashErr) return res.status(500).json({ error: hashErr.message });
      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
      const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const sendCodeAndRespond = () => {
        sendVerificationCodeEmail(emailNorm, verificationCode, () => {});
        res.status(201).json({
          success: true,
          message: 'На вашу почту отправлен код. Введите его на странице подтверждения, чтобы войти в аккаунт.',
          email: emailNorm
        });
      };
      if (existing && existing.emailVerified === 0) {
        authDb.run(
          'UPDATE users SET passwordHash = ?, accountType = ?, displayName = ?, companyName = ?, inn = ?, verificationToken = ?, verificationTokenExpires = ? WHERE id = ?',
          [passwordHash, accountType, displayName, companyName || null, inn || null, verificationCode, verificationTokenExpires, existing.id],
          (updErr) => {
            if (updErr) return res.status(500).json({ error: updErr.message });
            sendCodeAndRespond();
          }
        );
        return;
      }
      authDb.run(
        'INSERT INTO users (email, passwordHash, accountType, displayName, companyName, inn, emailVerified, verificationToken, verificationTokenExpires) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
        [emailNorm, passwordHash, accountType, displayName, companyName || null, inn || null, verificationCode, verificationTokenExpires],
        function (insErr) {
          if (insErr) return res.status(500).json({ error: insErr.message });
          sendCodeAndRespond();
        }
      );
    });
  });
});

app.post('/api/auth/verify-email', (req, res) => {
  const body = req.body || {};
  const email = (body.email != null ? String(body.email).trim() : '').toLowerCase();
  const code = (body.code != null ? String(body.code).trim() : '').replace(/\s/g, '');
  if (!email) return res.status(400).json({ error: 'Укажите email' });
  if (!code) return res.status(400).json({ error: 'Введите код из письма' });
  const authDb = getAuthDb();
  authDb.get(
    'SELECT id, email, accountType, displayName, companyName FROM users WHERE email = ? AND verificationToken = ? AND (verificationTokenExpires IS NULL OR datetime(verificationTokenExpires) > datetime("now"))',
    [email, code],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'Неверный код или истёк срок действия. Проверьте email и код или зарегистрируйтесь снова.' });
      authDb.run('UPDATE users SET emailVerified = 1, verificationToken = NULL, verificationTokenExpires = NULL WHERE id = ?', [user.id], (updErr) => {
        if (updErr) return res.status(500).json({ error: updErr.message });
        authDb.get('SELECT id FROM tenants WHERE userId = ?', [user.id], (teErr, existingTenant) => {
          if (teErr) return res.status(500).json({ error: teErr.message });
          const sendToken = (isOwner) => {
            const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
              success: true,
              token: jwtToken,
              user: { id: user.id, email: user.email, accountType: user.accountType, displayName: user.displayName, companyName: user.companyName, isOwner: !!isOwner }
            });
          };
          if (existingTenant) return sendToken(true);
          const userId = user.id;
          const slug = 't' + userId;
          authDb.run('INSERT INTO tenants (userId, slug, dbPath) VALUES (?, ?, ?)', [userId, slug, ''], function (tenErr) {
            if (tenErr) return res.status(500).json({ error: tenErr.message });
            const tenantId = this.lastID;
            const dbPath = path.join(__dirname, 'data', `tenant_${tenantId}.db`);
            authDb.run('UPDATE tenants SET dbPath = ? WHERE id = ?', [dbPath, tenantId], (pathErr) => {
              if (pathErr) return res.status(500).json({ error: pathErr.message });
              createTenantDb(tenantId, (schemaErr) => {
                if (schemaErr) {
                  console.error('Tenant schema init error:', schemaErr);
                  return res.status(500).json({ error: 'Ошибка инициализации базы данных тенанта. Попробуйте позже.' });
                }
                return sendToken(true);
              });
            });
          });
        });
      });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const email = (body.email != null ? String(body.email).trim() : '') || '';
  const password = body.password != null ? String(body.password).trim() : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Укажите email и пароль' });
  }
  const authDb = getAuthDb();
  authDb.get('SELECT id, email, passwordHash, accountType, displayName, companyName, emailVerified FROM users WHERE email = ?', [email.toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    if (user.emailVerified === 0) {
      return res.status(403).json({ error: 'Аккаунт не активирован. Проверьте почту и перейдите по ссылке из письма.' });
    }
    bcrypt.compare(password, user.passwordHash, (cmpErr, ok) => {
      if (cmpErr) return res.status(500).json({ error: cmpErr.message });
      if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });
      authDb.get('SELECT id FROM tenants WHERE userId = ?', [user.id], (ownerErr, ownerRow) => {
        if (ownerErr) return res.status(500).json({ error: ownerErr.message });
        const isOwner = !!ownerRow;
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
          success: true,
          token,
          user: { id: user.id, email: user.email, accountType: user.accountType, displayName: user.displayName, companyName: user.companyName, isOwner }
        });
      });
    });
  });
});

// Все остальные /api/* требуют JWT и работают с БД тенанта
app.use('/api', authMiddleware);

// Сотрудник не может удалять или изменять данные — только владелец
function requireOwnerForModify(req, res, next) {
  if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    if (!req.isOwner) {
      return res.status(403).json({ error: 'Только владелец может изменять или удалять данные' });
    }
  }
  next();
}
app.use('/api', requireOwnerForModify);

// Текущий пользователь (с isOwner) — чтобы на фронте шеф видел блок «Сотрудники»
app.get('/api/me', (req, res) => {
  const authDb = getAuthDb();
  authDb.get('SELECT id, email, accountType, displayName, companyName FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        displayName: user.displayName,
        companyName: user.companyName,
        isOwner: !!req.isOwner
      }
    });
  });
});

// === КОМАНДА (сотрудники) — только для владельца бизнес-аккаунта ===
app.get('/api/team', (req, res) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Доступ только для владельца' });
  const authDb = getAuthDb();
  authDb.get('SELECT accountType FROM users WHERE id = ?', [req.userId], (err, u) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!u || u.accountType !== 'business') return res.status(403).json({ error: 'Добавлять сотрудников может только бизнес-аккаунт' });
    authDb.all(
      'SELECT u.id, u.email, u.displayName, u.createdAt FROM tenant_members m JOIN users u ON u.id = m.userId WHERE m.tenantId = ? ORDER BY u.displayName',
      [req.tenantId],
      (listErr, rows) => {
        if (listErr) return res.status(500).json({ error: listErr.message });
        res.json({ success: true, employees: rows || [] });
      }
    );
  });
});

app.post('/api/team', (req, res) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Доступ только для владельца' });
  const authDb = getAuthDb();
  authDb.get('SELECT accountType FROM users WHERE id = ?', [req.userId], (err, u) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!u || u.accountType !== 'business') return res.status(403).json({ error: 'Добавлять сотрудников может только бизнес-аккаунт' });
    const body = req.body || {};
    const email = (body.email != null ? String(body.email).trim() : '').toLowerCase();
    const password = body.password;
    const displayName = (body.displayName != null ? String(body.displayName).trim() : '') || email.split('@')[0] || 'Сотрудник';
    if (!email) return res.status(400).json({ error: 'Укажите email' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Пароль не менее 6 символов' });
    authDb.get('SELECT id FROM users WHERE email = ?', [email], (existErr, existing) => {
      if (existErr) return res.status(500).json({ error: existErr.message });
      if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });
      bcrypt.hash(password, 10, (hashErr, passwordHash) => {
        if (hashErr) return res.status(500).json({ error: hashErr.message });
        authDb.run(
          'INSERT INTO users (email, passwordHash, accountType, displayName, companyName, inn, emailVerified) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [email, passwordHash, 'business', displayName, null, null],
          function (insErr) {
            if (insErr) return res.status(500).json({ error: insErr.message });
            const newUserId = this.lastID;
            authDb.run('INSERT INTO tenant_members (tenantId, userId) VALUES (?, ?)', [req.tenantId, newUserId], (memErr) => {
              if (memErr) return res.status(500).json({ error: memErr.message });
              res.status(201).json({
                success: true,
                message: 'Сотрудник добавлен. Он может войти по email и паролю.',
                user: { id: newUserId, email, displayName }
              });
            });
          }
        );
      });
    });
  });
});

// Обновление сотрудника (имя, email, пароль) — только владелец
app.put('/api/team/:userId', (req, res) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Доступ только для владельца' });
  const authDb = getAuthDb();
  authDb.get('SELECT accountType FROM users WHERE id = ?', [req.userId], (err, u) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!u || u.accountType !== 'business') return res.status(403).json({ error: 'Только владелец бизнеса может изменять сотрудников' });
    const targetUserId = parseInt(req.params.userId, 10);
    if (!targetUserId) return res.status(400).json({ error: 'Неверный id сотрудника' });
    authDb.get('SELECT userId FROM tenant_members WHERE tenantId = ? AND userId = ?', [req.tenantId, targetUserId], (memErr, member) => {
      if (memErr) return res.status(500).json({ error: memErr.message });
      if (!member) return res.status(404).json({ error: 'Сотрудник не найден в вашей команде' });
      const body = req.body || {};
      const displayName = body.displayName != null ? String(body.displayName).trim() : null;
      const email = body.email != null ? String(body.email).trim().toLowerCase() : null;
      const newPassword = body.password != null ? String(body.password).trim() : null;
      if (newPassword !== null && newPassword !== '' && newPassword.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
      }
      authDb.get('SELECT id, email, displayName FROM users WHERE id = ?', [targetUserId], (uErr, target) => {
        if (uErr) return res.status(500).json({ error: uErr.message });
        if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
        const updates = [];
        const values = [];
        if (displayName !== null) {
          updates.push('displayName = ?');
          values.push(displayName || target.displayName);
        }
        if (email !== null && email !== '') {
          updates.push('email = ?');
          values.push(email);
        }
        const doUpdate = (passwordHash) => {
          if (passwordHash) {
            updates.push('passwordHash = ?');
            values.push(passwordHash);
          }
          if (updates.length === 0) return res.status(400).json({ error: 'Укажите имя, email или новый пароль' });
          values.push(targetUserId);
          authDb.run('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', values, (updErr) => {
            if (updErr) return res.status(500).json({ error: updErr.message });
            res.json({ success: true, message: 'Сотрудник обновлён' });
          });
        };
        const checkEmailAndUpdate = () => {
          if (email !== null && email !== '' && email !== target.email) {
            authDb.get('SELECT id FROM users WHERE email = ?', [email], (eErr, existing) => {
              if (eErr) return res.status(500).json({ error: eErr.message });
              if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
              if (newPassword !== null && newPassword !== '') {
                bcrypt.hash(newPassword, 10, (hErr, hash) => { if (hErr) return res.status(500).json({ error: hErr.message }); doUpdate(hash); });
              } else doUpdate(null);
            });
          } else {
            if (newPassword !== null && newPassword !== '') {
              bcrypt.hash(newPassword, 10, (hErr, hash) => { if (hErr) return res.status(500).json({ error: hErr.message }); doUpdate(hash); });
            } else doUpdate(null);
          }
        };
        checkEmailAndUpdate();
      });
    });
  });
});

// Удаление сотрудника из команды — только владелец (сотрудник теряет доступ к данным компании)
app.delete('/api/team/:userId', (req, res) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Доступ только для владельца' });
  const authDb = getAuthDb();
  authDb.get('SELECT accountType FROM users WHERE id = ?', [req.userId], (err, u) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!u || u.accountType !== 'business') return res.status(403).json({ error: 'Только владелец может удалять сотрудников' });
    const targetUserId = parseInt(req.params.userId, 10);
    if (!targetUserId) return res.status(400).json({ error: 'Неверный id сотрудника' });
    authDb.get('SELECT userId FROM tenant_members WHERE tenantId = ? AND userId = ?', [req.tenantId, targetUserId], (memErr, member) => {
      if (memErr) return res.status(500).json({ error: memErr.message });
      if (!member) return res.status(404).json({ error: 'Сотрудник не найден в вашей команде' });
      authDb.run('DELETE FROM tenant_members WHERE tenantId = ? AND userId = ?', [req.tenantId, targetUserId], (delErr) => {
        if (delErr) return res.status(500).json({ error: delErr.message });
        res.json({ success: true, message: 'Сотрудник удалён из команды' });
      });
    });
  });
});

// Активность сотрудника: продажи, возвраты, расходы (только владелец)
function ensureActivityColumns(db, cb) {
  const tables = ['purchases', 'returns', 'expenses'];
  let done = 0;
  tables.forEach((table) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN createdByUserId INTEGER`, () => {
      if (++done === tables.length) cb();
    });
  });
}

app.get('/api/team/:userId/activity', (req, res) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Доступ только для владельца' });
  const targetUserId = parseInt(req.params.userId, 10);
  if (!targetUserId) return res.status(400).json({ error: 'Неверный id сотрудника' });
  const authDb = getAuthDb();
  authDb.get('SELECT userId FROM tenant_members WHERE tenantId = ? AND userId = ?', [req.tenantId, targetUserId], (memErr, member) => {
    if (memErr) return res.status(500).json({ error: memErr.message });
    if (!member) return res.status(404).json({ error: 'Сотрудник не найден в вашей команде' });
    const db = req.db;
    ensureActivityColumns(db, () => {
      db.all('SELECT * FROM purchases WHERE createdByUserId = ? ORDER BY date DESC', [targetUserId], (pErr, purchases) => {
        if (pErr) return res.status(500).json({ error: pErr.message });
        // Для возвратов берём время из product_activities (timestamp), как на странице возвратов — иначе время отображается неверно
        db.all(`
          SELECT r.*, pa.timestamp as activityTimestamp, pa.amount as amount
          FROM returns r
          LEFT JOIN product_activities pa ON pa.productId = r.productId
            AND pa.customerName = r.customerName
            AND pa.quantity = r.quantity
            AND pa.status = 'returned'
            AND pa.description = 'Return: ' || COALESCE(r.reason, '')
            AND pa.timestamp = r.date
          WHERE r.createdByUserId = ?
          ORDER BY COALESCE(pa.timestamp, r.date) DESC
        `, [targetUserId], (rErr, returnsRaw) => {
          if (rErr) return res.status(500).json({ error: rErr.message });
          const returns = (returnsRaw || []).map(row => {
            const { activityTimestamp, ...rest } = row;
            let date = activityTimestamp || row.date;
            if (date) {
              date = String(date).trim();
              if (date.includes(' ') && !date.includes('T')) date = date.replace(' ', 'T');
              if (/T\d{1,2}:\d{2}/.test(date) && !/Z|[+-]\d{2}:?\d{2}$/.test(date)) date = date + 'Z';
            }
            return { ...rest, date };
          });
          db.all('SELECT * FROM expenses WHERE createdByUserId = ? ORDER BY date DESC', [targetUserId], (eErr, expenses) => {
            if (eErr) return res.status(500).json({ error: eErr.message });
            res.json({ success: true, purchases: purchases || [], returns, expenses: expenses || [] });
          });
        });
      });
    });
  });
});

// === API ДЛЯ ИНТЕГРАЦИИ С N8N/MAKE ===

// API для получения данных в формате, удобном для n8n/Make
app.get('/api/export/customers', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM customers ORDER BY date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });
  });
});

app.get('/api/export/products', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM products ORDER BY date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });
  });
});

app.get('/api/export/sales', (req, res) => {
  const db = req.db;
  const { days = 30 } = req.query;
  db.all(`
    SELECT * FROM purchases 
    WHERE DATE(date) >= DATE('now', '-${days} days')
    ORDER BY date DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      period: `${days} days`,
      timestamp: new Date().toISOString()
    });
  });
});

// API для создания записей через внешние системы
app.post('/api/webhooks/create-customer', (req, res) => {
  const db = req.db;
  const { name, phone, email, address } = req.body;
  
  db.run(
    'INSERT INTO customers (name, phone, email, address, deals, date) VALUES (?, ?, ?, ?, ?, ?)',
    [name, phone || '', email || '', address || '', '', new Date().toISOString()],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        id: this.lastID,
        message: 'Клиент создан успешно'
      });
    }
  );
});

app.post('/api/webhooks/create-product', (req, res) => {
  const db = req.db;
  const { name, price, category, stock, description } = req.body;
  
  db.run(
    'INSERT INTO products (name, price, category, stock, description, date, minStock, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, price || 0, category || '', stock || 0, description || '', new Date().toISOString(), 10, ''],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        id: this.lastID,
        message: 'Товар создан успешно'
      });
    }
  );
});

// API для получения статистики
app.get('/api/stats/summary', (req, res) => {
  const db = req.db;
  const stats = {};
  
  // Общий доход
  db.get('SELECT SUM(total) as totalRevenue FROM purchases', (err, revenue) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalRevenue = revenue.totalRevenue || 0;
    
    // Количество продаж
    db.get('SELECT COUNT(*) as totalSales FROM purchases', (err, sales) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalSales = sales.totalSales || 0;
      
      // Количество клиентов
      db.get('SELECT COUNT(*) as totalCustomers FROM customers', (err, customers) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalCustomers = customers.totalCustomers || 0;
        
        // Товары на складе
        db.get('SELECT SUM(stock) as totalStock FROM products', (err, stock) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.totalStock = stock.totalStock || 0;
          
          res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
          });
        });
      });
    });
  });
});

// === АНАЛИТИКА API ===

// Общая статистика для главной страницы
app.get('/api/analytics/dashboard', (req, res) => {
  const db = req.db;
  const stats = {};
  
  // Общий доход
  db.get('SELECT SUM(total) as totalRevenue FROM purchases', (err, revenue) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalRevenue = revenue.totalRevenue || 0;
    
    // Количество продаж
    db.get('SELECT COUNT(*) as totalSales FROM purchases', (err, sales) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalSales = sales.totalSales || 0;
      
      // Количество клиентов
      db.get('SELECT COUNT(*) as totalCustomers FROM customers', (err, customers) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalCustomers = customers.totalCustomers || 0;
        
        // Товары на складе
        db.get('SELECT SUM(stock) as totalStock FROM products', (err, stock) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.totalStock = stock.totalStock || 0;
          
          res.json(stats);
        });
      });
    });
  });
});

// Продажи за последние 7 дней
app.get('/api/analytics/sales-trend', (req, res) => {
  const db = req.db;
  const query = `
    SELECT DATE(date) as day, SUM(total) as revenue, COUNT(*) as orders
    FROM purchases 
    WHERE DATE(date) >= DATE('now', '-7 days')
    GROUP BY DATE(date)
    ORDER BY day
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Топ продаваемые товары
app.get('/api/analytics/top-products', (req, res) => {
  const db = req.db;
  const query = `
    SELECT p.name, SUM(pu.quantity) as sold, SUM(pu.total) as revenue
    FROM purchases pu
    JOIN products p ON pu.productId = p.id
    GROUP BY pu.productId
    ORDER BY sold DESC
    LIMIT 10
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Товары с низким остатком
app.get('/api/analytics/low-stock', (req, res) => {
  const db = req.db;
  const query = `
    SELECT * FROM products 
    WHERE stock <= minStock
    ORDER BY stock ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Активность по дням недели
app.get('/api/analytics/weekly-activity', (req, res) => {
  const db = req.db;
  const query = `
    SELECT 
      CASE strftime('%w', date)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
      END as dayOfWeek,
      COUNT(*) as orders,
      SUM(total) as revenue
    FROM purchases
    WHERE DATE(date) >= DATE('now', '-30 days')
    GROUP BY strftime('%w', date)
    ORDER BY strftime('%w', date)
  `;
  
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Статистика возвратов
app.get('/api/analytics/returns-stats', (req, res) => {
  const db = req.db;
  const stats = {};
  
  db.get('SELECT COUNT(*) as totalReturns FROM product_activities WHERE status = "returned"', (err, returns) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalReturns = returns.totalReturns || 0;
    
    db.all(`
      SELECT SUBSTR(description, 9) as reason, COUNT(*) as count 
      FROM product_activities 
      WHERE status = 'returned' AND description LIKE 'Return: %'
      GROUP BY reason 
      ORDER BY count DESC
    `, (err, reasons) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.returnReasons = reasons;
      res.json(stats);
    });
  });
});

// Expenses API
app.get('/api/expenses', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM expenses ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/expenses', (req, res) => {
  const db = req.db;
  const { description, amount, category, date } = req.body;
  // Сохраняем полную дату и время (если с фронта пришла только дата YYYY-MM-DD — подставляем текущее время)
  const dateToStore = (date && typeof date === 'string' && date.includes('T')) ? date : new Date().toISOString();
  ensureActivityColumns(db, () => {
    db.run(
      'INSERT INTO expenses (description, amount, category, date, createdByUserId) VALUES (?, ?, ?, ?, ?)',
      [description, amount, category, dateToStore, req.userId || null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, description, amount, category, date: dateToStore });
      }
    );
  });
});

app.put('/api/expenses/:id', (req, res) => {
  const db = req.db;
  const { description, amount, category, date } = req.body;
  const dateToStore = (date && typeof date === 'string' && date.includes('T')) ? date : (date ? date + 'T12:00:00.000Z' : new Date().toISOString());
  db.run(
    'UPDATE expenses SET description=?, amount=?, category=?, date=? WHERE id=?',
    [description, amount, category, dateToStore, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/expenses/:id', (req, res) => {
  const db = req.db;
  db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === СУЩЕСТВУЮЩИЕ API ===

// Customers API
app.get('/api/customers', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM customers', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const db = req.db;
  const { name, phone, email, address, deals, date } = req.body;
  db.run(
    'INSERT INTO customers (name, phone, email, address, deals, date) VALUES (?, ?, ?, ?, ?, ?)',
    [name, phone, email, address, deals, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const db = req.db;
  const { name, phone, email, address, deals, date } = req.body;
  db.run(
    'UPDATE customers SET name=?, phone=?, email=?, address=?, deals=?, date=? WHERE id=?',
    [name, phone, email, address, deals, date, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/customers/:id', (req, res) => {
  const db = req.db;
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Products API
app.get('/api/products', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM products', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  const db = req.db;
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  });
});

app.post('/api/products', (req, res) => {
  const db = req.db;
  console.log('Received product data:', req.body);
  const { name, price, category, stock, description, date, minStock, barcode } = req.body || {};
  
  // Sanitize inputs
  const safeName = (name || '').toString();
  const safeCategory = (category || '').toString();
  const safeDescription = (description || '').toString();
  const priceNum = Number.isFinite(Number(price)) ? Number(price) : 0;
  const stockNum = Number.isFinite(parseInt(stock)) ? parseInt(stock) : 0;
  const minStockNum = Number.isFinite(parseInt(minStock)) ? parseInt(minStock) : 10;
  const barcodeStr = (barcode || '').toString();
  const dateStr = date || new Date().toISOString();
  
  console.log('Extracted fields:', { name: safeName, price: priceNum, category: safeCategory, stock: stockNum, description: safeDescription, date: dateStr, minStock: minStockNum, barcode: barcodeStr });
  
  db.run(
    'INSERT INTO products (name, price, category, stock, description, date, minStock, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [safeName, priceNum, safeCategory, stockNum, safeDescription, dateStr, minStockNum, barcodeStr],
    function (err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Product inserted successfully with ID:', this.lastID);
      
      // Log activity: product added
      const nowIso = new Date().toISOString();
      db.run(
        'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [this.lastID, safeName, '-', stockNum || 0, 'Product added', 0, 'added', nowIso.split('T')[0], nowIso],
        (logErr) => {
          if (logErr) console.error('Error logging product added activity:', logErr.message);
        }
      );
      
      res.json({ id: this.lastID, name: safeName, price: priceNum, category: safeCategory, stock: stockNum, description: safeDescription, date: dateStr, minStock: minStockNum, barcode: barcodeStr });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const db = req.db;
  const { name, price, category, stock, description, date, minStock, barcode } = req.body || {};
  const productId = req.params.id;
  
  // Sanitize inputs
  const safeName = (name || '').toString();
  const safeCategory = (category || '').toString();
  const safeDescription = (description || '').toString();
  const priceNum = Number.isFinite(Number(price)) ? Number(price) : 0;
  const stockNum = Number.isFinite(parseInt(stock)) ? parseInt(stock) : 0;
  const minStockNum = Number.isFinite(parseInt(minStock)) ? parseInt(minStock) : 10;
  const barcodeStr = (barcode || '').toString();
  const dateStr = date || new Date().toISOString();
  
  // First get current product to compute changes
  db.get('SELECT * FROM products WHERE id = ?', [productId], (getErr, current) => {
    if (getErr) return res.status(500).json({ error: getErr.message });
    
    db.run(
      'UPDATE products SET name=?, price=?, category=?, stock=?, description=?, date=?, minStock=?, barcode=? WHERE id=?',
      [safeName, priceNum, safeCategory, stockNum, safeDescription, dateStr, minStockNum, barcodeStr, productId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Build changes description
        let changes = [];
        if (current) {
          const trim = (v) => (v || '').toString().replace(/\s+/g, ' ').slice(0, 60);
          if (current.name !== safeName) changes.push(`Name: "${current.name || '-'}" → "${safeName || '-'}"`);
          if (Number(current.price) !== Number(priceNum)) changes.push(`Price: ${current.price || 0} → ${priceNum || 0}`);
          if ((current.category || '') !== (safeCategory || '')) changes.push(`Category: "${current.category || '-'}" → "${safeCategory || '-'}"`);
          if ((current.description || '') !== (safeDescription || '')) changes.push(`Description: "${trim(current.description)}" → "${trim(safeDescription)}"`);
          if (Number(current.stock) !== Number(stockNum)) {
            const diff = Number(stockNum) - Number(current.stock);
            if (diff > 0) {
              // Separate activity for stock added
              const nowIso1 = new Date().toISOString();
              db.run(
                'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ',
                [productId, safeName, '-', diff, `Stock added: +${diff}`, 0, 'added', nowIso1.split('T')[0], nowIso1],
                (logErr) => { if (logErr) console.error('Error logging stock added:', logErr.message); }
              );
            } else if (diff < 0) {
              // Separate activity for stock removed
              const removed = Math.abs(diff);
              const nowIso2 = new Date().toISOString();
              db.run(
                'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ',
                [productId, safeName, '-', removed, `Stock removed: -${removed}`, 0, 'removed', nowIso2.split('T')[0], nowIso2],
                (logErr) => { if (logErr) console.error('Error logging stock removed:', logErr.message); }
              );
            }
          }
        }
        
        if (changes.length > 0) {
          const nowIso = new Date().toISOString();
          db.run(
            'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [productId, safeName, '-', 0, `Edited: ${changes.join(', ')}`, 0, 'edit', nowIso.split('T')[0], nowIso],
            (logErr) => { if (logErr) console.error('Error logging product edited activity:', logErr.message); }
          );
        }
        
        res.json({ success: true });
      }
    );
  });
});

app.delete('/api/products/:id', (req, res) => {
  const db = req.db;
  const productId = req.params.id;
  db.get('SELECT * FROM products WHERE id = ?', [productId], (getErr, product) => {
    if (getErr) return res.status(500).json({ error: getErr.message });
    
    db.run('DELETE FROM products WHERE id = ?', [productId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log activity: product deleted
      if (product) {
        const nowIso = new Date().toISOString();
        db.run(
          'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [productId, product.name, '-', 0, 'Product deleted', 0, 'deleted', nowIso.split('T')[0], nowIso],
          (logErr) => { if (logErr) console.error('Error logging product deleted activity:', logErr.message); }
        );
      }
      
      res.json({ success: true });
    });
  });
});

// Purchases API
app.get('/api/purchases', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM purchases ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/purchases', (req, res) => {
  const db = req.db;
  const { productId, productName, customerName, quantity, unitPrice, total, paymentMethod, notes, date } = req.body;
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  if (qty <= 0) {
    return res.status(400).json({ error: 'Количество должно быть больше 0' });
  }
  if (!productId) {
    return res.status(400).json({ error: 'Укажите товар' });
  }
  const normalizedCustomerName = (customerName == null || String(customerName).trim() === '') ? '' : String(customerName).trim();
  const runInsert = () => {
    db.get('SELECT name, stock FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
      const stock = product.stock != null ? product.stock : 0;
      if (stock < qty) {
        return res.status(400).json({ error: `Недостаточно на складе. Доступно: ${stock}, запрошено: ${qty}` });
      }
      const finalProductName = (productName && String(productName).trim()) ? String(productName).trim() : (product.name || `Product ${productId}`);
      db.run(
        'INSERT INTO purchases (productId, productName, customerName, quantity, unitPrice, total, paymentMethod, notes, date, createdByUserId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [productId, finalProductName, normalizedCustomerName, qty, unitPrice, total, paymentMethod, notes, date, req.userId || null],
        function (insErr) {
          if (insErr) return res.status(500).json({ error: insErr.message });
          db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, productId], () => {});
          res.json({ id: this.lastID, ...req.body, quantity: qty, productName: finalProductName, customerName: normalizedCustomerName });
        }
      );
    });
  };
  ensureActivityColumns(db, runInsert);
});

app.get('/api/purchases/product/:productId', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM purchases WHERE productId = ? ORDER BY date DESC', [req.params.productId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/purchases/customer/:customerName', (req, res) => {
  const db = req.db;
  const customerName = (req.params.customerName != null ? String(req.params.customerName) : '').trim();
  db.all('SELECT * FROM purchases WHERE TRIM(COALESCE(customerName, "")) = ? ORDER BY date DESC', [customerName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Покупки без клиента (customerName пустое или null)
app.get('/api/purchases/no-customer', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM purchases WHERE customerName IS NULL OR TRIM(COALESCE(customerName, "")) = "" OR customerName = "-" OR customerName = "Guest Customer" ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Количество покупок за сегодня
app.get('/api/purchases/today/count', (req, res) => {
  const db = req.db;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  db.get('SELECT COUNT(*) as count FROM purchases WHERE DATE(date) = ?', [today], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count || 0 });
  });
});

// Orders API (для редактирования и удаления заказов)
app.put('/api/orders/:id', (req, res) => {
  const db = req.db;
  const { quantity, total, productName, customerName, paymentMethod, notes } = req.body;
  
  // Сначала получаем текущие данные заказа
  db.get('SELECT * FROM purchases WHERE id = ?', [req.params.id], (err, currentOrder) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!currentOrder) return res.status(404).json({ error: 'Order not found' });
    
    // Обновляем заказ
    db.run(
      'UPDATE purchases SET quantity=?, total=?, productName=?, customerName=?, paymentMethod=?, notes=? WHERE id=?',
      [quantity, total, productName, customerName, paymentMethod, notes, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Обновляем склад: возвращаем старое количество и вычитаем новое
        if (currentOrder.productId) {
          const stockDifference = currentOrder.quantity - quantity;
          db.run(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [stockDifference, currentOrder.productId],
            (err) => {
              if (err) console.error('Error updating stock:', err);
            }
          );
        }
        
        res.json({ success: true, message: 'Order updated successfully' });
      }
    );
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const db = req.db;
  // Сначала получаем данные заказа для возврата товара на склад
  db.get('SELECT * FROM purchases WHERE id = ?', [req.params.id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Удаляем заказ
    db.run('DELETE FROM purchases WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Возвращаем товар на склад
      if (order.productId) {
        db.run(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [order.quantity, order.productId],
          (err) => {
            if (err) console.error('Error updating stock on order deletion:', err);
          }
        );
      }
      
      res.json({ success: true, message: 'Order deleted successfully' });
    });
  });
});

// Returns API — только возвраты со статусом pending (не обработанные)
app.get('/api/returns', (req, res) => {
  const db = req.db;
  db.all(`
    SELECT r.*, pa.timestamp, pa.amount
    FROM returns r
    LEFT JOIN product_activities pa ON r.productId = pa.productId 
      AND r.customerName = pa.customerName 
      AND r.quantity = pa.quantity 
      AND pa.status = 'returned'
      AND pa.description LIKE 'Return: ' || COALESCE(r.reason, '')
    WHERE COALESCE(r.status, 'pending') = 'pending'
    ORDER BY COALESCE(pa.timestamp, r.date, r.id) DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/returns', (req, res) => {
  const db = req.db;
  const { productId, productName, customerName, quantity, reason, notes, date } = req.body;
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  if (qty <= 0) {
    return res.status(400).json({ error: 'Количество для возврата должно быть больше 0' });
  }
  if (!productId) {
    return res.status(400).json({ error: 'Укажите товар' });
  }
  const normalizedCustomerName = (customerName == null || String(customerName).trim() === '') ? '' : String(customerName).trim();
  const normForDb = (name) => {
    if (name == null || String(name).trim() === '') return '';
    const s = String(name).trim().toLowerCase();
    if (s === 'no customer' || s === 'нет клиента' || s === 'guest customer' || s === '-') return '';
    return String(name).trim();
  };
  const customerForQuery = normForDb(normalizedCustomerName);
  ensureActivityColumns(db, () => {
    if (!productId) return res.status(400).json({ error: 'Укажите товар' });
    db.get(
      'SELECT COALESCE(SUM(quantity), 0) as totalPurchased FROM purchases WHERE TRIM(COALESCE(customerName, "")) = ? AND productId = ?',
      [customerForQuery, productId],
      (pErr, purchased) => {
        if (pErr) return res.status(500).json({ error: pErr.message });
        db.get(
          'SELECT COALESCE(SUM(quantity), 0) as totalReturned FROM returns WHERE TRIM(COALESCE(customerName, "")) = ? AND productId = ?',
          [customerForQuery, productId],
          (rErr, returned) => {
            if (rErr) return res.status(500).json({ error: rErr.message });
            const totalPurchased = purchased && purchased.totalPurchased != null ? purchased.totalPurchased : 0;
            const totalReturned = returned && returned.totalReturned != null ? returned.totalReturned : 0;
            const availableToReturn = totalPurchased - totalReturned;
            if (qty > availableToReturn) {
              return res.status(400).json({
                error: `Нельзя вернуть больше, чем куплено. Куплено: ${totalPurchased}, уже возвращено: ${totalReturned}, можно вернуть: ${availableToReturn}`
              });
            }
            db.run(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [qty, productId],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
              }
            );
            db.get('SELECT price, name FROM products WHERE id = ?', [productId], (priceErr, product) => {
              if (priceErr) return res.status(500).json({ error: priceErr.message });
              const finalProductName = (productName && String(productName).trim()) ? String(productName).trim() : (product && product.name) || `Product ${productId}`;
              const returnAmount = product && product.price != null ? -(product.price * qty) : 0;
              const dateToStore = (date && String(date).includes('T')) ? date : new Date().toISOString();
              const insertParams = [productId, finalProductName, customerForQuery, qty, reason, notes, dateToStore, req.userId || null, 'processed'];
              const insertParamsNoStatus = [productId, finalProductName, customerForQuery, qty, reason, notes, dateToStore, req.userId || null];
              const isColumnError = (e) => {
                const msg = (e && e.message ? e.message : String(e)).toLowerCase();
                return msg.includes('no such column') || msg.includes('has no column') || (msg.includes('status') && msg.includes('column'));
              };
              const doInsert = (useStatus, afterAlter) => {
                const sql = useStatus
                  ? 'INSERT INTO returns (productId, productName, customerName, quantity, reason, notes, date, createdByUserId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                  : 'INSERT INTO returns (productId, productName, customerName, quantity, reason, notes, date, createdByUserId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                const params = useStatus ? insertParams : insertParamsNoStatus;
                db.run(sql, params, function (returnErr) {
                  if (returnErr) {
                    if (useStatus && !afterAlter && isColumnError(returnErr)) {
                      db.run('ALTER TABLE returns ADD COLUMN status TEXT', () => { doInsert(true, true); });
                      return;
                    }
                    if (useStatus && afterAlter && isColumnError(returnErr)) {
                      doInsert(false, true);
                      return;
                    }
                    return res.status(500).json({ error: returnErr.message });
                  }
                  const returnId = this.lastID;
                  db.run(
                    'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [productId, finalProductName, customerForQuery, qty, `Return: ${reason}`, returnAmount, 'returned', dateToStore.split('T')[0], dateToStore],
                    function (logErr) {
                      if (logErr) return res.status(500).json({ error: logErr.message });
                      res.json({ id: returnId, productId, productName: finalProductName, customerName: customerForQuery, quantity: qty, reason, notes, date: dateToStore });
                    }
                  );
                });
              };
              doInsert(true, false);
            });
          }
        );
      }
    );
  });
});

// Отметить возврат как обработанный — после этого он исчезнет со страницы «Возвраты»
app.patch('/api/returns/:id', (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Неверный id возврата' });
  }
  const { status } = req.body || {};
  const newStatus = (status && String(status).trim().toLowerCase()) || 'processed';
  if (!['processed', 'completed', 'завершен', 'обработан'].includes(newStatus)) {
    return res.status(400).json({ error: 'Недопустимый статус. Используйте: processed, completed' });
  }
  db.run(
    "UPDATE returns SET status = 'processed' WHERE id = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Возврат не найден' });
      }
      res.json({ id, status: 'processed', message: 'Возврат обработан' });
    }
  );
});

app.get('/api/returns/product/:productId', (req, res) => {
  const db = req.db;
  db.all('SELECT productId, productName, customerName, quantity, SUBSTR(description, 9) as reason, "" as notes, date, amount FROM product_activities WHERE status = "returned" AND description LIKE "Return: %" AND productId = ? ORDER BY date DESC', [req.params.productId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API для получения количества возвратов по товару и клиенту
app.get('/api/returns/customer/:customerName/product/:productId', (req, res) => {
  const db = req.db;
  let customerName = (req.params.customerName != null ? String(req.params.customerName) : '').trim();
  const s = customerName.toLowerCase();
  if (s === 'no customer' || s === 'нет клиента' || s === 'guest customer' || s === '-' || customerName === '') customerName = '';
  const productId = req.params.productId;
  db.get(`
    SELECT COALESCE(SUM(quantity), 0) as totalReturned
    FROM returns
    WHERE TRIM(COALESCE(customerName, "")) = ? AND productId = ?
  `, [customerName, productId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ totalReturned: row ? row.totalReturned : 0 });
  });
});

// Suppliers API
app.get('/api/suppliers', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM suppliers', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Парсим JSON products
    const processedRows = rows.map(row => ({
      ...row,
      products: row.products ? JSON.parse(row.products) : []
    }));
    
    res.json(processedRows);
  });
});

app.post('/api/suppliers', (req, res) => {
  const db = req.db;
  const { name, phone, email, rating, lastOrder, products } = req.body;
  db.run(
    'INSERT INTO suppliers (name, phone, email, rating, lastOrder, products) VALUES (?, ?, ?, ?, ?, ?)',
    [name, phone, email, rating, lastOrder, JSON.stringify(products || [])],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Получить все активности продуктов
app.get('/api/product-activities', (req, res) => {
  const db = req.db;
  db.all('SELECT * FROM product_activities ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Stock operations API placeholder to avoid 404
app.get('/api/stock-operations/product/:productId', (req, res) => {
  res.json([]);
});

// Добавить новую активность продукта
app.post('/api/product-activities', (req, res) => {
  const db = req.db;
  const { productId, productName, customerName, quantity, description, amount, status, date, timestamp } = req.body;
  db.run(
    'INSERT INTO product_activities (productId, productName, customerName, quantity, description, amount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [productId, productName, customerName || '-', quantity || 0, description, amount || 0, status, date, timestamp],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// Получить активности для конкретного продукта
app.get('/api/product-activities/product/:productId', (req, res) => {
  const db = req.db;
  const { productId } = req.params;
  db.all('SELECT * FROM product_activities WHERE productId = ? ORDER BY date DESC', [productId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Graceful shutdown handling
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    const { getAuthDb } = require('./db/auth');
    getAuthDb().close((err) => {
      if (err) console.error('Error closing auth DB:', err);
      console.log('Server shut down gracefully.');
      process.exit(0);
    });
  });
  
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forcing shutdown after timeout...');
    process.exit(1);
  }, 10000);
}

// Start server
const server = app.listen(3002, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  
  console.log('🚀 Real Business Server started successfully!');
  console.log('📊 Server running on port 3002');
  console.log('📈 Analytics API available');
  console.log('💾 Auth DB: auth.db, tenant DBs: backend/data/tenant_<id>.db');
  console.log('🔗 Health check: http://localhost:3002/api/health');
  console.log('⏰ Server started at:', new Date().toISOString());
});

// Error handling for server
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Port 3002 is already in use!');
    console.error('💡 Try running: lsof -ti:3002 | xargs kill -9');
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Keep alive mechanism
let keepAliveInterval = setInterval(() => {
  console.log(`✅ Server alive - ${new Date().toISOString()} - Uptime: ${Math.floor(process.uptime())}s`);
}, 30000); // Every 30 seconds

// Signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Clear All Data API endpoints
app.delete('/api/clear-all-customers', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all customers...');
  db.run('DELETE FROM customers', (err) => {
    if (err) {
      console.error('Error clearing customers:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All customers cleared successfully');
    res.json({ message: 'All customers cleared successfully' });
  });
});

app.delete('/api/clear-all-products', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all products...');
  db.run('DELETE FROM products', (err) => {
    if (err) {
      console.error('Error clearing products:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All products cleared successfully');
    res.json({ message: 'All products cleared successfully' });
  });
});

app.delete('/api/clear-all-orders', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all orders...');
  db.run('DELETE FROM purchases', (err) => {
    if (err) {
      console.error('Error clearing orders:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All orders cleared successfully');
    res.json({ message: 'All orders cleared successfully' });
  });
});

app.delete('/api/clear-all-returns', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all returns...');
  db.run('DELETE FROM returns', (err) => {
    if (err) {
      console.error('Error clearing returns:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All returns cleared successfully');
    res.json({ message: 'All returns cleared successfully' });
  });
});

app.delete('/api/clear-all-tasks', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all tasks...');
  db.run('DELETE FROM tasks', (err) => {
    if (err) {
      console.error('Error clearing tasks:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All tasks cleared successfully');
    res.json({ message: 'All tasks cleared successfully' });
  });
});

app.delete('/api/clear-all-activities', (req, res) => {
  const db = req.db;
  console.log('🗑️ Clearing all activities...');
  db.run('DELETE FROM product_activities', (err) => {
    if (err) {
      console.error('Error clearing activities:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ All activities cleared successfully');
    res.json({ message: 'All activities cleared successfully' });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Cleanup interval on shutdown
process.on('exit', () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  console.log('👋 Process exiting...');
});