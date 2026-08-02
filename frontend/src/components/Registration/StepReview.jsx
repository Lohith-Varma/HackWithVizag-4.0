import RegistrationSummary from '../Dashboard/RegistrationSummary';

export default function StepReview({ data, accepted, onAcceptedChange, onEditSection }) {
  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 5</span>
        <h2>Review & Final Submit</h2>
        <p>Review each section carefully. You can jump back and edit before the final submission.</p>
      </div>

      <RegistrationSummary data={data} onEditSection={onEditSection} />

      <label className="declaration">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => onAcceptedChange(event.target.checked)}
        />
        <span>I confirm that all the information provided is correct.</span>
      </label>
    </div>
  );
}
