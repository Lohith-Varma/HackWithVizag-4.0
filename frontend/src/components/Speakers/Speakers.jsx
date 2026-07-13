import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLinkedin } from 'react-icons/fi';
import { JUDGES_MENTORS } from '../../data/hackathonData';
import './Speakers.css';

function TiltCard({ member }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [showGloss, setShowGloss] = useState(false);
  const [glossPos, setGlossPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    
    // Relative mouse positions inside the card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Center point of the card
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation angles (max 12deg tilt)
    const factorX = 12 / centerY;
    const factorY = 12 / centerX;
    const rotX = ((y - centerY) * -1) * factorX;
    const rotY = (x - centerX) * factorY;
    
    setRotateX(rotX);
    setRotateY(rotY);
    
    // Set position of gloss light reflection
    setGlossPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
    setShowGloss(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShowGloss(false);
  };

  return (
    <div 
      className="speaker-tilt-card-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: rotateX === 0 && rotateY === 0 ? 'transform 0.5s ease' : 'none'
      }}
    >
      {/* Dynamic 3D Gloss reflection */}
      {showGloss && (
        <div 
          className="card-gloss-shine"
          style={{
            background: `radial-gradient(circle at ${glossPos.x}% ${glossPos.y}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`
          }}
        />
      )}

      {/* Card Content */}
      <div className="speaker-card-inner">
        <div className="speaker-img-container">
          <img src={member.image} alt={member.name} className="speaker-img" />
          <div className="speaker-overlay-glow" />
        </div>

        <div className="speaker-details">
          <span className="speaker-expertise">{member.expertise}</span>
          <h3 className="speaker-name">{member.name}</h3>
          <p className="speaker-designation">
            {member.designation} at <span className="speaker-company">{member.company}</span>
          </p>
          
          <a 
            href={member.linkedin} 
            className="speaker-linkedin-link" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label={`Visit ${member.name}'s LinkedIn profile`}
          >
            <FiLinkedin />
            <span>Connect</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Speakers() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="mentors" className="speakers-section">
      <div className="glow-blob blob-speakers-purple" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Experts</span>
          <h2 className="section-title">Judges & Mentors</h2>
          <p className="section-description">
            Meet the leaders from top-tier organizations who will evaluate your solutions and guide you throughout the hacking cycles.
          </p>
        </div>

        {/* Speakers Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="speakers-grid"
        >
          {JUDGES_MENTORS.map((member) => (
            <motion.div key={member.id} variants={itemVariants}>
              <TiltCard member={member} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
