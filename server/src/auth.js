import crypto from 'crypto';
import db from './db.js';

// Hash a password with a random salt using Node's native crypto (PBKDF2)
export function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Verify a plaintext password against stored hash & salt
export function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

// Generate a secure session token valid for 30 days
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(token, userId, expiresAt);

  return token;
}

// Invalidate / delete a session token
export function destroySession(token) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

// Find user by session token (checking expiry)
export function getUserByToken(token) {
  if (!token) return null;

  const session = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    destroySession(token);
    return null;
  }

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

// Express middleware to protect private API endpoints
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7)
    : req.query.token; // also allow ?token= for direct file downloads

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
  }

  req.user = user;
  next();
}
