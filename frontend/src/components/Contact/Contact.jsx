import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';
import { api } from '../../services/api';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message cannot be empty';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setStatusMessage('');

    try {
      await api.submitInquiry(formData);
      setIsSubmitting(false);
      setSubmitStatus('success');
      setStatusMessage('Your inquiry has been emailed to hackwithvizag@nsrit.edu.in. Our team will get back to you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitStatus(null), 7000);
    } catch (error) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      setStatusMessage(error.message || 'Unable to send inquiry email right now. Please try again or email us directly at hackwithvizag@nsrit.edu.in.');
      setTimeout(() => setSubmitStatus(null), 7000);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="glow-blob blob-contact-purple" />
      <div className="glow-blob blob-contact-cyan" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Get In Touch</span>
          <h2 className="section-title">Contact & Venue</h2>
          <p className="section-description">
            Have questions about Hack With Vizag 4.0? Send a general inquiry directly to our organizing desk. No registration or login required.
          </p>
        </div>

        <div className="contact-grid">
          {/* Column 1: Details & Map */}
          <div className="contact-info-column">
            {/* Coordinator Cards */}
            <div className="coordinators-box">
              <div className="coord-card">
                <span className="coord-role">Faculty Coordinator</span>
                <h4 className="coord-name">Dr. V. Sreerama Murthy</h4>
                <p className="coord-desc">Associate Professor, Department of CSE</p>
                {/* <div className="coord-contact-item">
                  <FiPhone size={14} />
                  <a href="tel:+919701254792">+91 97012 54792</a>
                </div> */}
              </div>

              <div className="coord-card">
                <span className="coord-role">Student Coordinator</span>
                <h4 className="coord-name">D. K. Lohith Varma</h4>
                <p className="coord-desc">Organizing Committee Member</p>
                <div className="coord-contact-item">
                  <FiPhone size={14} />
                  <a href="tel:+917670818348">+91 76708 18348</a>
                </div>
                <div className="coord-contact-item">
                  <FaWhatsapp size={14} />
                  <a href="https://wa.me/917670818348" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="general-contacts-box">
              <div className="info-row">
                <FiMail className="info-icon" />
                <div>
                  <h5>General Inquiry Email</h5>
                  <a href="mailto:hackwithvizag@nsrit.edu.in">hackwithvizag@nsrit.edu.in</a>
                </div>
              </div>
              <div className="info-row">
                <FiMapPin className="info-icon" />
                <div>
                  <h5>Venue Address</h5>
                  <p>NSRIT, Sontyam village, Visakhapatnam</p>
                </div>
              </div>
            </div>

            {/* Styled Dark Map Embed */}
            <div className="map-embed-container">
              <iframe 
                title="NSRIT College Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d919.3901730987361!2d83.29508233434073!3d17.86970218514252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a395ef65bddc04d%3A0x2e8c26b707b47ab6!2sNSRIT%20CSE%20BLOCK!5e0!3m2!1sen!2sin!4v1785404790650!5m2!1sen!2sin"
                width="100%" 
                height="220" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
              ></iframe>
            </div>

            {/* Social Connects */}
            <div className="socials-box">
              <h5>Follow Us</h5>
              <div className="social-icons-row">
                <a href="#" aria-label="Follow us on Twitter"><FaTwitter /></a>
                <a href="#" aria-label="Follow us on Instagram"><FaInstagram /></a>
                <a href="#" aria-label="View our GitHub organization"><FaGithub /></a>
                <a href="#" aria-label="Follow us on LinkedIn"><FaLinkedin /></a>
              </div>
            </div>
          </div>

          {/* Column 2: Form */}
          <div className="contact-form-column">
            <div className="form-card-container">
              <h3 className="form-title">General Inquiry Form</h3>
              <p className="form-subtitle">Anyone can send an inquiry directly to hackwithvizag@nsrit.edu.in. All fields marked with * are required.</p>

              <form onSubmit={handleSubmit} className="contact-form">
                
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'input-error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className="error-text"><FiAlertCircle /> {errors.name}</span>}
                </div>

                {/* Email & Phone Grid */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'input-error' : ''}
                      placeholder="you@example.com"
                    />
                    {errors.email && <span className="error-text"><FiAlertCircle /> {errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number <span className="optional-tag">(Optional)</span></label>
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone" 
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input 
                    type="text" 
                    id="subject"
                    name="subject" 
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={errors.subject ? 'input-error' : ''}
                    placeholder="e.g. Query regarding timeline or eligibility"
                  />
                  {errors.subject && <span className="error-text"><FiAlertCircle /> {errors.subject}</span>}
                </div>

                {/* Message */}
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea 
                    id="message"
                    name="message" 
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={errors.message ? 'input-error' : ''}
                    placeholder="Type your query or message here..."
                  ></textarea>
                  {errors.message && <span className="error-text"><FiAlertCircle /> {errors.message}</span>}
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  className="btn-submit-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="submit-spinner">Sending Email...</span>
                  ) : (
                    <>
                      Send Inquiry <FiSend className="btn-send-icon" />
                    </>
                  )}
                </button>

                {/* Success/Error Alerts */}
                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="submit-alert-success"
                    >
                      <FiCheckCircle className="alert-icon-success" />
                      <div>
                        <h5>Inquiry Sent Successfully!</h5>
                        <p>{statusMessage}</p>
                      </div>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="submit-alert-error"
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        marginTop: '1rem'
                      }}
                    >
                      <FiAlertCircle className="alert-icon-error" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h5 style={{ margin: 0, fontWeight: 600, color: '#f87171' }}>Submission Failed</h5>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{statusMessage}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
