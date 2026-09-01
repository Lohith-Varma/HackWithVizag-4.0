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
  FiCopy,
  FiMail,
  FiPhone,
  FiGithub,
  FiLinkedin,
  FiGlobe,
  FiEye,
  FiLayers,
  FiUser,
} from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api, buildAssetUrl } from '../services/api';
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
    actionLabel: 'Jump to Team Details',
    actionTarget: 'team-details-section',
    themeClass: 'status-card-submitted',
  },
  under_review: {
    badgeLabel: 'Under Review',
    badgeColor: 'yellow',
    badgeIcon: FiClock,
    title: 'Submission Currently Under Review',
    description: 'The screening committee is evaluating your project proposal against the judging criteria.',
    actionLabel: 'Jump to Team Details',
    actionTarget: 'team-details-section',
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

const safeDisplay = (value, fallback = 'Not provided') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  return String(value);
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

  // Active Preview & Modals
  const [activePreview, setActivePreview] = useState(null); // { type: 'ppt' | 'doc' | 'video' | 'abstract', url?: string, title?: string, content?: string } | null
  const [activeModal, setActiveModal] = useState(null); // 'announcements' | null

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
  const registrationId = dashboardData?.registrationId || (submission ? `HWV-2026-${submission._id.toString().slice(-6).toUpperCase()}` : 'HWV-2026-PENDING');

  // Build complete team members array
  const allTeamMembers = (() => {
    if (team?.members && team.members.length > 0) {
      const leaderId = team.leader?._id?.toString() || team.leader?.toString();
      return team.members.map((m) => {
        const mId = m._id?.toString() || m.toString();
        const isLeader = mId === leaderId || m.email === team.leader?.email;
        return {
          id: mId,
          isLeader,
          role: isLeader ? 'Team Leader' : 'Team Member',
          name: m.name || (isLeader ? team.leader?.name : 'Participant'),
          email: m.email || (isLeader ? team.leader?.email : ''),
          phone: m.phone || (isLeader ? team.leader?.phone : ''),
          college: m.collegeName || m.college || (isLeader ? (team.leader?.collegeName || team.leader?.college) : ''),
          department: m.department || (isLeader ? team.leader?.department : ''),
          year: m.year || (isLeader ? team.leader?.year : ''),
          gender: m.gender || '',
          githubUrl: m.githubUrl || '',
          linkedinUrl: m.linkedinUrl || '',
          portfolioUrl: m.portfolioUrl || '',
          resumeUrl: m.resumeUrl || '',
        };
      });
    }

    // Fallback from draft
    const membersList = [];
    const leaderName = draft.team?.teamLeader || draft.personal?.fullName || user.name || 'Team Leader';
    membersList.push({
      id: 'leader',
      isLeader: true,
      role: 'Team Leader',
      name: leaderName,
      email: draft.personal?.email || user.email || '',
      phone: draft.personal?.phone || user.phone || '',
      college: draft.personal?.collegeName || user.collegeName || user.college || '',
      department: draft.personal?.department || user.department || '',
      year: draft.personal?.year || user.year || '',
      gender: draft.personal?.gender || '',
      githubUrl: draft.personal?.githubUrl || '',
      linkedinUrl: draft.personal?.linkedinUrl || '',
      portfolioUrl: draft.personal?.portfolioUrl || '',
      resumeUrl: draft.personal?.resumeUrl || '',
    });

    if (draft.team?.members && Array.isArray(draft.team.members)) {
      draft.team.members.forEach((m, idx) => {
        if (m.fullName || m.email) {
          membersList.push({
            id: `member-${idx}`,
            isLeader: false,
            role: 'Team Member',
            name: m.fullName || `Member ${idx + 2}`,
            email: m.email || '',
            phone: m.phone || '',
            college: m.college || draft.personal?.collegeName || '',
            department: m.department || '',
            year: m.year || '',
            gender: m.gender || '',
            githubUrl: m.githubUrl || '',
            linkedinUrl: m.linkedinUrl || '',
            portfolioUrl: m.portfolioUrl || '',
            resumeUrl: m.resumeUrl || '',
          });
        }
      });
    }

    return membersList;
  })();

  const projectDetails = {
    title: project?.title || draft.project?.title || '',
    problemCode: project?.problemCode || project?.problemStatementId?.code || draft.project?.problemCode || '',
    problemType: project?.problemType || draft.project?.problemType || 'official',
    theme: project?.theme || project?.problemStatementId?.theme || draft.project?.theme || '',
    problemStatement: project?.problemStatement || project?.problemStatementId?.problemStatement || draft.project?.problemStatement || '',
    abstract: project?.abstract || draft.project?.abstract || '',
    technologyStack: project?.technologyStack || draft.project?.technologyStack || '',
    githubRepository: project?.githubRepository || draft.project?.githubRepository || '',
    demoVideoUrl: project?.demoVideoUrl || draft.project?.demoVideoUrl || '',
    pptFile: project?.pptFile?.url
      ? {
          url: project.pptFile.url,
          name: project.pptFile.originalName || 'Presentation.ppt',
          size: project.pptFile.size,
        }
      : draft.uploads?.pptFile
      ? {
          url: '',
          name: draft.uploads.pptFile.name || 'Presentation.ppt',
          size: draft.uploads.pptFile.size,
        }
      : null,
    supportingDocFile: project?.supportingDocFile?.url
      ? {
          url: project.supportingDocFile.url,
          name: project.supportingDocFile.originalName || 'SupportingDoc.pdf',
          size: project.supportingDocFile.size,
        }
      : draft.uploads?.supportingDocFile
      ? {
          url: '',
          name: draft.uploads.supportingDocFile.name || 'SupportingDoc.pdf',
          size: draft.uploads.supportingDocFile.size,
        }
      : null,
  };

  const teamName = team?.teamName || draft.team?.teamName || 'My Team';
  const submissionTimestamp = submission?.finalSubmittedAt || project?.submittedAt;
  const formattedSubmissionDate = submissionTimestamp
    ? new Date(submissionTimestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'In Draft';

  const handleCopyRegId = () => {
    if (registrationId && registrationId !== 'HWV-2026-PENDING') {
      navigator.clipboard.writeText(registrationId);
      setToast({ type: 'success', message: 'Registration ID copied to clipboard!' });
    }
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
      content: 'Complete all steps of the application wizard before the deadline.',
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

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };

  return (
    <main className="portal-page participant-dashboard-page">
      <section className="portal-shell dashboard-shell">
        
        {/* TOP SECTION: Welcome & Status Header */}
        <div className="dash-top-bar">
          <div className="welcome-group">
            <h1 className="welcome-title">
              Welcome back, {safeDisplay(user.name || currentUser?.name, 'Participant')} 👋
            </h1>
            <p className="team-subtitle">
              Team: <strong>{teamName}</strong>
            </p>
          </div>

          <div className="status-badge-container">
            <div className={`status-pill status-pill-${statusConfig.badgeColor}`}>
              <BadgeIcon className="badge-pill-icon" />
              <span>{statusConfig.badgeLabel}</span>
            </div>
            <div className="reg-id-badge" onClick={handleCopyRegId} title="Click to copy ID" style={{ cursor: 'pointer' }}>
              <span>ID: {registrationId}</span>
              <FiCopy size={14} />
            </div>
          </div>
        </div>

        {/* PRIMARY ACTION CARD */}
        <div className={`primary-focal-card ${statusConfig.themeClass}`}>
          <div className="focal-card-glow" />
          <div className="focal-card-content">
            <div className="focal-header-row">
              <div className="focal-icon-badge">
                <BadgeIcon />
              </div>
              <span className={`focal-tag tag-${statusConfig.badgeColor}`}>
                Current Status
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

        {/* REGISTRATION TIMELINE */}
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

        {/* ====================================================================
            MAIN TEAM DETAILS & INFORMATION SECTION (Fulfills Req #2)
           ==================================================================== */}
        <div id="team-details-section" className="team-details-section">
          
          {/* 1. TEAM & PROBLEM STATEMENT OVERVIEW CARD */}
          <div className="team-overview-card">
            <div className="section-head-row">
              <div className="section-title-group">
                <h3><FiLayers /> Team Information & Track</h3>
              </div>
              <span className={`status-pill status-pill-${statusConfig.badgeColor}`}>
                {statusConfig.badgeLabel}
              </span>
            </div>

            <div className="team-info-grid">
              <div className="info-item-box">
                <span className="info-label">Team Name</span>
                <strong className="info-value">{teamName}</strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Registration ID</span>
                <div className="info-value reg-id-badge" onClick={handleCopyRegId} title="Copy ID" style={{ cursor: 'pointer' }}>
                  {registrationId} <FiCopy size={13} />
                </div>
              </div>

              <div className="info-item-box">
                <span className="info-label">Problem Statement Code</span>
                <strong className="info-value">{safeDisplay(projectDetails.problemCode, 'Track Not Selected')}</strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Track Category / Theme</span>
                <strong className="info-value">{safeDisplay(projectDetails.theme, 'Open Innovation')}</strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Track Type</span>
                <strong className="info-value">
                  {projectDetails.problemType === 'open' ? 'Open Innovation' : 'Official Challenge Track'}
                </strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Submission Status</span>
                <strong className="info-value text-capitalize">
                  {safeDisplay(submission?.status || team?.currentStatus || 'Draft')}
                </strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Submitted On</span>
                <strong className="info-value">{formattedSubmissionDate}</strong>
              </div>

              <div className="info-item-box">
                <span className="info-label">Total Team Size</span>
                <strong className="info-value">{allTeamMembers.length} Members</strong>
              </div>
            </div>

            {projectDetails.problemStatement && (
              <div className="abstract-full-box mt-3">
                <span className="info-label">Problem Statement Description</span>
                <p className="mt-1">{projectDetails.problemStatement}</p>
              </div>
            )}
          </div>

          {/* 2. COMPLETE TEAM MEMBERS ROSTER TABLE (Req #2B) */}
          <div className="team-overview-card">
            <div className="section-head-row">
              <div className="section-title-group">
                <h3><FiUsers /> Team Members ({allTeamMembers.length})</h3>
              </div>
              <span className="text-dim font-sm">
                Showing all registered members of this team
              </span>
            </div>

            <div className="team-members-wrapper">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Member Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>College / Institution</th>
                    <th>Branch / Year</th>
                    <th>Profiles / Links</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeamMembers.map((member, idx) => (
                    <tr key={member.id || idx}>
                      <td>
                        <span className={`role-pill ${member.isLeader ? 'role-leader' : 'role-member'}`}>
                          {member.isLeader ? '👑 Team Leader' : '👤 Member'}
                        </span>
                      </td>
                      <td>
                        <div className="member-name-cell">
                          <span className="member-name-text">{safeDisplay(member.name, 'Participant')}</span>
                          {member.gender && <small className="text-dim">Gender: {member.gender}</small>}
                        </div>
                      </td>
                      <td>
                        {member.email ? (
                          <a href={`mailto:${member.email}`} className="member-email-link">
                            <FiMail /> {member.email}
                          </a>
                        ) : (
                          <span className="text-dim">Not provided</span>
                        )}
                      </td>
                      <td>
                        {member.phone ? (
                          <a href={`tel:${member.phone}`} className="member-phone-link">
                            <FiPhone /> {member.phone}
                          </a>
                        ) : (
                          <span className="text-dim">Not provided</span>
                        )}
                      </td>
                      <td>
                        <strong>{safeDisplay(member.college, 'Not provided')}</strong>
                      </td>
                      <td>
                        <span>
                          {safeDisplay(member.department, 'Dept Not Set')} • {safeDisplay(member.year, 'Year Not Set')}
                        </span>
                      </td>
                      <td>
                        <div className="member-socials-row">
                          {member.githubUrl && (
                            <a href={member.githubUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="GitHub">
                              <FiGithub />
                            </a>
                          )}
                          {member.linkedinUrl && (
                            <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="LinkedIn">
                              <FiLinkedin />
                            </a>
                          )}
                          {member.portfolioUrl && (
                            <a href={member.portfolioUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="Portfolio">
                              <FiGlobe />
                            </a>
                          )}
                          {member.resumeUrl && (
                            <a href={member.resumeUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="Resume">
                              <FiFileText />
                            </a>
                          )}
                          {!member.githubUrl && !member.linkedinUrl && !member.portfolioUrl && !member.resumeUrl && (
                            <span className="text-dim font-sm">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. SUBMITTED DOCUMENTS & ASSETS (Req #2C) */}
          <div className="team-overview-card">
            <div className="section-head-row">
              <div className="section-title-group">
                <h3><FiFileText /> Submitted Documents & Project Media</h3>
              </div>
              <span className="text-dim font-sm">
                View or download your uploaded project materials
              </span>
            </div>

            {/* Project Title & Tech Stack */}
            <div className="compact-project-info mb-4">
              <h4 className="project-title-text" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                {safeDisplay(projectDetails.title, 'Untitled Project Submission')}
              </h4>
              <p className="project-track-text">
                Technology Stack: <strong>{safeDisplay(projectDetails.technologyStack, 'Not specified')}</strong>
              </p>
            </div>

            <div className="documents-section-grid">
              
              {/* Card 1: Project Abstract */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box doc-abstract">
                    <FiFileText />
                  </div>
                  <div className="doc-meta-box">
                    <h4>Project Abstract</h4>
                    <p>{projectDetails.abstract ? `${projectDetails.abstract.trim().split(/\s+/).filter(Boolean).length} Words Submitted` : 'No abstract entered'}</p>
                    <span className={`doc-status-tag ${projectDetails.abstract ? 'uploaded' : 'missing'}`}>
                      {projectDetails.abstract ? '✓ Submitted' : 'Not submitted'}
                    </span>
                  </div>
                </div>

                <div className="doc-btn-group">
                  <button
                    type="button"
                    className="btn-doc-action btn-doc-primary"
                    disabled={!projectDetails.abstract}
                    onClick={() => setActivePreview({
                      type: 'abstract',
                      title: 'Project Abstract',
                      content: projectDetails.abstract,
                    })}
                  >
                    <FiEye /> Read Abstract
                  </button>
                </div>
              </div>

              {/* Card 2: Presentation Deck (PPT) */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box doc-ppt">
                    <FiLayers />
                  </div>
                  <div className="doc-meta-box">
                    <h4>Presentation Deck (PPT)</h4>
                    <p>{projectDetails.pptFile ? `${projectDetails.pptFile.name} (${formatBytes(projectDetails.pptFile.size)})` : 'No presentation uploaded'}</p>
                    <span className={`doc-status-tag ${projectDetails.pptFile ? 'uploaded' : 'missing'}`}>
                      {projectDetails.pptFile ? '✓ Uploaded' : 'Not uploaded'}
                    </span>
                  </div>
                </div>

                <div className="doc-btn-group">
                  {projectDetails.pptFile?.url ? (
                    <>
                      <button
                        type="button"
                        className="btn-doc-action btn-doc-primary"
                        onClick={() => setActivePreview({
                          type: 'ppt',
                          title: projectDetails.pptFile.name,
                          url: buildAssetUrl(projectDetails.pptFile.url),
                        })}
                      >
                        <FiEye /> View PPT
                      </button>
                      <a
                        href={buildAssetUrl(projectDetails.pptFile.url)}
                        download={projectDetails.pptFile.name}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-doc-action btn-doc-secondary"
                      >
                        <FiDownload /> Download
                      </a>
                    </>
                  ) : (
                    <span className="text-dim font-sm" style={{ padding: '0.5rem 0' }}>Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Card 3: Supporting Document */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box">
                    <FiDownload />
                  </div>
                  <div className="doc-meta-box">
                    <h4>Supporting Document</h4>
                    <p>{projectDetails.supportingDocFile ? `${projectDetails.supportingDocFile.name} (${formatBytes(projectDetails.supportingDocFile.size)})` : 'Optional documentation'}</p>
                    <span className={`doc-status-tag ${projectDetails.supportingDocFile ? 'uploaded' : 'missing'}`}>
                      {projectDetails.supportingDocFile ? '✓ Attached' : 'Not uploaded'}
                    </span>
                  </div>
                </div>

                <div className="doc-btn-group">
                  {projectDetails.supportingDocFile?.url ? (
                    <>
                      <button
                        type="button"
                        className="btn-doc-action btn-doc-primary"
                        onClick={() => setActivePreview({
                          type: 'doc',
                          title: projectDetails.supportingDocFile.name,
                          url: buildAssetUrl(projectDetails.supportingDocFile.url),
                        })}
                      >
                        <FiEye /> View Doc
                      </button>
                      <a
                        href={buildAssetUrl(projectDetails.supportingDocFile.url)}
                        download={projectDetails.supportingDocFile.name}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-doc-action btn-doc-secondary"
                      >
                        <FiDownload /> Download
                      </a>
                    </>
                  ) : (
                    <span className="text-dim font-sm" style={{ padding: '0.5rem 0' }}>Not uploaded</span>
                  )}
                </div>
              </div>

              {/* Card 4: Demo Video */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box doc-video">
                    <FiVideo />
                  </div>
                  <div className="doc-meta-box">
                    <h4>Demo Video</h4>
                    <p>{projectDetails.demoVideoUrl ? safeDisplay(projectDetails.demoVideoUrl) : 'No video link provided'}</p>
                    <span className={`doc-status-tag ${projectDetails.demoVideoUrl ? 'uploaded' : 'missing'}`}>
                      {projectDetails.demoVideoUrl ? '✓ Link Added' : 'No video link provided'}
                    </span>
                  </div>
                </div>

                <div className="doc-btn-group">
                  {projectDetails.demoVideoUrl ? (
                    <>
                      <button
                        type="button"
                        className="btn-doc-action btn-doc-primary"
                        onClick={() => setActivePreview({
                          type: 'video',
                          title: 'Demo Video',
                          url: getYoutubeEmbedUrl(projectDetails.demoVideoUrl),
                        })}
                      >
                        <FiEye /> Watch Video
                      </button>
                      <a
                        href={projectDetails.demoVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-doc-action btn-doc-secondary"
                      >
                        <FiExternalLink /> Open
                      </a>
                    </>
                  ) : (
                    <span className="text-dim font-sm" style={{ padding: '0.5rem 0' }}>No video link provided</span>
                  )}
                </div>
              </div>

              {/* Card 5: GitHub Repository */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box doc-github">
                    <FiGithub />
                  </div>
                  <div className="doc-meta-box">
                    <h4>GitHub Repository</h4>
                    <p>{projectDetails.githubRepository ? safeDisplay(projectDetails.githubRepository) : 'Not provided'}</p>
                    <span className={`doc-status-tag ${projectDetails.githubRepository ? 'uploaded' : 'missing'}`}>
                      {projectDetails.githubRepository ? '✓ Linked' : 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="doc-btn-group">
                  {projectDetails.githubRepository ? (
                    <a
                      href={projectDetails.githubRepository}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-doc-action btn-doc-primary"
                    >
                      <FiExternalLink /> Open GitHub Repo
                    </a>
                  ) : (
                    <span className="text-dim font-sm" style={{ padding: '0.5rem 0' }}>Not provided</span>
                  )}
                </div>
              </div>

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

        {/* SIDEBAR WIDGETS: Announcements & Upcoming Dates */}
        <div className="dash-secondary-grid mt-4">
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

        {/* QUICK ACTIONS BAR */}
        <div className="quick-actions-bar mt-4">
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

      {/* DOCUMENT & MEDIA PREVIEW MODAL */}
      {activePreview && (
        <div className="dash-modal-overlay" onClick={() => setActivePreview(null)}>
          <div className="dash-modal-box modal-doc-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activePreview.title || 'Document Viewer'}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setActivePreview(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {activePreview.type === 'abstract' && (
                <div className="abstract-full-box">
                  <p>{activePreview.content}</p>
                </div>
              )}

              {(activePreview.type === 'ppt' || activePreview.type === 'doc') && (
                <div>
                  <div className="doc-iframe-box">
                    <iframe
                      src={activePreview.url}
                      title={activePreview.title}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <a
                      href={activePreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-doc-action btn-doc-primary"
                    >
                      <FiExternalLink /> Open in Full Window
                    </a>
                  </div>
                </div>
              )}

              {activePreview.type === 'video' && (
                <div className="doc-iframe-box">
                  <iframe
                    src={activePreview.url}
                    title="Demo Video Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
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

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}


