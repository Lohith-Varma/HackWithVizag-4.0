import { useState, useEffect } from 'react';
import { FiArrowUp, FiHeart, FiGlobe, FiMapPin, FiMail } from 'react-icons/fi';
import { FaTwitter, FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleLinkClick = (e, id) => {
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

  return (
    <>
      <footer className="footer">
        <div className="container footer-container">
          
          {/* Section 1: Logo & About Brief */}
          <div className="footer-brand-column">
            <a href="#home" className="footer-logo" onClick={(e) => handleLinkClick(e, 'home')}>
              HACK WITH <span>VIZAG</span>
              <div className="logo-dot"></div>
            </a>
            <p className="footer-brand-desc">
              Empowering student innovators, coders, and designers from across the country to build technologies that matter. Joined by leading mentors and sponsors.
            </p>
            <div className="footer-social-row">
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="GitHub"><FaGithub /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="footer-links-column">
            <h4 className="footer-column-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li><a href="#home" onClick={(e) => handleLinkClick(e, 'home')}>Home</a></li>
              <li><a href="#about" onClick={(e) => handleLinkClick(e, 'about')}>About Event</a></li>
              <li><a href="#themes" onClick={(e) => handleLinkClick(e, 'themes')}>Problem Tracks</a></li>
              <li><a href="#timeline" onClick={(e) => handleLinkClick(e, 'timeline')}>Timeline</a></li>
              <li><a href="#eligibility" onClick={(e) => handleLinkClick(e, 'eligibility')}>Eligibility</a></li>
            </ul>
          </div>

          {/* Section 3: More Links */}
          <div className="footer-links-column">
            <h4 className="footer-column-title">Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#rules" onClick={(e) => handleLinkClick(e, 'rules')}>Rules & Guide</a></li>
              <li><a href="#judging" onClick={(e) => handleLinkClick(e, 'judging')}>Judging Criteria</a></li>
              <li><a href="#rewards" onClick={(e) => handleLinkClick(e, 'rewards')}>Rewards & Perks</a></li>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, 'faq')}>FAQ Help</a></li>
              <li><a href="#contact" onClick={(e) => handleLinkClick(e, 'contact')}>Contact desk</a></li>
            </ul>
          </div>

          {/* Section 4: Venue Info & Contact */}
          <div className="footer-info-column">
            <h4 className="footer-column-title">Venue & Contact</h4>
            <ul className="footer-contact-list">
              <li>
                <FiMapPin className="footer-info-icon" />
                <span>Vizag Convention Centre, Visakhapatnam</span>
              </li>
              <li>
                <FiMail className="footer-info-icon" />
                <a href="mailto:support@hackwithvizag.in">support@hackwithvizag.in</a>
              </li>
              <li>
                <FiGlobe className="footer-info-icon" />
                <span>www.hackwithvizag.in</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Designed by */}
        <div className="footer-bottom-bar">
          <div className="container bottom-bar-container">
            <p className="copyright-text">
              &copy; {new Date().getFullYear()} Hack With Vizag-4.0. All Rights Reserved.
            </p>
            
            <p className="designed-by-text">
              Designed with <FiHeart className="heart-icon" /> for Hack With Vizag-4.0
            </p>

            <div className="footer-policy-links">
              <a href="#">Privacy Policy</a>
              <span>|</span>
              <a href="#">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back To Top Button */}
      <button 
        className={`btn-back-to-top ${isVisible ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <FiArrowUp />
      </button>
    </>
  );
}
