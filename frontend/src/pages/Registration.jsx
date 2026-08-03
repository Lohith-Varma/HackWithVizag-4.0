import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiDownload, FiHome, FiSave } from 'react-icons/fi';
import ProgressBar from '../components/Registration/ProgressBar';
import StepPersonal from '../components/Registration/StepPersonal';
import StepTeam from '../components/Registration/StepTeam';
import StepProblemStatement from '../components/Registration/StepProblemStatement';
import StepProject from '../components/Registration/StepProject';
import StepUpload from '../components/Registration/StepUpload';
import StepReview from '../components/Registration/StepReview';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import {
  clearDraftRegistration,
  loadDraftRegistration,
  saveDraftRegistration,
  saveSubmission,
} from '../utils/registrationStorage';
import {
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

export default function Registration() {
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

  // Fetch Event Configuration dynamically on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getEventConfig()
      .then((res) => {
        if (isMounted && res.event) {
          setEventConfig(res.event);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync draft state to localStorage
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveDraftRegistration(registration);
      api.saveRegistrationDraft(registration).catch(() => {});
      setIsSaving(false);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [registration]);

  const currentStepErrors = errors[steps[currentStep]?.id] || {};

  const stepValidators = useMemo(
    () => [
      (reg) => validatePersonal(reg.personal),
      (reg) => validateTeam(reg.team, eventConfig),
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
