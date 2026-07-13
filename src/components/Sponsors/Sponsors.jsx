import { motion } from 'framer-motion';
import { SPONSORS_DATA } from '../../data/hackathonData';
import './Sponsors.css';

export default function Sponsors() {
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
    <section id="sponsors" className="sponsors-section">
      <div className="glow-blob blob-sponsors-cyan" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Collaborators</span>
          <h2 className="section-title">Official Sponsors</h2>
          <p className="section-description">
            Hack With Vizag 4.0 is made possible by the generous backing of our global technology sponsors and local community partners.
          </p>
        </div>

        {/* Sponsors Container */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="sponsors-layout"
        >
          {/* Title Tiers */}
          <div className="sponsor-tier title-tier">
            <h3 className="tier-name">Title Sponsors</h3>
            <div className="logos-grid">
              {SPONSORS_DATA.title.map((sponsor, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  className="sponsor-logo-box title-logo"
                >
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-image" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Gold Tiers */}
          <div className="sponsor-tier gold-tier">
            <h3 className="tier-name">Gold Sponsors</h3>
            <div className="logos-grid">
              {SPONSORS_DATA.gold.map((sponsor, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  className="sponsor-logo-box gold-logo"
                >
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-image" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Silver Tiers */}
          <div className="sponsor-tier silver-tier">
            <h3 className="tier-name">Silver Sponsors</h3>
            <div className="logos-grid">
              {SPONSORS_DATA.silver.map((sponsor, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  className="sponsor-logo-box silver-logo"
                >
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-image" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Partners Tiers */}
          <div className="sponsor-tier partners-tier">
            <h3 className="tier-name">Ecosystem Partners</h3>
            <div className="logos-grid">
              {SPONSORS_DATA.partners.map((sponsor, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  className="sponsor-logo-box partner-logo"
                >
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="sponsor-image" />
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
