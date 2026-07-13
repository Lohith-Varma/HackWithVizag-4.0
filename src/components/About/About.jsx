import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiUsers, FiAward, FiBookOpen, FiCpu, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import './About.css';

function StatCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const cleanEnd = parseInt(end.replace(/[^0-9]/g, ''), 10);
    const totalSteps = 50;
    const stepDuration = duration / totalSteps;
    const increment = cleanEnd / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= cleanEnd) {
        setCount(cleanEnd);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="stat-number">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const whyParticipate = [
    {
      title: "Real-world Problems",
      desc: "Work on pressing regional and global issues related to coastal security, tourism, and marine preservation."
    },
    {
      title: "Exceptional Mentorship",
      desc: "Get 1-on-1 guidance from principal architects at Microsoft, tech leads at Devfolio, and ocean research directors."
    },
    {
      title: "Networking & Careers",
      desc: "Connect with sponsors and partner organizations offering direct recruitment paths and incubation credits."
    },
    {
      title: "Premium Swags & Awards",
      desc: "Take home official premium hoodies, high-value cloud credits, standard developer kits, and cash prizes."
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="glow-blob blob-about-purple" />
      <div className="glow-blob blob-about-cyan" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Introduction</span>
          <h2 className="section-title">Where Innovation Meets the Coast</h2>
          <p className="section-description">
            Hack With Vizag 4.0 is a premier national-level hackathon designed to unite talented developers, designers, and entrepreneurs to solve critical challenges.
          </p>
        </div>

        {/* 2-Column Info Block */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="about-grid"
        >
          <motion.div variants={itemVariants} className="about-card about-vision">
            <h3>Our Vision</h3>
            <p>
              Located along the scenic coast of Visakhapatnam, we aim to bridge the gap between academic brilliance and industrial realities. By focusing on critical tracks like Marine AI, FinTech, and Disaster Resilience, Hack With Vizag 4.0 provides a launching pad for products that solve real-world problems.
            </p>
            <div className="vision-bullets">
              <div className="bullet-item">
                <FiCheckCircle className="bullet-icon" />
                <span>Nurturing localized solutions with global potential.</span>
              </div>
              <div className="bullet-item">
                <FiCheckCircle className="bullet-icon" />
                <span>Empowering student developers with mentorship and infrastructure.</span>
              </div>
              <div className="bullet-item">
                <FiCheckCircle className="bullet-icon" />
                <span>Fostering public-private partnerships in governance.</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="about-card about-organizers">
            <h3>About Organizers</h3>
            <p>
              Hack With Vizag is organized by a passionate consortium of academic institutions, government bodies, and technology communities. In collaboration with the Vizag Tech Hub and ocean research institutes, we are dedicated to providing a frictionless, high-energy environment for the developer ecosystem.
            </p>
            <div className="organizer-features">
              <div className="org-badge">
                <FiCpu className="org-icon" />
                <div>
                  <h4>Government Support</h4>
                  <p>In partnership with state incubation centers.</p>
                </div>
              </div>
              <div className="org-badge">
                <FiTrendingUp className="org-icon" />
                <div>
                  <h4>Industry Connected</h4>
                  <p>Advisory panel from top multinational companies.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <FiUsers className="stat-icon icon-purple" />
            <StatCounter end="500" suffix="+" />
            <span className="stat-label">Participants</span>
          </div>
          <div className="stat-card">
            <FiCpu className="stat-icon icon-cyan" />
            <StatCounter end="100" suffix="+" />
            <span className="stat-label">Teams Shortlisted</span>
          </div>
          <div className="stat-card">
            <FiBookOpen className="stat-icon icon-purple" />
            <StatCounter end="20" suffix="+" />
            <span className="stat-label">Colleges Represented</span>
          </div>
          <div className="stat-card">
            <FiAward className="stat-icon icon-cyan" />
            <span className="stat-number">₹1L+</span>
            <span className="stat-label">Cash Prize Pool</span>
          </div>
        </div>

        {/* Why Participate Block */}
        <div className="why-participate-container">
          <h3 className="sub-section-title">Why Participate?</h3>
          <div className="why-grid">
            {whyParticipate.map((item, index) => (
              <div key={index} className="why-card">
                <div className="why-badge">0{index + 1}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
