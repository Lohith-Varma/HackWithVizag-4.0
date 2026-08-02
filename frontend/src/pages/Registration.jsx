import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiDownload, FiHome, FiSave } from 'react-icons/fi';
import ProgressBar from '../components/Registration/ProgressBar';
import StepPersonal from '../components/Registration/StepPersonal';
import StepProject from '../components/Registration/StepProject';
import StepReview from '../components/Registration/StepReview';
import StepTeam from '../components/Registration/StepTeam';
import StepUpload from '../components/Registration/StepUpload';
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
  validateProject,
  validateTeam,
  validateUploads,
} from '../utils/registrationValidation';
import './Portal.css';

const steps = [
  { id: 'personal', label: 'Personal' },
  { id: 'team', label: 'Team' },
  { id: 'project', label: 'Project' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'review', label: 'Review' },
];

const stepKeys = ['personal', 'team', 'project', 'uploads'];
const stepValidators = [validatePersonal, validateTeam, validateProject, validateUploads];

export default function Registration() {
  const [registration, setRegistration] = useState(() => loadDraftRegistration());
  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  const currentStepErrors = errors[steps[currentStep]?.id] || {};

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveDraftRegistration(registration);
      api.saveRegistrationDraft(registration).catch(() => {});
      setIsSaving(false);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [registration]);

  const completion = useMemo(() => {
    const completed = stepValidators.reduce((count, validator, index) => {
      const stepError = validator(registration[stepKeys[index]]);
      return count + (hasErrors(stepError) ? 0 : 1);
    }, 0);
    return Math.round((completed / stepValidators.length) * 100);
  }, [registration]);

  const updateSection = (section, value) => {
    setIsSaving(true);
    setRegistration((current) => ({ ...current, [section]: value }));
    setErrors((current) => ({ ...current, [steps[currentStep].id]: {} }));
  };

  const updatePersonalField = (field, value) => {
    updateSection('personal', { ...registration.personal, [field]: value });
  };

  const updatePersonalFile = (field, file) => {
    updateSection('personal', { ...registration.personal, [field]: file });
  };

  const updateUploadFile = (field, file) => {
    updateSection('uploads', { ...registration.uploads, [field]: file });
  };

  const validateStep = (index) => {
    if (index >= stepValidators.length) return true;
    const validator = stepValidators[index];
    const stepError = validator(registration[stepKeys[index]]);
    setErrors((current) => ({ ...current, [steps[index].id]: stepError }));
    return !hasErrors(stepError);
  };

  const goNext = () => {
    if (!validateStep(currentStep)) {
      setToast({ type: 'error', message: 'Please complete the required fields before continuing.' });
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
      const stepError = validator(registration[stepKeys[index]]);
      nextErrors[steps[index].id] = stepError;
      if (invalidStep === -1 && hasErrors(stepError)) invalidStep = index;
    });

    if (invalidStep !== -1) {
      setErrors(nextErrors);
      setCurrentStep(invalidStep);
      setToast({ type: 'error', message: 'Please fix the highlighted section before submitting.' });
      return;
    }
    if (!accepted) {
      setToast({ type: 'error', message: 'Please accept the declaration to submit.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.submitRegistration(registration);
      const submission = {
        ...result,
        status: result.status,
        registration,
      };
      saveSubmission(submission);
      clearDraftRegistration();
      setSuccess(submission);
      setToast({ type: 'success', message: 'Registration submitted successfully.' });
    } catch {
      setToast({ type: 'error', message: 'Submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAcknowledgement = async () => {
    setToast({ type: 'info', message: 'Acknowledgement download will be available after backend integration.' });
    await api.downloadAcknowledgement();
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <StepPersonal
          data={registration.personal}
          errors={currentStepErrors}
          onChange={updatePersonalField}
          onFileChange={updatePersonalFile}
        />
      );
    }
    if (currentStep === 1) {
      return (
        <StepTeam
          data={registration.team}
          errors={currentStepErrors}
          onChange={(team) => updateSection('team', team)}
        />
      );
    }
    if (currentStep === 2) {
      return (
        <StepProject
          data={registration.project}
          errors={currentStepErrors}
          onChange={(project) => updateSection('project', project)}
        />
      );
    }
    if (currentStep === 3) {
      return (
        <StepUpload
          data={registration.uploads}
          errors={currentStepErrors}
          onFileChange={updateUploadFile}
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
            <p>Your project is now marked as <strong>Under Review</strong>. Keep an eye on the participant dashboard for screening updates.</p>
            <div className="success-meta">
              <span>Registration ID</span>
              <strong>{success.registrationId}</strong>
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
            <span className="section-subtitle">Complete Registration</span>
            <h1>Hack With Vizag Registration</h1>
            <p>{completion}% profile completion</p>
          </div>
          <div className="autosave-indicator">
            <FiSave />
            {isSaving ? 'Saving draft...' : 'Draft saved locally'}
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
