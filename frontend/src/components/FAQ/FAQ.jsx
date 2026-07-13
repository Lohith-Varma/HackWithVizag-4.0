import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import { FAQ_DATA } from '../../data/hackathonData';
import './FAQ.css';

export default function FAQ() {
  const [activeFaqId, setActiveFaqId] = useState(null);

  const toggleFaq = (id) => {
    if (activeFaqId === id) {
      setActiveFaqId(null);
    } else {
      setActiveFaqId(id);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <section id="faq" className="faq-section">
      <div className="glow-blob blob-faq-purple" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Common Queries</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-description">
            Have questions? We have answers. If you can't find what you're looking for, feel free to reach out to our organizers below.
          </p>
        </div>

        {/* FAQ list */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="faq-accordion-container"
        >
          {FAQ_DATA.map((faq) => {
            const isOpen = activeFaqId === faq.id;
            return (
              <motion.div 
                key={faq.id}
                variants={itemVariants}
                className={`faq-accordion-item ${isOpen ? 'faq-open' : ''}`}
              >
                {/* Header button click */}
                <button 
                  className="faq-accordion-header"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-group">
                    <FiHelpCircle className={`faq-icon ${isOpen ? 'active' : ''}`} />
                    <span>{faq.question}</span>
                  </div>
                  <div className={`faq-chevron-icon ${isOpen ? 'rotate' : ''}`}>
                    <FiChevronDown size={18} />
                  </div>
                </button>

                {/* Smooth Expandable Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="faq-accordion-content"
                    >
                      <div className="faq-content-inner">
                        <p>{faq.answer}</p>
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
