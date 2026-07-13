import { motion } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import { JUDGING_CRITERIA } from '../../data/hackathonData';
import './Judging.css';

const renderIcon = (iconName, className) => {
  const IconComponent = Icons[iconName];
  return IconComponent ? <IconComponent className={className} /> : <Icons.FiLayers className={className} />;
};

export default function Judging() {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="judging" className="judging-section">
      <div className="glow-blob blob-judging-blue" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Evaluation</span>
          <h2 className="section-title">Judging Criteria</h2>
          <p className="section-description">
            Your submissions will be reviewed by a panel of industry veterans based on these clear, quantitative metrics.
          </p>
        </div>

        {/* Judging Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="judging-grid"
        >
          {JUDGING_CRITERIA.map((criteria) => {
            const strokeDashoffset = circumference - (criteria.percentage / 100) * circumference;
            return (
              <motion.div 
                key={criteria.id}
                variants={cardVariants}
                className="judging-card"
              >
                {/* SVG Progress Circle & Icon */}
                <div className="judging-graphic-box">
                  <svg className="progress-svg" viewBox="0 0 100 100">
                    {/* Background Track Circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      className="circle-track"
                    />
                    {/* Animated Fill Circle */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      className="circle-fill"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      whileInView={{ strokeDashoffset: strokeDashoffset }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                  </svg>
                  
                  {/* Center Content: Icon */}
                  <div className="judging-icon-wrapper">
                    {renderIcon(criteria.icon, 'judging-icon')}
                  </div>
                </div>

                {/* Criteria Details */}
                <div className="judging-info">
                  <div className="judging-header-row">
                    <h3 className="judging-card-title">{criteria.title}</h3>
                    <span className="judging-percentage">{criteria.percentage}%</span>
                  </div>
                  <p className="judging-card-desc">{criteria.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
