import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiCalendar, FiMapPin, FiAward, FiArrowRight } from 'react-icons/fi';
import { api } from '../../services/api';
import './Hero.css';

export default function Hero() {
  const [eventConfig, setEventConfig] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    let isMounted = true;
    api.getEventConfig()
      .then((res) => {
        if (isMounted && res.event) {
          setEventConfig(res.event);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const targetDate = new Date('2026-09-25T09:00:00').getTime();
  // eventConfig?.hackathonDate ? new Date(eventConfig.hackathonDate).getTime() : new Date('2026-09-25T09:00:00').getTime();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

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

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleScrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
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

  const eventName = eventConfig?.eventName || 'HACK WITH VIZAG 4.0';
  const isPostponed = true;
  const regDeadline = eventConfig?.registrationEndDate
    ? new Date(eventConfig.registrationEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'September 20, 2026';
  const spotRegistrationMessage = '🚨 Hack With Vizag 4.0 is postponed due to the Red Alert and severe weather. Revised dates will be announced soon.';

  return (
    <section id="home" className="hero-section">
      <div className="glow-blob blob-purple" />
      <div className="glow-blob blob-cyan" />
      <div className="glow-grid" />

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
          <motion.div variants={itemVariants} className="hero-badge">
            <span className="badge-glow"></span>
            <span className="badge-text">Vizag's Grandest Tech Hackathon</span>
          </motion.div>

          <motion.aside
            variants={itemVariants}
            className="hero-announcement"
            role="alert"
            aria-labelledby="postponement-title"
          >
            <div className="announcement-heading">
              <span className="announcement-icon" aria-hidden="true">
                <FiAlertTriangle />
              </span>
              <div>
                <span className="announcement-eyebrow">🚨 Important Announcement</span>
                <h2 id="postponement-title">Hackathon <strong>Postponed</strong></h2>
              </div>
            </div>

            <div className="announcement-copy">
              <p>
                Due to the Red Alert issued by the Government in view of the approaching cyclone and severe weather
                conditions, Hack With Vizag 4.0 has been <strong>POSTPONED</strong>.
              </p>
              <p>The safety of all participants, mentors, judges, and organizers is our top priority.</p>
              <p className="announcement-date"><FiCalendar aria-hidden="true" /> Revised dates will be announced soon.</p>
              <p>We sincerely apologize for any inconvenience caused and appreciate your understanding and cooperation.</p>
            </div>

            <div className="announcement-signoff">
              <strong>Stay safe. Stay updated. 🌧️</strong>
              <span>— Team Hack With Vizag 4.0</span>
            </div>
          </motion.aside>

          <motion.h1 variants={itemVariants} className="hero-title">
            {eventName.toUpperCase()}
          </motion.h1>

          <motion.h3 variants={itemVariants} className="hero-tagline">
            Where Innovation Meets the Coast.
          </motion.h3>

          <motion.div variants={itemVariants} className="hero-meta-grid">
            <div className="hero-meta-item">
              <FiCalendar className="meta-icon icon-primary" />
              <div>
                <span className="meta-label">{isPostponed ? 'Revised Date' : 'Date'}</span>
                <span className="meta-value">
                  {isPostponed
                    ? 'To be announced'
                    : eventConfig?.hackathonDate
                    ? new Date(eventConfig.hackathonDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Sept 25, 2026'}
                </span>
              </div>
            </div>
            <div className="hero-meta-item">
              <FiMapPin className="meta-icon icon-accent" />
              <div>
                <span className="meta-label">Venue</span>
                <span className="meta-value">NSRIT, Visakhapatnam</span>
              </div>
            </div>
            <div className="hero-meta-item">
              <FiAward className="meta-icon icon-secondary" />
              <div>
                <span className="meta-label">Registration Fee</span>
                <span className="meta-value">
                  {eventConfig?.registrationFee ? `₹${eventConfig.registrationFee}/- per participant` : '₹500/- per participant'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-timer-container">
            <h4 className="timer-title">{isPostponed ? 'Schedule Update' : 'Hacking Begins In'}</h4>
            {isPostponed ? (
              <div className="timer-postponed">Event Postponed</div>
            ) : timeLeft.isExpired ? (
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
              {isPostponed ? (
                <>Registration and event schedule updates will be <strong>shared soon</strong>.</>
              ) : (
                <>Registrations <strong>Open Now</strong> • Deadline: <strong>Extended to {regDeadline}</strong></>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="spot-registration-ticker"
            role="status"
            aria-label={spotRegistrationMessage}
          >
            <div className="spot-registration-ticker-track" aria-hidden="true">
              <span>{spotRegistrationMessage}</span>
              <span>{spotRegistrationMessage}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-ctas">
            {/* <a href="#register" className="btn-hero-primary">
              Register Now <FiArrowRight />
            </a> */}
            {/* <a href="#spot-registration" className="btn-hero-spot btn-hero-postponed">
              Registration Updates <FiArrowRight />
            </a> */}
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
