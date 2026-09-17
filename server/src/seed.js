import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to generate professional mock receipt SVGs
function createMockReceiptSvg(title, vendor, invoiceNo, amount, date, lineItems) {
  const itemsHtml = lineItems.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 14px; font-size: 13px; color: #334155;">${item.desc}</td>
      <td style="padding: 10px 14px; font-size: 13px; color: #64748b; text-align: center;">${item.qty || 1}</td>
      <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">$${Number(item.price).toLocaleString()}</td>
    </tr>
  `).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 850" width="100%" height="100%">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
    </defs>
    <style>
      .text-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
    <!-- Background Card -->
    <rect width="700" height="850" fill="#f8fafc" rx="16" />
    <rect x="25" y="25" width="650" height="800" fill="#ffffff" rx="12" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" stroke="#e2e8f0" stroke-width="1.5" />

    <!-- Top Header Banner -->
    <rect x="25" y="25" width="650" height="110" fill="url(#headerGrad)" rx="12" />
    <text x="60" y="75" fill="#ffffff" font-size="24" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      ${vendor.toUpperCase()}
    </text>
    <text x="60" y="105" fill="#94a3b8" font-size="13" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      FINANCIAL TECHNOLOGY &amp; ENTERPRISE SERVICES
    </text>
    <rect x="530" y="55" width="110" height="32" rx="6" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5"/>
    <text x="585" y="76" fill="#10b981" font-size="13" font-weight="700" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">PAID / AUDITED</text>

    <!-- Meta Info Box -->
    <g transform="translate(60, 160)" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      <text x="0" y="0" fill="#64748b" font-size="12" font-weight="600">BILLED TO:</text>
      <text x="0" y="22" fill="#0f172a" font-size="15" font-weight="bold">Apex Pay Technologies Inc.</text>
      <text x="0" y="42" fill="#475569" font-size="13">Attn: Finance &amp; Treasury Dept</text>
      <text x="0" y="62" fill="#475569" font-size="13">500 Howard St, Suite 400, San Francisco, CA</text>

      <text x="360" y="0" fill="#64748b" font-size="12" font-weight="600">INVOICE DETAILS:</text>
      <text x="360" y="22" fill="#0f172a" font-size="14">Invoice No: <tspan font-weight="bold">${invoiceNo}</tspan></text>
      <text x="360" y="42" fill="#0f172a" font-size="14">Date: <tspan font-weight="bold">${date}</tspan></text>
      <text x="360" y="62" fill="#0f172a" font-size="14">Status: <tspan fill="#10b981" font-weight="bold">Settled via Wire</tspan></text>
    </g>

    <!-- Divider -->
    <line x1="60" y1="260" x2="640" y2="260" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 4" />

    <!-- Table Header -->
    <rect x="60" y="280" width="580" height="38" fill="#f1f5f9" rx="6"/>
    <text x="75" y="304" fill="#475569" font-size="12" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif">DESCRIPTION</text>
    <text x="440" y="304" fill="#475569" font-size="12" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif" text-anchor="middle">QTY</text>
    <text x="620" y="304" fill="#475569" font-size="12" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif" text-anchor="end">AMOUNT (USD)</text>

    <!-- Table Items Embed via foreignObject -->
    <foreignObject x="60" y="325" width="580" height="280">
      <table xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        ${itemsHtml}
      </table>
    </foreignObject>

    <!-- Total Breakdown -->
    <g transform="translate(380, 620)" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      <rect x="0" y="0" width="260" height="110" fill="#f8fafc" rx="8" stroke="#e2e8f0" />
      <text x="20" y="32" fill="#64748b" font-size="13">Subtotal:</text>
      <text x="240" y="32" fill="#0f172a" font-size="13" text-anchor="end" font-weight="600">$${(Number(amount) * 0.92).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</text>
      
      <text x="20" y="58" fill="#64748b" font-size="13">Sales Tax / VAT (8%):</text>
      <text x="240" y="58" fill="#0f172a" font-size="13" text-anchor="end" font-weight="600">$${(Number(amount) * 0.08).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</text>

      <line x1="20" y1="72" x2="240" y2="72" stroke="#cbd5e1" stroke-width="1" />

      <text x="20" y="96" fill="#0f172a" font-size="15" font-weight="bold">Total Paid:</text>
      <text x="240" y="96" fill="#2563eb" font-size="17" font-weight="bold" text-anchor="end">$${Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</text>
    </g>

    <!-- Footer Seal / Verification -->
    <g transform="translate(60, 750)" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      <circle cx="20" cy="20" r="18" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
      <path d="M12 20 L18 26 L28 14" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <text x="50" y="16" fill="#0f172a" font-size="12" font-weight="bold">Digital Receipt Verified &amp; Cryptographically Timestamped</text>
      <text x="50" y="32" fill="#64748b" font-size="11">Compliance Ref: SOC2-TYPE-II-AUDIT-${invoiceNo} | Stored for 7-Year Retention</text>
    </g>
  </svg>`;
}

