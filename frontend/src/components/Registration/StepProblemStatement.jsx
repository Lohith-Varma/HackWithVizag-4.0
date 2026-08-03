import { useState, useEffect } from 'react';
import { FiCheck, FiChevronDown, FiChevronUp, FiLayers, FiStar } from 'react-icons/fi';
import { api } from '../../services/api';

export default function StepProblemStatement({ data, errors, onChange }) {
  const [problemStatements, setProblemStatements] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getProblemStatements()
      .then((res) => {
        if (isMounted) {
          const list = res.problemStatements || [];
          setProblemStatements(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectProblem = (ps) => {
    if (ps.type === 'open') {
      onChange({
        ...data,
        problemStatementId: ps._id,
        problemCode: ps.code,
        problemType: 'open',
        title: data.title || 'Open Innovation Entry',
        theme: data.theme || 'Open Innovation',
        problemStatement: data.problemStatement || '',
      });
    } else {
      onChange({
        ...data,
        problemStatementId: ps._id,
        problemCode: ps.code,
        problemType: 'official',
        title: ps.title,
        theme: ps.theme,
        problemStatement: ps.problemStatement,
      });
    }
  };

  const updateOpenField = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const isSelected = (ps) => data.problemCode === ps.code || data.problemStatementId === ps._id;

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 3</span>
        <h2>Choose Problem Statement</h2>
        <p>Select an official track or propose a custom solution through Open Innovation.</p>
      </div>

      {loading ? (
        <div className="loading-skeleton">Loading challenge tracks...</div>
      ) : (
        <div className="problem-statement-cards">
          {problemStatements.map((ps) => {
            const active = isSelected(ps);
            const isExpanded = expandedId === ps._id;

            return (
              <div
                key={ps._id}
                className={`problem-card ${active ? 'selected-card' : ''}`}
              >
                <div className="problem-card-header" onClick={() => setExpandedId(isExpanded ? null : ps._id)}>
                  <div className="problem-card-meta">
                    <span className={`ps-tag ${ps.type === 'open' ? 'open-tag' : ''}`}>
                      {ps.type === 'open' ? <FiStar /> : <FiLayers />} {ps.code}
                    </span>
                    <span className="ps-theme">{ps.theme}</span>
                  </div>
                  <h3>{ps.title}</h3>

                  <div className="problem-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`select-ps-btn ${active ? 'active-select' : ''}`}
                      onClick={() => selectProblem(ps)}
                    >
                      {active ? <><FiCheck /> Selected</> : 'Select'}
                    </button>
                    <button
                      type="button"
                      className="icon-toggle"
                      onClick={() => setExpandedId(isExpanded ? null : ps._id)}
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="problem-card-body">
                    <div className="ps-detail-section">
                      <strong>Problem Description:</strong>
                      <p>{ps.problemStatement}</p>
                    </div>

                    {ps.objectives && ps.objectives.length > 0 && (
                      <div className="ps-detail-section">
                        <strong>Key Objectives:</strong>
                        <ul>
                          {ps.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ps.onlineRoundRequirements && (
                      <div className="ps-detail-section">
                        <strong>Online Round Requirements:</strong>
                        <p>{ps.onlineRoundRequirements}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory extra fields if Open Innovation is selected */}
      {data.problemType === 'open' && (
        <div className="open-innovation-fields form-grid span-2 mt-4">
          <div className="section-divider">
            <h3>Open Innovation Details (Mandatory)</h3>
          </div>
          <label className="field span-2">
            <span>Custom Problem Title *</span>
            <input
              value={data.title}
              onChange={(e) => updateOpenField('title', e.target.value)}
              placeholder="Give your open innovation idea a title"
            />
            {errors.title && <small>{errors.title}</small>}
          </label>

          <label className="field span-2">
            <span>Theme / Domain *</span>
            <input
              value={data.theme}
              onChange={(e) => updateOpenField('theme', e.target.value)}
              placeholder="e.g. AgriTech / HealthTech / FinTech"
            />
            {errors.theme && <small>{errors.theme}</small>}
          </label>

          <label className="field span-2">
            <span>Custom Problem Statement *</span>
            <textarea
              rows="4"
              value={data.problemStatement}
              onChange={(e) => updateOpenField('problemStatement', e.target.value)}
              placeholder="Describe the problem you are solving in detail..."
            />
            {errors.problemStatement && <small>{errors.problemStatement}</small>}
          </label>
        </div>
      )}

      {errors.problemStatementId && <div className="error-banner">{errors.problemStatementId}</div>}
    </div>
  );
}
