import { FiCheck } from 'react-icons/fi';

export default function ProgressBar({ steps, currentStep, onStepClick, highestStep }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="wizard-progress" aria-label="Registration progress">
      <div className="mobile-step-summary" aria-live="polite">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <strong>{steps[currentStep].label}</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="step-indicator-list">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          const canVisit = index <= highestStep;

          return (
            <button
              key={step.id}
              type="button"
              className={`step-indicator ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => canVisit && onStepClick(index)}
              disabled={!canVisit}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-marker">{isDone ? <FiCheck /> : index + 1}</span>
              <span className="step-label">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
