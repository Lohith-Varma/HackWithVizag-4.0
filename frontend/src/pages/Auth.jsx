import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import { saveCurrentUser } from '../utils/registrationStorage';
import './Portal.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;

export default function Auth() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const nextErrors = {};
    if (mode === 'register' && !form.name.trim()) nextErrors.name = 'Full name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (form.email && !emailPattern.test(form.email)) nextErrors.email = 'Enter a valid email';

    if (mode === 'register') {
      if (!form.phone.trim()) nextErrors.phone = 'Phone number is required';
      else if (!phonePattern.test(form.phone.trim())) nextErrors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';

      if (!form.password.trim()) nextErrors.password = 'Password is required';
      else if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
      else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
        nextErrors.password = 'Password must include uppercase, lowercase, and a number';
      }
    } else {
      if (!form.password.trim()) nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      setToast({ type: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = mode === 'register'
        ? { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };

      const result = mode === 'register' ? await api.register(payload) : await api.login(payload);
      saveCurrentUser(result.user);
      setToast({ type: 'success', message: mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.' });
      window.setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 450);
    } catch (err) {
      if (err.payload?.errors) {
        const serverErrors = {};
        err.payload.errors.forEach((e) => {
          if (e.field) serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      }
      setToast({ type: 'error', message: err.message || 'Unable to continue right now. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  return (
    <main className="portal-page auth-page">
      <div className="portal-shell auth-shell">
        <motion.section
          className="auth-panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="auth-copy">
            <span className="section-subtitle">Participant Access</span>
            <h1>Login / Register</h1>
            <p>Continue to your participant dashboard and complete the Hack With Vizag 4.0 registration workflow.</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label className="field icon-field">
                <span>Full Name *</span>
                <FiUser />
                <input value={form.name} onChange={update('name')} placeholder="Participant name" />
                {errors.name && <small>{errors.name}</small>}
              </label>
            )}

            <label className="field icon-field">
              <span>Email Address *</span>
              <FiMail />
              <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
              {errors.email && <small>{errors.email}</small>}
            </label>

            {mode === 'register' && (
              <label className="field icon-field">
                <span>Phone Number *</span>
                <FiPhone />
                <input type="tel" value={form.phone} onChange={update('phone')} placeholder="10-digit mobile number (e.g. 9876543210)" />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
            )}

            <label className="field icon-field">
              <span>Password *</span>
              <FiLock />
              <input type="password" value={form.password} onChange={update('password')} placeholder={mode === 'register' ? 'Min 8 chars, 1 upper, 1 lower, 1 number' : 'Your password'} />
              {errors.password && <small>{errors.password}</small>}
            </label>

            <button type="submit" className="primary-action" disabled={isLoading}>
              {isLoading ? 'Please wait...' : 'Continue'} <FiArrowRight />
            </button>
          </form>
        </motion.section>
      </div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </main>
  );
}
