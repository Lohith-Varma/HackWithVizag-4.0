import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiFileText } from 'react-icons/fi';
import { RULES_DATA } from '../../data/hackathonData';
import './Rules.css';

export default function Rules() {
  const [activeRuleId, setActiveRuleId] = useState(null);

  const toggleRule = (id) => {
    if (activeRuleId === id) {
      setActiveRuleId(null);
    } else {
      setActiveRuleId(id);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="rules" className="rules-section">
      <div className="glow-blob blob-rules-purple" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Guidelines</span>
          <h2 className="section-title">Rules & Code of Conduct</h2>
          <p className="section-description">
            Read these guidelines carefully. Adherence to these rules is mandatory for a fair, inclusive, and competitive hackathon.
          </p>
        </div>

        {/* Rules Accordions */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="rules-accordion-container"
        >
          {RULES_DATA.map((rule) => {
            const isOpen = activeRuleId === rule.id;
            return (
              <motion.div 
                key={rule.id}
                variants={itemVariants}
                className={`rule-accordion-item ${isOpen ? 'rule-open' : ''}`}
              >
                {/* Header button click */}
                <button 
                  className="rule-accordion-header"
                  onClick={() => toggleRule(rule.id)}
                  aria-expanded={isOpen}
                >
                  <div className="rule-title-group">
                    <FiFileText className={`rule-icon ${isOpen ? 'active' : ''}`} />
                    <span>{rule.title}</span>
                  </div>
                  <div className={`rule-accordion-icon ${isOpen ? 'rotate' : ''}`}>
                    {isOpen ? <FiMinus size={20} /> : <FiPlus size={20} />}
                  </div>
                </button>

                {/* Smooth Expandable Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="rule-accordion-content"
                    >
                      <div className="rule-content-inner">
                        <p>{rule.content}</p>
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
