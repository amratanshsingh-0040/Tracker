import React from 'react';
import { DollarSign, TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react';

export default function DashboardStats({ stats, onFilterCategory, onFilterMissingReceipts }) {
  if (!stats) return null;

  const { totalSpend = 0, monthlyBurn = 0, salariesSpend = 0, recurringMonthly = 0, missingReceiptCount = 0, totalCount = 0 } = stats;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const cards = [
    {
      label: 'Total Expenses',
      value: fmt(totalSpend),
      sub: `${totalCount} transactions`,
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'This Month',
      value: fmt(monthlyBurn),
      sub: 'Current month spend',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Salaries & Payroll',
      value: fmt(salariesSpend),
      sub: 'Click to filter',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onClick: () => onFilterCategory('Salaries & Payroll'),
    },
    {
      label: 'Subscriptions & Recurring',
      value: `${fmt(recurringMonthly)}/mo`,
      sub: 'Monthly recurring costs',
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Missing Receipts',
      value: missingReceiptCount === 0 ? 'All clear ✓' : `${missingReceiptCount} missing`,
      sub: missingReceiptCount === 0 ? '100% compliance' : 'Click to review',
      icon: AlertCircle,
      color: missingReceiptCount === 0 ? 'text-emerald-600' : 'text-amber-600',
      bg: missingReceiptCount === 0 ? 'bg-emerald-50' : 'bg-amber-50',
      onClick: missingReceiptCount > 0 ? onFilterMissingReceipts : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            onClick={card.onClick}
            className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${card.onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            <div className="text-[11px] text-gray-400 mt-1">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
