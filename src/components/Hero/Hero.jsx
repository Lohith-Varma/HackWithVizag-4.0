import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiAward, FiArrowRight } from 'react-icons/fi';
import './Hero.css';

// Target date: Sept 11, 2026 09:00 AM (local time)
const TARGET_DATE = new Date('2026-09-11T09:00:00').getTime();

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft(); // Run initially
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleScrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="home" className="hero-section">
      {/* Background Radial Glows */}
      <div className="glow-blob blob-purple" />
      <div className="glow-blob blob-cyan" />
      <div className="glow-grid" />

      {/* Floating Decorative Shapes */}
      <div className="floating-shape shape-1">{"</>"}</div>
      <div className="floating-shape shape-2">{"{ }"}</div>
      <div className="floating-shape shape-3">{"[ ]"}</div>

      <div className="container hero-container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-content"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="hero-badge">
            <span className="badge-glow"></span>
            <span className="badge-text">Vizag's Grandest Tech Hackathon</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 variants={itemVariants} className="hero-title">
            HACK WITH <span className="gradient-text">VIZAG 4.0</span>
          </motion.h1>

          {/* Subtitle / Tagline */}
          <motion.h3 variants={itemVariants} className="hero-tagline">
            Where Innovation Meets the Coast.
          </motion.h3>

          {/* Metadata Grid */}
          <motion.div variants={itemVariants} className="hero-meta-grid">
            <div className="hero-meta-item">
              <FiCalendar className="meta-icon icon-primary" />
              <div>
                <span className="meta-label">Date</span>
                <span className="meta-value">Sept 18 - 19, 2026</span>
              </div>
            </div>
            <div className="hero-meta-item">
              <FiMapPin className="meta-icon icon-accent" />
              <div>
                <span className="meta-label">Venue</span>
                <span className="meta-value">NSRIT</span>
              </div>
            </div>
            <div className="hero-meta-item">
              <FiAward className="meta-icon icon-secondary" />
              <div>
                <span className="meta-label">Prize Pool</span>
                <span className="meta-value">₹1,00,000+ Cash</span>
              </div>
            </div>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div variants={itemVariants} className="hero-timer-container">
            <h4 className="timer-title">Hacking Begins In</h4>
            {timeLeft.isExpired ? (
              <div className="timer-live">HACKING IS LIVE!</div>
            ) : (
              <div className="timer-blocks">
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="timer-unit">Days</span>
                </div>
                <div className="timer-separator">:</div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="timer-unit">Hours</span>
                </div>
                <div className="timer-separator">:</div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="timer-unit">Mins</span>
                </div>
                <div className="timer-separator">:</div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="timer-unit">Secs</span>
                </div>
              </div>
            )}
            <div className="registration-deadline">
              Registration closes on <strong>August 15, 2026</strong>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div variants={itemVariants} className="hero-ctas">
            <a
              href="#contact"
              className="btn-hero-primary"
              onClick={(e) => handleScrollToSection(e, 'contact')}
            >
              Register Now <FiArrowRight />
            </a>
            <a
              href="#themes"
              className="btn-hero-secondary"
              onClick={(e) => handleScrollToSection(e, 'themes')}
            >
              Explore Themes
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
