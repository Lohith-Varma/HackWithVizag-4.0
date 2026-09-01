import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit3,
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
  FiMaximize2,
  FiMinimize2,
  FiSave,
  FiCornerUpRight,
  FiVideo,
  FiCheck,
  FiX,
  FiClock,
  FiFilter,
  FiFolder,
  FiExternalLink,
  FiBell,
} from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import './AdminPortal.css';

const statusOptions = [
  'pending',
  'submitted',
  'under_review',
  'approved',
  'selected',
  'rejected',
  'waitlisted',
  'shortlisted',
  'payment_pending',
  'payment_completed',
];

const statusLabels = {
  pending: 'Pending',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  selected: 'Selected',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  shortlisted: 'Shortlisted',
  payment_pending: 'Payment Pending',
  payment_completed: 'Payment Completed',
  draft: 'Draft',
};

const statusColors = {
  pending: 'gray',
  submitted: 'blue',
  under_review: 'amber',
  approved: 'green',
  selected: 'green',
  rejected: 'red',
  waitlisted: 'purple',
  shortlisted: 'emerald',
  payment_pending: 'amber',
  payment_completed: 'indigo',
  draft: 'gray',
};


const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
  { id: 'review', label: 'Review Queue', icon: FiSliders },
  { id: 'teams', label: 'All Teams', icon: FiUsers },
  { id: 'leads', label: 'Notification Leads', icon: FiBell },
  { id: 'problemStatements', label: 'Problem Statements', icon: FiLayers },
  { id: 'eventConfig', label: 'Event Config', icon: FiCalendar },
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

