import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../expenses.db');
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    vendor TEXT,
    pay_to TEXT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    tax_amount REAL DEFAULT 0.0,
    date TEXT NOT NULL,
    type TEXT DEFAULT 'one-time',
    recurrence_period TEXT DEFAULT 'none',
    payment_method TEXT DEFAULT 'Bank Wire',
    status TEXT DEFAULT 'Paid',
    department TEXT DEFAULT 'Engineering',
    invoice_ref TEXT,
    receipt_filename TEXT,
    receipt_original_name TEXT,
    receipt_mimetype TEXT,
    receipt_size INTEGER,
    notes TEXT,
    reminder_dismissed INTEGER DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
`);

// Migrations for existing DBs
try { db.exec(`ALTER TABLE expenses ADD COLUMN pay_to TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE expenses ADD COLUMN reminder_dismissed INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE expenses ADD COLUMN created_by TEXT`); } catch (e) {}

// Auto-seed default Admin if no users exist
const userCount = db.prepare(`SELECT COUNT(*) as count FROM users`).get();
if (!userCount || userCount.count === 0) {
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultHash = crypto.pbkdf2Sync('admin123', defaultSalt, 10000, 64, 'sha512').toString('hex');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('Admin', 'admin@company.com', defaultHash, defaultSalt, 'admin');

  console.log('✅ Default admin user created: admin@company.com / admin123');
}

export default db;
