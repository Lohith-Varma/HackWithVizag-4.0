import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiLayers,
  FiStar,
  FiArrowRight,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiSliders,
} from 'react-icons/fi';
import { api } from '../../services/api';
import ProblemStatementModal from './ProblemStatementModal';
import './ProblemStatements.css';

export default function ProblemStatements() {
  const [problemStatements, setProblemStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState('All');
  const [selectedProblem, setSelectedProblem] = useState(null);

  const fetchProblemStatements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProblemStatements();
      const list = res.problemStatements || [];
      setProblemStatements(list);
    } catch (err) {
      setError(err?.message || 'Unable to load problem statements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblemStatements();
  }, [fetchProblemStatements]);

  // Handle URL hash changes for deep linking (e.g. #problem-statement/HWV-01 or ID)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (
        hash.startsWith('#problem-statement/') ||
        hash.startsWith('#problem-statements/') ||
        hash.startsWith('#ps/') ||
        hash.startsWith('#theme/')
      ) {
        const idOrCode = hash.split('/')[1]?.trim();
        if (idOrCode && problemStatements.length > 0) {
          const match = problemStatements.find(
            (p) =>
              (p.code && p.code.toLowerCase() === idOrCode.toLowerCase()) ||
              p._id === idOrCode
          );
          if (match) {
            setSelectedProblem(match);
          }
        }
      } else if (hash === '#themes' && selectedProblem) {
        setSelectedProblem(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [problemStatements, selectedProblem]);

  // Open Problem Detail Modal & update hash for shareability & back button
  const handleOpenDetails = (problem) => {
    setSelectedProblem(problem);
    if (problem?.code) {
      window.location.hash = `#problem-statement/${problem.code}`;
    } else if (problem?._id) {
      window.location.hash = `#problem-statement/${problem._id}`;
    }
  };

  // Close Problem Detail Modal & revert hash
  const handleCloseDetails = () => {
    setSelectedProblem(null);
    if (window.location.hash.startsWith('#problem-statement/') || window.location.hash.startsWith('#ps/')) {
      // Revert to themes section without reloading
      history.pushState(null, '', '#themes');
    }
  };

  // Extract unique themes for filtering chips
  const themeCategories = useMemo(() => {
    const categories = new Set(['All']);
    problemStatements.forEach((ps) => {
      if (ps.theme && ps.theme.trim()) {
        categories.add(ps.theme.trim());
      }
    });
    return Array.from(categories);
  }, [problemStatements]);

  // Filtered problem statements based on search query and category pill
  const filteredProblems = useMemo(() => {
    return problemStatements.filter((ps) => {
      // Theme filter
      const matchesCategory =
        selectedThemeFilter === 'All' ||
        (ps.theme && ps.theme.toLowerCase() === selectedThemeFilter.toLowerCase());

      // Search query filter (matches code, title, theme, description, tech)
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCategory;

      const codeMatch = ps.code?.toLowerCase().includes(q);
      const titleMatch = ps.title?.toLowerCase().includes(q);
      const themeMatch = ps.theme?.toLowerCase().includes(q);
      const descMatch = (ps.problemStatement || ps.description)?.toLowerCase().includes(q);
      const techMatch = Array.isArray(ps.technologies) && ps.technologies.some(t => t.toLowerCase().includes(q));

      return matchesCategory && (codeMatch || titleMatch || themeMatch || descMatch || techMatch);
    });
  }, [problemStatements, selectedThemeFilter, searchQuery]);

  // Handle selecting a track directly for registration
  const handleSelectForRegistration = (ps) => {
    // If the app supports draft preselection
    try {
      const existingDraft = JSON.parse(localStorage.getItem('hwv_registration_draft') || '{}');
      const updatedDraft = {
        ...existingDraft,
        project: {
          ...(existingDraft.project || {}),
          problemStatementId: ps._id,
          problemCode: ps.code,
          problemType: ps.type === 'open' ? 'open' : 'official',
          title: ps.type === 'open' ? (existingDraft.project?.title || 'Open Innovation Entry') : ps.title,
          theme: ps.theme,
          problemStatement: ps.type === 'open' ? (existingDraft.project?.problemStatement || '') : (ps.problemStatement || ''),
        },
      };
      localStorage.setItem('hwv_registration_draft', JSON.stringify(updatedDraft));
    } catch (_) {
      // Ignore storage error
    }
    window.location.hash = '#register';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="themes" className="themes-section">
      <div className="glow-blob blob-themes-blue" />
      <div className="glow-blob blob-themes-purple" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Hackathon Tracks & Challenges</span>
          <h2 className="section-title">
            Problem <span className="gradient-text-cyan">Statements</span>
          </h2>
          <p className="section-description">
            Choose an official challenge statement or propose your breakthrough solution in Open Innovation.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="ps-controls-container">
          <div className="ps-search-bar">
            <FiSearch className="ps-search-icon" />
            <input
              type="text"
              className="ps-search-input"
              placeholder="Search problem statements, themes, technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search problem statements"
            />
            {searchQuery && (
              <button
                type="button"
                className="ps-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {themeCategories.length > 1 && (
            <div className="ps-filter-pills" role="tablist" aria-label="Filter by theme">
              {themeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selectedThemeFilter === cat}
                  className={`ps-filter-pill ${selectedThemeFilter === cat ? 'active' : ''}`}
                  onClick={() => setSelectedThemeFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          /* Loading Skeletons */
          <div className="ps-compact-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="ps-skeleton-card">
                <div className="skeleton-line skeleton-badge" />
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-title-short" />
                <div className="skeleton-line skeleton-btn" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="ps-state-container ps-error-state">
            <div className="ps-state-icon">⚠️</div>
            <h3>Unable to load problem statements</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn-retry"
              onClick={fetchProblemStatements}
            >
              <FiRefreshCw className="mr-2" /> Try Again
            </button>
          </div>
        ) : filteredProblems.length === 0 ? (
          /* Empty State */
          <div className="ps-state-container ps-empty-state">
            <div className="ps-state-icon">🔍</div>
            <h3>No problem statements found</h3>
            <p>
              {searchQuery || selectedThemeFilter !== 'All'
                ? 'No tracks matched your search or category filter. Try clearing your filters.'
                : 'No problem statements available at the moment.'}
            </p>
            {(searchQuery || selectedThemeFilter !== 'All') && (
              <button
                type="button"
                className="btn-reset-filter"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedThemeFilter('All');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Compact Problem Statements Grid */
          <>
            <div className="ps-results-meta">
              <span>
                Showing <strong>{filteredProblems.length}</strong> challenge track
                {filteredProblems.length === 1 ? '' : 's'}
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="ps-compact-grid"
            >
              {filteredProblems.map((ps) => {
                const isOpenTrack = ps.type === 'open';

                return (
                  <motion.div
                    key={ps._id || ps.code}
                    variants={cardVariants}
                    className={`ps-compact-card ${isOpenTrack ? 'open-innovation-card' : ''}`}
                    onClick={() => handleOpenDetails(ps)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${ps.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDetails(ps);
                      }
                    }}
                  >
                    <div className="ps-card-glow-edge" />

                    {/* Card Header with Badges */}
                    <div className="ps-card-top">
                      <div className="ps-badges-row">
                        <span className={`ps-code-tag ${isOpenTrack ? 'open-tag' : ''}`}>
                          {isOpenTrack ? <FiStar /> : <FiLayers />} {ps.code || 'HWV'}
                        </span>
                        <span className="ps-theme-tag">{ps.theme || 'Track'}</span>
                      </div>
                      {ps.difficulty && (
                        <span className="ps-difficulty-mini">{ps.difficulty}</span>
                      )}
                    </div>

                    {/* Card Title (Primary Focus) */}
                    <h3 className="ps-card-title">{ps.title}</h3>

                    {/* Card Footer with "View Details ->" CTA */}
                    <div className="ps-card-footer">
                      <button
                        type="button"
                        className="ps-view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(ps);
                        }}
                      >
                        <span>View Details</span>
                        <FiArrowRight className="ps-arrow-icon" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>

      {/* Dedicated Detail View Modal */}
      <ProblemStatementModal
        problem={selectedProblem}
        isOpen={Boolean(selectedProblem)}
        onClose={handleCloseDetails}
        onSelectForRegistration={handleSelectForRegistration}
      />
    </section>
  );
}
