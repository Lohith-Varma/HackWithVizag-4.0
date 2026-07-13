import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import { PROBLEM_STATEMENTS } from '../../data/hackathonData';
import './ProblemStatements.css';

// Dynamic icon renderer helper
const renderIcon = (iconName, className) => {
  const IconComponent = Icons[iconName];
  return IconComponent ? <IconComponent className={className} /> : <Icons.FiLayers className={className} />;
};

export default function ProblemStatements() {
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleExpand = (id) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="themes" className="themes-section">
      <div className="glow-blob blob-themes-blue" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Themes & Focus Areas</span>
          <h2 className="section-title">Problem Statements</h2>
          <p className="section-description">
            Choose a challenge track that matches your skills. Build software or hardware prototypes that create a tangible, lasting impact.
          </p>
        </div>

        {/* Problem Statements Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="themes-grid"
        >
          {PROBLEM_STATEMENTS.map((theme) => {
            const isExpanded = expandedCard === theme.id;
            return (
              <motion.div 
                key={theme.id}
                variants={cardVariants}
                className={`theme-card ${isExpanded ? 'theme-expanded' : ''}`}
                layout
              >
                {/* Border Glow Gradient */}
                <div className="card-border-glow" />
                
                <div className="theme-card-header">
                  <div className="theme-icon-container">
                    {renderIcon(theme.icon, 'theme-icon')}
                  </div>
                  <div className="badge-container">
                    <span className="sdg-badge">{theme.sdgBadge}</span>
                    <span className="industry-badge">{theme.industryBadge}</span>
                  </div>
                </div>

                <h3 className="theme-title">{theme.title}</h3>
                <p className="theme-desc">{theme.shortDesc}</p>

                <button 
                  className={`btn-learn-more ${isExpanded ? 'btn-active' : ''}`}
                  onClick={() => toggleExpand(theme.id)}
                >
                  {isExpanded ? 'Show Less' : 'Learn More'}
                  <Icons.FiChevronDown className={`chevron-icon ${isExpanded ? 'rotate-chevron' : ''}`} />
                </button>

                {/* Collapsible Examples Drawer */}
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
                        <h4 className="examples-title">Example Solutions:</h4>
                        <ul className="examples-list">
                          {theme.examples.map((example, idx) => (
                            <li key={idx}>
                              <Icons.FiCornerDownRight className="bullet-arrow" />
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
