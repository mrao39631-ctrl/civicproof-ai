// CivicProof AI API Client

const getAuthHeaders = () => {
  const token = localStorage.getItem("civicproof_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const data = await res.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch("/api/auth/me", {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getDemoUsers() {
    const res = await fetch("/api/auth/demo-users");
    return handleResponse(res);
  },

  // Complaints
  async getStats() {
    const res = await fetch("/api/complaints/stats/summary", {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async listComplaints(filters = {}) {
    const query = new URLSearchParams();
    if (filters.category) query.append("category", filters.category);
    if (filters.status) query.append("status", filters.status);
    if (filters.search) query.append("search", filters.search);
    if (filters.my_only) query.append("my_only", "true");

    const res = await fetch(`/api/complaints?${query.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async getComplaint(id) {
    const res = await fetch(`/api/complaints/${id}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async createComplaint(formData) {
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadBeforeEvidence(complaintId, formData) {
    const res = await fetch(`/api/complaints/${complaintId}/evidence/before`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadAfterEvidence(complaintId, formData) {
    const res = await fetch(`/api/complaints/${complaintId}/evidence/after`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse(res);
  },

  async triggerAiVerification(complaintId, payload = {}) {
    const res = await fetch(`/api/complaints/${complaintId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async submitReporterDecision(complaintId, decision, comments = "") {
    const res = await fetch(`/api/complaints/${complaintId}/reporter-decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ decision, feedback_comments: comments })
    });
    return handleResponse(res);
  },

  // Admin
  async getDisputes() {
    const res = await fetch("/api/admin/disputes", {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  async adminOverride(complaintId, action, notes) {
    const res = await fetch(`/api/admin/complaints/${complaintId}/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action, notes })
    });
    return handleResponse(res);
  },

  async getAuditLogs(limit = 100) {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  }
};
