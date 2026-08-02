import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLock, FiMail, FiUser } from 'react-icons/fi';
import Toast from '../components/Toast/Toast';
import { api } from '../services/api';
import { saveCurrentUser } from '../utils/registrationStorage';
import './Portal.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const nextErrors = {};
    if (mode === 'register' && !form.name.trim()) nextErrors.name = 'Full name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (form.email && !emailPattern.test(form.email)) nextErrors.email = 'Enter a valid email';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    if (form.password && form.password.length < 6) nextErrors.password = 'Use at least 6 characters';
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
      const result = mode === 'register' ? await api.register(form) : await api.login(form);
      saveCurrentUser(result.user);
      setToast({ type: 'success', message: mode === 'register' ? 'Account created successfully.' : 'Signed in successfully.' });
      window.setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 450);
    } catch {
      setToast({ type: 'error', message: 'Unable to continue right now. Please try again.' });
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

            <label className="field icon-field">
              <span>Password *</span>
              <FiLock />
              <input type="password" value={form.password} onChange={update('password')} placeholder="Minimum 6 characters" />
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
