import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'application/pdf', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Please upload an image or PDF.`));
    }
  }
});

const router = express.Router();

// Require authentication for all expense endpoints
router.use(authMiddleware);

// GET /api/expenses - List with filters & search
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      department,
      status,
      type,
      has_receipt,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'DESC'
    } = req.query;

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (title LIKE ? OR vendor LIKE ? OR invoice_ref LIKE ? OR notes LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (department && department !== 'All') {
      query += ` AND department = ?`;
      params.push(department);
    }

    if (status && status !== 'All') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (type && type !== 'All') {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (has_receipt === 'yes') {
      query += ` AND receipt_filename IS NOT NULL AND receipt_filename != ''`;
    } else if (has_receipt === 'no') {
      query += ` AND (receipt_filename IS NULL OR receipt_filename = '')`;
    }

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate);
    }

    // Sort column validation
    const validSortCols = ['date', 'amount', 'title', 'vendor', 'category', 'status', 'created_at'];
    const sortColumn = validSortCols.includes(sortBy) ? sortBy : 'date';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortDirection}, id DESC`;

    const expenses = db.prepare(query).all(...params);
    res.json({ success: true, data: expenses, count: expenses.length });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/stats - Aggregated stats with optional ?period=1m|3m|6m
router.get('/stats', (req, res) => {
  try {
    const { period = '1m' } = req.query;
    const now = new Date();
    const allExpenses = db.prepare(`SELECT * FROM expenses`).all();

    // Period start dates
    const getPeriodStart = (p) => {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      if (p === '1m') return d.toISOString().split('T')[0];
      if (p === '3m') { d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0]; }
      if (p === '6m') { d.setMonth(d.getMonth() - 5); return d.toISOString().split('T')[0]; }
      return null;
    };

    const periodStart = getPeriodStart(period);
    const periodExpenses = periodStart
      ? allExpenses.filter(e => e.date && e.date >= periodStart)
      : allExpenses;

    // Current month burn (always from full data)
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let monthlyBurn = 0;
    allExpenses.forEach(e => {
      if (e.date && e.date.startsWith(currentYM)) monthlyBurn += Number(e.amount) || 0;
    });

    // Period-scoped KPI stats
    let totalSpend = 0, salariesSpend = 0, recurringMonthly = 0;
    let missingReceiptCount = 0, flaggedCount = 0;
    const categoryMap = {}, departmentMap = {};
    const statusMap = {
      'Paid': { count: 0, total: 0 },
      'Approved': { count: 0, total: 0 },
      'Pending Review': { count: 0, total: 0 },
      'Flagged': { count: 0, total: 0 }
    };

    periodExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      totalSpend += amount;
      if (exp.category === 'Salaries & Payroll') salariesSpend += amount;
      if (exp.type === 'recurring') {
        if (exp.recurrence_period === 'monthly') recurringMonthly += amount;
        else if (exp.recurrence_period === 'annually') recurringMonthly += amount / 12;
        else if (exp.recurrence_period === 'weekly') recurringMonthly += amount * 4.33;
      }
      if (!exp.receipt_filename) missingReceiptCount++;
      if (exp.status === 'Flagged') flaggedCount++;

      const cat = exp.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, total: 0, count: 0 };
      categoryMap[cat].total += amount;
      categoryMap[cat].count++;

      const dept = exp.department || 'General';
      if (!departmentMap[dept]) departmentMap[dept] = { department: dept, total: 0, count: 0 };
      departmentMap[dept].total += amount;
      departmentMap[dept].count++;

      if (statusMap[exp.status]) {
        statusMap[exp.status].count++;
        statusMap[exp.status].total += amount;
      }
    });

    const categoryBreakdown = Object.values(categoryMap)
      .map(item => ({ ...item, percentage: totalSpend > 0 ? Number(((item.total / totalSpend) * 100).toFixed(1)) : 0 }))
      .sort((a, b) => b.total - a.total);

    const departmentBreakdown = Object.values(departmentMap).sort((a, b) => b.total - a.total);

    // === ALWAYS build 6-month trend (for the chart) ===
    const trendMonths = 6;
    const monthList = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthList.push({ ym, label, total: 0, salaries: 0, subscriptions: 0, infra: 0, compliance: 0, other: 0, count: 0 });
    }

    // Populate trend from ALL expenses (so chart always has context)
    allExpenses.forEach(exp => {
      if (!exp.date) return;
      const ym = exp.date.substring(0, 7);
      const slot = monthList.find(m => m.ym === ym);
      if (!slot) return;
      const amt = Number(exp.amount) || 0;
      slot.total += amt;
      slot.count++;
      if (exp.category === 'Salaries & Payroll') {
        slot.salaries += amt;
      } else if (exp.category === 'Subscriptions' || exp.category === 'SaaS & Tools') {
        slot.subscriptions += amt;
      } else if (exp.category === 'Cloud Infrastructure' || exp.category === 'Banking Rails & Payments') {
        slot.infra += amt;
      } else if (exp.category === 'KYC & Compliance' || exp.category === 'Regulatory & Audits' || exp.category === 'Security & Audits') {
        slot.compliance += amt;
      } else {
        slot.other += amt;
      }
    });

    // Top vendors scoped to period
    const vendorMap = {};
    periodExpenses.forEach(exp => {
      const v = exp.vendor || exp.title;
      if (!vendorMap[v]) vendorMap[v] = { vendor: v, total: 0, count: 0, category: exp.category };
      vendorMap[v].total += Number(exp.amount) || 0;
      vendorMap[v].count++;
    });
    const topVendors = Object.values(vendorMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Previous period comparison
    const getPrevRange = (p) => {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      if (p === '1m') { d.setMonth(d.getMonth() - 1); return { start: d.toISOString().split('T')[0], end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0] }; }
      if (p === '3m') { const end = new Date(d); end.setDate(end.getDate() - 1); d.setMonth(d.getMonth() - 3); return { start: d.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }; }
      if (p === '6m') { const end = new Date(d); end.setDate(end.getDate() - 1); d.setMonth(d.getMonth() - 6); return { start: d.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }; }
      return null;
    };
    const prevRange = getPrevRange(period);
    const prevTotal = prevRange
      ? allExpenses.filter(e => e.date && e.date >= prevRange.start && e.date <= prevRange.end)
          .reduce((s, e) => s + (Number(e.amount) || 0), 0)
      : 0;
    const changePercent = prevTotal > 0 ? Number((((totalSpend - prevTotal) / prevTotal) * 100).toFixed(1)) : null;

    res.json({
      success: true,
      stats: {
        period,
        totalSpend,
        monthlyBurn,
        salariesSpend,
        recurringMonthly,
        missingReceiptCount,
        flaggedCount,
        totalCount: periodExpenses.length,
        changePercent,
        prevTotal,
        categoryBreakdown,
        departmentBreakdown,
        monthlyTrends: monthList,   // always 6 months
        topVendors,
        statusBreakdown: statusMap
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET /api/expenses/pending-reminders - Expenses pending review for 5+ days
router.get('/pending-reminders', (req, res) => {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const cutoff = fiveDaysAgo.toISOString().split('T')[0];

    const reminders = db.prepare(`
      SELECT id, title, vendor, pay_to, amount, currency, date, status, category, department, invoice_ref
      FROM expenses
      WHERE status = 'Pending Review'
        AND date <= ?
        AND (reminder_dismissed IS NULL OR reminder_dismissed = 0)
      ORDER BY date ASC
    `).all(cutoff);

    res.json({ success: true, data: reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses/:id/dismiss-reminder - Dismiss a pending reminder
router.post('/:id/dismiss-reminder', (req, res) => {
  try {
    db.prepare(`UPDATE expenses SET reminder_dismissed = 1 WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/export/csv - Export filtered expenses to CSV
router.get('/export/csv', (req, res) => {
  try {
    const expenses = db.prepare(`SELECT * FROM expenses ORDER BY date DESC`).all();

    const headers = [
      'ID', 'Date', 'Title', 'Vendor', 'Category', 'Department',
      'Amount', 'Currency', 'Tax Amount', 'Payment Method',
      'Status', 'Type', 'Recurrence', 'Invoice Ref', 'Has Receipt', 'Receipt Filename', 'Notes'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = expenses.map(e => [
      e.id,
      escapeCsv(e.date),
      escapeCsv(e.title),
      escapeCsv(e.vendor),
      escapeCsv(e.category),
      escapeCsv(e.department),
      e.amount,
      escapeCsv(e.currency),
      e.tax_amount || 0,
      escapeCsv(e.payment_method),
      escapeCsv(e.status),
      escapeCsv(e.type),
      escapeCsv(e.recurrence_period),
      escapeCsv(e.invoice_ref),
      e.receipt_filename ? 'YES' : 'NO',
      escapeCsv(e.receipt_original_name || e.receipt_filename || ''),
      escapeCsv(e.notes)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fintech_expenses_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/:id - Single expense details
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Create new expense with optional receipt
router.post('/', upload.single('receipt'), (req, res) => {
  try {
    const {
      title,
      vendor = '',
      pay_to = '',
      category,
      amount,
      currency = 'INR',
      tax_amount = 0,
      date,
      type = 'one-time',
      recurrence_period = 'none',
      payment_method = 'Bank Wire',
      status = 'Paid',
      department = 'Engineering',
      invoice_ref = '',
      notes = ''
    } = req.body;

    if (!title || !category || !amount || !date) {
      return res.status(400).json({
        success: false,
        error: 'Title, Category, Amount, and Date are required fields.'
      });
    }

    let receipt_filename = null, receipt_original_name = null;
    let receipt_mimetype = null, receipt_size = null;
    if (req.file) {
      receipt_filename = req.file.filename;
      receipt_original_name = req.file.originalname;
      receipt_mimetype = req.file.mimetype;
      receipt_size = req.file.size;
    }

    const creatorName = req.user?.name || 'Admin';

    const stmt = db.prepare(`
      INSERT INTO expenses (
        title, vendor, pay_to, category, amount, currency, tax_amount, date,
        type, recurrence_period, payment_method, status, department,
        invoice_ref, receipt_filename, receipt_original_name,
        receipt_mimetype, receipt_size, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title, vendor, pay_to, category,
      parseFloat(amount), currency, parseFloat(tax_amount || 0), date,
      type, recurrence_period, payment_method, status, department,
      invoice_ref, receipt_filename, receipt_original_name,
      receipt_mimetype, receipt_size, notes, creatorName
    );

    const newExpense = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newExpense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', upload.single('receipt'), (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const {
      title = existing.title,
      vendor = existing.vendor,
      pay_to = existing.pay_to,
      category = existing.category,
      amount = existing.amount,
      currency = existing.currency,
      tax_amount = existing.tax_amount,
      date = existing.date,
      type = existing.type,
      recurrence_period = existing.recurrence_period,
      payment_method = existing.payment_method,
      status = existing.status,
      department = existing.department,
      invoice_ref = existing.invoice_ref,
      notes = existing.notes,
      remove_receipt
    } = req.body;

    let receipt_filename = existing.receipt_filename;
    let receipt_original_name = existing.receipt_original_name;
    let receipt_mimetype = existing.receipt_mimetype;
    let receipt_size = existing.receipt_size;

    if (req.file) {
      // If there was an old file, remove it
      if (existing.receipt_filename) {
        const oldPath = path.join(uploadsDir, existing.receipt_filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      receipt_filename = req.file.filename;
      receipt_original_name = req.file.originalname;
      receipt_mimetype = req.file.mimetype;
      receipt_size = req.file.size;
    } else if (remove_receipt === 'true') {
      if (existing.receipt_filename) {
        const oldPath = path.join(uploadsDir, existing.receipt_filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      receipt_filename = null;
      receipt_original_name = null;
      receipt_mimetype = null;
      receipt_size = null;
    }

    const stmt = db.prepare(`
      UPDATE expenses SET
        title = ?, vendor = ?, pay_to = ?, category = ?, amount = ?, currency = ?,
        tax_amount = ?, date = ?, type = ?, recurrence_period = ?,
        payment_method = ?, status = ?, department = ?, invoice_ref = ?,
        receipt_filename = ?, receipt_original_name = ?, receipt_mimetype = ?,
        receipt_size = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title, vendor, pay_to, category,
      parseFloat(amount), currency, parseFloat(tax_amount || 0), date,
      type, recurrence_period, payment_method, status, department, invoice_ref,
      receipt_filename, receipt_original_name, receipt_mimetype, receipt_size,
      notes, req.params.id
    );

    const updated = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete expense and receipt file
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (existing.receipt_filename) {
      const filePath = path.join(uploadsDir, existing.receipt_filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete receipt file:', e.message);
        }
      }
    }

    db.prepare(`DELETE FROM expenses WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
