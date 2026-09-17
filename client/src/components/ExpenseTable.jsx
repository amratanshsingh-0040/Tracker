import React from 'react';
import { Paperclip, AlertTriangle, Edit3, Trash2, ArrowUpDown, FileX } from 'lucide-react';

const categoryColors = {
  'Salaries & Payroll': 'bg-emerald-100 text-emerald-700',
  'Banking Rails & Payments': 'bg-blue-100 text-blue-700',
  'Cloud Infrastructure': 'bg-cyan-100 text-cyan-700',
  'KYC & Compliance': 'bg-amber-100 text-amber-700',
  'Regulatory & Audits': 'bg-purple-100 text-purple-700',
  'Security & Audits': 'bg-rose-100 text-rose-700',
  'SaaS & Tools': 'bg-indigo-100 text-indigo-700',
  'Marketing & Growth': 'bg-pink-100 text-pink-700',
  'Office & Travel': 'bg-gray-100 text-gray-600',
};

const statusColors = {
  'Paid': 'bg-emerald-100 text-emerald-700',
  'Approved': 'bg-blue-100 text-blue-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  'Flagged': 'bg-rose-100 text-rose-700',
};

export default function ExpenseTable({ expenses, loading, onViewReceipt, onEdit, onDelete, onAttachReceipt, onSort }) {
  const fmt = (amt, curr = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: curr || 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading expenses...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <FileX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-600">No expenses found</p>
        <p className="text-xs text-gray-400 mt-1">Try changing your filters or add a new expense.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Summary row */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
        <span>Total: <span className="font-bold text-gray-800 text-sm">{fmt(total)}</span></span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <th className="py-3 px-4 text-left cursor-pointer hover:text-gray-600" onClick={() => onSort('date')}>
                <span className="flex items-center space-x-1">Date <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-3 px-4 text-left cursor-pointer hover:text-gray-600" onClick={() => onSort('title')}>
                <span className="flex items-center space-x-1">Expense <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-3 px-4 text-left">Vendor</th>
              <th className="py-3 px-4 text-left cursor-pointer hover:text-gray-600" onClick={() => onSort('amount')}>
                <span className="flex items-center space-x-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-center">Receipt</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((exp) => {
              const catColor = categoryColors[exp.category] || 'bg-gray-100 text-gray-600';
              const statColor = statusColors[exp.status] || 'bg-gray-100 text-gray-600';
              return (
                <tr key={exp.id} className="hover:bg-gray-50 transition group">

                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-gray-600 font-medium">{exp.date}</span>
                    {exp.invoice_ref && (
                      <div className="text-[11px] text-gray-400 truncate max-w-[120px]">#{exp.invoice_ref}</div>
                    )}
                  </td>

                  {/* Title + Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800 truncate max-w-xs">{exp.title}</div>
                    <div className="mt-1 flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catColor}`}>
                        {exp.category}
                      </span>
                      {exp.type === 'recurring' && (
                        <span className="text-[10px] text-purple-500 font-medium">↻ {exp.recurrence_period}</span>
                      )}
                    </div>
                    {exp.notes && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate max-w-xs" title={exp.notes}>
                        📝 {exp.notes}
                      </p>
                    )}
                  </td>

                  {/* Vendor + Pay To */}
                  <td className="py-3.5 px-4">
                    <div className="text-gray-700 truncate max-w-[160px] font-medium">{exp.vendor || '—'}</div>
                    {exp.pay_to && (
                      <div className="text-[11px] text-indigo-600 truncate max-w-[160px] mt-0.5">
                        → {exp.pay_to}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-400">{exp.department}</div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-gray-900">
                    {fmt(exp.amount, exp.currency)}
                    {Number(exp.tax_amount) > 0 && (
                      <div className="text-[11px] text-gray-400 font-normal">Tax: {fmt(exp.tax_amount, exp.currency)}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statColor}`}>
                      {exp.status}
                    </span>
                  </td>

                  {/* Receipt */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {exp.receipt_filename ? (
                      <button
                        onClick={() => onViewReceipt(exp)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onAttachReceipt(exp)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => onEdit(exp)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
