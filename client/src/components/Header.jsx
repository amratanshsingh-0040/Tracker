import React, { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Download, RefreshCw, AlertTriangle, Bell, X, Clock, ChevronRight, Users, LogOut } from 'lucide-react';
import { api } from '../services/api';

export default function Header({
  stats,
  onNewExpense,
  onRefresh,
  loading,
  onFilterMissingReceipts,
  onEditExpense,
  reminderReloadKey,
  currentUser,
  onOpenTeam,
  onLogout
}) {
  const missingCount = stats?.missingReceiptCount || 0;

  // Reminders bell state
  const [reminders, setReminders] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const panelRef = useRef(null);

  // Load ALL pending reminders (5+ days, not filtered by dismissed)
  const loadReminders = () => {
    api.getPendingReminders()
      .then(r => setReminders(r.data || []))
      .catch(() => {});
  };

  useEffect(() => { loadReminders(); }, [reminderReloadKey]);

  // Close panel on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const fmt = (n, c = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: c || 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  const handleMarkPaid = (exp) => {
    setBellOpen(false);
    if (onEditExpense) onEditExpense(exp);
  };

  const handleDismissFromPanel = async (id) => {
    await api.dismissReminder(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Expense Tracker</h1>
              <p className="text-xs text-gray-400">Company Cost Management</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {missingCount > 0 && (
              <button
                onClick={onFilterMissingReceipts}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{missingCount} missing receipt{missingCount > 1 ? 's' : ''}</span>
              </button>
            )}

            {/* ── Bell / Reminders ── */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => { setBellOpen(o => !o); loadReminders(); }}
                className={`relative p-2 rounded-lg transition cursor-pointer ${
                  reminders.length > 0
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Pending Reminders"
              >
                <Bell className="w-4 h-4" />
                {reminders.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {reminders.length > 9 ? '9+' : reminders.length}
                  </span>
                )}
              </button>

              {/* Reminders Panel */}
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-800">Pending Reminders</span>
                      {reminders.length > 0 && (
                        <span className="text-xs text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          {reminders.length}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reminder Items */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {reminders.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Bell className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">All clear!</p>
                        <p className="text-xs text-gray-400 mt-1">No expenses have been pending for 5+ days.</p>
                      </div>
                    ) : (
                      reminders.map((r) => {
                        const days = daysSince(r.date);
                        return (
                          <div key={r.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50 group transition">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${days >= 14 ? 'bg-red-400' : 'bg-amber-400'}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {r.pay_to ? `To: ${r.pay_to}` : r.vendor || r.category}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs font-bold text-gray-700">{fmt(r.amount, r.currency)}</span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    days >= 14 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {days} day{days !== 1 ? 's' : ''} pending
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 ml-2 shrink-0 mt-1">
                              <button
                                onClick={() => handleMarkPaid(r)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer flex items-center gap-0.5"
                              >
                                Update
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDismissFromPanel(r.id)}
                                className="p-1 text-gray-300 hover:text-gray-500 transition cursor-pointer rounded"
                                title="Dismiss reminder"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  {reminders.length > 0 && (
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400">
                        Click <strong>Update</strong> to change status · <strong>✕</strong> to dismiss permanently
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team Management button */}
            <button
              onClick={onOpenTeam}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition cursor-pointer"
              title="Manage Authorized People"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Team</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            <a
              href={api.getExportCsvUrl()}
              target="_blank"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>

            <button
              onClick={onNewExpense}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>

            {/* Current user pill & Log out */}
            {currentUser && (
              <div className="flex items-center pl-2 border-l border-gray-200 space-x-1.5">
                <div
                  className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700"
                  title={`Signed in as ${currentUser.email}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-gray-800">{currentUser.name}</span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
