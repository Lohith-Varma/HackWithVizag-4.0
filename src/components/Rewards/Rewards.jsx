import { motion } from 'framer-motion';
import { FiCheck, FiAward, FiGift, FiZap } from 'react-icons/fi';
import { REWARDS_DATA } from '../../data/hackathonData';
import './Rewards.css';

export default function Rewards() {
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
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="rewards" className="rewards-section">
      <div className="glow-blob blob-rewards-purple" />
      <div className="glow-blob blob-rewards-cyan" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Prizes & Perks</span>
          <h2 className="section-title">Rewards & Benefits</h2>
          <p className="section-description">
            Compete for high-value cash rewards, incubation seats, cloud credits, and direct internship opportunities with our tech partners.
          </p>
        </div>

        {/* Highlighted Total Prize Pool Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="prize-pool-banner"
        >
          <FiAward className="banner-award-icon" />
          <div className="banner-info">
            <span className="banner-label">Total Prize Pool</span>
            <h3 className="banner-amount">₹ 2,00,000+</h3>
            <p className="banner-subtext">Plus incubation seats, cloud credits, and premium gadgets.</p>
          </div>
        </motion.div>

        {/* Prizes Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="rewards-grid"
        >
          {REWARDS_DATA.map((reward) => (
            <motion.div 
              key={reward.id}
              variants={cardVariants}
              className="reward-card"
              style={{ '--glow-color': reward.glowColor }}
            >
              {/* Card Ribbon Glow */}
              <div className="reward-glow-layer" />
              
              <div className="reward-card-header">
                <FiZap className="reward-icon-badge" />
                <h4 className="reward-type">{reward.type}</h4>
              </div>

              <div className="reward-prize-box">
                <span className="prize-label">Cash Reward</span>
                <h3 className="reward-prize-value">{reward.prize}</h3>
              </div>

              <div className="reward-perks-box">
                <h5 className="perks-title">Additional Perks:</h5>
                <ul className="reward-perks-list">
                  {reward.perks.map((perk, index) => (
                    <li key={index}>
                      <FiCheck className="perk-check-icon" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* General Benefits Block */}
        <div className="general-benefits-container">
          <h4 className="benefits-section-title">Participation Benefits For All Teams</h4>
          <div className="benefits-grid">
            <div className="benefit-item-card">
              <FiAward className="benefit-icon" />
              <h5>Certificates</h5>
              <p>Official digital credentials backed by Vizag Tech Hub & partners.</p>
            </div>
            <div className="benefit-item-card">
              <FiZap className="benefit-icon" />
              <h5>Mentorship</h5>
              <p>1-on-1 architecture feedback rounds with senior engineers.</p>
            </div>
            <div className="benefit-item-card">
              <FiGift className="benefit-icon" />
              <h5>Swag & Kits</h5>
              <p>Stickers, water bottles, and notebooks in official welcome kits.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
