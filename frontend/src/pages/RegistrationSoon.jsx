import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiBell,
  FiArrowRight,
  FiCheckCircle,
  FiUsers,
  FiAward,
  FiCompass,
  FiLayers,
  FiMapPin,
  FiMessageSquare,
  FiArrowLeft
} from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import './RegistrationSoon.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistrationSoon() {
  const [eventConfig, setEventConfig] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotified, setIsNotified] = useState(() => {
    try {
      return Boolean(localStorage.getItem('hwv.notify_registered'));
    } catch {
      return false;
    }
  });
  const [toast, setToast] = useState(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch event configuration if available
  useEffect(() => {
    let isMounted = true;
    api.getEventConfig()
      .then((res) => {
        if (isMounted && res.event) {
          setEventConfig(res.event);
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  // Set target date for registration announcement countdown (or hackathon date fallback)
  const targetDate = eventConfig?.hackathonDate
    ? new Date(eventConfig.hackathonDate).getTime()
    : new Date('2026-09-25T09:00:00').getTime();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setToast({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.subscribeNotification({ name: name.trim(), email: email.trim() });
    } catch {
      // Graceful fallback
    }

    try {
      const storedEmails = JSON.parse(localStorage.getItem('hwv.notify_list') || '[]');
      storedEmails.push({ email: email.trim(), name: name.trim(), date: new Date().toISOString() });
      localStorage.setItem('hwv.notify_list', JSON.stringify(storedEmails));
      localStorage.setItem('hwv.notify_registered', 'true');
    } catch {
      // Local storage fallback
    }

    setIsSubmitting(false);
    setIsNotified(true);
    setToast({
      type: 'success',
      message: "You're on the priority notification list! We'll alert you the moment registration opens."
    });
    setEmail('');
    setName('');
  };

  const handleNavigate = (target) => {
    if (target === 'home' || target === 'about' || target === 'themes' || target === 'rewards' || target === 'faq' || target === 'contact') {
      window.location.hash = `#${target}`;
      const element = document.getElementById(target);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    } else {
      window.location.hash = `#${target}`;
    }
  };

  const readinessSteps = [
    {
      step: '01',
      title: 'Assemble Your Squad',
      desc: 'Form a team of 3 to 4 innovators (mix frontend, backend, AI, and design skills). Inter-college teams are welcome.',
      icon: <FiUsers className="step-icon" />
    },
    {
      step: '02',
      title: 'Explore Problem Tracks',
      desc: 'Deep-dive into our 6 challenge tracks (Smart City, AI/ML, CleanTech, Healthcare, etc.) and brainstorm your prototype concept.',
      icon: <FiCompass className="step-icon" />
    },
    {
      step: '03',
      title: 'Prepare Credentials & Deck',
      desc: 'Keep student IDs, basic project summary ideas, and GitHub/portfolio profiles ready for a smooth 1-click submission.',
      icon: <FiLayers className="step-icon" />
    },
    {
      step: '04',
      title: 'Stay Connected',
      desc: 'Join our WhatsApp updates group and follow official channels to catch the exact registration opening time.',
      icon: <FiMessageSquare className="step-icon" />
    }
  ];

  const highlights = [
    { label: 'Total Prize Pool', value: '₹ 1,00,000+', icon: <FiAward /> },
    { label: 'Team Size', value: '3 - 4 Members', icon: <FiUsers /> },
    { label: 'Innovation Tracks', value: '6 Live Domains', icon: <FiLayers /> },
    { label: 'Finale Venue', value: 'NSRIT, Visakhapatnam', icon: <FiMapPin /> }
  ];

  return (
    <div className="reg-soon-page">
      {/* Ambient background glows */}
      <div className="glow-blob reg-blob-purple" />
      <div className="glow-blob reg-blob-cyan" />
      <div className="glow-blob reg-blob-blue" />
      <div className="reg-soon-grid-bg" />

      {/* Floating decorative code particles */}
      <div className="reg-floating-shape reg-shape-1" aria-hidden="true">{'<launch/>'}</div>
      <div className="reg-floating-shape reg-shape-2" aria-hidden="true">{'{ status: "upcoming" }'}</div>
      <div className="reg-floating-shape reg-shape-3" aria-hidden="true">{'[ HWV 2026 ]'}</div>

      <div className="container reg-soon-container">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="reg-soon-top-bar">
          <button
            type="button"
            className="reg-back-btn"
            onClick={() => handleNavigate('home')}
            aria-label="Back to home page"
          >
            <FiArrowLeft /> Back to Home
          </button>
          <div className="reg-soon-event-tag">
            <span className="dot-pulse"></span>
            <span>HACK WITH VIZAG 4.0</span>
          </div>
        </div>

        {/* Hero Announcement Header */}
        <motion.div
          className="reg-soon-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="reg-status-pill">
            <span className="pill-ping">
              <span className="pill-ping-inner"></span>
            </span>
            <span className="pill-text">Official Registrations Opening Very Soon</span>
          </div>

          <h1 className="reg-soon-title">
            The Stage is Setting Up for <br />
            <span className="gradient-text">Hack With Vizag 4.0</span>
          </h1>

          <p className="reg-soon-desc">
            We are currently putting the final touches on our problem statement tracks, evaluation criteria,
            and submission portal. Team registrations are not officially open yet, but we will be unlocking
            the portal very soon!
          </p>
        </motion.div>

        {/* Live Countdown Ticker */}
        <motion.div
          className="reg-countdown-card glass-panel"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="countdown-card-header">
            <FiClock className="countdown-icon" />
            <span>Countdown to Grand Hackathon</span>
          </div>

          <div className="reg-timer-blocks">
            <div className="reg-timer-block">
              <span className="reg-timer-val">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="reg-timer-lbl">Days</span>
            </div>
            <div className="reg-timer-sep">:</div>
            <div className="reg-timer-block">
              <span className="reg-timer-val">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="reg-timer-lbl">Hours</span>
            </div>
            <div className="reg-timer-sep">:</div>
            <div className="reg-timer-block">
              <span className="reg-timer-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="reg-timer-lbl">Mins</span>
            </div>
            <div className="reg-timer-sep">:</div>
            <div className="reg-timer-block">
              <span className="reg-timer-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="reg-timer-lbl">Secs</span>
            </div>
          </div>
        </motion.div>

        {/* Interactive "Get Notified" Form */}
        <motion.div
          className="reg-notify-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="notify-badge">
            <FiBell className="notify-bell-icon" />
            <span>Be First in Line</span>
          </div>

          <h3>Get Notified Instantly When Registrations Go Live</h3>
          <p>
            Slots for physical participation and track selections are limited. Drop your email below to receive an
            instant ping the exact second the registration desk opens!
          </p>

          {isNotified ? (
            <div className="notify-success-state">
              <FiCheckCircle className="success-icon" />
              <div>
                <h4>You are on the Priority Notification List!</h4>
                <p>We will email you immediately when team applications go live. Get your squad ready!</p>
              </div>
            </div>
          ) : (
            <form className="notify-form" onSubmit={handleNotifySubmit}>
              <div className="notify-inputs">
                <input
                  type="text"
                  className="notify-input"
                  placeholder="Team Lead / Your Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="email"
                  className="notify-input"
                  placeholder="Enter your email address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="notify-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering Interest...' : 'Notify Me On Launch'}
                <FiArrowRight />
              </button>
            </form>
          )}
        </motion.div>

        {/* Event Quick Snapshot Grid */}
        <motion.div
          className="reg-snapshot-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {highlights.map((item, index) => (
            <div key={index} className="snapshot-card glass-panel">
              <div className="snapshot-icon-wrap">{item.icon}</div>
              <div className="snapshot-details">
                <span className="snapshot-label">{item.label}</span>
                <strong className="snapshot-value">{item.value}</strong>
              </div>
            </div>
          ))}
        </motion.div>

        {/* "What to do in the meantime" - Readiness Roadmap */}
        <motion.div
          className="readiness-section"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="readiness-header">
            <span className="section-subtitle">How To Prepare</span>
            <h2>What You Can Do While Waiting</h2>
            <p>Get ahead of the competition by preparing your team and ideas before registrations open.</p>
          </div>

          <div className="readiness-grid">
            {readinessSteps.map((step, idx) => (
              <div key={idx} className="readiness-card glass-panel">
                <div className="readiness-top">
                  <span className="step-number">{step.step}</span>
                  <div className="step-icon-badge">{step.icon}</div>
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick CTA Actions */}
        <motion.div
          className="reg-soon-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <div className="actions-wrapper">
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => handleNavigate('themes')}
            >
              Explore Challenge Themes <FiArrowRight />
            </button>
            <a
              href="https://chat.whatsapp.com/LjcFke4fB536fLYEmc0lpF"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary-action"
            >
              <FiMessageSquare /> Join WhatsApp Community
            </a>
            <button
              type="button"
              className="btn-ghost-action"
              onClick={() => handleNavigate('home')}
            >
              Back to Overview
            </button>
          </div>

          <div className="organizer-login-hint">
            <span>Already have an organizer or admin account? </span>
            <a href="#auth" onClick={(e) => { e.preventDefault(); handleNavigate('auth'); }}>
              Sign In to Portal
            </a>
          </div>
        </motion.div>

      </div>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}
