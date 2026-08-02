import { useState } from 'react';
import { FiArrowRight, FiDownload, FiEdit3, FiLogOut } from 'react-icons/fi';
import RegistrationSummary from '../components/Dashboard/RegistrationSummary';
import StatusCard from '../components/Dashboard/StatusCard';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import {
  clearCurrentUser,
  loadCurrentUser,
  loadDraftRegistration,
  loadSubmission,
} from '../utils/registrationStorage';
import { hasErrors, validatePersonal, validateProject, validateTeam, validateUploads } from '../utils/registrationValidation';
import { getStatusConfig } from '../utils/submissionStatus';
import './Portal.css';

const countCompletion = (registration) => {
  const validators = [
    validatePersonal(registration.personal),
    validateTeam(registration.team),
    validateProject(registration.project),
    validateUploads(registration.uploads),
  ];
  const complete = validators.filter((result) => !hasErrors(result)).length;
  return Math.round((complete / validators.length) * 100);
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'Not submitted';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
};

export default function Dashboard() {
  const [toast, setToast] = useState(null);
  const user = loadCurrentUser();
  const submission = loadSubmission();
  const draft = loadDraftRegistration();
  const registration = submission?.registration || draft;
  const status = submission?.status || 'draft';
  const statusConfig = getStatusConfig(status);

  const completion = countCompletion(registration);

  const goRegistration = () => {
    window.location.hash = '#registration';
  };

  const logout = () => {
    clearCurrentUser();
    window.location.hash = '#auth';
  };

  const downloadAcknowledgement = async () => {
    await api.downloadAcknowledgement();
    setToast({ type: 'info', message: 'Acknowledgement download is a placeholder until backend integration.' });
  };

  return (
    <main className="portal-page">
      <section className="portal-shell dashboard-shell">
        <div className="dashboard-header">
          <div>
            <span className="section-subtitle">Participant Dashboard</span>
            <h1>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p>Track your registration, screening status, and next action for Hack With Vizag 4.0.</p>
          </div>
          <button type="button" className="secondary-action compact-action" onClick={logout}>
            <FiLogOut /> Logout
          </button>
        </div>

        <div className="dashboard-metrics">
          <article className="metric-card">
            <span>Profile Completion</span>
            <strong>{completion}%</strong>
            <div className="metric-progress"><span style={{ width: `${completion}%` }} /></div>
          </article>
          <article className="metric-card">
            <span>Registration Status</span>
            <strong>{statusConfig.label}</strong>
            <span className={`status-badge status-${status}`}>{statusConfig.label}</span>
          </article>
          <article className="metric-card">
            <span>Submission Date</span>
            <strong>{formatDate(submission?.submissionDate)}</strong>
          </article>
        </div>

        <div className="dashboard-grid">
          <StatusCard status={status} />

          <article className="stage-card">
            <span className="section-subtitle">Screening Status</span>
            <h3>{status === 'selected' ? 'Congratulations!' : status === 'rejected' ? 'Screening Complete' : 'Your submission is under review.'}</h3>
            {status === 'selected' ? (
              <>
                <p>Your team has been shortlisted. Proceed to Offline Registration when the organizers open the next stage.</p>
                <button type="button" className="primary-action" onClick={() => setToast({ type: 'info', message: 'Offline round registration will be connected in the next phase.' })}>
                  Register for Offline Round <FiArrowRight />
                </button>
              </>
            ) : status === 'rejected' ? (
              <p>Your team was not shortlisted. Thank you for participating in the online screening phase.</p>
            ) : (
              <p>Your submission is under review. The offline registration section will appear here if your team is selected.</p>
            )}
          </article>
        </div>

        <div className="dashboard-main-card">
          <div className="dashboard-main-header">
            <div>
              <span className="section-subtitle">Registration Snapshot</span>
              <h2>{registration.project.title || 'No project title yet'}</h2>
              <p>Team: {registration.team.teamName || 'Not created yet'}</p>
            </div>
            <div className="dashboard-actions">
              <button type="button" className="secondary-action" onClick={goRegistration}>
                <FiEdit3 /> {status === 'draft' ? 'Complete Registration' : 'Edit Draft'}
              </button>
              <button type="button" className="secondary-action" onClick={downloadAcknowledgement} disabled={!submission}>
                <FiDownload /> Acknowledgement
              </button>
            </div>
          </div>
          <RegistrationSummary data={registration} />
        </div>
      </section>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
