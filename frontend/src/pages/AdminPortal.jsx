import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiGrid,
  FiLock,
  FiLogOut,
  FiMail,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiTrash2,
  FiUsers,
  FiXCircle,
  FiLayers,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
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
  { id: 'eventConfig', label: 'Event Config', icon: FiCalendar },
  { id: 'problemStatements', label: 'Problem Statements', icon: FiLayers },
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
  openInnovationEntries: 0,
  officialEntries: 0,
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
        <p>Sign in with your organizer account to manage Hack With Vizag.</p>

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
            <th>Problem Code</th>
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
              <td>
                <span className="badge-tag">
                  {team.project?.problemCode || (team.project?.problemType === 'open' ? 'OPEN' : 'N/A')}
                </span>
              </td>
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
  const docUrl = buildAssetUrl(project.supportingDocFile?.url);

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
          <button type="button" className="admin-success" onClick={() => onStatus(team.id, 'selected')}>Select & Unlock Offline</button>
          <button type="button" className="admin-danger" onClick={() => onStatus(team.id, 'rejected')}>Reject</button>
        </div>
      </section>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h3>Team Information</h3>
          </div>
          <div className="admin-info-grid">
            <span>Leader Name</span><strong>{team.leader?.name || 'Not assigned'}</strong>
            <span>Leader Email</span><strong>{team.leader?.email || 'Not provided'}</strong>
            <span>Leader Phone</span><strong>{team.leader?.phone || 'Not provided'}</strong>
            <span>College</span><strong>{team.college || 'Not provided'}</strong>
            <span>Department</span><strong>{team.department || 'Not provided'}</strong>
            <span>Submission Date</span><strong>{formatDate(team.submissionDate)}</strong>
            <span>Reviewed By</span><strong>{team.reviewedBy?.name || team.reviewedBy?.email || 'Not reviewed yet'}</strong>
            <span>Reviewed At</span><strong>{formatDate(team.reviewedAt)}</strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h3>Screening Controls</h3>
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
            <span>Reviewer Remarks</span>
            <textarea rows="5" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add screening evaluation notes..." />
          </label>
          <button type="button" className="admin-primary" onClick={() => onRemarks(team.id, remarks)} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Remarks & Audit Log'}
          </button>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Project & Problem Statement Details</h3>
        </div>
        <div className="admin-info-grid wide">
          <span>Problem Code</span><strong>{firstValue(project.problemCode, project.problemType === 'open' ? 'OPEN INNOVATION' : 'N/A')}</strong>
          <span>Project Title</span><strong>{firstValue(project.title)}</strong>
          <span>Theme / Track</span><strong>{firstValue(project.theme)}</strong>
          <span>Technology Stack</span><strong>{firstValue(project.technologyStack)}</strong>
          <span>GitHub Link</span><strong>{project.githubRepository ? <a href={project.githubRepository} target="_blank" rel="noreferrer">{project.githubRepository}</a> : 'Not provided'}</strong>
          <span>Demo Video URL</span><strong>{project.demoVideoUrl ? <a href={project.demoVideoUrl} target="_blank" rel="noreferrer">{project.demoVideoUrl}</a> : 'Not provided'}</strong>
          <span>Project Abstract</span><p>{firstValue(project.abstract)}</p>
          <span>Problem Statement</span><p>{firstValue(project.problemStatement)}</p>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Uploaded Documents & Assets</h3>
        </div>
        <div className="admin-ppt-row">
          <div>
            <strong>Project Presentation (PPT): {project.pptFile?.originalName || 'PPT Document'}</strong>
            <span>{formatBytes(project.pptFile?.size)}</span>
          </div>
          {pptUrl ? (
            <div className="admin-detail-actions">
              <a className="admin-secondary" href={pptUrl} target="_blank" rel="noreferrer"><FiEye /> View PPT</a>
              <a className="admin-secondary" href={pptUrl} download><FiDownload /> Download PPT</a>
            </div>
          ) : (
            <small>No PPT File Uploaded</small>
          )}
        </div>

        {docUrl && (
          <div className="admin-ppt-row mt-3">
            <div>
              <strong>Supporting Document: {project.supportingDocFile?.originalName || 'Supporting Doc'}</strong>
              <span>{formatBytes(project.supportingDocFile?.size)}</span>
            </div>
            <div className="admin-detail-actions">
              <a className="admin-secondary" href={docUrl} target="_blank" rel="noreferrer"><FiEye /> View Doc</a>
              <a className="admin-secondary" href={docUrl} download><FiDownload /> Download Doc</a>
            </div>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <h3>Team Roster ({team.members?.length || 0})</h3>
        </div>
        <div className="admin-member-grid">
          {(team.members || []).map((member, i) => (
            <article className="admin-member" key={member._id || member.id || i}>
              <strong>{i + 1}. {member.name}</strong>
              <span>{member.email}</span>
              <span>{member.phone || 'No phone'}</span>
              <span>{member.collegeName || member.college} | {member.department}</span>
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
  const [filters, setFilters] = useState({ search: '', status: '', college: '', department: '', theme: '', problemStatement: '', sort: 'newest', page: 1, limit: 10 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Event Config Management State
  const [eventConfig, setEventConfig] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Problem Statements Management State
  const [problemStatements, setProblemStatements] = useState([]);
  const [editingPs, setEditingPs] = useState(null); // null | PS object for modal

  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const effectiveFilters = useMemo(() => {
    if (activeView === 'selected') return { ...filters, status: 'selected' };
    if (activeView === 'rejected') return { ...filters, status: 'rejected' };
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

  const loadEventConfig = useCallback(async () => {
    try {
      const res = await api.getEventConfig();
      setEventConfig(res.event);
    } catch {
      setToast({ type: 'error', message: 'Failed to load event configuration.' });
    }
  }, []);

  const loadProblemStatements = useCallback(async () => {
    try {
      const res = await api.getAdminProblemStatements();
      setProblemStatements(res.problemStatements || []);
    } catch {
      setToast({ type: 'error', message: 'Failed to load problem statements.' });
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
    loadDashboard().catch(() => {});
  }, [user, loadDashboard]);

  useEffect(() => {
    if (!user) return;
    if (['teams', 'screening', 'selected', 'rejected', 'submissions'].includes(activeView)) {
      loadTeams();
    } else if (activeView === 'analytics') {
      loadAnalytics();
    } else if (activeView === 'eventConfig') {
      loadEventConfig();
    } else if (activeView === 'problemStatements') {
      loadProblemStatements();
    }
  }, [user, activeView, loadTeams, loadAnalytics, loadEventConfig, loadProblemStatements]);

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
    if (activeView === 'eventConfig') loadEventConfig();
    if (activeView === 'problemStatements') loadProblemStatements();
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

  const saveEventConfig = async (e) => {
    e.preventDefault();
    if (!eventConfig?._id) return;
    setIsSavingConfig(true);
    try {
      await api.updateEventConfig(eventConfig._id, eventConfig);
      setToast({ type: 'success', message: 'Event Configuration updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update event configuration.' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSavePs = async (e) => {
    e.preventDefault();
    if (!editingPs) return;
    try {
      if (editingPs._id) {
        await api.updateProblemStatement(editingPs._id, editingPs);
        setToast({ type: 'success', message: 'Problem Statement updated successfully.' });
      } else {
        await api.createProblemStatement(editingPs);
        setToast({ type: 'success', message: 'Problem Statement created successfully.' });
      }
      setEditingPs(null);
      loadProblemStatements();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save problem statement.' });
    }
  };

  const handleDeletePs = async (id) => {
    if (!window.confirm('Delete this problem statement permanently?')) return;
    try {
      await api.deleteProblemStatement(id);
      setToast({ type: 'success', message: 'Problem statement deleted.' });
      loadProblemStatements();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Delete failed.' });
    }
  };

  const movePsOrder = async (index, direction) => {
    const list = [...problemStatements];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reorderedItems = list.map((item, idx) => ({
      id: item._id,
      displayOrder: idx + 1,
    }));

    try {
      const res = await api.reorderProblemStatements(reorderedItems);
      setProblemStatements(res.problemStatements || list);
      setToast({ type: 'success', message: 'Display order updated.' });
    } catch {
      setToast({ type: 'error', message: 'Failed to reorder.' });
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
    return <main className="admin-loading"><FiRefreshCw /> Verifying admin authorization...</main>;
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
          <span className="admin-eyebrow">Overview</span>
          <h1>Event Dashboard</h1>
        </div>
        <button type="button" className="admin-secondary" onClick={refreshCurrent}><FiRefreshCw /> Refresh</button>
      </div>
      <div className="admin-metrics">
        <MetricCard label="Total Registered Teams" value={dashboard.totalRegisteredTeams} icon={FiUsers} />
        <MetricCard label="Total Participants" value={dashboard.totalRegisteredParticipants} icon={FiActivity} />
        <MetricCard label="Total Submissions" value={dashboard.totalSubmittedProjects} icon={FiFileText} />
        <MetricCard label="Pending Review" value={dashboard.teamsUnderReview} icon={FiSliders} />
        <MetricCard label="Selected Teams" value={dashboard.selectedTeams} icon={FiCheckCircle} />
        <MetricCard label="Rejected Teams" value={dashboard.rejectedTeams} icon={FiXCircle} />
        <MetricCard label="Official PS Entries" value={dashboard.officialEntries || 0} icon={FiLayers} />
        <MetricCard label="Open Innovation Entries" value={dashboard.openInnovationEntries || 0} icon={FiPlusCircle} />
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
        <div className="admin-controls-grid mb-3">
          <label className="admin-search">
            <FiSearch />
            <input
              value={filters.search}
              onChange={(e) => setFilters((curr) => ({ ...curr, search: e.target.value, page: 1 }))}
              placeholder="Search team, leader, email, college, department"
            />
          </label>
          <input
            type="text"
            className="admin-input-filter"
            placeholder="Filter College"
            value={filters.college}
            onChange={(e) => setFilters((curr) => ({ ...curr, college: e.target.value, page: 1 }))}
          />
          <input
            type="text"
            className="admin-input-filter"
            placeholder="Filter Department"
            value={filters.department}
            onChange={(e) => setFilters((curr) => ({ ...curr, department: e.target.value, page: 1 }))}
          />
          <input
            type="text"
            className="admin-input-filter"
            placeholder="Filter Problem Code"
            value={filters.problemStatement}
            onChange={(e) => setFilters((curr) => ({ ...curr, problemStatement: e.target.value, page: 1 }))}
          />
          {!['selected', 'rejected'].includes(activeView) && (
            <select value={filters.status} onChange={(e) => setFilters((curr) => ({ ...curr, status: e.target.value, page: 1 }))}>
              <option value="">All Statuses</option>
              {statusOptions.map((st) => <option key={st} value={st}>{statusLabels[st]}</option>)}
            </select>
          )}
        </div>

        <div className="admin-bulkbar">
          <span>{selectedIds.length} teams selected</span>
          <button type="button" onClick={() => bulkStatus('selected')} disabled={isSaving}>Bulk Select</button>
          <button type="button" onClick={() => bulkStatus('rejected')} disabled={isSaving}>Bulk Reject</button>
          <button type="button" onClick={() => api.exportAdminData({ scope: 'teams', format: 'csv' })}>Export CSV</button>
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
          <span>Page {pagination.page} of {pagination.pages} ({pagination.total} teams)</span>
          <div>
            <button type="button" disabled={pagination.page <= 1} onClick={() => setFilters((curr) => ({ ...curr, page: curr.page - 1 }))}>
              <FiChevronLeft />
            </button>
            <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((curr) => ({ ...curr, page: curr.page + 1 }))}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderEventConfig = () => (
    <div className="admin-stack">
      <div className="admin-page-title">
        <div>
          <span className="admin-eyebrow">Event Management</span>
          <h1>Event Configuration</h1>
        </div>
        <button type="button" className="admin-secondary" onClick={loadEventConfig}><FiRefreshCw /> Reload</button>
      </div>

      {eventConfig ? (
        <form onSubmit={saveEventConfig} className="admin-panel form-grid">
          <label className="field">
            <span>Event Name *</span>
            <input
              required
              value={eventConfig.eventName || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, eventName: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Event Year *</span>
            <input
              required
              value={eventConfig.eventYear || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, eventYear: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Event Status *</span>
            <select
              value={eventConfig.eventStatus || 'Published'}
              onChange={(e) => setEventConfig({ ...eventConfig, eventStatus: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <label className="field">
            <span>Registration Fee (INR)</span>
            <input
              type="number"
              min="0"
              value={eventConfig.registrationFee ?? 0}
              onChange={(e) => setEventConfig({ ...eventConfig, registrationFee: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Min Team Size *</span>
            <input
              type="number"
              min="1"
              max="10"
              value={eventConfig.minTeamSize || 1}
              onChange={(e) => setEventConfig({ ...eventConfig, minTeamSize: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Max Team Size *</span>
            <input
              type="number"
              min="1"
              max="10"
              value={eventConfig.maxTeamSize || 4}
              onChange={(e) => setEventConfig({ ...eventConfig, maxTeamSize: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Min Abstract Words *</span>
            <input
              type="number"
              min="10"
              value={eventConfig.minAbstractWords || 50}
              onChange={(e) => setEventConfig({ ...eventConfig, minAbstractWords: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Max Abstract Words *</span>
            <input
              type="number"
              min="50"
              value={eventConfig.maxAbstractWords || 500}
              onChange={(e) => setEventConfig({ ...eventConfig, maxAbstractWords: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>PPT Max Size (MB) *</span>
            <input
              type="number"
              min="1"
              value={eventConfig.maxPptSizeMb || 15}
              onChange={(e) => setEventConfig({ ...eventConfig, maxPptSizeMb: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Supporting Doc Max Size (MB) *</span>
            <input
              type="number"
              min="1"
              value={eventConfig.maxSupportingDocSizeMb || 15}
              onChange={(e) => setEventConfig({ ...eventConfig, maxSupportingDocSizeMb: Number(e.target.value) })}
            />
          </label>

          <label className="field span-2">
            <span>Allowed PPT Formats (Comma Separated)</span>
            <input
              value={Array.isArray(eventConfig.allowedPptFormats) ? eventConfig.allowedPptFormats.join(', ') : eventConfig.allowedPptFormats || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, allowedPptFormats: e.target.value.split(',').map((s) => s.trim()) })}
            />
          </label>

          <label className="field span-2">
            <span>Allowed Supporting Doc Formats (Comma Separated)</span>
            <input
              value={Array.isArray(eventConfig.allowedSupportingDocFormats) ? eventConfig.allowedSupportingDocFormats.join(', ') : eventConfig.allowedSupportingDocFormats || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, allowedSupportingDocFormats: e.target.value.split(',').map((s) => s.trim()) })}
            />
          </label>

          <div className="span-2 mt-3">
            <button type="submit" className="admin-primary" disabled={isSavingConfig}>
              {isSavingConfig ? 'Saving...' : 'Save Event Configuration'}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-panel admin-empty-state">Loading Event Configuration...</div>
      )}
    </div>
  );

  const renderProblemStatements = () => (
    <div className="admin-stack">
      <div className="admin-page-title">
        <div>
          <span className="admin-eyebrow">Tracks & Challenges</span>
          <h1>Problem Statement Management</h1>
        </div>
        <button
          type="button"
          className="admin-primary"
          onClick={() => setEditingPs({ code: '', title: '', theme: '', problemStatement: '', objectives: '', onlineRoundRequirements: '', type: 'official', activeStatus: true })}
        >
          <FiPlusCircle /> Add Problem Statement
        </button>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Code</th>
                <th>Title</th>
                <th>Theme</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problemStatements.map((ps, index) => (
                <tr key={ps._id}>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => movePsOrder(index, -1)} disabled={index === 0}><FiArrowUp /></button>
                      <button type="button" onClick={() => movePsOrder(index, 1)} disabled={index === problemStatements.length - 1}><FiArrowDown /></button>
                    </div>
                  </td>
                  <td><strong>{ps.code}</strong></td>
                  <td>{ps.title}</td>
                  <td>{ps.theme}</td>
                  <td><span className={`badge-tag ${ps.type === 'open' ? 'open-tag' : ''}`}>{ps.type}</span></td>
                  <td>{ps.activeStatus ? <span className="status-badge status-selected">Active</span> : <span className="status-badge status-rejected">Inactive</span>}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => setEditingPs(ps)} title="Edit"><FiEdit3 /></button>
                      <button type="button" onClick={() => handleDeletePs(ps._id)} title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Modal */}
      {editingPs && (
        <div className="admin-modal-overlay">
          <form className="admin-modal-card" onSubmit={handleSavePs}>
            <h3>{editingPs._id ? 'Edit Problem Statement' : 'Add New Problem Statement'}</h3>

            <div className="form-grid">
              <label className="field">
                <span>Code *</span>
                <input required value={editingPs.code} onChange={(e) => setEditingPs({ ...editingPs, code: e.target.value })} placeholder="e.g. HWV-05" />
              </label>

              <label className="field">
                <span>Type *</span>
                <select value={editingPs.type} onChange={(e) => setEditingPs({ ...editingPs, type: e.target.value })}>
                  <option value="official">Official Track</option>
                  <option value="open">Open Innovation</option>
                </select>
              </label>

              <label className="field span-2">
                <span>Title *</span>
                <input required value={editingPs.title} onChange={(e) => setEditingPs({ ...editingPs, title: e.target.value })} placeholder="Title of the challenge track" />
              </label>

              <label className="field span-2">
                <span>Theme *</span>
                <input required value={editingPs.theme} onChange={(e) => setEditingPs({ ...editingPs, theme: e.target.value })} placeholder="e.g. Smart Cities / Marine Tech" />
              </label>

              <label className="field span-2">
                <span>Problem Statement Description *</span>
                <textarea required rows="4" value={editingPs.problemStatement} onChange={(e) => setEditingPs({ ...editingPs, problemStatement: e.target.value })} />
              </label>

              <label className="field span-2">
                <span>Key Objectives (One per line)</span>
                <textarea rows="3" value={Array.isArray(editingPs.objectives) ? editingPs.objectives.join('\n') : editingPs.objectives} onChange={(e) => setEditingPs({ ...editingPs, objectives: e.target.value })} />
              </label>

              <label className="field span-2">
                <span>Online Round Requirements *</span>
                <textarea required rows="2" value={editingPs.onlineRoundRequirements} onChange={(e) => setEditingPs({ ...editingPs, onlineRoundRequirements: e.target.value })} />
              </label>
            </div>

            <div className="admin-modal-actions mt-3">
              <button type="button" className="admin-secondary" onClick={() => setEditingPs(null)}>Cancel</button>
              <button type="submit" className="admin-primary">Save Problem Statement</button>
            </div>
          </form>
        </div>
      )}
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
          <BarList title="College-wise Registrations" rows={charts.collegeWiseRegistrationCount} />
          <BarList title="Department-wise Registrations" rows={charts.departmentWiseRegistrationCount} />
          <BarList title="Theme-wise Registrations" rows={charts.themeWiseRegistrationCount} />
          <BarList title="Problem Code-wise Registrations" rows={charts.problemStatementWiseCount} />
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
          <h3>Session Info</h3>
        </div>
        <div className="admin-info-grid">
          <span>Name</span><strong>{user.name}</strong>
          <span>Email</span><strong>{user.email}</strong>
          <span>Role</span><strong>{user.role}</strong>
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    if (activeView === 'dashboard') return renderDashboard();
    if (activeView === 'analytics') return renderAnalytics();
    if (activeView === 'eventConfig') return renderEventConfig();
    if (activeView === 'problemStatements') return renderProblemStatements();
    if (activeView === 'settings') return renderSettings();
    if (activeView === 'details') {
      return (
        <TeamDetails
          key={selectedTeam?.id || 'team-details'}
          team={selectedTeam}
          onBack={() => switchView('teams')}
          onStatus={updateTeamStatus}
          onRemarks={saveRemarks}
          isSaving={isSaving}
        />
      );
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
                className={`admin-nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => switchView(item.id)}
              >
                <Icon /> <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-user-footer">
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button type="button" onClick={logout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>

      <section className="admin-content">
        {renderContent()}
      </section>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
