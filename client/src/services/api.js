const API_BASE = '/api';

const TOKEN_KEY = 'apexpay_auth_token';

export const api = {
  // Token management
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getAuthHeaders(extraHeaders = {}) {
    const token = this.getToken();
    const headers = { ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Auth endpoints
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to sign in. Check email and password.');
    }
    this.setToken(data.token);
    return data;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (e) {}
    this.clearToken();
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to change password');
    }
    return data;
  },

  async resetPassword(email, recoveryKey, newPassword) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, recoveryKey, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  },

  async getMe() {
    const token = this.getToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      this.clearToken();
      return null;
    }
    const data = await res.json();
    return data.user || null;
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },

  async addUser({ name, email, password, role = 'member' }) {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to add team member');
    }
    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to remove team member');
    }
    return data;
  },

  // Expense endpoints (protected)
  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        params.append(key, value);
      }
    });
    const res = await fetch(`${API_BASE}/expenses?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async getStats(period = '1m') {
    const res = await fetch(`${API_BASE}/expenses/stats?period=${period}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch expense statistics');
    return res.json();
  },

  async getExpense(id) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch expense');
    return res.json();
  },

  async createExpense(formData) {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: this.getAuthHeaders(), // fetch sets multipart boundary automatically
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create expense');
    }
    return res.json();
  },

  async updateExpense(id, formData) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update expense');
    }
    return res.json();
  },

  async deleteExpense(id) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete expense');
    }
    return res.json();
  },

  getReceiptUrl(filename) {
    if (!filename) return null;
    const token = this.getToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/receipts/${encodeURIComponent(filename)}${query}`;
  },

  getReceiptDownloadUrl(filename) {
    if (!filename) return null;
    const token = this.getToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/receipts/${encodeURIComponent(filename)}/download${query}`;
  },

  getExportCsvUrl() {
    const token = this.getToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/expenses/export/csv${query}`;
  },

  async getPendingReminders() {
    const res = await fetch(`${API_BASE}/expenses/pending-reminders`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) return { data: [], count: 0 };
    return res.json();
  },

  async dismissReminder(id) {
    const res = await fetch(`${API_BASE}/expenses/${id}/dismiss-reminder`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return res.json();
  }
};
