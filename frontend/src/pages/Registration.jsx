import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiHome,
  FiSave,
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiLayers,
  FiVideo,
  FiGithub,
  FiLinkedin,
  FiGlobe,
  FiX,
  FiInfo,
} from 'react-icons/fi';
import ProgressBar from '../components/Registration/ProgressBar';
import StepPersonal from '../components/Registration/StepPersonal';
import StepTeam from '../components/Registration/StepTeam';
import StepProblemStatement from '../components/Registration/StepProblemStatement';
import StepProject from '../components/Registration/StepProject';
import StepUpload from '../components/Registration/StepUpload';
import StepReview from '../components/Registration/StepReview';
import Toast from '../components/Toast/Toast';
import { api, buildAssetUrl } from '../services/api';
import {
  clearDraftRegistration,
  loadCurrentUser,
  loadDraftRegistration,
  saveDraftRegistration,
  saveSubmission,
} from '../utils/registrationStorage';
import {
  formatBytes,
  hasErrors,
  validatePersonal,
  validateTeam,
  validateProject,
  validateUploads,
} from '../utils/registrationValidation';
import './Portal.css';

const steps = [
  { id: 'personal', label: '1. Profile' },
  { id: 'team', label: '2. Team' },
  { id: 'problemStatement', label: '3. Problem Statement' },
  { id: 'project', label: '4. Project' },
  { id: 'uploads', label: '5. Uploads' },
  { id: 'review', label: '6. Review' },
];

const safeDisplay = (value, fallback = 'Not provided') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  return String(value);
};

