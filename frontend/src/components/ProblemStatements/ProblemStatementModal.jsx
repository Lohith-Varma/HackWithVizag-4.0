import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiShare2,
  FiCheck,
  FiLayers,
  FiStar,
  FiFileText,
  FiTarget,
  FiSend,
  FiCpu,
  FiAward,
  FiArrowRight,
  FiExternalLink,
} from 'react-icons/fi';

export default function ProblemStatementModal({ problem, isOpen, onClose, onSelectForRegistration }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  const isOpenTrack = problem.type === 'open';

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#problem-statement/${problem.code || problem._id}`;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleRegisterClick = () => {
    if (onSelectForRegistration) {
      onSelectForRegistration(problem);
    } else {
      window.location.hash = '#register';
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="ps-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <motion.div
          className="ps-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />

        <motion.div
          className="ps-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Modal Header */}
          <div className="ps-modal-header">
            <div className="ps-modal-badges">
              <span className={`ps-badge-code ${isOpenTrack ? 'open-badge' : ''}`}>
                {isOpenTrack ? <FiStar /> : <FiLayers />} {problem.code || 'HWV'}
              </span>
              <span className="ps-badge-theme">{problem.theme || 'General Track'}</span>
              {problem.difficulty && (
                <span className="ps-badge-difficulty">{problem.difficulty}</span>
              )}
              {problem.organization && (
                <span className="ps-badge-org">{problem.organization}</span>
              )}
            </div>

            <div className="ps-modal-actions-top">
              <button
                type="button"
                className={`ps-btn-icon ${copied ? 'ps-btn-copied' : ''}`}
                onClick={handleCopyLink}
                title="Copy shareable link"
                aria-label="Copy link to problem statement"
              >
                {copied ? <FiCheck className="text-emerald" /> : <FiShare2 />}
                <span className="ps-tooltip">{copied ? 'Link Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                className="ps-btn-icon ps-btn-close"
                onClick={onClose}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Modal Title */}
          <div className="ps-modal-title-wrap">
            <h2 className="ps-modal-title">{problem.title}</h2>
          </div>

          {/* Modal Scrollable Body */}
          <div className="ps-modal-body">
            {/* Problem Statement Overview */}
            <div className="ps-detail-block">
              <div className="ps-detail-heading">
                <FiFileText className="ps-heading-icon" />
                <h3>Problem Description</h3>
              </div>
              <p className="ps-detail-text">
                {problem.problemStatement || problem.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Key Objectives */}
            {problem.objectives && problem.objectives.length > 0 && (
              <div className="ps-detail-block">
                <div className="ps-detail-heading">
                  <FiTarget className="ps-heading-icon" />
                  <h3>Key Objectives & Scope</h3>
                </div>
                <div className="ps-objectives-grid">
                  {problem.objectives.map((obj, idx) => (
                    <div key={idx} className="ps-objective-item">
                      <span className="ps-objective-num">{idx + 1}</span>
                      <p>{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online Round Requirements */}
            {problem.onlineRoundRequirements && (
              <div className="ps-detail-block">
                <div className="ps-detail-heading">
                  <FiSend className="ps-heading-icon" />
                  <h3>Online Round Requirements</h3>
                </div>
                <div className="ps-requirements-box">
                  <p>{problem.onlineRoundRequirements}</p>
                </div>
              </div>
            )}

            {/* Technologies / Focus Areas */}
            {problem.technologies && problem.technologies.length > 0 && (
              <div className="ps-detail-block">
                <div className="ps-detail-heading">
                  <FiCpu className="ps-heading-icon" />
                  <h3>Recommended Tech & Tools</h3>
                </div>
                <div className="ps-tech-tags">
                  {problem.technologies.map((tech, idx) => (
                    <span key={idx} className="ps-tech-pill">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Deliverables or Evaluation Notice */}
            <div className="ps-detail-block ps-deliverables-block">
              <div className="ps-detail-heading">
                <FiAward className="ps-heading-icon" />
                <h3>Submission & Deliverables</h3>
              </div>
              <ul className="ps-deliverables-list">
                <li>
                  <FiCheck className="ps-check-icon" />
                  <span>PPT presentation following the official hackathon template.</span>
                </li>
                <li>
                  <FiCheck className="ps-check-icon" />
                  <span>Working software/hardware prototype or simulation demonstration.</span>
                </li>
                <li>
                  <FiCheck className="ps-check-icon" />
                  <span>Public GitHub repository link with clean documentation and architecture diagrams.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="ps-modal-footer">
            <button
              type="button"
              className="ps-btn-secondary"
              onClick={onClose}
            >
              Back to Tracks
            </button>

            <button
              type="button"
              className="ps-btn-primary"
              onClick={handleRegisterClick}
            >
              <span>Choose & Register for this Track</span>
              <FiArrowRight className="ps-btn-arrow" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
