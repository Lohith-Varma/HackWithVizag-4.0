import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Themes', href: '#themes' },
  // { label: 'Timeline', href: '#timeline' },
  // { label: 'Eligibility', href: '#eligibility' },
  // { label: 'Rules', href: '#rules' },
  // { label: 'Judging', href: '#judging' },
  { label: 'Rewards', href: '#rewards' },
  // { label: 'Mentors', href: '#mentors' },
  // { label: 'Sponsors', href: '#sponsors' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      // Add glass effect when scrolled down 20px
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Determine active section based on scroll position
      const scrollPosition = window.scrollY + 120; // offset
      for (const link of NAV_LINKS) {
        const targetId = link.href.substring(1);
        const element = document.getElementById(targetId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(targetId);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    const targetId = href.substring(1);
    const element = document.getElementById(targetId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // height of sticky navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      // Fallback active setter
      setActiveSection(targetId);
    }
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar-glass' : ''}`}>
        <div className="navbar-container">
          <a href="#home" className="navbar-logo" onClick={(e) => handleLinkClick(e, '#home')}>
            HACK WITH <span>VIZAG</span>
            <div className="logo-dot"></div>
          </a>

          {/* Desktop Nav Items */}
          <ul className="navbar-links">
            {NAV_LINKS.map((link) => {
              const targetId = link.href.substring(1);
              const isActive = activeSection === targetId;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeUnderline"
                        className="active-underline"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="navbar-actions">
            <a href="#contact" className="btn-register" onClick={(e) => handleLinkClick(e, '#contact')}>
              Register Now
            </a>
            <button className="hamburger" onClick={toggleMobileMenu} aria-label="Toggle Menu">
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mobile-nav-overlay"
          >
            <ul className="mobile-navbar-links">
              {NAV_LINKS.map((link) => {
                const targetId = link.href.substring(1);
                const isActive = activeSection === targetId;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className={`mobile-nav-link ${isActive ? 'mobile-active' : ''}`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
              <li style={{ marginTop: '1.5rem', width: '100%', textAlign: 'center' }}>
                <a
                  href="#contact"
                  className="mobile-btn-register"
                  onClick={(e) => handleLinkClick(e, '#contact')}
                >
                  Register Now
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
