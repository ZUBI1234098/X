const jwt = require('jsonwebtoken');
const { getAuthDb } = require('../db/auth');
const { getTenantDb } = require('../tenantManager');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

function requireTenantDb(req, res, next) {
  const authDb = getAuthDb();
  authDb.get('SELECT id FROM tenants WHERE userId = ?', [req.userId], (err, ownerRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (ownerRow) {
      req.tenantId = ownerRow.id;
      req.isOwner = true;
      const db = getTenantDb(ownerRow.id);
      if (!db) {
        return res.status(500).json({ error: 'База данных тенанта не найдена или не инициализирована' });
      }
      req.db = db;
      return next();
    }
    authDb.get('SELECT tenantId FROM tenant_members WHERE userId = ?', [req.userId], (err2, memberRow) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!memberRow) return res.status(403).json({ error: 'Тенант не найден' });
      req.tenantId = memberRow.tenantId;
      req.isOwner = false;
      const db = getTenantDb(memberRow.tenantId);
      if (!db) {
        return res.status(500).json({ error: 'База данных тенанта не найдена или не инициализирована' });
      }
      req.db = db;
      next();
    });
  });
}

function isPublicPath(path) {
  return path === '/api/health' || path === '/health' || path.startsWith('/api/auth') || path.startsWith('/auth');
}

function authMiddleware(req, res, next) {
  const path = req.path;
  if (isPublicPath(path)) {
    return next();
  }
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    requireTenantDb(req, res, next);
  });
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireTenantDb,
  authMiddleware,
  isPublicPath
};
