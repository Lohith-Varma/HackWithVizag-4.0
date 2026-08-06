import { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit3,
  FiInfo,
  FiLogOut,
  FiUsers,
  FiFileText,
  FiAlertTriangle,
  FiAward,
  FiCalendar,
  FiArrowRight,
  FiX,
  FiExternalLink,
  FiCheck,
  FiMapPin,
  FiVideo,
} from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import {
  clearCurrentUser,
  loadCurrentUser,
  loadDraftRegistration,
} from '../utils/registrationStorage';
import { formatBytes } from '../utils/registrationValidation';
import './Portal.css';

const TIMELINE_STAGES = [
  { id: 'Draft', label: 'Draft', icon: FiEdit3 },
  { id: 'Submitted', label: 'Submitted', icon: FiCheckCircle },
  { id: 'Under Review', label: 'Under Review', icon: FiClock },
  { id: 'Selected', label: 'Selected', icon: FiAward },
  { id: 'Offline Registration', label: 'Offline Reg', icon: FiMapPin },
];

const STATUS_CONFIGS = {
  draft: {
    badgeLabel: 'Draft',
    badgeColor: 'gray',
    badgeIcon: FiEdit3,
    title: 'Complete Your Registration',
    description: 'Finish all steps of your application to submit your project before the deadline.',
    actionLabel: 'Complete Registration',
    actionRoute: '#registration',
    themeClass: 'status-card-draft',
  },
  submitted: {
    badgeLabel: 'Submitted',
    badgeColor: 'blue',
    badgeIcon: FiCheckCircle,
    title: 'Your Submission Has Been Received',
    description: 'Your project details and presentation have been recorded. Screening will begin shortly.',
    actionLabel: 'View Submission Details',
    actionModal: 'submission',
    themeClass: 'status-card-submitted',
  },
  under_review: {
    badgeLabel: 'Under Review',
    badgeColor: 'yellow',
    badgeIcon: FiClock,
    title: 'Submission Currently Under Review',
    description: 'The screening committee is evaluating your project proposal against the judging criteria.',
    actionLabel: 'View Submission Details',
    actionModal: 'submission',
    themeClass: 'status-card-review',
  },
  selected: {
    badgeLabel: 'Selected',
    badgeColor: 'green',
    badgeIcon: FiAward,
    title: 'Congratulations! Your Team is Selected!',
    description: 'You have been shortlisted for the final offline hackathon round at NSRIT Visakhapatnam.',
    actionLabel: 'Proceed to Offline Registration',
    actionTarget: 'offline-section',
    themeClass: 'status-card-selected',
  },
  rejected: {
    badgeLabel: 'Rejected',
    badgeColor: 'red',
    badgeIcon: FiAlertTriangle,
    title: 'Thank You for Participating',
    description: 'Unfortunately, your submission was not shortlisted for the offline round. We appreciate your participation.',
    actionLabel: 'Download Acknowledgement',
    actionFunction: 'downloadAck',
    themeClass: 'status-card-rejected',
  },
};