export default function Registration() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusCheckError, setStatusCheckError] = useState(null);
  const [existingTeamData, setExistingTeamData] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());

  const [eventConfig, setEventConfig] = useState({});
  const [registration, setRegistration] = useState(() => loadDraftRegistration());
  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  // Active modal preview for existing team view
  const [activePreview, setActivePreview] = useState(null);

  // 1. Initial Authentication and Team Status Check
  const checkRegistrationStatus = async () => {
    setIsCheckingStatus(true);
    setStatusCheckError(null);

    try {
      // Parallel fetch: Event configuration, Current User profile, and User Team details
      const [eventRes, userRes, teamRes] = await Promise.all([
        api.getEventConfig().catch(() => ({})),
        api.getCurrentUser().catch(() => ({})),
        api.getMyTeam(),
      ]);

      if (eventRes?.event) {
        setEventConfig(eventRes.event);
      }

      if (userRes?.user) {
        setCurrentUser(userRes.user);
        const u = userRes.user;
        setRegistration((current) => ({
          ...current,
          personal: {
            ...current.personal,
            fullName: current.personal?.fullName || u.name || '',
            email: current.personal?.email || u.email || '',
            phone: current.personal?.phone || u.phone || '',
            collegeName: current.personal?.collegeName || u.collegeName || u.college || '',
            registeredNumber: current.personal?.registeredNumber || u.registeredNumber || '',
            department: current.personal?.department || u.department || '',
            year: (current.personal?.year === 'Final Year' ? '4th Year' : current.personal?.year) || (u.year === 'Final Year' ? '4th Year' : u.year) || '',
            gender: current.personal?.gender || u.gender || '',
          },
          team: {
            ...current.team,
            teamLeader: u.name || current.personal?.fullName || current.team?.teamLeader || '',
            teamLeaderCollege: u.collegeName || u.college || current.personal?.collegeName || '',
          },
        }));
      }

      if (teamRes?.team) {
        setExistingTeamData(teamRes);
      } else {
        setExistingTeamData(null);
      }
    } catch (err) {
      console.error('Registration status check failed:', err);
      setStatusCheckError(err.message || 'Unable to verify your registration status. Please check your connection and try again.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  // Sync draft state to localStorage only if user has no team yet
  useEffect(() => {
    if (existingTeamData?.team) return;

    const timeout = window.setTimeout(() => {
      saveDraftRegistration(registration);
      api.saveRegistrationDraft(registration).catch(() => {});
      setIsSaving(false);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [registration, existingTeamData]);

  const currentStepErrors = errors[steps[currentStep]?.id] || {};

  const stepValidators = useMemo(
    () => [
      (reg) => validatePersonal(reg.personal),
      (reg) => validateTeam(reg.team, eventConfig, reg.personal?.collegeName || reg.team?.teamLeaderCollege),
      (reg) => {
        const errs = {};
        if (!reg.project?.problemStatementId && !reg.project?.problemCode) {
          errs.problemStatementId = 'Please select a problem statement or open innovation track';
        }
        if (reg.project?.problemType === 'open') {
          if (!reg.project?.title?.trim()) errs.title = 'Custom title is required for Open Innovation';
          if (!reg.project?.theme?.trim()) errs.theme = 'Theme is required for Open Innovation';
          if (!reg.project?.problemStatement?.trim()) errs.problemStatement = 'Custom problem statement is required';
        }
        return errs;
      },
      (reg) => validateProject(reg.project, eventConfig),
      (reg) => validateUploads(reg.uploads, eventConfig),
    ],
    [eventConfig]
  );

  const completion = useMemo(() => {
    const completed = stepValidators.reduce((count, validator) => {
      const stepError = validator(registration);
      return count + (hasErrors(stepError) ? 0 : 1);
    }, 0);
    return Math.round((completed / stepValidators.length) * 100);
  }, [registration, stepValidators]);

  const updateSection = (section, value) => {
    setIsSaving(true);
    setRegistration((current) => ({ ...current, [section]: value }));
    setErrors((current) => ({ ...current, [steps[currentStep].id]: {} }));
  };

  const updatePersonalField = (field, value) => {
    updateSection('personal', { ...registration.personal, [field]: value });
  };

  const updateUploadFile = (field, file) => {
    updateSection('uploads', { ...registration.uploads, [field]: file });
  };

  const validateStep = (index) => {
    if (index >= stepValidators.length) return true;
    const validator = stepValidators[index];
    const stepError = validator(registration);
    setErrors((current) => ({ ...current, [steps[index].id]: stepError }));
    return !hasErrors(stepError);
  };

  const goNext = () => {
    if (!validateStep(currentStep)) {
      setToast({ type: 'error', message: 'Please fix highlighted errors before continuing.' });
      return;
    }
    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);
    setHighestStep((value) => Math.max(value, nextStep));
  };

  const goBack = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const submitFinal = async () => {
    const nextErrors = {};
    let invalidStep = -1;
    stepValidators.forEach((validator, index) => {
      const stepError = validator(registration);
      nextErrors[steps[index].id] = stepError;
      if (invalidStep === -1 && hasErrors(stepError)) invalidStep = index;
    });

    if (invalidStep !== -1) {
      setErrors(nextErrors);
      setCurrentStep(invalidStep);
      setToast({ type: 'error', message: 'Please complete all required sections before submitting.' });
      return;
    }
    if (!accepted) {
      setToast({ type: 'error', message: 'Please accept the declaration checkbox to submit.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.submitRegistration(registration);
      const submission = {
        ...result,
        registrationId: result.registrationId || `HWV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: result.status || 'under_review',
        submissionDate: result.submissionDate || new Date().toISOString(),
        teamName: registration.team?.teamName || 'My Team',
        registration,
      };
      saveSubmission(submission);
      clearDraftRegistration();
      setSuccess(submission);
      setToast({ type: 'success', message: 'Registration submitted successfully!' });
      // Re-fetch existing team data
      await checkRegistrationStatus();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAcknowledgement = async () => {
    await api.downloadAcknowledgement();
    setToast({ type: 'info', message: 'Acknowledgement downloaded successfully.' });
  };

  const handleCopyRegId = (regId) => {
    if (regId) {
      navigator.clipboard.writeText(regId);
      setToast({ type: 'success', message: 'Registration ID copied to clipboard!' });
    }
  };

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

  // -------------------------------------------------------------
  // RENDER STATE 1: LOADING SPINNER
  // -------------------------------------------------------------
  if (isCheckingStatus) {
    return (
      <main className="portal-page">
        <section className="portal-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="auth-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
              Checking your registration status...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Verifying team membership and application records.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER STATE 2: API ERROR / RETRY SCREEN
  // -------------------------------------------------------------
  if (statusCheckError) {
    return (
      <main className="portal-page">
        <section className="portal-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="auth-panel" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <FiAlertTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
              Unable to Verify Registration Status
            </h2>
            <p style={{ color: '#fca5a5', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              {statusCheckError}
            </p>
            <button
              type="button"
              className="primary-action"
              onClick={checkRegistrationStatus}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Retry Status Check
            </button>
          </div>
        </section>
        <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER STATE 3: POST-SUBMISSION CONFIRMATION
  // -------------------------------------------------------------
  if (success) {
    return (
      <main className="portal-page">
        <section className="portal-shell success-shell">
          <motion.div className="success-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FiCheckCircle className="success-icon" />
            <span className="section-subtitle">Registration Successful</span>
            <h1>Submission Received</h1>
            <p>Your team submission is locked and marked as <strong>Under Review</strong>. Check your participant dashboard for status updates.</p>
            <div className="success-meta">
              <div>
                <span>Registration ID</span>
                <strong>{success.registrationId}</strong>
              </div>
              <div>
                <span>Team Name</span>
                <strong>{success.teamName}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className="badge-tag">{success.status}</strong>
              </div>
            </div>
            <div className="success-actions">
              <button type="button" className="primary-action" onClick={() => { window.location.hash = '#dashboard'; }}>
                <FiHome /> Go to Dashboard
              </button>
              <button type="button" className="secondary-action" onClick={downloadAcknowledgement}>
                <FiDownload /> Download Acknowledgement
              </button>
            </div>
          </motion.div>
        </section>
        <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER STATE 4: CASE B — USER HAS AN EXISTING REGISTERED TEAM
  // -------------------------------------------------------------
  if (existingTeamData?.team) {
    const { team, project, submission, registrationId } = existingTeamData;

    const leaderId = team.leader?._id?.toString() || team.leader?.toString();
    const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
    const isLeader = Boolean(
      (leaderId && currentUserId && leaderId === currentUserId) ||
      (team.leader?.email && currentUser?.email && team.leader.email.toLowerCase() === currentUser.email.toLowerCase())
    );

    const teamMembersList = (() => {
      if (Array.isArray(team.members) && team.members.length > 0) {
        return team.members.map((m) => {
          const mId = m._id?.toString() || m.toString();
          const isMemberLeader = mId === leaderId || m.email?.toLowerCase() === team.leader?.email?.toLowerCase();
          return {
            id: mId,
            isLeader: isMemberLeader,
            role: isMemberLeader ? 'Team Leader' : 'Team Member',
            name: m.name || (isMemberLeader ? team.leader?.name : 'Participant'),
            email: m.email || (isMemberLeader ? team.leader?.email : ''),
            phone: m.phone || (isMemberLeader ? team.leader?.phone : ''),
            registeredNumber: m.registeredNumber || (isMemberLeader ? team.leader?.registeredNumber : '') || '',
            college: m.collegeName || m.college || (isMemberLeader ? (team.leader?.collegeName || team.leader?.college) : ''),
            department: m.department || (isMemberLeader ? team.leader?.department : ''),
            year: m.year || (isMemberLeader ? team.leader?.year : ''),
            gender: m.gender || (isMemberLeader ? team.leader?.gender : '') || '',
            githubUrl: m.githubUrl || '',
            linkedinUrl: m.linkedinUrl || '',
            portfolioUrl: m.portfolioUrl || '',
            resumeUrl: m.resumeUrl || '',
          };
        });
      }
      return [];
    })();

    const projectDetails = {
      title: project?.title || 'Untitled Project',
      problemCode: project?.problemCode || project?.problemStatementId?.code || (project?.problemType === 'open' ? 'Open Innovation' : 'Track Not Set'),
      problemType: project?.problemType || 'official',
      theme: project?.theme || project?.problemStatementId?.theme || 'General Track',
      problemStatement: project?.problemStatement || project?.problemStatementId?.problemStatement || 'Problem description not provided',
      abstract: project?.abstract || '',
      technologyStack: project?.technologyStack || '',
      githubRepository: project?.githubRepository || '',
      demoVideoUrl: project?.demoVideoUrl || '',
      pptFile: project?.pptFile?.url
        ? {
            url: project.pptFile.url,
            name: project.pptFile.originalName || 'Presentation.ppt',
            size: project.pptFile.size,
          }
        : null,
      supportingDocFile: project?.supportingDocFile?.url
        ? {
            url: project.supportingDocFile.url,
            name: project.supportingDocFile.originalName || 'SupportingDoc.pdf',
            size: project.supportingDocFile.size,
          }
        : null,
    };

    const statusBadge = (team.currentStatus || submission?.status || 'under_review').toLowerCase();
    const formattedDate = (project?.submittedAt || team.createdAt)
      ? new Date(project?.submittedAt || team.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Submitted';

    return (
      <main className="portal-page participant-dashboard-page">
        <section className="portal-shell dashboard-shell">
          
          {/* HEADER: Team & User Status */}
          <div className="dash-top-bar" style={{ marginBottom: '1.5rem' }}>
            <div className="welcome-group">
              <span className="section-subtitle">Hack With Vizag 4.0 Registration</span>
              <h1 className="welcome-title" style={{ fontSize: '2.2rem', marginTop: '0.2rem' }}>
                My Team: <span className="gradient-text">{team.teamName}</span>
              </h1>
              <p className="team-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.35rem' }}>
                <span>You are logged in as: <strong>{currentUser?.name || 'Participant'}</strong></span>
                <span className={`badge-tag ${isLeader ? 'badge-leader' : 'badge-member'}`} style={{
                  background: isLeader ? 'rgba(234, 179, 8, 0.18)' : 'rgba(99, 102, 241, 0.18)',
                  color: isLeader ? '#facc15' : '#a5b4fc',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.8rem'
                }}>
                  {isLeader ? '👑 Role: Team Lead' : '👥 Role: Team Member'}
                </span>
              </p>
            </div>

            <div className="status-badge-container">
              <div className={`status-pill status-pill-${statusBadge === 'selected' ? 'green' : statusBadge === 'rejected' ? 'red' : 'yellow'}`}>
                <FiClock className="badge-pill-icon" />
                <span>Status: {team.currentStatus?.toUpperCase() || 'UNDER REVIEW'}</span>
              </div>
              <div className="reg-id-badge" onClick={() => handleCopyRegId(registrationId)} title="Click to copy ID" style={{ cursor: 'pointer' }}>
                <span>ID: {registrationId}</span>
                <FiCopy size={14} />
              </div>
            </div>
          </div>

          {/* READ-ONLY / REVIEW LOCK BANNER */}
          <div
            style={{
              padding: '1.1rem 1.4rem',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiInfo style={{ color: '#818cf8', fontSize: '1.6rem', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.98rem', display: 'block' }}>
                  Team Registration Active & Locked
                </strong>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {isLeader
                    ? 'Your team registration is submitted and currently under review by the evaluation jury.'
                    : 'You have read-only access as a verified team member. Team registration details cannot be modified.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="secondary-action"
                onClick={downloadAcknowledgement}
                style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
              >
                <FiDownload /> Acknowledgement
              </button>
              <button
                type="button"
                className="primary-action"
                onClick={() => { window.location.hash = '#dashboard'; }}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
              >
                <FiHome /> Go to Dashboard
              </button>
            </div>
          </div>

          <div className="dash-two-col-grid" style={{ marginBottom: '2rem' }}>
            
            {/* TEAM INFORMATION CARD */}
            <div className="dash-card">
              <div className="card-top-header">
                <h3 className="card-heading"><FiUsers /> Team Overview</h3>
                <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                  {teamMembersList.length} Total Members
                </span>
              </div>

              <div className="form-grid compact" style={{ marginTop: '1rem' }}>
                <div className="field">
                  <span>Team Name</span>
                  <div className="readonly-box"><strong style={{ color: '#fff' }}>{team.teamName}</strong></div>
                </div>
                <div className="field">
                  <span>Registration ID</span>
                  <div className="readonly-box"><code>{registrationId}</code></div>
                </div>
                <div className="field">
                  <span>Team Leader</span>
                  <div className="readonly-box">👑 {team.leader?.name || 'Leader'}</div>
                </div>
                <div className="field">
                  <span>Registered College</span>
                  <div className="readonly-box">🏛️ {team.leader?.collegeName || team.leader?.college || 'College'}</div>
                </div>
                <div className="field">
                  <span>Submission Date</span>
                  <div className="readonly-box">📅 {formattedDate}</div>
                </div>
                <div className="field">
                  <span>Registration Status</span>
                  <div className="readonly-box"><strong style={{ color: '#38bdf8' }}>{team.currentStatus?.toUpperCase()}</strong></div>
                </div>
              </div>
            </div>

            {/* PROBLEM STATEMENT CARD */}
            <div className="dash-card">
              <div className="card-top-header">
                <h3 className="card-heading"><FiFileText /> Problem Statement</h3>
                <span className="badge-tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                  {projectDetails.problemCode}
                </span>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Track / Domain</span>
                  <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0.2rem 0' }}>{projectDetails.theme}</h4>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problem Statement</span>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '0.2rem' }}>
                    {projectDetails.problemStatement}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* TEAM MEMBERS TABLE */}
          <div className="team-overview-card" style={{ marginBottom: '2rem' }}>
            <div className="section-head-row">
              <div className="section-title-group">
                <h3><FiUsers /> Team Members ({teamMembersList.length})</h3>
              </div>
              <span className="text-dim font-sm">
                All members registered under {team.leader?.collegeName || team.leader?.college || 'the same college'}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table team-members-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Member Details</th>
                    <th>College Reg. No.</th>
                    <th>Gender</th>
                    <th>College</th>
                    <th>Department & Year</th>
                    <th>Profiles</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembersList.map((m, idx) => (
                    <tr key={m.id || `member-${idx}`}>
                      <td>
                        <span
                          className={`badge-tag ${m.isLeader ? 'badge-leader' : 'badge-member'}`}
                          style={{
                            background: m.isLeader ? 'rgba(234, 179, 8, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: m.isLeader ? '#facc15' : '#a5b4fc',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.78rem',
                          }}
                        >
                          {m.isLeader ? '👑 Team Lead' : '👥 Member'}
                        </span>
                      </td>
                      <td>
                        <div className="member-name-block">
                          <strong>{m.name}</strong>
                          <span className="text-dim font-xs">{m.email}</span>
                          {m.phone && <span className="text-dim font-xs">{m.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <code>{safeDisplay(m.registeredNumber, 'N/A')}</code>
                      </td>
                      <td>
                        <span>{safeDisplay(m.gender, 'Not specified')}</span>
                      </td>
                      <td>
                        <strong>{safeDisplay(m.college, 'College Not Set')}</strong>
                      </td>
                      <td>
                        <span>{safeDisplay(m.department, 'Dept')} • {safeDisplay(m.year, 'Year')}</span>
                      </td>
                      <td>
                        <div className="member-socials-row">
                          {m.githubUrl && (
                            <a href={m.githubUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="GitHub">
                              <FiGithub />
                            </a>
                          )}
                          {m.linkedinUrl && (
                            <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="LinkedIn">
                              <FiLinkedin />
                            </a>
                          )}
                          {m.portfolioUrl && (
                            <a href={m.portfolioUrl} target="_blank" rel="noreferrer" className="social-icon-btn" title="Portfolio">
                              <FiGlobe />
                            </a>
                          )}
                          {!m.githubUrl && !m.linkedinUrl && !m.portfolioUrl && (
                            <span className="text-dim font-xs">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PROJECT DETAILS & ASSETS */}
          <div className="team-overview-card" style={{ marginBottom: '2rem' }}>
            <div className="section-head-row">
              <div className="section-title-group">
                <h3><FiLayers /> Project Details & Uploaded Materials</h3>
              </div>
              <span className="text-dim font-sm">
                Project deck and documents submitted to the jury
              </span>
            </div>

            <div className="compact-project-info mb-4" style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.35rem' }}>
                {safeDisplay(projectDetails.title, 'Untitled Project')}
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Technology Stack: <strong style={{ color: '#cbd5e1' }}>{safeDisplay(projectDetails.technologyStack, 'Not specified')}</strong>
              </p>
            </div>

            <div className="documents-section-grid">
              
              {/* Card 1: Abstract */}
              <div className="doc-asset-card">
                <div className="doc-top-info">
                  <div className="doc-icon-box doc-abstract">
                    <FiFileText />
                  </div>
                  <div className="doc-meta-box">
                    <h4>Project Abstract</h4>
                    <p>{projectDetails.abstract ? `${projectDetails.abstract.trim().split(/\s+/).filter(Boolean).length} Words Submitted` : 'No abstract entered'}</p>
                    <span className={`doc-status-tag ${projectDetails.abstract ? 'uploaded' : 'missing'}`}>
                      {projectDetails.abstract ? '✓ Submitted' : 'Missing'}
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
                      {projectDetails.pptFile ? '✓ Uploaded' : 'Missing'}
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
                    <span className="text-dim font-sm" style={{ padding: '0.5rem 0' }}>Optional document not attached</span>
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
                      {projectDetails.demoVideoUrl ? '✓ Link Added' : 'No link'}
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
                        <FiExternalLink /> Open Link
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
                      {projectDetails.githubRepository ? '✓ Linked' : 'Missing'}
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

        </section>

        {/* MODAL PREVIEWS (Abstract, PPT, Doc, Video) */}
        <AnimatePresence>
          {activePreview && (
            <div className="preview-modal-overlay" onClick={() => setActivePreview(null)}>
              <motion.div
                className="preview-modal-dialog"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="modal-top-bar">
                  <h3 className="modal-title-text">{activePreview.title}</h3>
                  <button type="button" className="btn-modal-close" onClick={() => setActivePreview(null)}>
                    <FiX />
                  </button>
                </div>

                <div className="modal-body-content">
                  {activePreview.type === 'abstract' && (
                    <div className="abstract-modal-body">
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#e2e8f0' }}>
                        {activePreview.content}
                      </p>
                    </div>
                  )}

                  {activePreview.type === 'video' && (
                    <div className="video-embed-box">
                      <iframe
                        src={activePreview.url}
                        title="Demo Video Preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {(activePreview.type === 'ppt' || activePreview.type === 'doc') && (
                    <div className="file-preview-fallback">
                      <FiFileText size={48} className="text-dim" style={{ marginBottom: '1rem' }} />
                      <h4>{activePreview.title}</h4>
                      <p className="text-dim font-sm">Document preview is ready. Download to view full high-res presentation.</p>
                      <a href={activePreview.url} target="_blank" rel="noreferrer" className="btn-focal-primary" style={{ marginTop: '1rem' }}>
                        <FiDownload /> Download Document
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER STATE 5: CASE A — USER HAS NO REGISTERED TEAM (WIZARD)
  // -------------------------------------------------------------
  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <StepPersonal
          data={registration.personal}
          errors={currentStepErrors}
          onChange={updatePersonalField}
          onFileChange={(field, file) => updatePersonalField(field, file)}
        />
      );
    }
    if (currentStep === 1) {
      return (
        <StepTeam
          data={registration.team}
          errors={currentStepErrors}
          onChange={(team) => updateSection('team', team)}
          eventConfig={eventConfig}
          leadName={registration.personal?.fullName || registration.team?.teamLeader}
          leadCollege={registration.personal?.collegeName || registration.team?.teamLeaderCollege}
        />
      );
    }
    if (currentStep === 2) {
      return (
        <StepProblemStatement
          data={registration.project}
          errors={currentStepErrors}
          onChange={(projectData) => updateSection('project', projectData)}
        />
      );
    }
    if (currentStep === 3) {
      return (
        <StepProject
          data={registration.project}
          errors={currentStepErrors}
          onChange={(projectData) => updateSection('project', projectData)}
          eventConfig={eventConfig}
        />
      );
    }
    if (currentStep === 4) {
      return (
        <StepUpload
          data={registration.uploads}
          errors={currentStepErrors}
          onFileChange={updateUploadFile}
          eventConfig={eventConfig}
        />
      );
    }
    return (
      <StepReview
        data={registration}
        accepted={accepted}
        onAcceptedChange={setAccepted}
        onEditSection={(index) => setCurrentStep(index)}
      />
    );
  };

  return (
    <main className="portal-page">
      <section className="portal-shell wizard-shell">
        <div className="wizard-topbar">
          <div>
            <span className="section-subtitle">{eventConfig.eventName || 'Hack With Vizag 4.0'}</span>
            <h1>Participant Registration Wizard</h1>
            <p>{completion}% progress completed</p>
          </div>
          <div className="autosave-indicator">
            <FiSave />
            {isSaving ? 'Saving draft...' : 'Draft saved'}
          </div>
        </div>

        <ProgressBar
          steps={steps}
          currentStep={currentStep}
          highestStep={highestStep}
          onStepClick={setCurrentStep}
        />

        <motion.div
          className="wizard-card"
          key={steps[currentStep].id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {renderStep()}
        </motion.div>

        <div className="wizard-actions">
          <button type="button" className="secondary-action" onClick={goBack} disabled={currentStep === 0}>
            <FiArrowLeft /> Back
          </button>
          {currentStep < steps.length - 1 ? (
            <button type="button" className="primary-action" onClick={goNext}>
              Continue <FiArrowRight />
            </button>
          ) : (
            <button type="button" className="primary-action" onClick={submitFinal} disabled={!accepted || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Final Submit'} <FiCheckCircle />
            </button>
          )}
        </div>
      </section>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
