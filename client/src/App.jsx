import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FilterBar from './components/FilterBar';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFormModal from './components/ExpenseFormModal';
import ReceiptViewerModal from './components/ReceiptViewerModal';
import PendingReminders from './components/PendingReminders';
import Login from './components/Login';
import TeamModal from './components/TeamModal';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  // Quick stats for header badge (always current)
  const [missingCount, setMissingCount] = useState(0);

  const [filters, setFilters] = useState({
    search: '', category: 'All', department: 'All', status: 'All',
    type: 'All', has_receipt: 'All', sortBy: 'date', order: 'DESC'
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Reload counter to trigger dashboard refresh after mutations
  const [reloadKey, setReloadKey] = useState(0);

  // Check existing session token on mount
  useEffect(() => {
    api.getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadExpenses = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const expRes = await api.getExpenses(filters);
      setExpenses(expRes.data || []);
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('sign in')) {
        setCurrentUser(null);
      } else {
        setError('Could not connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  // Fetch missing count separately for header
  useEffect(() => {
    if (!currentUser) return;
    api.getExpenses({ has_receipt: 'no' })
      .then(r => setMissingCount(r.count || 0))
      .catch(() => {});
  }, [reloadKey, currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadExpenses();
    }
  }, [loadExpenses, currentUser]);

  const handleSort = (col) => {
    setFilters(prev => ({
      ...prev,
      sortBy: col,
      order: prev.sortBy === col && prev.order === 'DESC' ? 'ASC' : 'DESC'
    }));
  };

  const handleReset = () => {
    setFilters({
      search: '', category: 'All', department: 'All', status: 'All',
      type: 'All', has_receipt: 'All', sortBy: 'date', order: 'DESC'
    });
  };

  const handleSave = (msg = 'Expense saved successfully!') => {
    setIsFormOpen(false);
    setEditingExpense(null);
    setReloadKey(k => k + 1);
    loadExpenses();
    showToast(msg);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      setReloadKey(k => k + 1);
      loadExpenses();
      showToast('Expense deleted.');
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleFilterMissingReceipts = () => {
    setFilters(p => ({ ...p, has_receipt: 'no' }));
    showToast('Showing expenses missing receipts.');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setExpenses([]);
    showToast('Signed out safely.');
  };

  // 1. Initial auth check loader
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Checking secure session…</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login screen
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setReloadKey(k => k + 1);
          showToast(`Welcome back, ${user.name}!`);
        }}
      />
    );
  }

  // 3. Authenticated: Render App
  const stats = {
    missingReceiptCount: missingCount,
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header with user profile and team management */}
      <Header
        stats={stats}
        onNewExpense={() => { setEditingExpense(null); setIsFormOpen(true); }}
        onRefresh={() => { setReloadKey(k => k + 1); loadExpenses(); }}
        loading={loading}
        onFilterMissingReceipts={handleFilterMissingReceipts}
        onEditExpense={(exp) => { setEditingExpense(exp); setIsFormOpen(true); }}
        reminderReloadKey={reloadKey}
        currentUser={currentUser}
        onOpenTeam={() => setIsTeamOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Error Banner */}
        {error && (
          <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-600">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => { setReloadKey(k => k + 1); loadExpenses(); }}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending Reminders */}
        <PendingReminders
          reloadKey={reloadKey}
          onEdit={(exp) => { setEditingExpense(exp); setIsFormOpen(true); }}
        />

        {/* Analytics Dashboard with period selector */}
        <Dashboard
          key={reloadKey}
          onFilterCategory={(cat) => setFilters(p => ({ ...p, category: cat }))}
          onFilterMissingReceipts={() => setFilters(p => ({ ...p, has_receipt: 'no' }))}
        />

        {/* Separator */}
        <div className="flex items-center space-x-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expense Ledger</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Filters */}
        <FilterBar filters={filters} setFilters={setFilters} onReset={handleReset} />

        {/* Expenses Table */}
        <ExpenseTable
          expenses={expenses}
          loading={loading}
          onViewReceipt={setViewingReceipt}
          onEdit={(exp) => { setEditingExpense(exp); setIsFormOpen(true); }}
          onDelete={handleDelete}
          onAttachReceipt={(exp) => { setEditingExpense(exp); setIsFormOpen(true); }}
          onSort={handleSort}
        />

      </main>

      {/* Team Management Modal (In-App UI) */}
      {isTeamOpen && (
        <TeamModal
          currentUser={currentUser}
          onClose={() => setIsTeamOpen(false)}
        />
      )}

      {/* Add / Edit Expense Modal */}
      {isFormOpen && (
        <ExpenseFormModal
          expense={editingExpense}
          onClose={() => { setIsFormOpen(false); setEditingExpense(null); }}
          onSave={() => handleSave(editingExpense ? 'Expense updated!' : 'Expense added!')}
        />
      )}

      {/* Receipt Viewer Modal */}
      {viewingReceipt && (
        <ReceiptViewerModal expense={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
