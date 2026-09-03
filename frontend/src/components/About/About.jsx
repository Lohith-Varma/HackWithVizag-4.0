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
      title: "Solve Real-World Problems",
      desc: "Work on challenges that go beyond the classroom. Turn your ideas into practical solutions for real problems faced by communities, industries, and society."
    },
    {
      title: "Build Your Network",
      desc: "Meet talented students, developers, mentors, industry professionals, and fellow innovators. Build connections that can open doors to internships, careers, collaborations, and future opportunities."
    },
    {
      title: "Teamwork & Collaboration",
      desc: "Hackathons are about building together. Learn how to communicate, divide responsibilities, solve problems under pressure, and turn different ideas into one impactful solution."
    },
    {
      title: "Win Prizes & Recognition",
      desc: "Compete with the best, showcase your skills, and get rewarded for your innovation. Win exciting prizes, earn recognition, and take your project to the next level."
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
            Hack With Vizag 4.0 is a premier national-level hackathon designed to unite talented developers, students, and innovators to solve critical challenges.
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
              At Hack With Vizag 4.0, our vision is to create a national platform where students challenge conventions, think beyond boundaries, and build solutions to problems that matter. Conducted by NSRIT, the hackathon aims to bridge the gap between academic learning and real-world problem solving by nurturing critical thinkers, innovators, and future technology leaders.
            </p>
            <div className="vision-bullets">
              <div className="bullet-item">
                <FiCheckCircle className="bullet-icon" />
                <span>Encouraging students to question conventional approaches and develop creative solutions to complex challenges.</span>
              </div>
              <div className="bullet-item">
                <FiCheckCircle className="bullet-icon" />
                <span>Transforming ideas and technical knowledge into practical solutions that address real-world needs.</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="about-card about-organizers">
            <h3>About Organizers</h3>
            <p>
              Hack With Vizag 4.0, organized by NSRIT, is a national-level platform built to bring together the brightest student minds, innovators, and technology enthusiasts from across the country. We are committed to creating an environment where ideas are challenged, skills are tested, and innovative solutions are built.
            </p>
            <p>
              Through collaboration, mentorship, and hands-on problem solving, we aim to empower students to move beyond the classroom and take on challenges that reflect the realities of the world around them.
            </p>
          </motion.div>
        </motion.div>

        {/* Statistics Grid */}
        {/* <div className="stats-grid">
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
        </div> */}

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
