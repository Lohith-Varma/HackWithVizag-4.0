import { PROBLEM_STATEMENTS } from '../../data/hackathonData';

export default function StepProject({ data, errors, onChange }) {
  const update = (field) => (event) => onChange({ ...data, [field]: event.target.value });

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 3</span>
        <h2>Project Details</h2>
        <p>Share the idea, problem focus, and build plan your team wants to submit for screening.</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Project Title *</span>
          <input value={data.title} onChange={update('title')} placeholder="Smart Coastal Response Platform" />
          {errors.title && <small>{errors.title}</small>}
        </label>

        <label className="field">
          <span>Theme *</span>
          <select value={data.theme} onChange={update('theme')}>
            <option value="">Select theme</option>
            {PROBLEM_STATEMENTS.map((theme) => (
              <option key={theme.id} value={theme.title}>{theme.title}</option>
            ))}
          </select>
          {errors.theme && <small>{errors.theme}</small>}
        </label>

        <label className="field span-2">
          <span>Problem Statement *</span>
          <textarea rows="4" value={data.problemStatement} onChange={update('problemStatement')} placeholder="What specific problem are you solving?" />
          {errors.problemStatement && <small>{errors.problemStatement}</small>}
        </label>

        <label className="field span-2">
          <span>Abstract *</span>
          <textarea rows="5" value={data.abstract} onChange={update('abstract')} placeholder="Summarize the project, target users, and expected impact." />
          {errors.abstract && <small>{errors.abstract}</small>}
        </label>

        <label className="field span-2">
          <span>Innovation Summary *</span>
          <textarea rows="4" value={data.innovationSummary} onChange={update('innovationSummary')} placeholder="What makes your solution new, practical, or differentiated?" />
          {errors.innovationSummary && <small>{errors.innovationSummary}</small>}
        </label>

        <label className="field span-2">
          <span>Technology Stack *</span>
          <input value={data.technologyStack} onChange={update('technologyStack')} placeholder="React, Node.js, Firebase, TensorFlow, IoT sensors..." />
          {errors.technologyStack && <small>{errors.technologyStack}</small>}
        </label>

        <label className="field">
          <span>GitHub Repository</span>
          <input type="url" value={data.githubRepository} onChange={update('githubRepository')} placeholder="https://github.com/team/project" />
          {errors.githubRepository && <small>{errors.githubRepository}</small>}
        </label>

        <label className="field">
          <span>Demo Video URL</span>
          <input type="url" value={data.demoVideoUrl} onChange={update('demoVideoUrl')} placeholder="https://youtu.be/demo" />
          {errors.demoVideoUrl && <small>{errors.demoVideoUrl}</small>}
        </label>
      </div>
    </div>
  );
}
