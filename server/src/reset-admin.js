import crypto from 'crypto';
import db from './db.js';

// Usage:
// node src/reset-admin.js [new_password] [email]
// Example:
// node src/reset-admin.js MyNewPass2026 admin@company.com

const newPassword = process.argv[2] || 'admin123';
const targetEmail = (process.argv[3] || 'admin@company.com').trim().toLowerCase();

console.log(`\n🔑 Resetting password for: ${targetEmail}...`);

const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`).get(targetEmail);

if (!user) {
  // If user doesn't exist, create it as admin
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('Admin', targetEmail, hash, salt, 'admin');

  console.log(`✅ Admin account created with email: ${targetEmail}`);
} else {
  // Update existing user
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');

  db.prepare(`
    UPDATE users SET password_hash = ?, salt = ?, role = 'admin' WHERE id = ?
  `).run(hash, salt, user.id);

  // Clear existing sessions
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);

  console.log(`✅ Password successfully reset for: ${user.name} (${user.email})`);
}

console.log(`\n---------------------------------------`);
console.log(`  Login URL:      http://localhost:3000`);
console.log(`  Email:          ${targetEmail}`);
console.log(`  New Password:   ${newPassword}`);
console.log(`---------------------------------------\n`);
process.exit(0);