export default function Dashboard() {
  const currentUser = loadCurrentUser();
  const draft = loadDraftRegistration();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [offlineForm, setOfflineForm] = useState({ contactName: '', contactPhone: '', arrivalDate: '', accommodationRequired: false });
  const [offlineStatus, setOfflineStatus] = useState(null);
  const [offlineError, setOfflineError] = useState(null);
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [toast, setToast] = useState(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState(null); // 'team' | 'announcements' | 'submission' | null

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getParticipantDashboard();
      setDashboardData(data);

      if (data.team?.currentStatus === 'selected') {
        api.getOfflineRegistrationEligibility(data.team._id)
          .then(() => setOfflineError(null))
          .catch((err) => setOfflineError(err.message || 'Offline registration access denied'));
      }
    } catch {
      // Fallback mode
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
  const rawStatus = team?.currentStatus || submission?.status || 'draft';
  const status = rawStatus.toLowerCase().replace(' ', '_');
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
  const statusConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.draft;
  const BadgeIcon = statusConfig.badgeIcon;

  const handlePrimaryActionClick = () => {
    if (statusConfig.actionRoute) {
      window.location.hash = statusConfig.actionRoute;
    } else if (statusConfig.actionModal) {
      setActiveModal(statusConfig.actionModal);
    } else if (statusConfig.actionTarget) {
      const el = document.getElementById(statusConfig.actionTarget);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (statusConfig.actionFunction === 'downloadAck') {
      downloadAcknowledgement();
    }
  };

  const allAnnouncements = dashboardData?.announcements || [
    {
      id: '1',
      title: 'Hack With Vizag 4.0 Registration Live',
      content: 'Complete all 5 steps of the application wizard before the deadline.',
      date: '2026-08-01',
    },
    {
      id: '2',
      title: 'Presentation & Deck Guidelines',
      content: 'Upload your presentation deck in .ppt or .pdf format with working video demo links.',
      date: '2026-08-02',
    },
    {
      id: '3',
      title: 'Screening Schedule Announced',
      content: 'Initial screening results will be announced on August 25, 2026.',
      date: '2026-08-03',
    },
  ];

  const latestAnnouncements = allAnnouncements.slice(0, 3);

  const upcomingDates = [
    { label: 'Screening Results', date: 'Aug 25, 2026', icon: FiClock, status: 'upcoming' },
    { label: 'Offline Registration Opens', date: 'Sept 1, 2026', icon: FiMapPin, status: 'upcoming' },
    { label: 'Hackathon Grand Event', date: 'Sept 25-26, 2026', icon: FiCalendar, status: 'event' },
  ];

  return (
    <main className="portal-page participant-dashboard-page">
      <section className="portal-shell dashboard-shell">
        
        {/* TOP SECTION: Welcome & Status Header */}
        <div className="dash-top-bar">
          <div className="welcome-group">
            <h1 className="welcome-title">
              Welcome back, {registrationData.personal.fullName || 'Participant'} 👋
            </h1>
            <p className="team-subtitle">
              Team: <strong>{registrationData.team.teamName || 'Individual / Pending Team'}</strong>
            </p>
          </div>

          <div className="status-badge-container">
            <div className={`status-pill status-pill-${statusConfig.badgeColor}`}>
              <BadgeIcon className="badge-pill-icon" />
              <span>{statusConfig.badgeLabel}</span>
            </div>
            <small className="reg-id-text">ID: {registrationId}</small>
          </div>
        </div>

        {/* PRIMARY ACTION CARD (Largest focal card) */}
        <div className={`primary-focal-card ${statusConfig.themeClass}`}>
          <div className="focal-card-glow" />
          <div className="focal-card-content">
            <div className="focal-header-row">
              <div className="focal-icon-badge">
                <BadgeIcon />
              </div>
              <span className={`focal-tag tag-${statusConfig.badgeColor}`}>
                Current Priority
              </span>
            </div>

            <h2 className="focal-title">{statusConfig.title}</h2>
            <p className="focal-desc">{statusConfig.description}</p>

            <div className="focal-action-row">
              <button
                type="button"
                className="btn-focal-primary"
                onClick={handlePrimaryActionClick}
              >
                {statusConfig.actionLabel} <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* REGISTRATION TIMELINE (Stage Roadmap) */}
        <div className="dash-card timeline-stage-card">
          <div className="card-top-header">
            <h3 className="card-heading">Registration Timeline</h3>
            <span className="current-stage-tag">
              Current Stage: <strong>{currentStage}</strong>
            </span>
          </div>

          <div className="stage-timeline-container">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isCurrent = idx === activeIndex;
              const isPassed = idx < activeIndex;
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`stage-item ${isCurrent ? 'stage-current' : ''} ${isPassed ? 'stage-passed' : ''}`}
                >
                  <div className="stage-node-icon">
                    {isPassed ? <FiCheck /> : <StageIcon />}
                  </div>
                  <span className="stage-node-label">{stage.label}</span>
                  {idx < TIMELINE_STAGES.length - 1 && <div className="stage-connector-line" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECONDARY INFORMATION GRID */}
        <div className="dash-secondary-grid">
          
          {/* PROJECT SUMMARY CARD */}
          <div className="dash-card compact-summary-card">
            <div className="card-top-header">
              <h3 className="card-heading">Project Summary</h3>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setActiveModal('submission')}
              >
                View Proposal <FiExternalLink />
              </button>
            </div>

            <div className="compact-project-info">
              <h4 className="project-title-text">{registrationData.project.title || 'Untitled Project Draft'}</h4>
              <p className="project-track-text">
                Track: <strong>{registrationData.project.problemCode || 'Open Innovation'}</strong> ({registrationData.project.theme || 'General Theme'})
              </p>

              <div className="submission-meta-row">
                <span className="meta-time">
                  <FiClock /> Submitted: {submission?.finalSubmittedAt ? new Date(submission.finalSubmittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Drafting'}
                </span>
              </div>
            </div>

            {/* Compact Checklist */}
            <div className="project-checklist">
              <div className={`check-item ${registrationData.project.abstract ? 'valid' : 'missing'}`}>
                {registrationData.project.abstract ? <FiCheckCircle /> : <FiX />}
                <span>{registrationData.project.abstract ? 'Abstract Submitted' : 'Abstract Missing'}</span>
              </div>

              <div className={`check-item ${registrationData.uploads.pptFile ? 'valid' : 'missing'}`}>
                {registrationData.uploads.pptFile ? <FiCheckCircle /> : <FiX />}
                <span>{registrationData.uploads.pptFile ? 'PPT Presentation Uploaded' : 'PPT File Missing'}</span>
              </div>

              <div className={`check-item ${registrationData.uploads.supportingDocFile ? 'valid' : 'optional'}`}>
                {registrationData.uploads.supportingDocFile ? <FiCheckCircle /> : <FiInfo />}
                <span>{registrationData.uploads.supportingDocFile ? 'Supporting Document Attached' : 'Supporting Doc (Optional)'}</span>
              </div>

              <div className={`check-item ${registrationData.project.demoVideoUrl ? 'valid' : 'optional'}`}>
                {registrationData.project.demoVideoUrl ? <FiCheckCircle /> : <FiVideo />}
                <span>{registrationData.project.demoVideoUrl ? 'Demo Video Link Added' : 'Demo Video (Optional)'}</span>
              </div>
            </div>
          </div>

          {/* TEAM SUMMARY CARD */}
          <div className="dash-card compact-summary-card">
            <div className="card-top-header">
              <h3 className="card-heading">Team Roster</h3>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setActiveModal('team')}
              >
                View Full Team ({1 + (registrationData.team.members?.length || 0)}) <FiUsers />
              </button>
            </div>

            <div className="team-brief-box">
              <div className="brief-row">
                <span>Team Name</span>
                <strong>{registrationData.team.teamName || 'Not Set'}</strong>
              </div>
              <div className="brief-row">
                <span>Team Leader</span>
                <strong>{registrationData.team.teamLeader || 'Pending Leader'}</strong>
              </div>
              <div className="brief-row">
                <span>Total Members</span>
                <strong>{1 + (registrationData.team.members?.length || 0)} Members</strong>
              </div>
            </div>

            <div className="team-quick-members">
              <div className="member-pill leader-pill">
                👑 {registrationData.team.teamLeader || 'Leader'} (Leader)
              </div>
              {registrationData.team.members?.slice(0, 2).map((m, idx) => (
                <div key={idx} className="member-pill">
                  👤 {m.fullName}
                </div>
              ))}
              {registrationData.team.members?.length > 2 && (
                <div className="member-pill overflow-pill">
                  +{registrationData.team.members.length - 2} more members
                </div>
              )}
            </div>
          </div>

          {/* ANNOUNCEMENTS CARD */}
          <div className="dash-card announcements-compact-card">
            <div className="card-top-header">
              <h3 className="card-heading">Latest Announcements</h3>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setActiveModal('announcements')}
              >
                View All <FiArrowRight />
              </button>
            </div>

            <div className="compact-announcements-list">
              {latestAnnouncements.map((item) => (
                <div key={item.id} className="compact-announce-item">
                  <div className="announce-title-row">
                    <strong>{item.title}</strong>
                    <span className="announce-date">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="announce-text">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING DATES CARD */}
          <div className="dash-card key-dates-card">
            <div className="card-top-header">
              <h3 className="card-heading">Upcoming Dates</h3>
            </div>

            <div className="dates-list">
              {upcomingDates.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div key={idx} className={`date-item ${item.status}`}>
                    <div className="date-icon-box">
                      <ItemIcon />
                    </div>
                    <div className="date-info">
                      <strong>{item.label}</strong>
                      <span>{item.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* OFFLINE REGISTRATION SECTION (UNLOCKED IF STATUS === 'SELECTED') */}
        {status === 'selected' && (
          <div id="offline-section" className="dash-card offline-registration-card">
            <div className="card-top-header">
              <div>
                <span className="section-subtitle">Venue Phase</span>
                <h3 className="card-heading">Offline Registration Form</h3>
              </div>
              <span className="unlocked-badge">
                <FiCheckCircle /> Shortlisted Team
              </span>
            </div>

            {offlineStatus === 'completed' ? (
              <div className="offline-complete-alert">
                <FiCheckCircle className="alert-check-icon" />
                <div>
                  <h4>Offline Registration Confirmed!</h4>
                  <p>Your team details have been recorded for the on-site hackathon at NSRIT Visakhapatnam. We look forward to hosting you!</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOfflineSubmit} className="form-grid compact mt-3">
                <label className="field">
                  <span>Primary Contact Name *</span>
                  <input
                    required
                    value={offlineForm.contactName}
                    onChange={(e) => setOfflineForm({ ...offlineForm, contactName: e.target.value })}
                    placeholder="Contact person full name"
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

                <label className="field checkbox-field span-2">
                  <input
                    type="checkbox"
                    checked={offlineForm.accommodationRequired}
                    onChange={(e) => setOfflineForm({ ...offlineForm, accommodationRequired: e.target.checked })}
                  />
                  <span>Require Campus Accommodation at NSRIT Hostel</span>
                </label>

                {offlineError && <small className="error-text span-2">{offlineError}</small>}

                <div className="span-2 mt-2">
                  <button type="submit" className="primary-action" disabled={isSubmittingOffline}>
                    {isSubmittingOffline ? 'Confirming...' : 'Confirm Offline Participation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* QUICK ACTIONS BAR */}
        <div className="quick-actions-bar">
          <button
            type="button"
            className="quick-btn"
            onClick={() => setActiveModal('submission')}
          >
            <FiFileText /> View Submission Proposal
          </button>

          <button
            type="button"
            className="quick-btn"
            onClick={downloadAcknowledgement}
          >
            <FiDownload /> Download Acknowledgement
          </button>

          {status === 'draft' && (
            <button
              type="button"
              className="quick-btn highlight-quick-btn"
              onClick={() => { window.location.hash = '#registration'; }}
            >
              <FiEdit3 /> Edit Application Form
            </button>
          )}

          <button
            type="button"
            className="quick-btn logout-quick-btn"
            onClick={logout}
          >
            <FiLogOut /> Logout
          </button>
        </div>

      </section>

      {/* TEAM DETAILS MODAL */}
      {activeModal === 'team' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Team Details: {registrationData.team.teamName}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="member-card leader-card">
                <div className="member-badge">Team Leader</div>
                <h4>{registrationData.team.teamLeader}</h4>
                <p>Email: {registrationData.personal.email}</p>
                <p>Phone: {registrationData.personal.phone}</p>
                <p>College: {registrationData.personal.collegeName}</p>
                <p>Dept / Year: {registrationData.personal.department} | {registrationData.personal.year}</p>
              </div>

              <h4 className="mt-4 mb-2">Team Members ({registrationData.team.members?.length || 0})</h4>
              {registrationData.team.members && registrationData.team.members.length > 0 ? (
                <div className="members-modal-grid">
                  {registrationData.team.members.map((m, idx) => (
                    <div key={idx} className="member-card">
                      <div className="member-num">Member #{idx + 2}</div>
                      <h4>{m.fullName}</h4>
                      <p>Email: {m.email || 'N/A'}</p>
                      <p>Phone: {m.phone || 'N/A'}</p>
                      <p>College: {m.college || 'N/A'}</p>
                      <p>Dept / Year: {m.department || 'N/A'} | {m.year || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dim">No additional members added to this team.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS MODAL */}
      {activeModal === 'announcements' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Official Announcements</h3>
              <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="full-announcements-list">
                {allAnnouncements.map((item) => (
                  <div key={item.id} className="full-announce-card">
                    <div className="announce-header">
                      <h4>{item.title}</h4>
                      <span className="announce-tag">{item.date}</span>
                    </div>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION PROPOSAL MODAL */}
      {activeModal === 'submission' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submission Details</h3>
              <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="submission-detail-block">
                <span className="ps-tag">{registrationData.project.problemCode || 'Track Code'}</span>
                <h4>{registrationData.project.title || 'Project Title'}</h4>
                <p><strong>Track Theme:</strong> {registrationData.project.theme || 'N/A'}</p>
                <p><strong>Problem Statement:</strong> {registrationData.project.problemStatement || 'N/A'}</p>
              </div>

              <div className="submission-detail-block">
                <h5>Project Abstract</h5>
                <p>{registrationData.project.abstract || 'No abstract entered.'}</p>
              </div>

              <div className="submission-detail-block">
                <h5>Technology Stack & Repo</h5>
                <p><strong>Stack:</strong> {registrationData.project.technologyStack || 'N/A'}</p>
                <p><strong>GitHub Repo:</strong> {registrationData.project.githubRepository || 'N/A'}</p>
                <p><strong>Video Link:</strong> {registrationData.project.demoVideoUrl || 'N/A'}</p>
              </div>

              <div className="submission-detail-block">
                <h5>Attached Documents</h5>
                <p><strong>Presentation (PPT):</strong> {registrationData.uploads.pptFile ? `${registrationData.uploads.pptFile.name} (${formatBytes(registrationData.uploads.pptFile.size)})` : 'Uploaded'}</p>
                <p><strong>Supporting Document:</strong> {registrationData.uploads.supportingDocFile ? `${registrationData.uploads.supportingDocFile.name} (${formatBytes(registrationData.uploads.supportingDocFile.size)})` : 'Optional / None'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}

