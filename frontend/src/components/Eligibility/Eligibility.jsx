import { motion } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import { ELIGIBILITY_DATA } from '../../data/hackathonData';
import './Eligibility.css';

const renderIcon = (iconName, className) => {
  const IconComponent = Icons[iconName];
  return IconComponent ? <IconComponent className={className} /> : <Icons.FiLayers className={className} />;
};

export default function Eligibility() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="eligibility" className="eligibility-section">
      <div className="glow-blob blob-eligibility-cyan" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Requirements</span>
          <h2 className="section-title">Eligibility Criteria</h2>
          <p className="section-description">
            Review the requirements below to verify your team is fully qualified to register and compete at Hack With Vizag 4.0.
          </p>
        </div>

        {/* Eligibility Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="eligibility-grid"
        >
          {ELIGIBILITY_DATA.map((item) => (
            <motion.div 
              key={item.id}
              variants={cardVariants}
              className="eligibility-card"
            >
              <div className="eligibility-icon-wrapper">
                {renderIcon(item.icon, 'eligibility-icon')}
              </div>
              <h3 className="eligibility-card-title">{item.title}</h3>
              <p className="eligibility-card-desc">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
