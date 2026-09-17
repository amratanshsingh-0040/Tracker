import React from 'react';
import { Search, X } from 'lucide-react';

const CATEGORIES = [
  'All', 'Salaries & Payroll', 'Subscriptions', 'Banking Rails & Payments',
  'KYC & Compliance', 'Cloud Infrastructure', 'Regulatory & Audits',
  'Security & Audits', 'SaaS & Tools', 'Marketing & Growth', 'Office & Travel', 'Other'
];

const STATUSES = ['All', 'Paid', 'Approved', 'Pending Review', 'Flagged'];

export default function FilterBar({ filters, setFilters, onReset }) {
  const hasFilters = filters.search || (filters.category && filters.category !== 'All') ||
    (filters.status && filters.status !== 'All') || (filters.has_receipt && filters.has_receipt !== 'All') ||
    (filters.type && filters.type !== 'All');

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

      {/* Search & Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search by name, vendor, or reference..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-gray-800 placeholder-gray-400"
          />
          {filters.search && (
            <button onClick={() => set('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <select
          value={filters.status || 'All'}
          onChange={(e) => set('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-700 bg-white cursor-pointer"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>

        {/* Type */}
        <select
          value={filters.type || 'All'}
          onChange={(e) => set('type', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-700 bg-white cursor-pointer"
        >
          <option value="All">All Types</option>
          <option value="recurring">Recurring</option>
          <option value="one-time">One-time</option>
        </select>

        {/* Receipt */}
        <select
          value={filters.has_receipt || 'All'}
          onChange={(e) => set('has_receipt', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-gray-700 bg-white cursor-pointer"
        >
          <option value="All">All Receipts</option>
          <option value="yes">Has Receipt</option>
          <option value="no">Missing Receipt</option>
        </select>

        {hasFilters && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer flex items-center space-x-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => {
          const active = (filters.category || 'All') === cat;
          return (
            <button
              key={cat}
              onClick={() => set('category', cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

    </div>
  );
}
