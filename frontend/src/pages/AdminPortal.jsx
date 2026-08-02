import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiGrid,
  FiLock,
  FiLogOut,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import './AdminPortal.css';

const statusOptions = ['pending', 'under_review', 'selected', 'rejected'];

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  selected: 'Selected',
  rejected: 'Rejected',
  draft: 'Draft',
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
  { id: 'teams', label: 'Teams', icon: FiUsers },
  { id: 'submissions', label: 'Submissions', icon: FiFileText },
  { id: 'screening', label: 'Screening', icon: FiSliders },
  { id: 'selected', label: 'Selected Teams', icon: FiCheckCircle },
  { id: 'rejected', label: 'Rejected Teams', icon: FiXCircle },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];

const emptyDashboard = {
  totalRegisteredTeams: 0,
  totalRegisteredParticipants: 0,
  totalSubmittedProjects: 0,
  teamsUnderReview: 0,
  selectedTeams: 0,
  rejectedTeams: 0,
};

const formatDate = (value) => {
  if (!value) return 'Not submitted';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatBytes = (value) => {
  if (!value) return '';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const backendAssetBase = () => api.baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const buildAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${backendAssetBase()}${url.startsWith('/') ? url : `/${url}`}`;
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') || 'Not provided';

function AdminLogin({ onLogin, onToast }) {
  const [form, setForm] = useState({ email: 'hackwithivzag@nsrit.edu.in', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    try {
      const result = await api.adminLogin(form);
      onLogin(result.user);
      onToast({ type: 'success', message: 'Admin login successful.' });
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Admin login failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-panel">
        <div className="admin-brand-lock">
          <FiShield />
        </div>
        <span className="admin-eyebrow">Organizer Access</span>
        <h1>Admin Login</h1>
        <p>Sign in with your organizer account.</p>

        <form className="admin-auth-form" onSubmit={submit}>
          <label className="admin-field">
            <span>Email Address</span>
            <FiMail />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="admin@example.com"
            />
            {errors.email && <small>{errors.email}</small>}
          </label>

          <label className="admin-field">
            <span>Password</span>
            <FiLock />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Admin password"
            />
            {errors.password && <small>{errors.password}</small>}
          </label>

          <button type="submit" className="admin-primary" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Login as Admin'}
          </button>
        </form>
      </section>
    </main>
  );
}

function StatusBadge({ status }) {
  const value = status || 'pending';
  return <span className={`admin-status admin-status-${value}`}>{statusLabels[value] || value}</span>;
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <article className="admin-metric">
      <span><Icon /> {label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

function BarList({ title, rows }) {
  const max = Math.max(...(rows || []).map((row) => row.count), 1);
  return (
    <section className="admin-panel">
      <div className="admin-panel-title">
        <h3>{title}</h3>
      </div>
      <div className="admin-chart-list">
        {(rows || []).length ? rows.map((row) => (
          <div className="admin-chart-row" key={row.label}>
            <div>
              <span>{row.label || 'Not specified'}</span>
              <strong>{row.count}</strong>
            </div>
            <div className="admin-bar"><span style={{ width: `${Math.max((row.count / max) * 100, 4)}%` }} /></div>
          </div>
        )) : <p className="admin-empty-inline">No data available.</p>}
      </div>
    </section>
  );
}

function TeamTable({
  teams,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
  onStatus,
  showActions = true,
  isLoading,
}) {
  const allChecked = teams.length > 0 && teams.every((team) => selectedIds.includes(team.id));

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-check-col">
              <input type="checkbox" checked={allChecked} onChange={onToggleAll} aria-label="Select all teams" />
            </th>
            <th>Team Name</th>
            <th>Team Leader</th>
            <th>Members</th>
            <th>College</th>
            <th>Department</th>
            <th>Submission Date</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(team.id)}
                  onChange={() => onToggle(team.id)}
                  aria-label={`Select ${team.teamName}`}
                />
              </td>
              <td><strong>{team.teamName}</strong></td>
              <td>
                <span>{team.leader?.name || 'Not assigned'}</span>
                <small>{team.leader?.email || ''}</small>
              </td>
              <td>{team.memberCount || team.members?.length || 0}</td>
              <td>{team.college || 'Not provided'}</td>
              <td>{team.department || 'Not provided'}</td>
              <td>{formatDate(team.submissionDate)}</td>
              <td><StatusBadge status={team.status || team.currentStatus} /></td>
              {showActions && (
                <td>
                  <div className="admin-row-actions">
                    <button type="button" title="View details" onClick={() => onOpen(team.id)}>
                      <FiEye />
                    </button>
                    <button type="button" title="Mark selected" onClick={() => onStatus(team.id, 'selected')}>
                      <FiCheckCircle />
                    </button>
                    <button type="button" title="Mark rejected" onClick={() => onStatus(team.id, 'rejected')}>
                      <FiXCircle />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {!teams.length && (
            <tr>
              <td colSpan={showActions ? 9 : 8}>
                <div className="admin-empty-state">{isLoading ? 'Loading teams...' : 'No teams match the current view.'}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TeamDetails({ team, onBack, onStatus, onRemarks, isSaving }) {
  const [remarks, setRemarks] = useState(team?.remarks || '');

  if (!team) {
    return (
      <section className="admin-panel">
        <div className="admin-empty-state">Select a team to review details.</div>
      </section>
    );
  }

  const project = team.project || {};
  const pptUrl = buildAssetUrl(project.pptFile?.url);

  return (
    <div className="admin-details">
      <button type="button" className="admin-link-button" onClick={onBack}>
        <FiChevronLeft /> Back to teams
      </button>

      <section className="admin-panel admin-detail-hero">
        <div>
          <span className="admin-eyebrow">Team Details</span>
          <h2>{team.teamName}</h2>
          <p>{project.title || 'No project title submitted yet.'}</p>
        </div>
        <div className="admin-detail-actions">
          <StatusBadge status={team.status} />
          <button type="button" className="admin-success" onClick={() => onStatus(team.id, 'selected')}>Select</button>
          <button type="button" className="admin-danger" onClick={() => onStatus(team.id, 'rejected')}>Reject</button>
        </div>
      </section>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h3>Team Information</h3>
          </div>
          <div className="admin-info-grid">
            <span>Leader</span><strong>{team.leader?.name || 'Not assigned'}</strong>
            <span>Email</span><strong>{team.leader?.email || 'Not provided'}</strong>
            <span>Phone</span><strong>{team.leader?.phone || 'Not provided'}</strong>
            <span>College</span><strong>{team.college || 'Not provided'}</strong>
            <span>Department</span><strong>{team.department || 'Not provided'}</strong>
            <span>Submission Date</span><strong>{formatDate(team.submissionDate)}</strong>
            <span>Reviewed By</span><strong>{team.reviewedBy?.name || 'Not reviewed'}</strong>
            <span>Reviewed At</span><strong>{formatDate(team.reviewedAt)}</strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h3>Screening</h3>
          </div>
          <label className="admin-plain-field">
            <span>Status</span>
            <select value={team.status || 'pending'} onChange={(event) => onStatus(team.id, event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label className="admin-plain-field">
            <span>Remarks</span>
            <textarea rows="6" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Excellent innovation." />
          </label>
          <button type="button" className="admin-primary" onClick={() => onRemarks(team.id, remarks)} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Remarks'}
          </button>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Project Information</h3>
        </div>
        <div className="admin-info-grid wide">
          <span>Project Title</span><strong>{firstValue(project.title)}</strong>
          <span>Theme</span><strong>{firstValue(project.theme)}</strong>
          <span>Technology Stack</span><strong>{firstValue(project.technologyStack)}</strong>
          <span>GitHub Link</span><strong>{project.githubRepository ? <a href={project.githubRepository} target="_blank" rel="noreferrer">{project.githubRepository}</a> : 'Not provided'}</strong>
          <span>Demo Video</span><strong>{project.demoVideoUrl ? <a href={project.demoVideoUrl} target="_blank" rel="noreferrer">{project.demoVideoUrl}</a> : 'Not provided'}</strong>
          <span>Project Abstract</span><p>{firstValue(project.abstract)}</p>
          <span>Problem Statement</span><p>{firstValue(project.problemStatement)}</p>
          <span>Innovation Summary</span><p>{firstValue(project.innovationSummary)}</p>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Uploaded PPT</h3>
        </div>
        {pptUrl ? (
          <div className="admin-ppt-row">
            <div>
              <strong>{project.pptFile?.originalName || 'Project PPT'}</strong>
              <span>{project.pptFile?.mimeType || 'Presentation'} {formatBytes(project.pptFile?.size)}</span>
            </div>
            <div className="admin-detail-actions">
              <a className="admin-secondary" href={pptUrl} target="_blank" rel="noreferrer"><FiEye /> View PPT</a>
              <a className="admin-secondary" href={pptUrl} download><FiDownload /> Download PPT</a>
              <a className="admin-secondary" href={pptUrl} target="_blank" rel="noreferrer"><FiExternalLink /> New Tab</a>
            </div>
          </div>
        ) : (
          <div className="admin-empty-state">No PPT uploaded for this team.</div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Member Details</h3>
        </div>
        <div className="admin-member-grid">
          {(team.members || []).map((member) => (
            <article className="admin-member" key={member._id || member.id || member.email}>
              <strong>{member.name}</strong>
              <span>{member.email}</span>
              <span>{member.phone || 'No phone'}</span>
              <StatusBadge status={member.status} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [analytics, setAnalytics] = useState(null);
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', sort: 'newest', page: 1, limit: 10 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const effectiveFilters = useMemo(() => {
    if (activeView === 'selected') return { ...filters, status: 'selected' };
    if (activeView === 'rejected') return { ...filters, status: 'rejected' };
    if (activeView === 'screening') return filters;
    if (activeView === 'submissions') return filters;
    return filters;
  }, [activeView, filters]);

  const loadDashboard = useCallback(async () => {
    const result = await api.getAdminDashboard();
    setDashboard(result.cards || emptyDashboard);
  }, []);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getAdminTeams(effectiveFilters);
      setTeams(result.teams || []);
      setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      setSelectedIds([]);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to load teams.' });
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFilters]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getAdminAnalytics();
      setAnalytics(result);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to load analytics.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getAdminProfile()
      .then((result) => {
        if (result.user?.role !== 'admin') throw new Error('Forbidden');
        setUser(result.user);
      })
      .catch(() => setUser(null))
      .finally(() => setIsChecking(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const timeout = window.setTimeout(() => {
      loadDashboard().catch((error) => setToast({ type: 'error', message: error.message || 'Unable to load dashboard.' }));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [user, loadDashboard]);

  useEffect(() => {
    if (!user) return;
    if (['teams', 'screening', 'selected', 'rejected', 'submissions'].includes(activeView)) {
      const timeout = window.setTimeout(() => {
        loadTeams();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [user, activeView, loadTeams]);

  useEffect(() => {
    if (user && activeView === 'analytics') {
      const timeout = window.setTimeout(() => {
        loadAnalytics();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [user, activeView, loadAnalytics]);

  const switchView = (view) => {
    setActiveView(view);
    setSelectedTeam(null);
    setFilters((current) => ({ ...current, page: 1 }));
  };

  const openTeam = async (id) => {
    setIsLoading(true);
    try {
      const result = await api.getAdminTeam(id);
      setSelectedTeam(result.team);
      setActiveView('details');
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to open team.' });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrent = () => {
    if (activeView === 'dashboard') loadDashboard();
    if (activeView === 'analytics') loadAnalytics();
    if (['teams', 'screening', 'selected', 'rejected', 'submissions'].includes(activeView)) loadTeams();
    if (activeView === 'details' && selectedTeam?.id) openTeam(selectedTeam.id);
  };

  const updateTeamStatus = async (id, status, remarks) => {
    if (!window.confirm(`Mark this team as ${statusLabels[status]}?`)) return;
    setIsSaving(true);
    try {
      const result = await api.updateAdminTeamStatus(id, { status, remarks });
      setToast({ type: 'success', message: `Team marked ${statusLabels[status]}.` });
      setSelectedTeam((current) => (current?.id === id ? result.team : current));
      await Promise.all([loadDashboard(), loadTeams()]);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update status.' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveRemarks = async (id, remarks) => {
    setIsSaving(true);
    try {
      const result = await api.updateAdminTeamRemarks(id, remarks);
      setSelectedTeam(result.team);
      setToast({ type: 'success', message: 'Remarks saved.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to save remarks.' });
    } finally {
      setIsSaving(false);
    }
  };

  const bulkStatus = async (status) => {
    if (!selectedIds.length) {
      setToast({ type: 'info', message: 'Select at least one team first.' });
      return;
    }
    if (!window.confirm(`Apply ${statusLabels[status]} to ${selectedIds.length} teams?`)) return;

    setIsSaving(true);
    try {
      await Promise.all(selectedIds.map((id) => api.updateAdminTeamStatus(id, { status })));
      setToast({ type: 'success', message: `${selectedIds.length} teams updated.` });
      await Promise.all([loadDashboard(), loadTeams()]);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Bulk update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const bulkExport = () => {
    if (!selectedIds.length) {
      setToast({ type: 'info', message: 'Select at least one team first.' });
      return;
    }
    exportData('teams', 'csv', effectiveFilters.status, selectedIds.join(','));
  };

  const exportData = async (scope = 'teams', format = 'csv', status, ids) => {
    try {
      await api.exportAdminData({ scope, format, status, ids });
      setToast({ type: 'success', message: 'Export started.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Export failed.' });
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      const ids = teams.map((team) => team.id);
      return ids.every((id) => current.includes(id)) ? [] : ids;
    });
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setActiveView('dashboard');
    setToast({ type: 'info', message: 'Logged out.' });
  };

  if (isChecking) {
    return <main className="admin-loading"><FiRefreshCw /> Checking admin session...</main>;
  }

  if (!user) {
    return (
      <>
        <AdminLogin onLogin={setUser} onToast={setToast} />
        <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      </>
    );
  }

  const renderDashboard = () => (
    <div className="admin-stack">
      <div className="admin-page-title">
        <div>
          <span className="admin-eyebrow">Dashboard</span>
          <h1>Admin Dashboard</h1>
        </div>
        <button type="button" className="admin-secondary" onClick={refreshCurrent}><FiRefreshCw /> Refresh</button>
      </div>
      <div className="admin-metrics">
        <MetricCard label="Total Registered Teams" value={dashboard.totalRegisteredTeams} icon={FiUsers} />
        <MetricCard label="Total Registered Participants" value={dashboard.totalRegisteredParticipants} icon={FiActivity} />
        <MetricCard label="Total Submitted Projects" value={dashboard.totalSubmittedProjects} icon={FiFileText} />
        <MetricCard label="Teams Under Review" value={dashboard.teamsUnderReview} icon={FiSliders} />
        <MetricCard label="Selected Teams" value={dashboard.selectedTeams} icon={FiCheckCircle} />
        <MetricCard label="Rejected Teams" value={dashboard.rejectedTeams} icon={FiXCircle} />
      </div>
    </div>
  );

  const renderTeamList = (title) => (
    <div className="admin-stack">
      <div className="admin-page-title">
        <div>
          <span className="admin-eyebrow">{title}</span>
          <h1>{title}</h1>
        </div>
        <button type="button" className="admin-secondary" onClick={refreshCurrent}><FiRefreshCw /> Refresh</button>
      </div>

      <section className="admin-panel">
        <div className="admin-controls">
          <label className="admin-search">
            <FiSearch />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
              placeholder="Search team, leader, college, department"
            />
          </label>
          {!['selected', 'rejected'].includes(activeView) && (
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
              <option value="">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          )}
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value, page: 1 }))}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="teamName">Team Name</option>
          </select>
        </div>

        <div className="admin-bulkbar">
          <span>{selectedIds.length} selected</span>
          <button type="button" onClick={() => bulkStatus('selected')} disabled={isSaving}>Bulk Select</button>
          <button type="button" onClick={() => bulkStatus('rejected')} disabled={isSaving}>Bulk Reject</button>
          <button
            type="button"
            onClick={bulkExport}
          >
            Bulk Export
          </button>
        </div>

        <TeamTable
          teams={teams}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
          onToggleAll={toggleAll}
          onOpen={openTeam}
          onStatus={updateTeamStatus}
          isLoading={isLoading}
        />

        <div className="admin-pagination">
          <span>Page {pagination.page} of {pagination.pages} - {pagination.total} teams</span>
          <div>
            <button type="button" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>
              <FiChevronLeft />
            </button>
            <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAnalytics = () => {
    const summary = analytics?.summary || {};
    const charts = analytics?.charts || {};
    return (
      <div className="admin-stack">
        <div className="admin-page-title">
          <div>
            <span className="admin-eyebrow">Analytics</span>
            <h1>Statistics & Analytics</h1>
          </div>
          <button type="button" className="admin-secondary" onClick={() => exportData('statistics', 'pdf')}><FiDownload /> Export PDF</button>
        </div>
        <div className="admin-metrics">
          <MetricCard label="Total Teams" value={summary.totalTeams} icon={FiUsers} />
          <MetricCard label="Total Participants" value={summary.totalParticipants} icon={FiActivity} />
          <MetricCard label="Total Colleges" value={summary.totalColleges} icon={FiGrid} />
          <MetricCard label="Total Projects" value={summary.totalProjects} icon={FiFileText} />
          <MetricCard label="Pending Reviews" value={summary.pendingReviews} icon={FiSliders} />
          <MetricCard label="Selection Percentage" value={`${summary.selectionPercentage || 0}%`} icon={FiBarChart2} />
        </div>
        <div className="admin-chart-grid">
          <BarList title="College-wise Registration Count" rows={charts.collegeWiseRegistrationCount} />
          <BarList title="Department-wise Registration Count" rows={charts.departmentWiseRegistrationCount} />
          <BarList title="Theme-wise Registration Count" rows={charts.themeWiseRegistrationCount} />
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="admin-stack">
      <div className="admin-page-title">
        <div>
          <span className="admin-eyebrow">Settings</span>
          <h1>Admin Settings</h1>
        </div>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Exports</h3>
        </div>
        <div className="admin-export-grid">
          {['teams', 'participants', 'selectedTeams', 'rejectedTeams', 'statistics'].map((scope) => (
            <div className="admin-export-row" key={scope}>
              <strong>{scope.replace(/([A-Z])/g, ' $1')}</strong>
              <div>
                <button type="button" onClick={() => exportData(scope, 'csv')}>CSV</button>
                <button type="button" onClick={() => exportData(scope, 'excel')}>Excel</button>
                <button type="button" onClick={() => exportData(scope, 'pdf')}>PDF</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Session</h3>
        </div>
        <div className="admin-info-grid">
          <span>Name</span><strong>{user.name}</strong>
          <span>Email</span><strong>{user.email}</strong>
          <span>Role</span><strong>{user.role}</strong>
          <span>Status</span><strong>{user.status}</strong>
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    if (activeView === 'dashboard') return renderDashboard();
    if (activeView === 'analytics') return renderAnalytics();
    if (activeView === 'settings') return renderSettings();
    if (activeView === 'details') {
      return <TeamDetails key={selectedTeam?.id || 'team-details'} team={selectedTeam} onBack={() => switchView('teams')} onStatus={updateTeamStatus} onRemarks={saveRemarks} isSaving={isSaving} />;
    }
    if (activeView === 'selected') return renderTeamList('Selected Teams');
    if (activeView === 'rejected') return renderTeamList('Rejected Teams');
    if (activeView === 'screening') return renderTeamList('Screening');
    if (activeView === 'submissions') return renderTeamList('Submissions');
    return renderTeamList('Teams');
  };

  return (
    <main className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <FiShield />
          <div>
            <strong>Hack With Vizag</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={activeView === item.id ? 'active' : ''}
                onClick={() => switchView(item.id)}
              >
                <Icon /> {item.label}
              </button>
            );
          })}
        </nav>

        <button type="button" className="admin-logout" onClick={logout}>
          <FiLogOut /> Logout
        </button>
      </aside>

      <section className="admin-content">
        {renderContent()}
      </section>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
