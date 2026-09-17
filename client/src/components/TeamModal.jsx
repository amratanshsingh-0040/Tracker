import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Shield, User, Key, CheckCircle2, AlertCircle, Lock, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export default function TeamModal({ currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'password'

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state to add a new person
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state to change own password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide Name, Email, and Password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.addUser({
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: 'member'
      });
      setSuccess(`${name} has been added! They can now log in using their email & password.`);
      setName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to add user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${userName}? They will no longer be able to log in.`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      await api.deleteUser(id);
      setSuccess(`Access revoked for ${userName}.`);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to remove user.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const isCallerAdmin = currentUser?.role === 'admin';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Account &amp; Team Settings</h2>
              <p className="text-xs text-gray-400">Signed in as <span className="font-semibold text-gray-700">{currentUser?.name}</span> ({currentUser?.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          <button
            onClick={() => { setActiveTab('team'); setError(''); setSuccess(''); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members</span>
          </button>

          <button
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change My Password</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Status Banners */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Add Member Form (Admins Only) */}
              {isCallerAdmin ? (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-indigo-950">Add Authorized Person</h3>
                  </div>
                  <p className="text-xs text-indigo-700/70 mb-4">
                    Enter their details below. They can immediately log in from their own device without any code access.
                  </p>

                  <form onSubmit={handleAddUser} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priya Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Email</label>
                        <input
                          type="email"
                          required
                          placeholder="priya@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Adding…' : 'Add Person'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>You are signed in as a Team Member. Only Administrators can add or remove people.</span>
                </div>
              )}

              {/* Current Authorized Team Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Authorized Accounts ({users.length})
                  </h3>
                  <span className="text-[11px] text-gray-400">Total accounts with access</span>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-xs text-gray-400">Loading team members…</div>
                ) : (
                  <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-white">
                    {users.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      const isAdmin = u.role === 'admin';

                      return (
                        <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.2 rounded-full">
                                    You
                                  </span>
                                )}
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                                  isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isAdmin ? 'Admin' : 'Member'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center">
                            {isAdmin ? (
                              <span className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1" title="Administrator accounts cannot be removed">
                                <Shield className="w-3 h-3 text-indigo-500" />
                                <span>Protected</span>
                              </span>
                            ) : isCallerAdmin ? (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={`Revoke access for ${u.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="max-w-md mx-auto py-2">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900">Update Your Password</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose a strong password to keep your expense tracker private and secure.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="At least 4 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isChangingPass ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>🔒 All passwords encrypted using cryptographic PBKDF2 hashing</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
