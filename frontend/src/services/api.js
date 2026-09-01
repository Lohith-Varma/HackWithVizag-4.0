const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const resolveApiBaseUrl = () => {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (/^https?:\/\//i.test(base)) return base;

  const origin = typeof window === 'undefined' ? 'https://hackwithvizag-4-0.onrender.com' : window.location.origin;
  if (!base) return origin;

  return `${origin}${base.startsWith('/') ? base : `/${base}`}`;
};

export const buildAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = resolveApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

const buildUrl = (path, params) => {
  const base = resolveApiBaseUrl();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};


const request = async (path, { method = 'GET', body, params, headers, isFormData = false } = {}) => {
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: {
      ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.errors?.[0]?.message || payload?.message || (typeof payload === 'string' ? payload : 'Request failed');
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.data ?? payload;
};

const downloadFile = async (path, params) => {
  const response = await fetch(buildUrl(path, params), {
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Export failed');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `hack-with-vizag-export.${params?.format || 'csv'}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const api = {
  baseUrl: API_BASE_URL,

  // Event Config APIs
  async getEventConfig() {
    return request('/event');
  },

  async getAdminEvents() {
    return request('/event/admin');
  },

  async updateEventConfig(id, payload) {
    return request(`/event/admin/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async createEventConfig(payload) {
    return request('/event/admin', {
      method: 'POST',
      body: payload,
    });
  },

  async setActiveEventConfig(id) {
    return request(`/event/admin/${id}/active`, {
      method: 'PATCH',
    });
  },

  async deleteEventConfig(id) {
    return request(`/event/admin/${id}`, {
      method: 'DELETE',
    });
  },

  // Problem Statements APIs
  async getProblemStatements(params) {
    return request('/problem-statements', { params });
  },

  async getProblemStatement(id) {
    return request(`/problem-statements/${id}`);
  },

  async getAdminProblemStatements() {
    return request('/problem-statements/admin');
  },


  async createProblemStatement(payload) {
    return request('/problem-statements/admin', {
      method: 'POST',
      body: payload,
    });
  },

  async updateProblemStatement(id, payload) {
    return request(`/problem-statements/admin/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteProblemStatement(id) {
    return request(`/problem-statements/admin/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderProblemStatements(items) {
    return request('/problem-statements/admin/reorder', {
      method: 'PATCH',
      body: { items },
    });
  },

  // Auth APIs
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  async register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  async logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  async adminLogout() {
    return request('/auth/logout', { method: 'POST' });
  },

  async getProfile() {
    return request('/auth/profile');
  },

  async getAdminProfile() {
    const result = await request('/auth/profile');
    if (result.user?.role !== 'admin') {
      const error = new Error('Forbidden: Admin role required');
      error.status = 403;
      throw error;
    }
    return result;
  },

  // Participant Team & Dashboard APIs
  async getParticipantDashboard() {
    return request('/dashboard/participant');
  },

  async getMyTeam() {
    return request('/teams/my-team');
  },

  async getTeam(id) {
    return request(`/teams/${id}`);
  },

  // Registration Submission API (Supports Multi-part File Uploads)
  async submitRegistration(registrationData) {
    const formData = new FormData();
    
    // Copy files out to avoid stringifying circular/binary objects
    const pptFile = registrationData.uploads?.pptFile;
    const supportingDocFile = registrationData.uploads?.supportingDocFile;

    const payloadToSerialize = {
      ...registrationData,
      uploads: {
        ...registrationData.uploads,
        pptFile: undefined,
        supportingDocFile: undefined,
      },
    };

    formData.append('payload', JSON.stringify(payloadToSerialize));

    if (pptFile && pptFile instanceof File) {
      formData.append('pptFile', pptFile);
    }
    if (supportingDocFile && supportingDocFile instanceof File) {
      formData.append('supportingDocFile', supportingDocFile);
    }

    return request('/submissions/full', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async saveRegistrationDraft(payload) {
    // Save locally or sync draft
    return { ok: true, draft: payload };
  },

  async downloadAcknowledgement() {
    // Generate text acknowledgement blob locally or fetch
    const content = `HACK WITH VIZAG 4.0 - REGISTRATION ACKNOWLEDGEMENT\n\nDate: ${new Date().toLocaleDateString()}\nStatus: Verified\n\nThank you for registering. Keep this document for your records.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HackWithVizag-Acknowledgement.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { ok: true };
  },

  // Admin Portal APIs
  async adminLogin(credentials) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (result.user?.role !== 'admin') {
      await request('/auth/logout', { method: 'POST' }).catch(() => {});
      const error = new Error('Only admin users can access the admin portal.');
      error.status = 403;
      throw error;
    }

    return result;
  },

  async getAdminDashboard() {
    return request('/admin/dashboard');
  },

  async getAdminTeams(params) {
    return request('/admin/teams', { params });
  },

  async getAdminTeam(id) {
    return request(`/admin/team/${id}`);
  },

  async updateAdminTeamStatus(id, payload) {
    return request(`/admin/team/${id}/status`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async updateAdminTeamRemarks(id, remarks) {
    return request(`/admin/team/${id}/remarks`, {
      method: 'PATCH',
      body: { remarks },
    });
  },

  async updateAdminTeamDetails(id, payload) {
    return request(`/admin/team/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteAdminTeam(id) {
    return request(`/admin/team/${id}`, {
      method: 'DELETE',
    });
  },

  async sendAdminTeamEmail(id, payload) {
    return request(`/admin/team/${id}/email`, {
      method: 'POST',
      body: payload,
    });
  },

  async downloadAdminTeamSubmission(id) {
    return request(`/admin/team/${id}/download`);
  },

  async getAdminAnalytics() {
    return request('/admin/analytics');
  },


  async exportAdminData(params) {
    return downloadFile('/admin/export', params);
  },

  // Offline Registration APIs
  async getOfflineRegistrationEligibility(teamId) {
    return request(`/offline-registration/team/${teamId}/eligibility`);
  },

  async getOfflineRegistration(teamId) {
    return request(`/offline-registration/team/${teamId}`);
  },

  async saveOfflineRegistration(teamId, payload) {
    return request(`/offline-registration/team/${teamId}`, {
      method: 'POST',
      body: payload,
    });
  },

  async completeOfflineRegistration(teamId) {
    return request(`/offline-registration/team/${teamId}/complete`, {
      method: 'POST',
    });
  },

  async submitInquiry(payload) {
    return request('/inquiry', {
      method: 'POST',
      body: payload,
    });
  },

  async subscribeNotification(payload) {
    return request('/inquiry/notify', {
      method: 'POST',
      body: payload,
    });
  },

  async getNotificationLeads(params) {
    return request('/admin/leads', { params });
  },

  async exportNotificationLeads() {
    return downloadFile('/admin/leads/export');
  },

  async deleteNotificationLead(id) {
    return request(`/admin/leads/${id}`, {
      method: 'DELETE',
    });
  },

  // Event Config APIs
  async getEventConfig() {
    try {
      return await request('/events');
    } catch {
      return await request('/event');
    }
  },

  async getAdminEvents() {
    try {
      return await request('/events/admin');
    } catch {
      return await request('/event/admin');
    }
  },

  async createEvent(payload) {
    return request('/events/admin', {
      method: 'POST',
      body: payload,
    });
  },

  async updateEventConfig(id, payload) {
    try {
      return await request(`/events/admin/${id}`, {
        method: 'PUT',
        body: payload,
      });
    } catch {
      return await request(`/event/admin/${id}`, {
        method: 'PUT',
        body: payload,
      });
    }
  },

  async setActiveEvent(id) {
    return request(`/events/admin/${id}/active`, {
      method: 'PATCH',
    });
  },

  async deleteEvent(id) {
    return request(`/events/admin/${id}`, {
      method: 'DELETE',
    });
  },

  // User Profile & Password Settings APIs
  async updateProfile(payload) {
    return request('/auth/profile', {
      method: 'PUT',
      body: payload,
    });
  },

  async changePassword(payload) {
    return request('/auth/change-password', {
      method: 'POST',
      body: payload,
    });
  },
};
