import React, { useState, useEffect, useCallback } from 'react';
import { Clock, X, ChevronRight, Bell } from 'lucide-react';
import { api } from '../services/api';

// Banner that shows at the top of the page for un-dismissed pending reminders.
// Dismiss here only hides from banner (local state) — all reminders remain
// accessible via the bell icon in the Header at any time.
export default function PendingReminders({ reloadKey, onEdit }) {
  const [reminders, setReminders] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set()); // locally hidden from banner only

  const load = useCallback(() => {
    api.getPendingReminders()
      .then(r => setReminders(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load, reloadKey]);

  // Hide banner items locally (not a DB call — still visible in header bell)
  const hideFromBanner = (id, e) => {
    e?.stopPropagation();
    setHiddenIds(prev => new Set([...prev, id]));
  };

  const hideAllFromBanner = () => {
    setHiddenIds(new Set(reminders.map(r => r.id)));
  };

  const visible = reminders.filter(r => !hiddenIds.has(r.id));
  if (visible.length === 0) return null;

  const fmt = (n, c = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: c || 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">
            {visible.length} Pending Review Reminder{visible.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full font-semibold">
            Overdue 5+ days
          </span>
        </div>
        <button
          onClick={hideAllFromBanner}
          className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center space-x-1 cursor-pointer"
          title="Hide banner (still accessible from bell icon)"
        >
          <span>Hide all</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Items */}
      <div className="divide-y divide-amber-100">
        {visible.map((r) => {
          const days = daysSince(r.date);
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-amber-100 transition group">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.pay_to ? `To: ${r.pay_to} · ` : r.vendor ? `${r.vendor} · ` : ''}
                    {fmt(r.amount, r.currency)} ·{' '}
                    <span className="text-amber-600 font-semibold">{days} day{days !== 1 ? 's' : ''} overdue</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-3 shrink-0">
                <button
                  onClick={() => onEdit(r)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50"
                >
                  <span>Update</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => hideFromBanner(r.id, e)}
                  className="p-1 text-amber-400 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition cursor-pointer rounded"
                  title="Hide from banner (still in bell icon)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-[11px] text-amber-600">
          💡 Hover any row to <strong>Update</strong> the status, or hide from this banner.
          All reminders stay accessible via the 🔔 bell icon in the top-right.
        </p>
      </div>
    </div>
  );
}
