const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const wait = (ms = 700) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const resolveApiBaseUrl = () => {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (/^https?:\/\//i.test(base)) return base;

  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  if (!base) return origin;

  return `${origin}${base.startsWith('/') ? base : `/${base}`}`;
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

const request = async (path, { method = 'GET', body, params, headers } = {}) => {
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || 'Request failed';
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

const createRegistrationId = () => {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HWV4-${new Date().getFullYear()}-${suffix}`;
};

export const api = {
  baseUrl: API_BASE_URL,

  async login(credentials) {
    await wait();
    return {
      user: {
        name: credentials.name || 'Hack With Vizag Participant',
        email: credentials.email,
      },
      accessToken: 'placeholder-access-token',
    };
  },

  async register(payload) {
    await wait();
    return {
      user: {
        name: payload.name,
        email: payload.email,
      },
      accessToken: 'placeholder-access-token',
    };
  },

  async saveRegistrationDraft(payload) {
    await wait(450);
    return { ok: true, draft: payload };
  },

  async submitRegistration(payload) {
    await wait(1000);
    return {
      registrationId: createRegistrationId(),
      status: 'under_review',
      submissionDate: new Date().toISOString(),
      payload,
    };
  },

  async downloadAcknowledgement() {
    await wait(500);
    return { ok: true };
  },

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

  async logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  async getAdminProfile() {
    return request('/auth/profile');
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

  async getAdminAnalytics() {
    return request('/admin/analytics');
  },

  async exportAdminData(params) {
    return downloadFile('/admin/export', params);
  },

  async submitInquiry(payload) {
    return request('/inquiry', {
      method: 'POST',
      body: payload,
    });
  },
};
