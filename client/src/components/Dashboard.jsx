import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Repeat,
  AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { api } from '../services/api';

const PERIODS = [
  { key: '1m', label: 'This Month' },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
];

const CAT_COLORS = [
  '#6366f1', '#10b981', '#3b82f6', '#f59e0b',
  '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6'
];

// Colors for stacked bar chart segments
const SEG_COLORS = {
  salaries:      { bg: '#6366f1', label: 'Salaries' },
  subscriptions: { bg: '#10b981', label: 'Subscriptions' },
  infra:         { bg: '#3b82f6', label: 'Cloud/Banking' },
  compliance:    { bg: '#f59e0b', label: 'Compliance' },
  other:         { bg: '#e2e8f0', label: 'Other' },
};

const CHART_HEIGHT = 160; // fixed pixel height for bar area

export default function Dashboard({ onFilterCategory, onFilterMissingReceipts }) {
  const [period, setPeriod] = useState('1m');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStats(period)
      .then(r => { if (r.stats) setStats(r.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const fmtShort = (n) => {
    const v = Number(n) || 0;
    if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
    if (v >= 100_000)    return `₹${(v / 100_000).toFixed(1)}L`;
    if (v >= 1_000)      return `₹${(v / 1_000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
  };

  const {
    totalSpend = 0, monthlyBurn = 0, salariesSpend = 0,
    missingReceiptCount = 0, totalCount = 0, changePercent = null,
    categoryBreakdown = [], monthlyTrends = [], topVendors = [],
    departmentBreakdown = [], statusBreakdown = {}
  } = stats || {};

  const maxMonthTotal = Math.max(...monthlyTrends.map(m => m.total || 0), 1);

  const periodLabel = PERIODS.find(p => p.key === period)?.label || 'This Month';

  // Build stacked bar segments using absolute positioning (most reliable)
  function StackedBar({ month }) {
    const total = month.total || 0;
    if (total === 0) return null;

    const barH = Math.max((total / maxMonthTotal) * CHART_HEIGHT, 6);

    const salH  = Math.round((( month.salaries      || 0) / total) * barH);
    const subH  = Math.round((( month.subscriptions || 0) / total) * barH);
    const infH  = Math.round((( month.infra          || 0) / total) * barH);
    const compH = Math.round((( month.compliance     || 0) / total) * barH);
    const othH  = Math.max(0, barH - salH - subH - infH - compH);

    // Stack from bottom: other → compliance → infra → subscriptions → salaries
    const segments = [
      { h: othH,  color: SEG_COLORS.other.bg,         bottom: 0 },
      { h: compH, color: SEG_COLORS.compliance.bg,    bottom: othH },
      { h: infH,  color: SEG_COLORS.infra.bg,         bottom: othH + compH },
      { h: subH,  color: SEG_COLORS.subscriptions.bg, bottom: othH + compH + infH },
      { h: salH,  color: SEG_COLORS.salaries.bg,      bottom: othH + compH + infH + subH },
    ];

    return (
      <div
        className="relative w-full max-w-[44px] rounded-t-lg overflow-hidden"
        style={{ height: `${barH}px`, backgroundColor: SEG_COLORS.other.bg }}
      >
        {segments.map((seg, i) =>
          seg.h > 0 ? (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                bottom: `${seg.bottom}px`,
                height: `${seg.h}px`,
                backgroundColor: seg.color,
              }}
            />
          ) : null
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${totalCount} expense${totalCount !== 1 ? 's' : ''} · ${periodLabel}`}
          </p>
        </div>
        {/* Period Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                period === p.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total Spend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Spend</span>
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{fmt(totalSpend)}</div>
              {changePercent !== null && (
                <div className={`flex items-center space-x-1 mt-1.5 text-xs font-semibold ${
                  changePercent > 0 ? 'text-rose-500' : changePercent < 0 ? 'text-emerald-500' : 'text-gray-400'
                }`}>
                  {changePercent > 0
                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                    : changePercent < 0
                    ? <ArrowDownRight className="w-3.5 h-3.5" />
                    : <Minus className="w-3.5 h-3.5" />}
                  <span>{changePercent > 0 ? '+' : ''}{changePercent}% vs prev period</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">{totalCount} transactions</p>
            </div>

            {/* This Month Burn */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">This Month</span>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{fmt(monthlyBurn)}</div>
              <p className="text-xs text-gray-400 mt-1">Current month burn</p>
            </div>

            {/* Salaries */}
            <div
              onClick={() => onFilterCategory('Salaries & Payroll')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-indigo-200 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Salaries</span>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{fmt(salariesSpend)}</div>
              <p className="text-xs text-gray-400 mt-1">
                {totalSpend > 0 ? `${((salariesSpend / totalSpend) * 100).toFixed(0)}% of total` : 'Payroll & compensation'}
              </p>
            </div>

            {/* Missing Receipts */}
            <div
              onClick={missingReceiptCount > 0 ? onFilterMissingReceipts : undefined}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                missingReceiptCount > 0
                  ? 'border-amber-200 cursor-pointer hover:border-amber-300 hover:shadow-md'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receipts</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  missingReceiptCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${missingReceiptCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {missingReceiptCount === 0 ? 'All clear' : `${missingReceiptCount} missing`}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {missingReceiptCount === 0 ? '100% receipt compliance' : 'Click to review'}
              </p>
            </div>
          </div>

          {/* Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* ── Stacked Bar Chart (always 6 months) ── */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">Monthly Spend (Last 6 Months)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    KPI cards above reflect <span className="font-semibold text-gray-600">{periodLabel}</span>
                  </p>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-[11px] text-gray-500 max-w-[180px]">
                  {Object.entries(SEG_COLORS).map(([key, val]) => (
                    <span key={key} className="flex items-center gap-1">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: val.bg }}
                      />
                      {val.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bars */}
              <div className="flex items-end gap-2" style={{ height: `${CHART_HEIGHT + 52}px` }}>
                {monthlyTrends.map((m, i) => {
                  const total = m.total || 0;
                  const barH = total > 0 ? Math.max((total / maxMonthTotal) * CHART_HEIGHT, 6) : 0;

                  // Highlight months in selected period
                  const now = new Date();
                  const periodMonths = period === '1m' ? 1 : period === '3m' ? 3 : 6;
                  const isInPeriod = (6 - i) <= periodMonths; // last N bars

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group relative"
                      style={{ height: `${CHART_HEIGHT + 52}px` }}
                    >
                      {/* Tooltip on hover */}
                      {total > 0 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
                          <div className="bg-gray-800 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap">
                            {m.label}: {fmtShort(total)}
                          </div>
                        </div>
                      )}

                      {/* Upper space (amount label) */}
                      <div
                        className="flex flex-col justify-end items-center w-full"
                        style={{ height: `${CHART_HEIGHT + 20}px` }}
                      >
                        {total > 0 && (
                          <span className="text-[10px] font-semibold text-gray-500 mb-1.5">
                            {fmtShort(total)}
                          </span>
                        )}

                        {/* Bar */}
                        <div className="relative w-full max-w-[44px]" style={{ height: `${barH}px` }}>
                          {/* Background track */}
                          <div
                            className="absolute inset-0 rounded-t-lg"
                            style={{ backgroundColor: '#e2e8f0' }}
                          />
                          {/* Stacked segments */}
                          {total > 0 && (() => {
                            const salH  = Math.round(((m.salaries      || 0) / total) * barH);
                            const subH  = Math.round(((m.subscriptions || 0) / total) * barH);
                            const infH  = Math.round(((m.infra          || 0) / total) * barH);
                            const compH = Math.round(((m.compliance     || 0) / total) * barH);
                            const othH  = Math.max(0, barH - salH - subH - infH - compH);

                            return (
                              <>
                                {othH > 0 && (
                                  <div className="absolute left-0 right-0 rounded-t-lg"
                                    style={{ bottom: 0, height: `${othH}px`, backgroundColor: SEG_COLORS.other.bg,
                                      borderRadius: salH===0 && subH===0 && infH===0 && compH===0 ? '6px 6px 0 0' : 0 }} />
                                )}
                                {compH > 0 && (
                                  <div className="absolute left-0 right-0"
                                    style={{ bottom: `${othH}px`, height: `${compH}px`, backgroundColor: SEG_COLORS.compliance.bg,
                                      borderRadius: salH===0 && subH===0 && infH===0 ? '6px 6px 0 0' : 0 }} />
                                )}
                                {infH > 0 && (
                                  <div className="absolute left-0 right-0"
                                    style={{ bottom: `${othH + compH}px`, height: `${infH}px`, backgroundColor: SEG_COLORS.infra.bg,
                                      borderRadius: salH===0 && subH===0 ? '6px 6px 0 0' : 0 }} />
                                )}
                                {subH > 0 && (
                                  <div className="absolute left-0 right-0"
                                    style={{ bottom: `${othH + compH + infH}px`, height: `${subH}px`, backgroundColor: SEG_COLORS.subscriptions.bg,
                                      borderRadius: salH===0 ? '6px 6px 0 0' : 0 }} />
                                )}
                                {salH > 0 && (
                                  <div className="absolute left-0 right-0 rounded-t-lg"
                                    style={{ bottom: `${othH + compH + infH + subH}px`, height: `${salH}px`, backgroundColor: SEG_COLORS.salaries.bg }} />
                                )}
                              </>
                            );
                          })()}

                          {/* Period highlight outline */}
                          {isInPeriod && total > 0 && (
                            <div
                              className="absolute inset-0 rounded-t-lg ring-2 ring-indigo-400 ring-opacity-50 pointer-events-none"
                            />
                          )}
                        </div>
                      </div>

                      {/* Month label */}
                      <div className="text-center mt-2" style={{ height: '32px' }}>
                        <p className={`text-[11px] font-semibold ${isInPeriod ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {m.label}
                        </p>
                        {m.count > 0 && (
                          <p className="text-[10px] text-gray-300">{m.count} txn{m.count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Category Breakdown ── */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-800 mb-4">Spend by Category</p>
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.slice(0, 6).map((cat, i) => (
                    <div
                      key={i}
                      onClick={() => onFilterCategory(cat.category)}
                      className="group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700 group-hover:text-indigo-600 font-medium transition truncate">
                            {cat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0 text-xs">
                          <span className="font-bold text-gray-800 font-mono">{fmtShort(cat.total)}</span>
                          <span className="text-gray-400 w-9 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(cat.percentage, 2)}%`,
                            backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {categoryBreakdown.length > 6 && (
                    <button
                      onClick={() => onFilterCategory('All')}
                      className="text-xs text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer mt-1"
                    >
                      +{categoryBreakdown.length - 6} more <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Top Vendors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-800 mb-4">Top Vendors / Payees</p>
              {topVendors.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="space-y-3">
                  {topVendors.map((v, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{v.vendor}</p>
                          <p className="text-[11px] text-gray-400 truncate">{v.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-800 font-mono shrink-0">{fmtShort(v.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-800 mb-4">By Department</p>
              {departmentBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="space-y-3">
                  {departmentBreakdown.map((dept, i) => {
                    const pct = totalSpend > 0 ? ((dept.total / totalSpend) * 100).toFixed(0) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium truncate pr-2">{dept.department}</span>
                          <span className="text-xs font-bold text-gray-800 font-mono shrink-0">{fmtShort(dept.total)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.max(Number(pct), 2)}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{dept.count} txn · {pct}%</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-800 mb-4">Payment Status</p>
              <div className="space-y-3">
                {[
                  { key: 'Paid',           color: '#10b981' },
                  { key: 'Approved',       color: '#3b82f6' },
                  { key: 'Pending Review', color: '#f59e0b' },
                  { key: 'Flagged',        color: '#ef4444' },
                ].map(({ key, color }) => {
                  const data = statusBreakdown[key] || { count: 0, total: 0 };
                  const pct = totalSpend > 0 ? ((data.total / totalSpend) * 100).toFixed(0) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm text-gray-700">{key}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800 font-mono">{fmtShort(data.total)}</span>
                          <span className="text-[11px] text-gray-400 ml-1.5">({data.count})</span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(Number(pct), data.count > 0 ? 2 : 0)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
