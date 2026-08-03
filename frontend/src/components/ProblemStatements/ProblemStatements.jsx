import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCornerDownRight, FiLayers, FiStar } from 'react-icons/fi';
import { api } from '../../services/api';
import './ProblemStatements.css';

export default function ProblemStatements() {
  const [problemStatements, setProblemStatements] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getProblemStatements()
      .then((res) => {
        if (isMounted) {
          setProblemStatements(res.problemStatements || []);
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

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="themes" className="themes-section">
      <div className="glow-blob blob-themes-blue" />

      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Tracks & Focus Areas</span>
          <h2 className="section-title">Problem Statements</h2>
          <p className="section-description">
            Explore official hackathon problem statements or choose the Open Innovation track.
          </p>
        </div>

        {loading ? (
          <div className="admin-loading">Loading challenge tracks...</div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="themes-grid"
          >
            {problemStatements.map((theme) => {
              const isExpanded = expandedCard === theme._id;
              const isOpenTrack = theme.type === 'open';

              return (
                <motion.div
                  key={theme._id}
                  variants={cardVariants}
                  className={`theme-card ${isExpanded ? 'theme-expanded' : ''}`}
                  layout
                >
                  <div className="card-border-glow" />

                  <div className="theme-card-header">
                    <div className="theme-icon-container">
                      {isOpenTrack ? <FiStar className="theme-icon" /> : <FiLayers className="theme-icon" />}
                    </div>
                    <div className="badge-container">
                      <span className={`sdg-badge ${isOpenTrack ? 'open-tag' : ''}`}>{theme.code}</span>
                      <span className="industry-badge">{theme.theme}</span>
                    </div>
                  </div>

                  <h3 className="theme-title">{theme.title}</h3>
                  <p className="theme-desc">{theme.problemStatement}</p>

                  <button
                    type="button"
                    className={`btn-learn-more ${isExpanded ? 'btn-active' : ''}`}
                    onClick={() => toggleExpand(theme._id)}
                  >
                    {isExpanded ? 'Show Less' : 'View Objectives'}
                    <FiChevronDown className={`chevron-icon ${isExpanded ? 'rotate-chevron' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="examples-drawer"
                      >
                        <div className="examples-inner">
                          {theme.objectives && theme.objectives.length > 0 && (
                            <>
                              <h4 className="examples-title">Key Objectives:</h4>
                              <ul className="examples-list">
                                {theme.objectives.map((objective, idx) => (
                                  <li key={idx}>
                                    <FiCornerDownRight className="bullet-arrow" />
                                    <span>{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {theme.onlineRoundRequirements && (
                            <div className="mt-3">
                              <h4 className="examples-title">Online Round Requirements:</h4>
                              <p className="text-sm text-dim">{theme.onlineRoundRequirements}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
