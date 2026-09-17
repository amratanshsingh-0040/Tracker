import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Trash2, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'Salaries & Payroll',
  'Subscriptions',
  'Banking Rails & Payments',
  'KYC & Compliance',
  'Cloud Infrastructure',
  'Regulatory & Audits',
  'Security & Audits',
  'SaaS & Tools',
  'Marketing & Growth',
  'Office & Travel',
  'Other',
];
const DEPARTMENTS = [
  'Engineering',
  'Risk & Compliance',
  'Operations & Finance',
  'Product & Design',
  'Sales & Marketing',
  'Executive',
  'Other',
];

const PAYMENT_METHODS = [
  'UPI', 'NEFT', 'RTGS', 'IMPS',
  'Credit Card', 'Debit Card',
  'Bank Wire', 'ACH Transfer',
  'Corporate Card', 'Cash', 'Crypto/USDC'
];
const STATUSES = ['Paid', 'Approved', 'Pending Review', 'Flagged'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'CAD', 'AUD'];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white transition";

export default function ExpenseFormModal({ expense, onClose, onSave }) {
  const isEditing = !!expense;
  const fileRef = useRef(null);

  // Detect if an existing expense uses a category/department not in our lists
  const initCat = expense?.category || 'Salaries & Payroll';
  const initDept = expense?.department || 'Engineering';
  const catIsCustom = initCat && !CATEGORIES.includes(initCat);
  const deptIsCustom = initDept && !DEPARTMENTS.includes(initDept);

  const [form, setForm] = useState({
    title: expense?.title || '',
    vendor: expense?.vendor || '',
    pay_to: expense?.pay_to || '',
    category: catIsCustom ? 'Other' : initCat,
    amount: expense?.amount || '',
    currency: expense?.currency || 'INR',
    tax_amount: expense?.tax_amount || '0',
    date: expense?.date || new Date().toISOString().split('T')[0],
    type: expense?.type || 'one-time',
    recurrence_period: expense?.recurrence_period || 'none',
    payment_method: expense?.payment_method || 'UPI',
    status: expense?.status || 'Paid',
    department: deptIsCustom ? 'Other' : initDept,
    invoice_ref: expense?.invoice_ref || '',
    notes: expense?.notes || '',
  });

  // Free-text for "Other" selections
  const [customCategory, setCustomCategory] = useState(catIsCustom ? initCat : '');
  const [customDepartment, setCustomDepartment] = useState(deptIsCustom ? initDept : '');


  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setRemoveReceipt(false);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else setPreview(null);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) return setError('Expense title is required.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Please enter a valid amount.');
    if (form.category === 'Other' && !customCategory.trim()) return setError('Please enter a custom category name.');
    if (form.department === 'Other' && !customDepartment.trim()) return setError('Please enter a custom department name.');

    try {
      setLoading(true);
      const data = new FormData();
      // Resolve "Other" → custom text before submitting
      const resolved = {
        ...form,
        category: form.category === 'Other' ? customCategory.trim() : form.category,
        department: form.department === 'Other' ? customDepartment.trim() : form.department,
      };
      Object.entries(resolved).forEach(([k, v]) => data.append(k, v));
      if (file) data.append('receipt', file);
      else if (removeReceipt) data.append('remove_receipt', 'true');

      if (isEditing) await api.updateExpense(expense.id, data);
      else await api.createExpense(data);

      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Expense Title *">
              <input type="text" required placeholder="e.g. AWS Cloud Invoice — September" value={form.title}
                onChange={e => set('title', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Vendor / Company">
              <input type="text" placeholder="e.g. Amazon Web Services" value={form.vendor}
                onChange={e => set('vendor', e.target.value)} className={inputClass} />
            </Field>
          </div>

          {/* Pay To */}
          <Field label="Pay To (Person / Payee Name)">
            <input type="text" placeholder="e.g. Rahul Sharma, Infosys Ltd, John Doe" value={form.pay_to}
              onChange={e => set('pay_to', e.target.value)} className={inputClass} />
          </Field>

          {/* Amount + Currency + Tax */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Field label="Amount *">
                <input type="number" step="0.01" placeholder="0.00" value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-emerald-600 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white transition" />
              </Field>
            </div>
            <Field label="Currency">
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inputClass}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tax / VAT">
              <input type="number" step="0.01" placeholder="0.00" value={form.tax_amount}
                onChange={e => set('tax_amount', e.target.value)} className={inputClass} />
            </Field>
          </div>

          {/* Category + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Category */}
            <div className="space-y-2">
              <Field label="Category *">
                <select
                  value={form.category}
                  onChange={e => {
                    const cat = e.target.value;
                    set('category', cat);
                    if (['Salaries & Payroll', 'Subscriptions', 'SaaS & Tools', 'Cloud Infrastructure'].includes(cat)) {
                      setForm(p => ({ ...p, category: cat, type: 'recurring', recurrence_period: 'monthly' }));
                    }
                    if (cat !== 'Other') setCustomCategory('');
                  }}
                  className={inputClass}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              {form.category === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your category name…"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className={`${inputClass} border-indigo-300 bg-indigo-50 focus:bg-white`}
                  autoFocus
                />
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Field label="Department">
                <select
                  value={form.department}
                  onChange={e => {
                    set('department', e.target.value);
                    if (e.target.value !== 'Other') setCustomDepartment('');
                  }}
                  className={inputClass}
                >
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              {form.department === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your department name…"
                  value={customDepartment}
                  onChange={e => setCustomDepartment(e.target.value)}
                  className={`${inputClass} border-indigo-300 bg-indigo-50 focus:bg-white`}
                  autoFocus
                />
              )}
            </div>

          </div>

          {/* Date + Payment + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Date *">
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Payment Method">
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className={inputClass}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Recurring + Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expense Type</p>
              <div className="flex space-x-4">
                {['one-time', 'recurring'].map(t => (
                  <label key={t} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="type" checked={form.type === t}
                      onChange={() => setForm(p => ({ ...p, type: t, recurrence_period: t === 'recurring' ? 'monthly' : 'none' }))}
                      className="text-indigo-600" />
                    <span className="capitalize">{t === 'one-time' ? 'One-time' : 'Recurring'}</span>
                  </label>
                ))}
              </div>
              {form.type === 'recurring' && (
                <select value={form.recurrence_period} onChange={e => set('recurrence_period', e.target.value)}
                  className="mt-2.5 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                  <option value="weekly">Weekly</option>
                </select>
              )}
            </div>
            <Field label="Invoice / Ref Number">
              <input type="text" placeholder="e.g. INV-4491 or WIRE-990" value={form.invoice_ref}
                onChange={e => set('invoice_ref', e.target.value)} className={inputClass} />
            </Field>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Receipt / Invoice (optional)
            </label>

            {isEditing && expense.receipt_filename && !removeReceipt && !file && (
              <div className="mb-3 flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-gray-700 truncate">{expense.receipt_original_name || expense.receipt_filename}</span>
                </div>
                <button type="button" onClick={() => setRemoveReceipt(true)}
                  className="text-xs text-rose-500 hover:underline cursor-pointer">Remove</button>
              </div>
            )}

            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                drag ? 'border-indigo-400 bg-indigo-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />

              {file ? (
                <div className="flex flex-col items-center">
                  <Check className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  {preview && <img src={preview} alt="" className="mt-3 max-h-24 rounded-lg object-cover border border-gray-200" />}
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="mt-2 text-xs text-rose-500 hover:underline inline-flex items-center space-x-1">
                    <Trash2 className="w-3 h-3" /><span>Change</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Drop file here or <span className="text-indigo-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 25MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea rows={2} placeholder="Add any relevant notes or descriptions..." value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white transition resize-none" />
          </Field>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Add Expense'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
