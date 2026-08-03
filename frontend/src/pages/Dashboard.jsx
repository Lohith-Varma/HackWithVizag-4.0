import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit3,
  FiInfo,
  FiLogOut,
  FiShield,
  FiUsers,
  FiVideo,
  FiFileText,
  FiAlertTriangle,
} from 'react-icons/fi';
import RegistrationSummary from '../components/Dashboard/RegistrationSummary';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import {
  clearCurrentUser,
  loadCurrentUser,
  loadDraftRegistration,
} from '../utils/registrationStorage';
import './Portal.css';

const TIMELINE_STAGES = [
  { id: 'Draft', label: 'Draft' },
  { id: 'Submitted', label: 'Submitted' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'Selected', label: 'Selected' },
  { id: 'Offline Registration', label: 'Offline Registration' },
];

export default function Dashboard() {
  const currentUser = loadCurrentUser();
  const draft = loadDraftRegistration();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [offlineForm, setOfflineForm] = useState({ contactName: '', contactPhone: '', arrivalDate: '', accommodationRequired: false });
  const [offlineStatus, setOfflineStatus] = useState(null); // null | 'completed' | 'in_progress'
  const [offlineError, setOfflineError] = useState(null);
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getParticipantDashboard();
      setDashboardData(data);

      // Check Offline Registration Eligibility if Selected
      if (data.team?.currentStatus === 'selected') {
        api.getOfflineRegistrationEligibility(data.team._id)
          .then(() => setOfflineError(null))
          .catch((err) => setOfflineError(err.message || 'Offline registration access denied'));
      }
    } catch {
      // Fallback if backend auth not active in offline mode
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const user = dashboardData?.user || currentUser || {};
  const team = dashboardData?.team || null;
  const project = dashboardData?.project || null;
  const submission = dashboardData?.submission || null;
  const currentStage = dashboardData?.timelineStage || (submission ? 'Under Review' : 'Draft');
  const status = team?.currentStatus || submission?.status || 'draft';
  const registrationId = dashboardData?.registrationId || 'HWV-2026-PENDING';

  const registrationData = {
    personal: {
      fullName: user.name || draft.personal?.fullName || '',
      email: user.email || draft.personal?.email || '',
      phone: user.phone || draft.personal?.phone || '',
      collegeName: user.college || user.collegeName || draft.personal?.collegeName || '',
      department: user.department || draft.personal?.department || '',
      year: user.year || draft.personal?.year || '',
    },
    team: {
      teamName: team?.teamName || draft.team?.teamName || '',
      teamLeader: team?.leader?.name || draft.team?.teamLeader || user.name || '',
      members: team?.members ? team.members.slice(1).map((m) => ({
        fullName: m.name,
        email: m.email,
        phone: m.phone,
        college: m.college || m.collegeName,
        department: m.department,
        year: m.year,
      })) : (draft.team?.members || []),
    },
    project: {
      problemCode: project?.problemCode || draft.project?.problemCode || '',
      problemType: project?.problemType || draft.project?.problemType || 'official',
      title: project?.title || draft.project?.title || '',
      theme: project?.theme || draft.project?.theme || '',
      problemStatement: project?.problemStatement || draft.project?.problemStatement || '',
      abstract: project?.abstract || draft.project?.abstract || '',
      technologyStack: project?.technologyStack || draft.project?.technologyStack || '',
      githubRepository: project?.githubRepository || draft.project?.githubRepository || '',
      demoVideoUrl: project?.demoVideoUrl || draft.project?.demoVideoUrl || '',
    },
    uploads: {
      pptFile: project?.pptFile?.url ? { name: project.pptFile.originalName || 'Presentation.ppt', size: project.pptFile.size } : draft.uploads?.pptFile,
      supportingDocFile: project?.supportingDocFile?.url ? { name: project.supportingDocFile.originalName || 'Doc.pdf', size: project.supportingDocFile.size } : draft.uploads?.supportingDocFile,
    },
  };

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!team?._id) return;
    setIsSubmittingOffline(true);
    setOfflineError(null);
    try {
      await api.saveOfflineRegistration(team._id, offlineForm);
      await api.completeOfflineRegistration(team._id);
      setOfflineStatus('completed');
      setToast({ type: 'success', message: 'Offline registration confirmed successfully!' });
    } catch (err) {
      setOfflineError(err.message || '403 Forbidden: You are not eligible for offline registration.');
      setToast({ type: 'error', message: err.message || 'Offline registration failed' });
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    clearCurrentUser();
    window.location.hash = '#auth';
  };

  const downloadAcknowledgement = async () => {
    await api.downloadAcknowledgement();
    setToast({ type: 'info', message: 'Acknowledgement downloaded successfully.' });
  };

  const getStageIndex = (stageName) => {
    const map = {
      Draft: 0,
      Submitted: 1,
      'Under Review': 2,
      Selected: 3,
      'Offline Registration': 4,
    };
    return map[stageName] ?? 0;
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <main className="portal-page">
      <section className="portal-shell dashboard-shell">
        {/* Header Bar */}
        <div className="dashboard-header">
          <div>
            <span className="section-subtitle">Participant Workspace</span>
            <h1>Welcome, {user.name || 'Participant'}</h1>
            <p>Track your registration status, timeline, and screening results in real time.</p>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="secondary-action compact-action" onClick={logout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {/* Welcome & Overview Card */}
        <div className="dashboard-metrics-grid">
          <article className="metric-card shadow-glow">
            <div className="metric-header">
              <span>Registration Status</span>
              <FiShield className="metric-icon" />
            </div>
            <strong className={`status-text status-${status}`}>{status.replace('_', ' ').toUpperCase()}</strong>
            <small>Reg ID: {registrationId}</small>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span>Team Name</span>
              <FiUsers className="metric-icon" />
            </div>
            <strong>{registrationData.team.teamName || 'Not Created'}</strong>
            <small>{1 + (registrationData.team.members?.length || 0)} Total Members</small>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span>Selected Track</span>
              <FiFileText className="metric-icon" />
            </div>
            <strong>{registrationData.project.problemCode || 'Open Innovation'}</strong>
            <small className="truncate-text">{registrationData.project.title || 'No project title'}</small>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span>Submission Date</span>
              <FiClock className="metric-icon" />
            </div>
            <strong>
              {submission?.finalSubmittedAt
                ? new Date(submission.finalSubmittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'In Draft'}
            </strong>
            <small>{submission?.finalSubmittedAt ? 'Locked for review' : 'Action Required'}</small>
          </article>
        </div>

        {/* Interactive Timeline Stepper */}
        <div className="dashboard-timeline-card">
          <span className="section-subtitle">Progress Roadmap</span>
          <h3>Hackathon Stage Timeline</h3>
          <div className="dashboard-timeline-track">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isCurrent = idx === activeIndex;
              const isPassed = idx < activeIndex;
              return (
                <div
                  key={stage.id}
                  className={`timeline-node ${isCurrent ? 'active-node' : ''} ${isPassed ? 'passed-node' : ''}`}
                >
                  <div className="node-icon">
                    {isPassed ? <FiCheckCircle /> : idx + 1}
                  </div>
                  <span className="node-label">{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Grid: Announcements & Offline Registration */}
        <div className="dashboard-grid">
          {/* Announcements Widget */}
          <article className="announcements-card">
            <div className="card-header-flex">
              <div>
                <span className="section-subtitle">Announcements</span>
                <h3>Latest Updates</h3>
              </div>
              <FiInfo className="info-icon" />
            </div>
            <div className="announcements-list">
              {(dashboardData?.announcements || [
                {
                  id: '1',
                  title: 'Hack With Vizag 4.0 Registration Live',
                  content: 'Complete all 6 steps of the wizard before the submission deadline.',
                  date: new Date().toISOString(),
                },
                {
                  id: '2',
                  title: 'Presentation & Deck Guidelines',
                  content: 'Upload your 10-slide deck in .ppt or .pdf format with working video demo links.',
                  date: new Date().toISOString(),
                },
              ]).map((item) => (
                <div key={item.id} className="announcement-item">
                  <strong>{item.title}</strong>
                  <p>{item.content}</p>
                  <small>{new Date(item.date).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </article>

          {/* Offline Registration Card (Only Visible if Status === 'selected') */}
          <article className={`offline-reg-card ${status === 'selected' ? 'unlocked' : 'locked'}`}>
            <div className="card-header-flex">
              <div>
                <span className="section-subtitle">Offline Phase</span>
                <h3>Offline Registration</h3>
              </div>
              <FiShield className="shield-icon" />
            </div>

            {status === 'selected' ? (
              <div className="offline-content">
                <div className="success-banner">
                  <FiCheckCircle />
                  <span>Your team has been shortlisted for the offline round!</span>
                </div>

                {offlineStatus === 'completed' ? (
                  <div className="offline-complete-box">
                    <h4>Offline Registration Completed!</h4>
                    <p>Your team status is confirmed for the hackathon venue. See you at the hackathon!</p>
                  </div>
                ) : (
                  <form onSubmit={handleOfflineSubmit} className="form-grid compact mt-3">
                    <label className="field">
                      <span>Primary Contact Name *</span>
                      <input
                        required
                        value={offlineForm.contactName}
                        onChange={(e) => setOfflineForm({ ...offlineForm, contactName: e.target.value })}
                        placeholder="Contact person name"
                      />
                    </label>

                    <label className="field">
                      <span>Primary Contact Phone *</span>
                      <input
                        required
                        type="tel"
                        value={offlineForm.contactPhone}
                        onChange={(e) => setOfflineForm({ ...offlineForm, contactPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </label>

                    <label className="field">
                      <span>Expected Arrival Date</span>
                      <input
                        type="date"
                        value={offlineForm.arrivalDate}
                        onChange={(e) => setOfflineForm({ ...offlineForm, arrivalDate: e.target.value })}
                      />
                    </label>

                    <label className="field checkbox-field">
                      <input
                        type="checkbox"
                        checked={offlineForm.accommodationRequired}
                        onChange={(e) => setOfflineForm({ ...offlineForm, accommodationRequired: e.target.checked })}
                      />
                      <span>Require Campus Accommodation</span>
                    </label>

                    {offlineError && <small className="error-text">{offlineError}</small>}

                    <button type="submit" className="primary-action w-full mt-2" disabled={isSubmittingOffline}>
                      {isSubmittingOffline ? 'Confirming...' : 'Confirm Offline Participation'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="offline-locked-notice">
                <FiAlertTriangle className="notice-icon" />
                {status === 'rejected' ? (
                  <p>Your team was not shortlisted for the offline round. Thank you for participating!</p>
                ) : (
                  <p>Your submission is currently under review by the screening committee. Offline registration will unlock automatically if your team is selected.</p>
                )}
              </div>
            )}
          </article>
        </div>

        {/* Full Registration Snapshot View */}
        <div className="dashboard-main-card">
          <div className="dashboard-main-header">
            <div>
              <span className="section-subtitle">Registration Overview</span>
              <h2>{registrationData.project.title || 'Project Draft'}</h2>
              <p>Team: {registrationData.team.teamName || 'Not Created'}</p>
            </div>
            <div className="dashboard-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => { window.location.hash = '#registration'; }}
              >
                <FiEdit3 /> {submission ? 'View Submission' : 'Edit Registration'}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={downloadAcknowledgement}
              >
                <FiDownload /> Acknowledgement
              </button>
            </div>
          </div>

          <RegistrationSummary data={registrationData} />
        </div>
      </section>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