export function seedFintechData() {
  const count = db.prepare(`SELECT count(*) as total FROM expenses`).get().total;
  if (count > 0) {
    console.log(`Database already has ${count} records. Skipping seed.`);
    return;
  }

  console.log('Seeding realistic Fintech expenses with receipts...');

  const mockExpenses = [
    {
      title: 'Core Banking & Plaid Production API Rails',
      vendor: 'Plaid Technologies Inc.',
      category: 'Banking Rails & Payments',
      amount: 4850.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-09-02',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'ACH Transfer',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'PLD-2026-09-441',
      notes: 'Tier-1 production API connectivity for instant account verification and bank balance webhooks.',
      receiptName: 'plaid_invoice_sept2026.svg',
      lineItems: [
        { desc: 'Plaid Auth & Identity API Calls (45,000 requests)', price: 2700 },
        { desc: 'Plaid Balance Real-Time Webhooks', price: 1150 },
        { desc: 'Production SLA 99.99% Enterprise Support', price: 1000 }
      ]
    },
    {
      title: 'VP of Engineering - Monthly Executive Compensation',
      vendor: 'Alexander Vance (VP Eng)',
      category: 'Salaries & Payroll',
      amount: 17500.00,
      currency: 'USD',
      tax_amount: 1400.00,
      date: '2026-09-01',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Bank Wire',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'PAY-202609-001',
      notes: 'Monthly executive payroll disbursement via Silicon Valley Bank payroll rail.',
      receiptName: 'payslip_vp_eng_sept2026.svg',
      lineItems: [
        { desc: 'Base Salary Compensation - Sept 2026', price: 15500 },
        { desc: 'Health & Dental Premium Contribution', price: 1200 },
        { desc: 'Tech & Home Office Stipend', price: 800 }
      ]
    },
    {
      title: 'Principal Compliance Officer Salary',
      vendor: 'Elena Rostova, CAMS',
      category: 'Salaries & Payroll',
      amount: 14200.00,
      currency: 'USD',
      tax_amount: 1136.00,
      date: '2026-09-01',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Bank Wire',
      status: 'Paid',
      department: 'Risk & Compliance',
      invoice_ref: 'PAY-202609-002',
      notes: 'Monthly compliance & BSA/AML lead compensation.',
      receiptName: 'payslip_compliance_lead.svg',
      lineItems: [
        { desc: 'Base Salary - Sept 2026', price: 13000 },
        { desc: 'Continuing Professional Education Allowance', price: 1200 }
      ]
    },
    {
      title: 'Senior Staff Distributed Systems Engineer',
      vendor: 'Marcus Chen',
      category: 'Salaries & Payroll',
      amount: 13800.00,
      currency: 'USD',
      tax_amount: 1104.00,
      date: '2026-09-01',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Bank Wire',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'PAY-202609-003',
      notes: 'Lead engineer for transaction settlement engine and ledgers.',
      receiptName: 'payslip_staff_eng.svg',
      lineItems: [
        { desc: 'Base Salary - Sept 2026', price: 12500 },
        { desc: 'Benefits & Stipends', price: 1300 }
      ]
    },
    {
      title: 'AWS Cloud Hosting - EKS, Aurora DB & CloudHSM',
      vendor: 'Amazon Web Services',
      category: 'Cloud Infrastructure',
      amount: 8640.50,
      currency: 'USD',
      tax_amount: 691.24,
      date: '2026-09-03',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Corporate Card',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'AWS-INV-8930112',
      notes: 'Multi-AZ Kubernetes clusters, encrypted Aurora PostgreSQL, and CloudHSM key storage for PCI compliance.',
      receiptName: 'aws_cloud_sept2026.svg',
      lineItems: [
        { desc: 'Amazon Elastic Kubernetes Service (EKS) Clusters', price: 3400.50 },
        { desc: 'Amazon Aurora PostgreSQL Serverless v2', price: 2840.00 },
        { desc: 'AWS CloudHSM Dedicated Hardware Security Module', price: 2400.00 }
      ]
    },
    {
      title: 'Persona KYC & Biometric Identity Verification',
      vendor: 'Persona Identities Inc.',
      category: 'KYC & Compliance',
      amount: 3420.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-09-05',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'ACH Transfer',
      status: 'Paid',
      department: 'Risk & Compliance',
      invoice_ref: 'PERS-9820-SEP',
      notes: 'User onboarding verification: government photo ID scans, selfie biometric matching, and watchlist lookups.',
      receiptName: 'persona_kyc_sept2026.svg',
      lineItems: [
        { desc: 'Automated Government ID Verifications (1,710 checks)', price: 2565 },
        { desc: 'OFAC & Global Sanctions Watchlist Screening', price: 855 }
      ]
    },
    {
      title: 'PCI-DSS 4.0 & SOC 2 Type II Annual Audit Retainer',
      vendor: 'A-LIGN Assurance Auditors',
      category: 'Regulatory & Audits',
      amount: 18500.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-08-28',
      type: 'one-time',
      recurrence_period: 'none',
      payment_method: 'Bank Wire',
      status: 'Approved',
      department: 'Risk & Compliance',
      invoice_ref: 'ALIGN-AUDIT-2026-Q3',
      notes: 'Milestone 2 payment for annual external compliance audit and penetration testing.',
      receiptName: 'align_audit_invoice.svg',
      lineItems: [
        { desc: 'PCI-DSS v4.0 Level 1 Assessment & Attestation', price: 11000 },
        { desc: 'SOC 2 Type II Surveillance Audit', price: 7500 }
      ]
    },
    {
      title: 'Stripe Gateway Interchange & Processing Fees',
      vendor: 'Stripe Inc.',
      category: 'Banking Rails & Payments',
      amount: 5120.30,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-09-04',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'ACH Transfer',
      status: 'Paid',
      department: 'Operations & Finance',
      invoice_ref: 'STRIPE-FEES-SEP-26',
      notes: 'Card network interchange, card issuing fees, and instant payout processing.',
      receiptName: 'stripe_monthly_fees.svg',
      lineItems: [
        { desc: 'Interchange Plus Processing & Payout Fees', price: 4220.30 },
        { desc: 'Radar Machine-Learning Fraud Defense', price: 900.00 }
      ]
    },
    {
      title: 'Experian Credit Bureau API Batch Ingestion',
      vendor: 'Experian Information Solutions',
      category: 'Banking Rails & Payments',
      amount: 2850.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-08-20',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'ACH Transfer',
      status: 'Paid',
      department: 'Risk & Compliance',
      invoice_ref: 'EXP-8812903',
      notes: 'Credit scoring pull and risk assessment for lending underwriting.',
      receiptName: 'experian_api_bill.svg',
      lineItems: [
        { desc: 'FICO / VantageScore Real-Time API Queries', price: 2850.00 }
      ]
    },
    {
      title: 'GitHub Enterprise & Copilot Business Seats',
      vendor: 'GitHub / Microsoft',
      category: 'SaaS & Tools',
      amount: 1450.00,
      currency: 'USD',
      tax_amount: 116.00,
      date: '2026-09-01',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Corporate Card',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'GH-2026-09-11',
      notes: '25 GitHub Enterprise Cloud developer seats with Advanced Security & Copilot.',
      receiptName: 'github_enterprise_bill.svg',
      lineItems: [
        { desc: 'GitHub Enterprise Cloud (25 seats)', price: 525 },
        { desc: 'GitHub Advanced Security Code Scanning', price: 475 },
        { desc: 'GitHub Copilot Business (25 seats)', price: 450 }
      ]
    },
    {
      title: 'Datadog APM & Security Information Event Monitoring (SIEM)',
      vendor: 'Datadog Inc.',
      category: 'Cloud Infrastructure',
      amount: 2150.00,
      currency: 'USD',
      tax_amount: 172.00,
      date: '2026-09-02',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Corporate Card',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'DD-SEP-4829',
      notes: 'Infrastructure monitoring, tracing, log management, and security posture monitoring.',
      receiptName: 'datadog_invoice.svg',
      lineItems: [
        { desc: 'Infrastructure & APM Hosts (20 nodes)', price: 1400 },
        { desc: 'Log Management & Cloud SIEM Retention', price: 750 }
      ]
    },
    {
      title: 'Money20/20 Fintech Conference Sponsorship & Booth',
      vendor: 'Ascential Events (Money20/20)',
      category: 'Marketing & Growth',
      amount: 12000.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-08-15',
      type: 'one-time',
      recurrence_period: 'none',
      payment_method: 'Bank Wire',
      status: 'Paid',
      department: 'Sales & Marketing',
      invoice_ref: 'M2026-SPONSOR-4',
      notes: 'Exhibition booth and lead pass badges for Money20/20 conference in Las Vegas.',
      receiptName: 'money2020_sponsorship.svg',
      lineItems: [
        { desc: 'Startup Kiosk Booth Space & Branding', price: 9500 },
        { desc: 'Full-Access Delegate Badges (5 attendees)', price: 2500 }
      ]
    },
    {
      title: 'HackerOne Bug Bounty Program Pool & Triage',
      vendor: 'HackerOne Inc.',
      category: 'Security & Audits',
      amount: 6500.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-08-10',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Bank Wire',
      status: 'Paid',
      department: 'Engineering',
      invoice_ref: 'H1-BOUNTY-991',
      notes: 'Crowdsourced white-hat security researcher payouts and professional triage service.',
      receiptName: 'hackerone_bounty.svg',
      lineItems: [
        { desc: 'Platform SaaS & Managed Triage Service', price: 2500 },
        { desc: 'Bounty Reward Pool Escrow Replenishment', price: 4000 }
      ]
    },
    {
      title: 'Google Workspace Enterprise & 1Password Vaults',
      vendor: 'Google LLC',
      category: 'SaaS & Tools',
      amount: 980.00,
      currency: 'USD',
      tax_amount: 78.40,
      date: '2026-09-01',
      type: 'recurring',
      recurrence_period: 'monthly',
      payment_method: 'Corporate Card',
      status: 'Paid',
      department: 'Operations & Finance',
      invoice_ref: 'GSUITE-882193',
      notes: 'Enterprise Plus Google Workspace for company domain and team vaults.',
      receiptName: 'google_workspace.svg',
      lineItems: [
        { desc: 'Google Workspace Enterprise Plus (35 users)', price: 770 },
        { desc: '1Password Business Vaults', price: 210 }
      ]
    },
    {
      title: 'Fintech Regulatory Legal Retainer - State Licensing',
      vendor: 'Gibson Dunn & Crutcher LLP',
      category: 'Regulatory & Audits',
      amount: 9500.00,
      currency: 'USD',
      tax_amount: 0.00,
      date: '2026-09-10',
      type: 'one-time',
      recurrence_period: 'none',
      payment_method: 'Bank Wire',
      status: 'Pending Review',
      department: 'Risk & Compliance',
      invoice_ref: 'GIBSON-LEG-4402',
      notes: 'Legal opinion and multi-state Money Transmitter License (MTL) application support.',
      receiptName: null, // intentionally left null to test missing receipt alert!
      lineItems: []
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO expenses (
      title, vendor, category, amount, currency, tax_amount, date,
      type, recurrence_period, payment_method, status, department,
      invoice_ref, receipt_filename, receipt_original_name,
      receipt_mimetype, receipt_size, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insertMany = db.transaction((expenses) => {
    for (const exp of expenses) {
      let filename = null;
      let originalName = null;
      let mimetype = null;
      let size = null;

      if (exp.receiptName) {
        filename = `receipt-${Date.now()}-${Math.floor(Math.random() * 10000)}.svg`;
        const svgContent = createMockReceiptSvg(
          exp.title,
          exp.vendor,
          exp.invoice_ref,
          exp.amount,
          exp.date,
          exp.lineItems || []
        );
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, svgContent, 'utf8');

        originalName = exp.receiptName;
        mimetype = 'image/svg+xml';
        size = Buffer.byteLength(svgContent, 'utf8');
      }

      insertStmt.run(
        exp.title,
        exp.vendor,
        exp.category,
        exp.amount,
        exp.currency,
        exp.tax_amount,
        exp.date,
        exp.type,
        exp.recurrence_period,
        exp.payment_method,
        exp.status,
        exp.department,
        exp.invoice_ref,
        filename,
        originalName,
        mimetype,
        size,
        exp.notes
      );
    }
  });

  insertMany(mockExpenses);
  console.log(`Successfully seeded ${mockExpenses.length} fintech expense records!`);
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedFintechData();
}
