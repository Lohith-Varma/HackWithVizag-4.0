import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamName: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error'

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
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
    // Clear error on input
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate backend submission API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        teamName: '',
        message: '',
      });
      // Clear status after 5s
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
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
            Register your interest, submit queries, or reach out to our event management desk. We are here to support you.
          </p>
        </div>

        <div className="contact-grid">
          {/* Column 1: Details & Map */}
          <div className="contact-info-column">
            {/* Coordinator Cards */}
            <div className="coordinators-box">
              <div className="coord-card">
                <span className="coord-role">Faculty Coordinator</span>
                <h4 className="coord-name">Dr. K. Raghavendra</h4>
                <p className="coord-desc">Associate Professor, Department of CSE</p>
                <div className="coord-contact-item">
                  <FiPhone size={14} />
                  <a href="tel:+919876543210">+91 98765 43210</a>
                </div>
              </div>

              <div className="coord-card">
                <span className="coord-role">Student Coordinator</span>
                <h4 className="coord-name">Lohith Varma</h4>
                <p className="coord-desc">President, Tech Club HWV</p>
                <div className="coord-contact-item">
                  <FiPhone size={14} />
                  <a href="tel:+918765432109">+91 87654 32109</a>
                </div>
                <div className="coord-contact-item">
                  <FaWhatsapp size={14} />
                  <a href="https://wa.me/918765432109" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="general-contacts-box">
              <div className="info-row">
                <FiMail className="info-icon" />
                <div>
                  <h5>General Inquiry Email</h5>
                  <a href="mailto:support@hackwithvizag.in">support@hackwithvizag.in</a>
                </div>
              </div>
              <div className="info-row">
                <FiMapPin className="info-icon" />
                <div>
                  <h5>Venue Address</h5>
                  <p>Vizag Convention Centre, Beach Road, Visakhapatnam, AP, 530003</p>
                </div>
              </div>
            </div>

            {/* Styled Dark Map Embed */}
            <div className="map-embed-container">
              <iframe 
                title="Vizag Convention Centre Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800.7077678581786!2d83.3364736148816!3d17.7291483878775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3943485fb0c91d%3A0xc3cf3387b3227a92!2sVisakhapatnam+Convention+Centre!5e0!3m2!1sen!2sin!4v1542478492023"
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
              <h3 className="form-title">Registration / Inquiry Form</h3>
              <p className="form-subtitle">Fill in details to register your team or ask general questions.</p>

              <form onSubmit={handleSubmit} className="contact-form">
                
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'input-error' : ''}
                    placeholder="Enter your name"
                  />
                  {errors.name && <span className="error-text"><FiAlertCircle /> {errors.name}</span>}
                </div>

                {/* Email */}
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

                {/* Grid for Phone & Team */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone" 
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="teamName">Team Name</label>
                    <input 
                      type="text" 
                      id="teamName"
                      name="teamName" 
                      value={formData.teamName}
                      onChange={handleInputChange}
                      placeholder="e.g. Code Wave"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="form-group">
                  <label htmlFor="message">Your Message / Inquiry *</label>
                  <textarea 
                    id="message"
                    name="message" 
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={errors.message ? 'input-error' : ''}
                    placeholder="Tell us about your team details or submit a query..."
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
                    <span className="submit-spinner">Sending...</span>
                  ) : (
                    <>
                      Submit Application <FiSend className="btn-send-icon" />
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
                        <h5>Message Sent Successfully!</h5>
                        <p>Thank you for reaching out. Our team will contact you shortly.</p>
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
