import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { api } from '../services/api';

export default function ReceiptViewerModal({ expense, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!expense?.receipt_filename) return null;

  const receiptUrl = api.getReceiptUrl(expense.receipt_filename);
  const downloadUrl = api.getReceiptDownloadUrl(expense.receipt_filename);
  const isPdf = (expense.receipt_mimetype === 'application/pdf') || expense.receipt_filename.endsWith('.pdf');

  const fmt = (n, c = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: c || 'INR' }).format(n || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{expense.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {expense.vendor && <span>{expense.vendor} · </span>}
              <span className="font-medium text-emerald-600">{fmt(expense.amount, expense.currency)}</span>
              <span> · {expense.date}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4 shrink-0">
            {/* Zoom controls (images only) */}
            {!isPdf && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 mr-1">
                <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} className="p-1.5 hover:bg-white rounded-md transition text-gray-600">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-500 px-1">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(s + 0.25, 3))} className="p-1.5 hover:bg-white rounded-md transition text-gray-600">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-white rounded-md transition text-gray-600">
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <ExternalLink className="w-4 h-4" />
            </a>

            <a href={downloadUrl} download
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
          {isPdf ? (
            <iframe src={receiptUrl} className="w-full h-full rounded-xl border border-gray-200 bg-white" title="Receipt PDF" />
          ) : (
            <div
              className="transition-transform duration-150 flex items-center justify-center"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: 'center center' }}
            >
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-lg border border-gray-200 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">{expense.receipt_original_name || expense.receipt_filename}</span>
          {expense.receipt_size && <span>{Math.round(expense.receipt_size / 1024)} KB</span>}
        </div>
      </div>
    </div>
  );
}
