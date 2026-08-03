import { countWords } from '../../utils/registrationValidation';

export default function StepProject({ data, errors, onChange, eventConfig = {} }) {
  const minWords = eventConfig.minAbstractWords || 50;
  const maxWords = eventConfig.maxAbstractWords || 500;

  const update = (field) => (event) => onChange({ ...data, [field]: event.target.value });

  const currentAbstractWords = countWords(data.abstract);
  const isWordCountValid = currentAbstractWords >= minWords && currentAbstractWords <= maxWords;

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 4</span>
        <h2>Project Details</h2>
        <p>Define your solution, abstract, technology stack, and repository links.</p>
      </div>

      <div className="form-grid">
        <label className="field span-2">
          <span>Project Title *</span>
          <input
            value={data.title}
            onChange={update('title')}
            placeholder="e.g. AI-Powered Autonomous Marine Debris Scanner"
          />
          {errors.title && <small>{errors.title}</small>}
        </label>

        <label className="field span-2">
          <span>Selected Problem Statement / Track</span>
          <div className="readonly-box">
            <strong>[{data.problemCode || 'Selected Track'}]</strong> {data.title || data.problemStatement || 'Not selected'}
          </div>
        </label>

        <label className="field span-2">
          <div className="field-header-row">
            <span>Abstract *</span>
            <span className={`word-counter ${isWordCountValid ? 'valid' : 'invalid'}`}>
              Word Count: {currentAbstractWords} / {minWords} - {maxWords} words
            </span>
          </div>
          <textarea
            rows="6"
            value={data.abstract}
            onChange={update('abstract')}
            placeholder="Summarize the project, core methodology, target users, and expected practical impact..."
          />
          <small className="field-hint">
            Abstract must be between {minWords} and {maxWords} words.
          </small>
          {errors.abstract && <small>{errors.abstract}</small>}
        </label>

        <label className="field span-2">
          <span>Technology Stack *</span>
          <input
            value={data.technologyStack}
            onChange={update('technologyStack')}
            placeholder="e.g. React, Node.js, Python, TensorFlow, OpenCV, Docker, MongoDB"
          />
          {errors.technologyStack && <small>{errors.technologyStack}</small>}
        </label>

        <label className="field">
          <span>GitHub Repository (Optional)</span>
          <input
            type="url"
            value={data.githubRepository}
            onChange={update('githubRepository')}
            placeholder="https://github.com/team/project-repo"
          />
          {errors.githubRepository && <small>{errors.githubRepository}</small>}
        </label>

        <label className="field">
          <span>Demo Video URL (Optional)</span>
          <input
            type="url"
            value={data.demoVideoUrl}
            onChange={update('demoVideoUrl')}
            placeholder="https://youtu.be/your-demo-video"
          />
          {errors.demoVideoUrl && <small>{errors.demoVideoUrl}</small>}
        </label>
      </div>
    </div>
  );
}
