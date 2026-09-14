import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiHome, FiUsers } from 'react-icons/fi';
import StepPersonal from './StepPersonal';
import StepTeam from './StepTeam';
import ProgressBar from './ProgressBar';
import Toast from '../Toast/Toast';
import { hasErrors, validatePersonal, validateTeam } from '../../utils/registrationValidation';
import { api } from '../../services/api';
import { saveDraftRegistration } from '../../utils/registrationStorage';

const phaseSteps = [
  { id: 'personal', label: '1. Profile' },
  { id: 'team', label: '2. Team' },
  { id: 'review', label: '3. Confirm' },
];

export default function TeamRegistrationFlow({ initialData, eventConfig, onRegistered }) {
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const validators = useMemo(() => [
    (value) => validatePersonal(value.personal),
    (value) => validateTeam(value.team, eventConfig, value.personal?.collegeName),
  ], [eventConfig]);

  useEffect(() => {
    saveDraftRegistration(data);
  }, [data]);

  const validateStep = (index) => {
    if (index >= validators.length) return true;
    const next = validators[index](data);
    setErrors((current) => ({ ...current, [phaseSteps[index].id]: next }));
    return !hasErrors(next);
  };

  const next = () => {
    if (!validateStep(step)) return setToast({ type: 'error', message: 'Please fix the highlighted details.' });
    const nextStep = Math.min(step + 1, phaseSteps.length - 1);
    setStep(nextStep);
    setHighestStep((value) => Math.max(value, nextStep));
  };

  const submit = async () => {
    const nextErrors = {
      personal: validators[0](data),
      team: validators[1](data),
    };
    const invalidIndex = hasErrors(nextErrors.personal) ? 0 : hasErrors(nextErrors.team) ? 1 : -1;
    if (invalidIndex >= 0) {
      setErrors(nextErrors);
      setStep(invalidIndex);
      return setToast({ type: 'error', message: 'Complete all required team registration details.' });
    }
    if (!accepted) return setToast({ type: 'error', message: 'Confirm that the team details are correct.' });
    setSubmitting(true);
    try {
      const response = await api.registerTeam({ personal: data.personal, team: data.team });
      setResult(response);
      setToast({ type: 'success', message: 'Team registered. Project submission is now available.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Team registration failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <main className="portal-page"><section className="portal-shell success-shell">
        <div className="success-card">
          <FiCheckCircle className="success-icon" />
          <span className="section-subtitle">Phase 1 Complete</span>
          <h1>Team Registered</h1>
          <p>Your team now counts as registered. Submit the project and PPT separately when you are ready.</p>
          <div className="success-meta">
            <div><span>Team</span><strong>{result.team?.teamName}</strong></div>
            <div><span>Team Size</span><strong>{result.team?.members?.length || 0}</strong></div>
            <div><span>Status</span><strong className="badge-tag">Registered</strong></div>
          </div>
          <div className="success-actions">
            <button type="button" className="primary-action" onClick={() => onRegistered?.()}><FiArrowRight /> Start Project Submission</button>
            <button type="button" className="secondary-action" onClick={() => { window.location.hash = '#dashboard'; }}><FiHome /> Dashboard</button>
          </div>
        </div>
      </section><Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} /></main>
    );
  }

  return (
    <main className="portal-page"><section className="portal-shell wizard-shell">
      <div className="portal-heading"><span className="section-subtitle">Phase 1 of 4</span><h1>Register Your Team</h1><p>Create your team first. No project or PPT is required at this stage.</p></div>
      <ProgressBar steps={phaseSteps} currentStep={step} highestStep={highestStep} onStepClick={(index) => index <= highestStep && setStep(index)} />
      <div className="wizard-card">
        {step === 0 && <StepPersonal data={data.personal} errors={errors.personal || {}} onChange={(field, value) => setData((current) => ({ ...current, personal: { ...current.personal, [field]: value } }))} onFileChange={() => {}} />}
        {step === 1 && <StepTeam data={data.team} errors={errors.team || {}} leadName={data.personal?.fullName} leadCollege={data.personal?.collegeName} onChange={(team) => setData((current) => ({ ...current, team }))} />}
        {step === 2 && <div className="wizard-step"><div className="step-copy"><span className="section-subtitle">Step 3</span><h2>Confirm Team Registration</h2><p>This creates the team only. Project submission remains a separate phase.</p></div><div className="team-overview-card"><h3><FiUsers /> {data.team?.teamName}</h3><p>{1 + (data.team?.members?.length || 0)} members • {data.personal?.collegeName}</p></div><label className="declaration"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I confirm that these team details are correct.</span></label></div>}
        <div className="wizard-actions"><button type="button" className="secondary-action" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><FiArrowLeft /> Back</button>{step < 2 ? <button type="button" className="primary-action" onClick={next}>Continue <FiArrowRight /></button> : <button type="button" className="primary-action" disabled={submitting} onClick={submit}>{submitting ? 'Registering...' : 'Register Team'} <FiCheckCircle /></button>}</div>
      </div>
    </section><Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} /></main>
  );
}
