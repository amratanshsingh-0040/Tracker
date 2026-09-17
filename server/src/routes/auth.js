import express from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword, createSession, destroySession, authMiddleware } from '../auth.js';

const router = express.Router();

// POST /api/auth/login - Authenticate user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`).get(cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = createSession(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me - Get current user profile from token
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout - Invalidate token
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;
  if (token) {
    destroySession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/change-password - Change password while logged in
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }

    // Fetch full user record with hash and salt
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const isCurrentValid = verifyPassword(currentPassword, user.password_hash, user.salt);
    if (!isCurrentValid) {
      return res.status(400).json({ success: false, error: 'Incorrect current password.' });
    }

    const { salt, hash } = hashPassword(newPassword);

    db.prepare(`
      UPDATE users SET password_hash = ?, salt = ? WHERE id = ?
    `).run(hash, salt, req.user.id);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/reset-password - Emergency password reset using master recovery key
router.post('/reset-password', (req, res) => {
  try {
    const { email, recoveryKey, newPassword } = req.body;

    if (!email || !recoveryKey || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, Master Recovery Key, and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }

    // Master recovery key configured via env or default fallback
    const expectedKey = (process.env.RECOVERY_KEY || 'apex-recovery-key-2026').trim();
    if (recoveryKey.trim() !== expectedKey) {
      return res.status(401).json({ success: false, error: 'Invalid Master Recovery Key.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`).get(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: `No account found with email: ${email}` });
    }

    const { salt, hash } = hashPassword(newPassword);

    db.prepare(`
      UPDATE users SET password_hash = ?, salt = ? WHERE id = ?
    `).run(hash, salt, user.id);

    // Invalidate all active sessions for safety
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);

    res.json({
      success: true,
      message: `Password for ${user.name} has been reset. You can now sign in with your new password.`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET /api/auth/users - List all team members (requires login)
router.get('/users', authMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/users - Add a new team member directly in the UI
router.post('/users', authMiddleware, (req, res) => {
  try {
    // Only administrators can add new team members
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Only administrators can add team members.' });
    }

    const { name, email, password, role = 'member' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password should be at least 4 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict email format validation (must contain valid username, @, domain, and TLD)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address (e.g. name@company.com).' });
    }

    const existing = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A team member with this email already exists.' });
    }

    const { salt, hash } = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, hash, salt, role === 'admin' ? 'admin' : 'member');

    const newUser = db.prepare(`SELECT id, name, email, role, created_at FROM users WHERE id = ?`).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: `${name} has been added successfully.`,
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/auth/users/:id - Remove a team member
router.delete('/users/:id', authMiddleware, (req, res) => {
  try {
    // 1. Only administrators can delete team members
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Only administrators can remove team members.' });
    }

    const targetId = parseInt(req.params.id, 10);

    // 2. You cannot delete your own account while logged in
    if (req.user.id === targetId) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account while logged in.' });
    }

    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Team member not found.' });
    }

    // 3. CRITICAL: Administrator accounts can NEVER be deleted!
    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, error: 'Security protection: Administrator accounts cannot be removed.' });
    }

    // Delete active sessions for this user
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(targetId);

    // Delete user
    db.prepare(`DELETE FROM users WHERE id = ?`).run(targetId);

    res.json({ success: true, message: `Access revoked for ${targetUser.name}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
