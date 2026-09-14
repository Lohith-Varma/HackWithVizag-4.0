import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiLock } from 'react-icons/fi';
import ProgressBar from './ProgressBar';
import StepProblemStatement from './StepProblemStatement';
import StepProject from './StepProject';
import StepUpload from './StepUpload';
import Toast from '../Toast/Toast';
import { api } from '../../services/api';
import { hasErrors, validateProject, validateUploads } from '../../utils/registrationValidation';
import { saveDraftRegistration } from '../../utils/registrationStorage';

const phaseSteps = [
  { id: 'problemStatement', label: '1. Problem Statement' },
  { id: 'project', label: '2. Project' },
  { id: 'uploads', label: '3. Uploads' },
  { id: 'review', label: '4. Review' },
];

export default function ProjectSubmissionFlow({ teamData, initialData, eventConfig, currentUser, onSubmitted }) {
  const [project, setProject] = useState({ ...(initialData?.project || {}), ...(teamData.project || {}) });
  const [uploads, setUploads] = useState(initialData?.uploads || {});
  const [step, setStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const leaderId = teamData.team?.leader?._id?.toString() || teamData.team?.leader?.toString();
  const userId = currentUser?._id?.toString() || currentUser?.id?.toString();
  const isLeader = Boolean(leaderId && userId && leaderId === userId) || teamData.team?.leader?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
  const validators = useMemo(() => [
    (value) => {
      const next = {};
      if (!value.problemStatementId && !value.problemCode) next.problemStatementId = 'Select a problem statement or Open Innovation track';
      if (value.problemType === 'open') {
        if (!value.title?.trim()) next.title = 'Custom title is required';
        if (!value.theme?.trim()) next.theme = 'Theme is required';
        if (!value.problemStatement?.trim()) next.problemStatement = 'Problem statement is required';
      }
      return next;
    },
    (value) => validateProject(value, eventConfig),
    () => validateUploads(uploads, eventConfig),
  ], [eventConfig, uploads]);

  useEffect(() => {
    saveDraftRegistration({ ...initialData, project, uploads });
  }, [initialData, project, uploads]);

  const validateStep = (index) => {
    if (index >= validators.length) return true;
    const next = validators[index](project);
    setErrors((current) => ({ ...current, [phaseSteps[index].id]: next }));
    return !hasErrors(next);
  };
  const next = () => {
    if (!validateStep(step)) return setToast({ type: 'error', message: 'Please fix the highlighted submission details.' });
    const nextStep = Math.min(step + 1, phaseSteps.length - 1);
    setStep(nextStep);
    setHighestStep((value) => Math.max(value, nextStep));
  };
  const submit = async () => {
    const nextErrors = {
      problemStatement: validators[0](project),
      project: validators[1](project),
      uploads: validators[2](project),
    };
    const invalidIndex = ['problemStatement', 'project', 'uploads'].findIndex((key) => hasErrors(nextErrors[key]));
    if (invalidIndex >= 0) { setErrors(nextErrors); setStep(invalidIndex); return setToast({ type: 'error', message: 'Complete all required project submission fields.' }); }
    if (!accepted) return setToast({ type: 'error', message: 'Confirm the declaration before submitting.' });
    setSubmitting(true);
    try {
      await api.submitProject({ project, uploads });
      setToast({ type: 'success', message: 'Project submitted and queued for evaluation.' });
      await onSubmitted?.();
      window.location.hash = '#dashboard';
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Project submission failed.' });
    } finally { setSubmitting(false); }
  };

  if (!isLeader) return <main className="portal-page"><section className="portal-shell success-shell"><div className="success-card"><FiLock className="success-icon" /><h1>Project Submission Pending</h1><p>Your team is registered. Only the team leader can complete the project and PPT submission.</p><button type="button" className="primary-action" onClick={() => { window.location.hash = '#dashboard'; }}>View Team Dashboard</button></div></section></main>;

  return (
    <main className="portal-page"><section className="portal-shell wizard-shell">
      <div className="portal-heading"><span className="section-subtitle">Phase 2 of 4</span><h1>Complete Project Submission</h1><p><strong>{teamData.team?.teamName}</strong> is registered. Submit the solution for evaluation.</p></div>
      <ProgressBar steps={phaseSteps} currentStep={step} highestStep={highestStep} onStepClick={(index) => index <= highestStep && setStep(index)} />
      <div className="wizard-card">
        {step === 0 && <StepProblemStatement data={project} errors={errors.problemStatement || {}} onChange={setProject} />}
        {step === 1 && <StepProject data={project} errors={errors.project || {}} eventConfig={eventConfig} onChange={setProject} />}
        {step === 2 && <StepUpload data={uploads} errors={errors.uploads || {}} eventConfig={eventConfig} onFileChange={(field, file) => setUploads((value) => ({ ...value, [field]: file }))} />}
        {step === 3 && <div className="wizard-step"><div className="step-copy"><span className="section-subtitle">Step 4</span><h2>Review & Submit for Evaluation</h2><p>Final submission locks project editing and starts admin evaluation.</p></div><div className="team-overview-card"><h3>{project.title}</h3><p>{project.problemCode} • {project.theme}</p><p>PPT: <strong>{uploads.pptFile?.name}</strong></p></div><label className="declaration"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I confirm the project information and files are ready for evaluation.</span></label></div>}
        <div className="wizard-actions"><button type="button" className="secondary-action" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><FiArrowLeft /> Back</button>{step < 3 ? <button type="button" className="primary-action" onClick={next}>Continue <FiArrowRight /></button> : <button type="button" className="primary-action" disabled={submitting} onClick={submit}>{submitting ? 'Submitting...' : 'Submit Project'} <FiCheckCircle /></button>}</div>
      </div>
    </section><Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} /></main>
  );
}