const backendAssetBase = () => api.baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const buildAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${backendAssetBase()}${url.startsWith('/') ? url : `/${url}`}`;
};

function AdminLogin({ onLogin, onToast }) {
  const [form, setForm] = useState({ email: 'hackwithvizag@nsrit.edu.in', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const result = await api.adminLogin(form);
      onToast({ type: 'success', message: 'Logged in as Admin successfully.' });
      onLogin(result.user);
    } catch (error) {
      setErrors({ form: error.message || 'Invalid credentials' });
      onToast({ type: 'error', message: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card shadow-glow">
        <div className="admin-login-header">
          <div className="admin-shield-icon">
            <FiShield />
          </div>
          <span className="section-subtitle">Staff Review Workspace</span>
          <h2>Admin Authentication</h2>
          <p>Sign in to evaluate hackathon submissions in real time.</p>
        </div>

        <form onSubmit={submit} className="admin-login-form">
          {errors.form && <div className="admin-alert error">{errors.form}</div>}

          <label className="field">
            <span>Email Address</span>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@nsrit.edu.in"
              />
            </div>
            {errors.email && <small className="error-text">{errors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>
            {errors.password && <small className="error-text">{errors.password}</small>}
          </label>

          <button type="submit" className="primary-action w-full" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In to Review Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
function MetricCard({ label, value, icon: Icon }) {
  return (
    <article className="admin-metric">
      <span>{Icon && <Icon />} {label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

const getInitialViewFromHash = () => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('event-config') || hash.includes('eventconfig')) return 'eventConfig';
  if (hash.includes('analytics')) return 'analytics';
  if (hash.includes('settings')) return 'settings';
  if (hash.includes('problem-statements') || hash.includes('problemstatements')) return 'problemStatements';
  if (hash.includes('leads') || hash.includes('notifications')) return 'leads';
  if (hash.includes('teams')) return 'teams';
  if (hash.includes('dashboard')) return 'dashboard';
  if (hash.includes('review')) return 'review';
  return 'dashboard';
};

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState(getInitialViewFromHash);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [analytics, setAnalytics] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [reviewFormStatus, setReviewFormStatus] = useState('under_review');
  const [reviewFormRemarks, setReviewFormRemarks] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    problemType: '',
    college: '',
    department: '',
    problemStatement: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);

  // Event Config Management State
  const [eventConfig, setEventConfig] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Settings State
  const [settingsTab, setSettingsTab] = useState('profile'); // 'profile' | 'security' | 'event'
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    college: '',
    department: '',
    year: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Problem Statements Management State
  const [problemStatements, setProblemStatements] = useState([]);
  const [editingPs, setEditingPs] = useState(null);
  const [isPsModalOpen, setIsPsModalOpen] = useState(false);
  const [psForm, setPsForm] = useState({
    code: '',
    title: '',
    theme: '',
    type: 'official',
    problemStatement: '',
    objectives: '',
    onlineRoundRequirements: '',
    activeStatus: true,
  });

  const openCreatePsModal = () => {
    setEditingPs(null);

    setPsForm({
      code: '',
      title: '',
      theme: '',
      type: 'official',
      problemStatement: '',
      objectives: '',
      onlineRoundRequirements: '',
      activeStatus: true,
    });
    setIsPsModalOpen(true);
  };

  const openEditPsModal = (ps) => {
    setEditingPs(ps);
    setPsForm({
      code: ps.code || '',
      title: ps.title || '',
      theme: ps.theme || ps.category || '',
      type: ps.type || (ps.isCustomIdea ? 'open' : 'official'),
      problemStatement: ps.problemStatement || ps.description || '',
      objectives: Array.isArray(ps.objectives) ? ps.objectives.join('\n') : ps.objectives || '',
      onlineRoundRequirements: ps.onlineRoundRequirements || ps.onlineRequirements || '',
      activeStatus: ps.activeStatus !== false,
    });
    setIsPsModalOpen(true);
  };

  const handleSavePs = async (e) => {
    e.preventDefault();
    if (!psForm.code.trim() || !psForm.title.trim() || !psForm.theme.trim() || !psForm.problemStatement.trim()) {
      setToast({ type: 'error', message: 'Please fill in all mandatory problem statement fields (Code, Title, Theme, Description).' });
      return;
    }

    try {
      if (editingPs?._id) {
        await api.updateProblemStatement(editingPs._id, psForm);
        setToast({ type: 'success', message: 'Problem Statement updated successfully.' });
      } else {
        await api.createProblemStatement(psForm);
        setToast({ type: 'success', message: 'Problem Statement created successfully.' });
      }
      setIsPsModalOpen(false);
      setEditingPs(null);
      await loadProblemStatements();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save problem statement.' });
    }
  };

  const handleTogglePsStatus = async (ps) => {
    try {
      await api.updateProblemStatement(ps._id, { activeStatus: !ps.activeStatus });
      setToast({ type: 'success', message: `Track ${ps.code} marked as ${!ps.activeStatus ? 'Active' : 'Inactive'}.` });
      await loadProblemStatements();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to toggle status.' });
    }
  };

  const handleDeletePs = async (id) => {
    if (!window.confirm('Delete this problem statement permanently?')) return;
    try {
      await api.deleteProblemStatement(id);
      setToast({ type: 'success', message: 'Problem statement deleted.' });
      await loadProblemStatements();
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

  const [leads, setLeads] = useState([]);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  const loadNotificationLeads = useCallback(async () => {
    setIsLeadsLoading(true);
    try {
      const res = await api.getNotificationLeads({ search: leadsSearch });
      setLeads(res.leads || []);
    } catch {
      try {
        const local = JSON.parse(localStorage.getItem('hwv.notify_list') || '[]');
        setLeads(local);
      } catch {
        setLeads([]);
      }
    } finally {
      setIsLeadsLoading(false);
    }
  }, [leadsSearch]);

  const handleExportLeads = async () => {
    try {
      await api.exportNotificationLeads();
      setToast({ type: 'success', message: 'Notification leads downloaded.' });
    } catch {
      const csvContent = "data:text/csv;charset=utf-8," 
        + ["Name,Email,Registered At"].concat(leads.map(l => `"${l.name || ''}","${l.email}","${l.createdAt || l.date || ''}"`)).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "notification_leads.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ type: 'success', message: 'Notification leads exported.' });
    }
  };

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
    } else if (activeView === 'eventConfig' || activeView === 'settings') {
      loadEventConfig();
    } else if (activeView === 'problemStatements') {
      loadProblemStatements();
    } else if (activeView === 'leads') {
      loadNotificationLeads();
    }
  }, [user, activeView, loadTeams, loadAnalytics, loadEventConfig, loadProblemStatements, loadNotificationLeads]);

  const openTeamDetails = async (id) => {
    if (!id) return;
    setSelectedTeamId(id);
    setActiveEmbed(null);
    try {
      const result = await api.getAdminTeam(id);
      setSelectedTeam(result.team);
      setReviewFormStatus(result.team?.status || 'under_review');
      setReviewFormRemarks(result.team?.remarks || '');
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to open team details.' });
    }
  };

  const handleSaveReview = async (shouldAdvance = false) => {
    if (!selectedTeamId) return;
    setIsSaving(true);
    try {
      const result = await api.updateAdminTeamStatus(selectedTeamId, {
        status: reviewFormStatus,
        remarks: reviewFormRemarks,
      });
      setToast({ type: 'success', message: `Review saved. Marked ${statusLabels[reviewFormStatus] || reviewFormStatus}.` });
      setSelectedTeam(result.team);
      await loadDashboard();

      setTeams((prev) =>
        prev.map((t) => ((t.id || t._id) === selectedTeamId ? { ...t, status: reviewFormStatus, remarks: reviewFormRemarks } : t))
      );

      if (shouldAdvance) {
        const currentIndex = teams.findIndex((t) => (t.id || t._id) === selectedTeamId);
        if (currentIndex >= 0 && currentIndex < teams.length - 1) {
          const nextTeam = teams[currentIndex + 1];
          openTeamDetails(nextTeam.id || nextTeam._id);
        } else {
          setToast({ type: 'info', message: 'Reached the end of the review queue.' });
        }
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save review.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigateQueue = (direction) => {
    if (!teams.length) return;
    const currentIndex = teams.findIndex((t) => (t.id || t._id) === selectedTeamId);
    let targetIndex = 0;
    if (currentIndex >= 0) {
      targetIndex = direction === 'next' ? Math.min(teams.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    }
    const targetTeam = teams[targetIndex];
    if (targetTeam) openTeamDetails(targetTeam.id || targetTeam._id);
  };

  const handleExportData = async (format = 'csv') => {
    try {
      setToast({ type: 'info', message: `Preparing ${format.toUpperCase()} export download...` });
      await api.exportAdminData({ format, status: filters.status });
      setToast({ type: 'success', message: `${format.toUpperCase()} exported successfully.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || `Failed to download ${format.toUpperCase()} export.` });
    }
  };


  const handleFilterChip = (statusVal) => {
    setFilters((prev) => ({ ...prev, status: prev.status === statusVal ? '' : statusVal, page: 1 }));
  };

  const handleProblemTypeChip = (typeVal) => {
    setFilters((prev) => ({ ...prev, problemType: prev.problemType === typeVal ? '' : typeVal, page: 1 }));
  };

  const logout = async () => {
    await api.adminLogout().catch(() => {});
    setUser(null);
    setToast({ type: 'info', message: 'Logged out successfully.' });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigateQueue('next');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigateQueue('prev');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveReview(false);
      } else if (e.key === 'Escape') {
        if (activeEmbed) setActiveEmbed(null);
        if (isFocusMode) setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teams, selectedTeamId, activeEmbed, isFocusMode, reviewFormStatus, reviewFormRemarks]);

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

  const handleSwitchView = (viewId) => {
    setActiveView(viewId);
    const slugMap = {
      eventConfig: 'event-config',
      problemStatements: 'problem-statements',
      leads: 'leads',
      analytics: 'analytics',
      settings: 'settings',
      dashboard: 'dashboard',
      teams: 'teams',
      review: 'review',
    };
    const slug = slugMap[viewId] || viewId;
    window.location.hash = `#admin/${slug}`;
    if (['review', 'teams', 'screening', 'selected', 'rejected', 'submissions'].includes(viewId)) {
      loadTeams();
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#admin')) {
        const nextView = getInitialViewFromHash();
        setActiveView(nextView);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        college: user.collegeName || user.college || '',
        department: user.department || '',
        year: user.year || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setToast({ type: 'error', message: 'Admin name cannot be empty.' });
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await api.updateProfile(profileForm);
      setUser(res.user);
      setToast({ type: 'success', message: 'Admin profile updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setToast({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setToast({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToast({ type: 'success', message: 'Admin password changed successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally {
      setIsSavingPassword(false);
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


  if (isChecking) {
    return (
      <div className="admin-loading-screen">
        <div className="loading-spinner" />
        <p>Loading Staff Review Workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={setUser} onToast={setToast} />;
  }

  return (
    <div className={`admin-workspace-app ${isFocusMode ? 'focus-mode-active' : ''}`}>
      
      {/* LEFT SIDEBAR: Persistent Navigation */}
      {!isFocusMode && (
        <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand-bar">
            <div className="brand-badge-box">
              <FiShield className="shield-icon" />
            </div>
            {!isSidebarCollapsed && (
              <div className="brand-text-box">
                <span className="brand-name">HackWithVizag</span>
                <span className="brand-tag">Review Workspace</span>
              </div>
            )}
            <button
              type="button"
              className="toggle-sidebar-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSwitchView(item.id)}
                  title={item.label}
                >
                  <ItemIcon className="nav-icon" />
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {isActive && <div className="nav-active-indicator" />}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-user-footer">
            <div className="user-avatar-badge">{user.name ? user.name[0] : 'A'}</div>
            {!isSidebarCollapsed && (
              <div className="user-info-text">
                <strong className="truncate-text">{user.name || 'Admin Evaluator'}</strong>
                <small>Staff Reviewer</small>
              </div>
            )}
            <button type="button" className="logout-btn" onClick={logout} title="Sign Out">
              <FiLogOut />
            </button>
          </div>
        </aside>
      )}

      {/* MAIN WORKSPACE AREA */}
      <div className="admin-main-container">

        {/* DASHBOARD HOME VIEW */}
        {activeView === 'dashboard' && (
          <div className="dashboard-home-view">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Metrics Overview</span>
                <h2>Dashboard Home</h2>
              </div>
              <div className="header-actions-row">
                <button type="button" className="secondary-action" onClick={() => handleExportData('csv')}>
                  <FiDownload /> Export CSV
                </button>
                <button type="button" className="secondary-action" onClick={() => handleExportData('excel')}>
                  <FiDownload /> Export Excel
                </button>
                <button type="button" className="secondary-action" onClick={() => handleExportData('pdf')}>
                  <FiDownload /> Export PDF
                </button>
                <button type="button" className="primary-action" onClick={() => setActiveView('review')}>
                  <FiSliders /> Launch Review Workspace →
                </button>
              </div>

            </div>

            {/* KPI Cards */}
            <div className="kpi-grid-container">
              <div className="kpi-card shadow-glow">
                <div className="kpi-icon-box blue"><FiUsers /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Total Teams</span>
                  <strong className="kpi-val">{dashboard.totalRegisteredTeams}</strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box amber"><FiClock /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Pending Reviews</span>
                  <strong className="kpi-val">{dashboard.teamsUnderReview}</strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box green"><FiCheckCircle /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Selected Teams</span>
                  <strong className="kpi-val">{dashboard.selectedTeams}</strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box red"><FiXCircle /></div>
                <div className="kpi-data">
                  <span className="kpi-label">Rejected Teams</span>
                  <strong className="kpi-val">{dashboard.rejectedTeams}</strong>
                </div>
              </div>
            </div>

            {/* Quick Summary Section */}
            <div className="home-summary-grid mt-4">
              <div className="dash-card">
                <h3>Track Breakdown</h3>
                <div className="track-stats-list mt-3">
                  <div className="track-stat-item">
                    <span>Open Innovation Ideas</span>
                    <strong>{dashboard.openInnovationEntries} Teams</strong>
                  </div>
                  <div className="track-stat-item">
                    <span>Official Industry Tracks</span>
                    <strong>{dashboard.officialEntries} Teams</strong>
                  </div>
                  <div className="track-stat-item">
                    <span>Total Submitted Proposals</span>
                    <strong>{dashboard.totalSubmittedProjects} Proposals</strong>
                  </div>
                </div>
              </div>

              <div className="dash-card">
                <h3>Evaluator Quick Actions</h3>
                <p className="text-dim mt-1 mb-3">Jump straight into evaluating pending hackathon submissions.</p>
                <button type="button" className="btn-focal-primary" onClick={() => setActiveView('review')}>
                  Open Review Queue ({dashboard.teamsUnderReview} Pending)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW WORKSPACE 3-COLUMN VIEW (Primary Working Interface) */}
        {['review', 'teams', 'screening', 'selected', 'rejected', 'submissions'].includes(activeView) && (
          <div className="review-workspace-3col">
            
            {/* CENTER PANEL: REVIEW QUEUE LIST */}
            <div className="review-queue-column">
              
              {/* Sticky Review Toolbar */}
              <div className="queue-toolbar">
                <div className="toolbar-top-row">
                  <div className="search-input-box">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                      placeholder="Search team, leader, title, college..."
                    />
                  </div>

                  <button
                    type="button"
                    className={`focus-mode-btn ${isFocusMode ? 'active' : ''}`}
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                  >
                    {isFocusMode ? <FiMinimize2 /> : <FiMaximize2 />}
                    <span>Focus</span>
                  </button>

                  <button type="button" className="toolbar-icon-btn" onClick={loadTeams} title="Refresh Queue">
                    <FiRefreshCw />
                  </button>
                </div>

                {/* Filter Chips Row */}
                <div className="filter-chips-row">
                  <button
                    type="button"
                    className={`chip ${filters.status === '' ? 'active' : ''}`}
                    onClick={() => handleFilterChip('')}
                  >
                    All ({pagination.total || teams.length})
                  </button>

                  <button
                    type="button"
                    className={`chip chip-amber ${filters.status === 'under_review' ? 'active' : ''}`}
                    onClick={() => handleFilterChip('under_review')}
                  >
                    Under Review
                  </button>

                  <button
                    type="button"
                    className={`chip chip-green ${filters.status === 'selected' ? 'active' : ''}`}
                    onClick={() => handleFilterChip('selected')}
                  >
                    Selected
                  </button>

                  <button
                    type="button"
                    className={`chip chip-red ${filters.status === 'rejected' ? 'active' : ''}`}
                    onClick={() => handleFilterChip('rejected')}
                  >
                    Rejected
                  </button>

                  <button
                    type="button"
                    className={`chip chip-blue ${filters.problemType === 'open' ? 'active' : ''}`}
                    onClick={() => handleProblemTypeChip('open')}
                  >
                    Open Innovation
                  </button>

                  <button
                    type="button"
                    className={`chip chip-blue ${filters.problemType === 'official' ? 'active' : ''}`}
                    onClick={() => handleProblemTypeChip('official')}
                  >
                    Official Tracks
                  </button>
                </div>
              </div>

              {/* Submission Cards Queue */}
              <div className="queue-list-scroll">
                {isLoading ? (
                  <div className="queue-skeleton-list">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="queue-item-skeleton" />
                    ))}
                  </div>
                ) : teams.length === 0 ? (
                  <div className="empty-queue-box">
                    <FiFolder className="empty-icon" />
                    <h4>No Submissions Found</h4>
                    <p>Try clearing filters or search term.</p>
                  </div>
                ) : (
                  teams.map((t) => {
                    const id = t.id || t._id;
                    const isSelected = id === selectedTeamId;
                    const st = (t.status || 'pending').toLowerCase();
                    const color = statusColors[st] || 'gray';

                    return (
                      <div
                        key={id}
                        className={`queue-submission-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => openTeamDetails(id)}
                      >
                        <div className="queue-card-top">
                          <strong className="queue-team-name">{t.teamName}</strong>
                          <span className={`status-pill-mini status-pill-${color}`}>
                            {statusLabels[st] || st}
                          </span>
                        </div>

                        <h4 className="queue-project-title truncate-text">
                          {t.projectTitle || 'Untitled Project'}
                        </h4>

                        <div className="queue-card-meta">
                          <span className="meta-badge">{t.problemCode || 'Open Innovation'}</span>
                          <span className="meta-college truncate-text">{t.college || t.leaderCollege || 'NSRIT'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* RIGHT PANEL: DYNAMIC REVIEW INSPECTION WORKSPACE */}
            <div className="review-inspection-column">
              {selectedTeam ? (
                <div className="inspection-workspace-content">
                  
                  {/* Section 1: Overview Header */}
                  <div className="inspection-section-header">
                    <div className="overview-title-group">
                      <div className="overview-code-badge">
                        {selectedTeam.project?.problemCode || selectedTeam.problemCode || 'OPEN-TRACK'}
                      </div>
                      <div>
                        <h2 className="overview-project-title">
                          {selectedTeam.project?.title || selectedTeam.projectTitle || 'Untitled Proposal'}
                        </h2>
                        <p className="overview-team-line">
                          Team: <strong>{selectedTeam.teamName}</strong> • Reg ID: <span className="font-mono font-bold text-accent">{selectedTeam.registrationId || selectedTeam.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="overview-meta-badges">
                      <span className={`status-pill status-pill-${statusColors[selectedTeam.status || 'pending']}`}>
                        {statusLabels[selectedTeam.status] || selectedTeam.status}
                      </span>
                      <small className="date-tag">
                        Submitted: {formatDate(selectedTeam.submissionDate || selectedTeam.submittedAt || selectedTeam.createdAt)}
                      </small>
                    </div>
                  </div>

                  {/* Section 2: Abstract Reader */}
                  <div className="inspection-block abstract-reader-block">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="block-label" style={{ margin: 0 }}>Project Abstract & Proposal</h3>
                      {selectedTeam.project?.abstract && (
                        <span className="text-dim font-sm">
                          {selectedTeam.project.abstract.trim().split(/\s+/).filter(Boolean).length} Words
                        </span>
                      )}
                    </div>
                    <div className="abstract-reading-container">
                      <p className="abstract-paragraph">
                        {selectedTeam.project?.abstract || 'No abstract text entered for this proposal.'}
                      </p>
                    </div>

                    {selectedTeam.project?.problemStatement && (
                      <div className="mt-3 p-3 rounded bg-black/20 border border-white/10">
                        <strong className="text-accent text-sm block mb-1">Problem Statement:</strong>
                        <p className="text-sm text-dim">{selectedTeam.project.problemStatement}</p>
                      </div>
                    )}

                    <div className="tech-stack-row mt-3">
                      <strong>Technology Stack:</strong>
                      <span>{selectedTeam.project?.technologyStack || 'Not specified'}</span>
                    </div>
                  </div>

                  {/* Section 3: Supporting Material & Embedded Viewer */}
                  <div className="inspection-block supporting-materials-block">
                    <h3 className="block-label">Supporting Material & Attachments</h3>
                    
                    <div className="attachments-buttons-grid">
                      {selectedTeam.project?.pptFile?.url ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="attachment-btn"
                            onClick={() => setActiveEmbed('ppt')}
                          >
                            <FiFileText /> View PPT ({selectedTeam.project.pptFile.originalName || 'Presentation'})
                          </button>
                          <a
                            href={buildAssetUrl(selectedTeam.project.pptFile.url)}
                            download={selectedTeam.project.pptFile.originalName || 'presentation.ppt'}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-btn"
                            title="Download Presentation"
                            style={{ padding: '0.6rem 0.85rem' }}
                          >
                            <FiDownload />
                          </a>
                        </div>
                      ) : (
                        <span className="attachment-btn disabled" style={{ opacity: 0.6 }}>
                          <FiFileText /> PPT Not Uploaded
                        </span>
                      )}

                      {selectedTeam.project?.supportingDocFile?.url ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="attachment-btn"
                            onClick={() => setActiveEmbed('doc')}
                          >
                            <FiFileText /> View Doc ({selectedTeam.project.supportingDocFile.originalName || 'SupportingDoc'})
                          </button>
                          <a
                            href={buildAssetUrl(selectedTeam.project.supportingDocFile.url)}
                            download={selectedTeam.project.supportingDocFile.originalName || 'supporting-doc.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-btn"
                            title="Download Supporting Document"
                            style={{ padding: '0.6rem 0.85rem' }}
                          >
                            <FiDownload />
                          </a>
                        </div>
                      ) : (
                        <span className="attachment-btn disabled" style={{ opacity: 0.6 }}>
                          <FiDownload /> No Supporting Doc
                        </span>
                      )}

                      {selectedTeam.project?.demoVideoUrl ? (
                        <button
                          type="button"
                          className="attachment-btn video-btn"
                          onClick={() => setActiveEmbed('video')}
                        >
                          <FiVideo /> Watch Video
                        </button>
                      ) : (
                        <span className="attachment-btn disabled" style={{ opacity: 0.6 }}>
                          <FiVideo /> No Video Provided
                        </span>
                      )}

                      {selectedTeam.project?.githubRepository ? (
                        <a
                          href={selectedTeam.project.githubRepository}
                          target="_blank"
                          rel="noreferrer"
                          className="attachment-btn repo-btn"
                        >
                          <FiExternalLink /> GitHub Repo
                        </a>
                      ) : (
                        <span className="attachment-btn disabled" style={{ opacity: 0.6 }}>
                          <FiExternalLink /> No Repo Provided
                        </span>
                      )}
                    </div>

                    {/* Inline Embedded Preview Pane */}
                    {activeEmbed && (
                      <div className="embedded-media-pane mt-3">
                        <div className="pane-header">
                          <span>
                            {activeEmbed === 'ppt' && 'Presentation Deck Viewer'}
                            {activeEmbed === 'doc' && 'Supporting Document Viewer'}
                            {activeEmbed === 'video' && 'Demo Video Stream'}
                          </span>
                          <button type="button" className="btn-close-pane" onClick={() => setActiveEmbed(null)}>
                            <FiX /> Close Preview
                          </button>
                        </div>

                        <div className="pane-content-box">
                          {activeEmbed === 'ppt' && (
                            <iframe
                              src={buildAssetUrl(selectedTeam.project?.pptFile?.url)}
                              title="PPT Preview"
                              className="media-iframe"
                            />
                          )}

                          {activeEmbed === 'doc' && (
                            <iframe
                              src={buildAssetUrl(selectedTeam.project?.supportingDocFile?.url)}
                              title="Document Preview"
                              className="media-iframe"
                            />
                          )}

                          {activeEmbed === 'video' && (
                            <div className="video-wrapper">
                              <iframe
                                src={selectedTeam.project?.demoVideoUrl?.includes('youtu') ? selectedTeam.project.demoVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/') : selectedTeam.project?.demoVideoUrl}
                                title="Video Demo"
                                className="media-iframe"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 4: Complete Team Roster */}
                  {(() => {
                    const leaderId = selectedTeam.leader?._id?.toString() || selectedTeam.leader?.toString() || selectedTeam.leader?.id;
                    const membersList = (selectedTeam.members || []).map((m) => {
                      const mId = m._id?.toString() || m.id || m.toString();
                      const isLeader = mId === leaderId || m.email === selectedTeam.leader?.email;
                      return {
                        ...m,
                        isLeader,
                        role: isLeader ? 'Team Leader' : 'Team Member',
                      };
                    });
                    if (selectedTeam.leader && !membersList.some((m) => m.isLeader || m.email === selectedTeam.leader?.email)) {
                      membersList.unshift({
                        ...selectedTeam.leader,
                        isLeader: true,
                        role: 'Team Leader',
                      });
                    }

                    return (
                      <div className="inspection-block team-roster-block">
                        <h3 className="block-label">Complete Team Members ({membersList.length})</h3>
                        
                        <div className="roster-grid">
                          {membersList.map((m, idx) => (
                            <div key={m._id || m.id || idx} className={`roster-card ${m.isLeader ? 'leader-card' : ''}`}>
                              <div className="role-tag">
                                {m.isLeader ? '👑 Team Leader' : `👤 Member #${idx + 1}`}
                              </div>
                              <strong>{m.name || 'Participant'}</strong>
                              <p>
                                <a href={`mailto:${m.email}`} className="text-dim hover:text-white">{m.email || 'No email'}</a>
                                {' • '}
                                <a href={`tel:${m.phone}`} className="text-dim hover:text-white">{m.phone || 'No phone'}</a>
                              </p>
                              <small>
                                {m.collegeName || m.college || 'College Not Set'} ({m.department || 'Dept Not Set'} • {m.year || 'Year Not Set'})
                              </small>
                              {(m.githubUrl || m.linkedinUrl || m.resumeUrl || m.portfolioUrl) && (
                                <div className="member-socials-row mt-2">
                                  {m.githubUrl && <a href={m.githubUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="GitHub"><FiExternalLink /> GitHub</a>}
                                  {m.linkedinUrl && <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="LinkedIn"><FiExternalLink /> LinkedIn</a>}
                                  {m.resumeUrl && <a href={m.resumeUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="Resume"><FiFileText /> Resume</a>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}


                  {/* Section 5: Review Form & Decision Controls */}
                  <div className="inspection-block review-decision-block">
                    <h3 className="block-label">Evaluator Review & Decision</h3>
                    
                    <div className="decision-form-grid">
                      <label className="field">
                        <span>Evaluation Status Decision *</span>
                        <select
                          value={reviewFormStatus}
                          onChange={(e) => setReviewFormStatus(e.target.value)}
                          className="decision-select"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="under_review">Under Review</option>
                          <option value="selected">Selected for Offline Round</option>
                          <option value="rejected">Rejected / Not Shortlisted</option>
                        </select>
                      </label>

                      <label className="field span-2">
                        <span>Evaluator Remarks & Feedback</span>
                        <textarea
                          rows={3}
                          value={reviewFormRemarks}
                          onChange={(e) => setReviewFormRemarks(e.target.value)}
                          placeholder="Enter technical scoring, feedback, or decision rationale..."
                        />
                      </label>
                    </div>

                    <div className="decision-actions-bar mt-3">
                      <div className="nav-buttons-group">
                        <button
                          type="button"
                          className="nav-queue-btn"
                          onClick={() => handleNavigateQueue('prev')}
                          title="Previous Submission (ArrowUp/Left)"
                        >
                          <FiChevronLeft /> Previous
                        </button>

                        <button
                          type="button"
                          className="nav-queue-btn"
                          onClick={() => handleNavigateQueue('next')}
                          title="Next Submission (ArrowDown/Right)"
                        >
                          Next <FiChevronRight />
                        </button>
                      </div>

                      <div className="save-buttons-group">
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => handleSaveReview(false)}
                          disabled={isSaving}
                        >
                          <FiSave /> Save Review (Ctrl+S)
                        </button>

                        <button
                          type="button"
                          className="primary-action btn-save-next"
                          onClick={() => handleSaveReview(true)}
                          disabled={isSaving}
                        >
                          Save & Next →
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="no-team-selected-placeholder">
                  <FiSliders className="placeholder-icon" />
                  <h3>Select a Submission to Review</h3>
                  <p>Choose any team from the queue list on the left to start evaluating.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PROBLEM STATEMENTS VIEW */}
        {activeView === 'problemStatements' && (
          <div className="admin-subview-container">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Track Management</span>
                <h2>Problem Statements ({problemStatements.length})</h2>
              </div>
              <button
                type="button"
                className="primary-action"
                onClick={openCreatePsModal}
              >
                <FiPlusCircle /> Add New Track
              </button>
            </div>

            <div className="ps-admin-grid mt-4">
              {problemStatements.map((ps, idx) => (
                <div key={ps._id || `ps-${idx}`} className={`dash-card ps-admin-card ${ps.activeStatus === false ? 'ps-inactive' : ''}`}>
                  <div className="ps-card-header">
                    <div className="ps-tags-group">
                      <span className="ps-code">{ps.code}</span>
                      <span className="ps-cat">{ps.theme || ps.category || 'General'}</span>
                      <span className={`ps-type-badge ${ps.type === 'open' ? 'open-tag' : ''}`}>
                        {ps.type === 'open' ? 'Open Track' : 'Official'}
                      </span>
                    </div>
                    <span className={`ps-status-badge ${ps.activeStatus !== false ? 'active' : 'inactive'}`}>
                      {ps.activeStatus !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h4 className="ps-title-text">{ps.title}</h4>
                  <p className="ps-desc-text">{ps.problemStatement || ps.description}</p>

                  {ps.onlineRoundRequirements && (
                    <div className="ps-req-block">
                      <small>Deliverable Requirements:</small>
                      <p>{ps.onlineRoundRequirements}</p>
                    </div>
                  )}

                  <div className="ps-card-actions">
                    <div className="order-buttons">
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => movePsOrder(idx, -1)}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => movePsOrder(idx, 1)}
                        disabled={idx === problemStatements.length - 1}
                        title="Move Down"
                      >
                        <FiArrowDown />
                      </button>
                    </div>

                    <div className="manage-buttons">
                      <button
                        type="button"
                        className={`status-toggle-btn ${ps.activeStatus !== false ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => handleTogglePsStatus(ps)}
                      >
                        {ps.activeStatus !== false ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="edit-ps-btn"
                        onClick={() => openEditPsModal(ps)}
                      >
                        <FiEdit3 /> Edit
                      </button>
                      <button
                        type="button"
                        className="delete-ps-btn"
                        onClick={() => handleDeletePs(ps._id)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATION LEADS VIEW */}
        {activeView === 'leads' && (
          <div className="admin-subview-container">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Pre-Registration Audience</span>
                <h2>Notification Leads ({leads.length})</h2>
              </div>
              <div className="header-actions-row">
                <button type="button" className="secondary-action" onClick={handleExportLeads}>
                  <FiDownload /> Export CSV
                </button>
                <button type="button" className="secondary-action" onClick={loadNotificationLeads}>
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            <div className="leads-search-bar mt-3" style={{ maxWidth: '400px' }}>
              <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15,23,42,0.6)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            <div className="dash-card mt-4" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>#</th>
                      <th style={{ padding: '1rem' }}>Name / Team Lead</th>
                      <th style={{ padding: '1rem' }}>Email Address</th>
                      <th style={{ padding: '1rem' }}>Subscribed Date</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                          {isLeadsLoading ? 'Loading leads from database...' : 'No pre-registration notification leads recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead, idx) => (
                        <tr key={lead._id || `lead-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>{idx + 1}</td>
                          <td style={{ padding: '1rem' }}><strong>{lead.name || 'Not provided'}</strong></td>
                          <td style={{ padding: '1rem' }}>
                            <a href={`mailto:${lead.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                              {lead.email}
                            </a>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                            {lead.createdAt || lead.date ? new Date(lead.createdAt || lead.date).toLocaleString('en-IN') : 'Just now'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {lead._id && (
                              <button
                                type="button"
                                className="icon-action-btn"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                title="Delete lead"
                                onClick={async () => {
                                  if (window.confirm(`Remove ${lead.email} from notification list?`)) {
                                    try {
                                      await api.deleteNotificationLead(lead._id);
                                      loadNotificationLeads();
                                      setToast({ type: 'success', message: 'Lead removed.' });
                                    } catch (err) {
                                      setToast({ type: 'error', message: err.message || 'Failed to delete' });
                                    }
                                  }
                                }}
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EVENT CONFIGURATION VIEW */}
        {activeView === 'eventConfig' && (
          <div className="admin-subview-container">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Event Lifecycle & Configuration</span>
                <h2>Event Configuration</h2>
              </div>
              <div className="header-actions-row">
                <button type="button" className="secondary-action" onClick={loadEventConfig} disabled={isSavingConfig}>
                  <FiRefreshCw /> Reload
                </button>
                <button type="button" className="primary-action" onClick={saveEventConfig} disabled={isSavingConfig}>
                  <FiSave /> {isSavingConfig ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {eventConfig ? (
              <form onSubmit={saveEventConfig} className="event-config-container mt-4">
                {/* Section 1: General Event Info */}
                <div className="config-section-card">
                  <div className="config-section-header">
                    <h3><FiCalendar /> General Event Details</h3>
                    <span className="status-pill status-pill-green">
                      {eventConfig.eventStatus || 'Published'}
                    </span>
                  </div>
                  <div className="config-grid">
                    <label className="field">
                      <span>Event Name *</span>
                      <input
                        required
                        value={eventConfig.eventName || ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, eventName: e.target.value })}
                        placeholder="e.g. Hack With Vizag 4.0"
                      />
                    </label>
                    <label className="field">
                      <span>Event Edition / Year *</span>
                      <input
                        required
                        value={eventConfig.eventYear || ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, eventYear: e.target.value })}
                        placeholder="e.g. 2026"
                      />
                    </label>
                    <label className="field span-2">
                      <span>Event Theme / Motto</span>
                      <input
                        value={eventConfig.theme || ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, theme: e.target.value })}
                        placeholder="e.g. Innovation for Coastal Infrastructure & AI"
                      />
                    </label>
                    <label className="field span-2">
                      <span>Event Venue & Location</span>
                      <input
                        value={eventConfig.venue || ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, venue: e.target.value })}
                        placeholder="e.g. NSRIT Campus Auditorium, Visakhapatnam"
                      />
                    </label>
                    <label className="field span-2">
                      <span>Event Description</span>
                      <textarea
                        rows={3}
                        value={eventConfig.description || ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, description: e.target.value })}
                        placeholder="Event overview and mission statement..."
                      />
                    </label>
                  </div>
                </div>

                {/* Section 2: Milestone Dates & Timeline */}
                <div className="config-section-card">
                  <div className="config-section-header">
                    <h3><FiClock /> Milestone Dates & Deadlines</h3>
                  </div>
                  <div className="config-grid">
                    <label className="field">
                      <span>Registration Start Date</span>
                      <input
                        type="date"
                        value={eventConfig.registrationStartDate ? new Date(eventConfig.registrationStartDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, registrationStartDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Registration End Date</span>
                      <input
                        type="date"
                        value={eventConfig.registrationEndDate ? new Date(eventConfig.registrationEndDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, registrationEndDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Online Submission Deadline</span>
                      <input
                        type="date"
                        value={eventConfig.onlineSubmissionDeadline ? new Date(eventConfig.onlineSubmissionDeadline).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, onlineSubmissionDeadline: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Screening Results Announcement</span>
                      <input
                        type="date"
                        value={eventConfig.screeningResultDate ? new Date(eventConfig.screeningResultDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, screeningResultDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Offline Registration Opens</span>
                      <input
                        type="date"
                        value={eventConfig.offlineRegistrationStartDate ? new Date(eventConfig.offlineRegistrationStartDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, offlineRegistrationStartDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Offline Registration Closes</span>
                      <input
                        type="date"
                        value={eventConfig.offlineRegistrationEndDate ? new Date(eventConfig.offlineRegistrationEndDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, offlineRegistrationEndDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                    <label className="field">
                      <span>Grand Finale Hackathon Date</span>
                      <input
                        type="date"
                        value={eventConfig.hackathonDate ? new Date(eventConfig.hackathonDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEventConfig({ ...eventConfig, hackathonDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Team Sizes & Deliverable Limits */}
                <div className="config-section-card">
                  <div className="config-section-header">
                    <h3><FiUsers /> Team Sizes & Deliverable Limits</h3>
                  </div>
                  <div className="config-grid triple-col">
                    <label className="field">
                      <span>Min Team Size (Members)</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={eventConfig.minTeamSize ?? 1}
                        onChange={(e) => setEventConfig({ ...eventConfig, minTeamSize: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Max Team Size (Members)</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={eventConfig.maxTeamSize ?? 4}
                        onChange={(e) => setEventConfig({ ...eventConfig, maxTeamSize: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Registration Fee (INR)</span>
                      <input
                        type="number"
                        min={0}
                        value={eventConfig.registrationFee ?? 0}
                        onChange={(e) => setEventConfig({ ...eventConfig, registrationFee: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Min Abstract Words</span>
                      <input
                        type="number"
                        min={10}
                        value={eventConfig.minAbstractWords ?? 50}
                        onChange={(e) => setEventConfig({ ...eventConfig, minAbstractWords: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Max Abstract Words</span>
                      <input
                        type="number"
                        min={50}
                        value={eventConfig.maxAbstractWords ?? 500}
                        onChange={(e) => setEventConfig({ ...eventConfig, maxAbstractWords: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      <span>Max PPT Deck Size (MB)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={eventConfig.maxPptSizeMb ?? 15}
                        onChange={(e) => setEventConfig({ ...eventConfig, maxPptSizeMb: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 4: Status & Prize Pool */}
                <div className="config-section-card">
                  <div className="config-section-header">
                    <h3><FiShield /> Status & Prize Pool</h3>
                  </div>
                  <div className="config-grid">
                    <label className="field">
                      <span>Lifecycle Status</span>
                      <select
                        value={eventConfig.eventStatus || 'Published'}
                        onChange={(e) => setEventConfig({ ...eventConfig, eventStatus: e.target.value })}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published (Live)</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </label>
                    <label className="field checkbox-field" style={{ alignSelf: 'center', marginTop: '1.2rem' }}>
                      <input
                        type="checkbox"
                        checked={eventConfig.activeEvent !== false}
                        onChange={(e) => setEventConfig({ ...eventConfig, activeEvent: e.target.checked })}
                      />
                      <span>Active Hackathon Event</span>
                    </label>
                    <label className="field">
                      <span>Total Prize Pool</span>
                      <input
                        value={eventConfig.prizePool?.total || ''}
                        onChange={(e) => setEventConfig({
                          ...eventConfig,
                          prizePool: { ...(eventConfig.prizePool || {}), total: e.target.value },
                        })}
                        placeholder="e.g. INR 1,50,000+"
                      />
                    </label>
                    <label className="field">
                      <span>First Prize</span>
                      <input
                        value={eventConfig.prizePool?.firstPrize || ''}
                        onChange={(e) => setEventConfig({
                          ...eventConfig,
                          prizePool: { ...(eventConfig.prizePool || {}), firstPrize: e.target.value },
                        })}
                        placeholder="e.g. INR 75,000"
                      />
                    </label>
                  </div>
                </div>

                {/* Section 5: Organizer Contact Info */}
                <div className="config-section-card">
                  <div className="config-section-header">
                    <h3><FiMail /> Organizer & Support Contact</h3>
                  </div>
                  <div className="config-grid">
                    <label className="field">
                      <span>Contact Email</span>
                      <input
                        type="email"
                        value={eventConfig.contactInfo?.email || ''}
                        onChange={(e) => setEventConfig({
                          ...eventConfig,
                          contactInfo: { ...(eventConfig.contactInfo || {}), email: e.target.value },
                        })}
                        placeholder="hackwithvizag@nsrit.edu.in"
                      />
                    </label>
                    <label className="field">
                      <span>Contact Phone</span>
                      <input
                        type="tel"
                        value={eventConfig.contactInfo?.phone || ''}
                        onChange={(e) => setEventConfig({
                          ...eventConfig,
                          contactInfo: { ...(eventConfig.contactInfo || {}), phone: e.target.value },
                        })}
                        placeholder="+91 91234 56789"
                      />
                    </label>
                    <label className="field span-2">
                      <span>Campus Address</span>
                      <input
                        value={eventConfig.contactInfo?.address || ''}
                        onChange={(e) => setEventConfig({
                          ...eventConfig,
                          contactInfo: { ...(eventConfig.contactInfo || {}), address: e.target.value },
                        })}
                        placeholder="NSRIT Campus, Sontyam, Visakhapatnam"
                      />
                    </label>
                  </div>
                </div>

                <div className="config-actions-bar">
                  <button type="button" className="secondary-action" onClick={loadEventConfig} disabled={isSavingConfig}>
                    Discard Unsaved
                  </button>
                  <button type="submit" className="primary-action" disabled={isSavingConfig}>
                    <FiSave /> {isSavingConfig ? 'Saving Changes...' : 'Save Event Configuration'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-loading-screen mt-4">
                <div className="loading-spinner" />
                <p>Loading event configuration...</p>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' && (
          <div className="admin-subview-container">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Real-Time Intelligence</span>
                <h2>Platform Analytics</h2>
              </div>
              <div className="header-actions-row">
                <button type="button" className="secondary-action" onClick={() => handleExportData('csv')}>
                  <FiDownload /> Export CSV
                </button>
                <button type="button" className="secondary-action" onClick={loadAnalytics} disabled={isLoading}>
                  <FiRefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {isLoading && !analytics ? (
              <div className="admin-loading-screen mt-4">
                <div className="loading-spinner" />
                <p>Calculating database aggregations...</p>
              </div>
            ) : !analytics || analytics.summary?.totalTeams === 0 ? (
              <div className="dash-card empty-analytics-box mt-4">
                <FiBarChart2 className="empty-analytics-icon" />
                <h3>No registration data available yet.</h3>
                <p className="text-dim">When participants register teams and submit proposals, live analytics and charts will populate here automatically.</p>
                <button type="button" className="primary-action mt-3" onClick={loadAnalytics}>
                  <FiRefreshCw /> Check Again
                </button>
              </div>
            ) : (
              <div className="analytics-view-container mt-4">
                {/* KPI Cards Row */}
                <div className="analytics-kpi-row">
                  <div className="kpi-card shadow-glow">
                    <div className="kpi-icon-box blue"><FiUsers /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Total Teams</span>
                      <strong className="kpi-val">{analytics.summary.totalTeams}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box green"><FiUsers /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Total Participants</span>
                      <strong className="kpi-val">{analytics.summary.totalParticipants}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box cyan"><FiLayers /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Colleges Represented</span>
                      <strong className="kpi-val">{analytics.summary.totalColleges}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box indigo"><FiFileText /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Submitted Proposals</span>
                      <strong className="kpi-val">{analytics.summary.totalProjects}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box amber"><FiClock /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Under Review</span>
                      <strong className="kpi-val">{analytics.summary.pendingReviews}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box green"><FiCheckCircle /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Selected Teams</span>
                      <strong className="kpi-val">{analytics.summary.selectedTeams}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box red"><FiXCircle /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Rejected Teams</span>
                      <strong className="kpi-val">{analytics.summary.rejectedTeams}</strong>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-box purple"><FiActivity /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">Acceptance Rate</span>
                      <strong className="kpi-val">{analytics.summary.selectionPercentage}%</strong>
                    </div>
                  </div>
                </div>

                {/* Track / Problem Statement Breakdown Table */}
                <div className="dash-card">
                  <div className="config-section-header">
                    <h3><FiLayers /> Problem Statement & Track Distribution</h3>
                    <span className="text-dim font-sm">
                      Official Tracks: <strong>{analytics.summary.officialProblemCount}</strong> • Open Innovation: <strong>{analytics.summary.openInnovationCount}</strong>
                    </span>
                  </div>

                  <div className="table-responsive mt-3">
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                          <th style={{ padding: '0.85rem 1rem' }}>Track Code</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Problem Statement Title</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Category / Theme</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Track Type</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Teams</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.charts?.problemStatementStats && analytics.charts.problemStatementStats.length > 0 ? (
                          analytics.charts.problemStatementStats.map((ps) => (
                            <tr key={ps.id || ps.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span className="ps-code">{ps.code}</span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <strong>{ps.title}</strong>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                                {ps.theme}
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span className={`ps-type-badge ${ps.type === 'open' ? 'open-tag' : ''}`}>
                                  {ps.type === 'open' ? 'Open Track' : 'Official'}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>
                                {ps.count}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                <span className="stat-badge-percent">{ps.percentage}%</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                              No problem statement statistics available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2-Column Analytics Distribution Grid */}
                <div className="analytics-grid-two-col">
                  {/* Colleges Breakdown */}
                  <div className="dash-card">
                    <div className="config-section-header">
                      <h3><FiUsers /> Top Participating Institutions</h3>
                    </div>
                    <div className="distribution-list">
                      {analytics.charts?.collegeWiseRegistrationCount && analytics.charts.collegeWiseRegistrationCount.length > 0 ? (
                        analytics.charts.collegeWiseRegistrationCount.slice(0, 8).map((item, idx) => {
                          const maxCount = analytics.charts.collegeWiseRegistrationCount[0]?.count || 1;
                          const pct = Math.round((item.count / maxCount) * 100);
                          return (
                            <div key={idx} className="distribution-item">
                              <div className="dist-info-row">
                                <span className="truncate-text" style={{ maxWidth: '75%' }}>{item.label}</span>
                                <strong>{item.count} {item.count === 1 ? 'student' : 'students'}</strong>
                              </div>
                              <div className="dist-bar-track">
                                <div className="dist-bar-fill cyan" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-dim font-sm">No college participation data yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Department / Branch Breakdown */}
                  <div className="dash-card">
                    <div className="config-section-header">
                      <h3><FiLayers /> Branch & Department Distribution</h3>
                    </div>
                    <div className="distribution-list">
                      {analytics.charts?.departmentWiseRegistrationCount && analytics.charts.departmentWiseRegistrationCount.length > 0 ? (
                        analytics.charts.departmentWiseRegistrationCount.slice(0, 8).map((item, idx) => {
                          const maxCount = analytics.charts.departmentWiseRegistrationCount[0]?.count || 1;
                          const pct = Math.round((item.count / maxCount) * 100);
                          return (
                            <div key={idx} className="distribution-item">
                              <div className="dist-info-row">
                                <span className="truncate-text" style={{ maxWidth: '75%' }}>{item.label}</span>
                                <strong>{item.count}</strong>
                              </div>
                              <div className="dist-bar-track">
                                <div className="dist-bar-fill green" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-dim font-sm">No department data yet.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && (
          <div className="admin-subview-container">
            <div className="workspace-header">
              <div>
                <span className="section-subtitle">Admin Account & Platform Preferences</span>
                <h2>Settings</h2>
              </div>
            </div>

            {/* Settings Navigation Tabs */}
            <div className="settings-tabs-row mt-3">
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setSettingsTab('profile')}
              >
                <FiUsers /> Admin Profile
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === 'security' ? 'active' : ''}`}
                onClick={() => setSettingsTab('security')}
              >
                <FiLock /> Security & Password
              </button>
              <button
                type="button"
                className={`settings-tab-btn ${settingsTab === 'event' ? 'active' : ''}`}
                onClick={() => setSettingsTab('event')}
              >
                <FiSliders /> Registration Preferences
              </button>
            </div>

            <div className="settings-view-container mt-4">
              {/* Tab 1: Admin Profile */}
              {settingsTab === 'profile' && (
                <div className="dash-card">
                  <div className="config-section-header">
                    <h3><FiUsers /> Admin Profile Information</h3>
                    <span className="status-pill status-pill-green">Admin Role</span>
                  </div>

                  <form onSubmit={handleSaveProfile} className="profile-card-content mt-3">
                    <div className="profile-avatar-box">
                      {profileForm.name ? profileForm.name[0].toUpperCase() : 'A'}
                    </div>

                    <div className="profile-form-area form-grid compact">
                      <label className="field">
                        <span>Full Name *</span>
                        <input
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="Admin full name"
                        />
                      </label>

                      <label className="field">
                        <span>Email Address (Read-Only)</span>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                        <small className="text-dim">Admin email is managed centrally.</small>
                      </label>

                      <label className="field">
                        <span>Contact Phone</span>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </label>

                      <label className="field">
                        <span>Institution / College</span>
                        <input
                          value={profileForm.college}
                          onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                          placeholder="e.g. NSRIT Visakhapatnam"
                        />
                      </label>

                      <label className="field">
                        <span>Department / Division</span>
                        <input
                          value={profileForm.department}
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                          placeholder="e.g. Computer Science Engineering"
                        />
                      </label>

                      <label className="field">
                        <span>Designation / Role</span>
                        <input
                          value={profileForm.year}
                          onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                          placeholder="e.g. Hackathon Lead Organizer"
                        />
                      </label>

                      <div className="span-2 mt-2 flex justify-end">
                        <button type="submit" className="primary-action" disabled={isSavingProfile}>
                          <FiSave /> {isSavingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Security & Password */}
              {settingsTab === 'security' && (
                <div className="dash-card">
                  <div className="config-section-header">
                    <h3><FiLock /> Change Admin Password</h3>
                  </div>

                  <form onSubmit={handleChangePassword} className="form-grid compact mt-3" style={{ maxWidth: '560px' }}>
                    <label className="field span-2">
                      <span>Current Password *</span>
                      <input
                        required
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                    </label>

                    <label className="field span-2">
                      <span>New Password (Min 8 characters) *</span>
                      <input
                        required
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new strong password"
                      />
                    </label>

                    <label className="field span-2">
                      <span>Confirm New Password *</span>
                      <input
                        required
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                      />
                    </label>

                    <div className="span-2 mt-2 flex justify-end">
                      <button type="submit" className="primary-action" disabled={isSavingPassword}>
                        <FiLock /> {isSavingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Registration Preferences */}
              {settingsTab === 'event' && (
                <div className="dash-card">
                  <div className="config-section-header">
                    <h3><FiSliders /> Registration & Platform Controls</h3>
                  </div>

                  {eventConfig ? (
                    <form onSubmit={saveEventConfig} className="form-grid compact mt-3">
                      <label className="field">
                        <span>Registration Status</span>
                        <select
                          value={eventConfig.eventStatus || 'Published'}
                          onChange={(e) => setEventConfig({ ...eventConfig, eventStatus: e.target.value })}
                        >
                          <option value="Published">Open / Live (Accepting Registrations)</option>
                          <option value="Draft">Draft (Registrations Soon)</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </label>

                      <label className="field">
                        <span>Active Event</span>
                        <select
                          value={eventConfig.activeEvent !== false ? 'true' : 'false'}
                          onChange={(e) => setEventConfig({ ...eventConfig, activeEvent: e.target.value === 'true' })}
                        >
                          <option value="true">Active Event</option>
                          <option value="false">Inactive / Archived</option>
                        </select>
                      </label>

                      <label className="field">
                        <span>Minimum Team Size</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={eventConfig.minTeamSize ?? 1}
                          onChange={(e) => setEventConfig({ ...eventConfig, minTeamSize: Number(e.target.value) })}
                        />
                      </label>

                      <label className="field">
                        <span>Maximum Team Size</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={eventConfig.maxTeamSize ?? 4}
                          onChange={(e) => setEventConfig({ ...eventConfig, maxTeamSize: Number(e.target.value) })}
                        />
                      </label>

                      <div className="span-2 mt-2 flex justify-end">
                        <button type="submit" className="primary-action" disabled={isSavingConfig}>
                          <FiSave /> {isSavingConfig ? 'Saving...' : 'Save Registration Settings'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-dim">Loading configuration settings...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {/* PROBLEM STATEMENT CREATE/EDIT MODAL */}
        {isPsModalOpen && (
          <div className="admin-modal-overlay" onClick={() => setIsPsModalOpen(false)}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-flex">
                <h3>{editingPs ? 'Edit Problem Statement Track' : 'Create Problem Statement Track'}</h3>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setIsPsModalOpen(false)}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSavePs} className="form-grid compact mt-3">
                <label className="field">
                  <span>Track Code *</span>
                  <input
                    required
                    value={psForm.code}
                    onChange={(e) => setPsForm({ ...psForm, code: e.target.value })}
                    placeholder="e.g. HWV-05"
                  />
                </label>

                <label className="field">
                  <span>Track Type *</span>
                  <select
                    value={psForm.type}
                    onChange={(e) => setPsForm({ ...psForm, type: e.target.value })}
                  >
                    <option value="official">Official Track</option>
                    <option value="open">Open Innovation Track</option>
                  </select>
                </label>

                <label className="field span-2">
                  <span>Track Title *</span>
                  <input
                    required
                    value={psForm.title}
                    onChange={(e) => setPsForm({ ...psForm, title: e.target.value })}
                    placeholder="e.g. AI-Powered Coastal Hazard Monitoring"
                  />
                </label>

                <label className="field span-2">
                  <span>Theme / Category *</span>
                  <input
                    required
                    value={psForm.theme}
                    onChange={(e) => setPsForm({ ...psForm, theme: e.target.value })}
                    placeholder="e.g. Sustainability & Marine Tech"
                  />
                </label>

                <label className="field span-2">
                  <span>Problem Description *</span>
                  <textarea
                    required
                    rows={4}
                    value={psForm.problemStatement}
                    onChange={(e) => setPsForm({ ...psForm, problemStatement: e.target.value })}
                    placeholder="Describe the challenge details and problem statement..."
                  />
                </label>

                <label className="field span-2">
                  <span>Key Objectives (One per line)</span>
                  <textarea
                    rows={3}
                    value={psForm.objectives}
                    onChange={(e) => setPsForm({ ...psForm, objectives: e.target.value })}
                    placeholder="Objective 1&#10;Objective 2&#10;Objective 3"
                  />
                </label>

                <label className="field span-2">
                  <span>Online Round Deliverable Requirements *</span>
                  <textarea
                    required
                    rows={2}
                    value={psForm.onlineRoundRequirements}
                    onChange={(e) => setPsForm({ ...psForm, onlineRoundRequirements: e.target.value })}
                    placeholder="e.g. Technical deck PPT, architecture diagram, working demo link."
                  />
                </label>

                <label className="field checkbox-field span-2">
                  <input
                    type="checkbox"
                    checked={psForm.activeStatus}
                    onChange={(e) => setPsForm({ ...psForm, activeStatus: e.target.checked })}
                  />
                  <span>Active Track (Visible to participants during registration)</span>
                </label>

                <div className="admin-modal-actions span-2">
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => setIsPsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-action">
                    {editingPs ? 'Save Changes' : 'Create Track'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}
