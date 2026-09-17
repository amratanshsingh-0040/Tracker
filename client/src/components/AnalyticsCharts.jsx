import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export default function AnalyticsCharts({ stats, onSelectCategory }) {
  const [open, setOpen] = useState(true);
  if (!stats) return null;

  const { categoryBreakdown = [], monthlyTrends = [], totalSpend = 0 } = stats;

  const maxMonth = Math.max(...monthlyTrends.map(m => m.total), 1);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const catColors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500'
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none border-b border-gray-100"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Spend Breakdown</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {open && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Monthly Bar Chart */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Monthly Spend (Last 6 Months)</p>
            <div className="flex items-end space-x-2 h-32">
              {monthlyTrends.map((m, i) => {
                const h = maxMonth > 0 ? (m.total / maxMonth) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono">{m.total > 0 ? fmt(m.total).replace('$', '').replace(',000', 'K') : ''}</span>
                    <div className="w-full bg-gray-100 rounded-t-md overflow-hidden" style={{ height: '80px' }}>
                      <div
                        className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(h, m.total > 0 ? 4 : 0)}%`, marginTop: `${100 - Math.max(h, m.total > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Category</p>
            <div className="space-y-2">
              {categoryBreakdown.slice(0, 6).map((cat, i) => (
                <div
                  key={i}
                  onClick={() => onSelectCategory && onSelectCategory(cat.category)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 group-hover:text-indigo-600 font-medium">{cat.category}</span>
                    <span className="text-gray-500 font-mono">{fmt(cat.total)} <span className="text-gray-300">({cat.percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catColors[i % catColors.length]}`}
                      style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
