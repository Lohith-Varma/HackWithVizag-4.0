import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiUpload, FiUsers } from 'react-icons/fi';
import { api, buildAssetUrl } from '../services/api';
import './SpotRegistration.css';

const steps = ['Team', 'Leader', 'Members', 'Payment', 'Review'];
const emptyMember = () => ({ name: '', email: '', phone: '', collegeName: '' });
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function SpotRegistration() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    teamName: '', collegeName: '', teamSize: 3,
    teamLeader: { name: '', email: '', phone: '' },
    members: [emptyMember(), emptyMember()],
    utr: '', paymentScreenshot: null,
  });
  const [payment, setPayment] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.getSpotPaymentInstructions(form.teamSize)
      .then((result) => { if (active) setPayment(result.payment); })
      .catch((error) => { if (active) setPaymentError(error.message || 'Unable to load payment instructions.'); });
    return () => { active = false; };
  }, [form.teamSize]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (step > 0) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const allParticipants = useMemo(() => [
    { ...form.teamLeader, collegeName: form.collegeName, role: 'Team Leader' },
    ...form.members.map((member, index) => ({ ...member, role: `Member ${index + 2}` })),
  ], [form]);

  const setValue = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const setLeader = (field, value) => {
    setForm((current) => ({ ...current, teamLeader: { ...current.teamLeader, [field]: value } }));
    setErrors((current) => ({ ...current, [`teamLeader.${field}`]: '' }));
  };

  const setMember = (index, field, value) => {
    setForm((current) => ({
      ...current,
      members: current.members.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member),
    }));
    setErrors((current) => ({ ...current, [`members.${index}.${field}`]: '' }));
  };

  const changeTeamSize = (value) => {
    const teamSize = Number(value);
    setPayment(null);
    setPaymentError('');
    setForm((current) => {
      const memberCount = teamSize - 1;
      const members = Array.from({ length: memberCount }, (_, index) => current.members[index] || { ...emptyMember(), collegeName: current.collegeName });
      return { ...current, teamSize, members };
    });
    setErrors({});
  };

  const validateStep = (index) => {
    const next = {};
    if (index === 0) {
      if (!form.teamName.trim()) next.teamName = 'Team name is required.';
      if (!form.collegeName.trim()) next.collegeName = 'College is required.';
    }
    if (index === 1) {
      ['name', 'email', 'phone'].forEach((field) => {
        if (!String(form.teamLeader[field] || '').trim()) next[`teamLeader.${field}`] = `${field === 'name' ? 'Name' : field === 'email' ? 'Email' : 'Phone'} is required.`;
      });
    }
    if (index === 2) {
      form.members.forEach((member, memberIndex) => {
        ['name', 'email', 'phone', 'collegeName'].forEach((field) => {
          if (!String(member[field] || '').trim()) next[`members.${memberIndex}.${field}`] = `${field === 'collegeName' ? 'College' : field[0].toUpperCase() + field.slice(1)} is required.`;
        });
        if (member.collegeName.trim().toLowerCase() !== form.collegeName.trim().toLowerCase()) {
          next[`members.${memberIndex}.collegeName`] = 'All participants must belong to the team college.';
        }
      });
      const emails = allParticipants.map((person) => person.email.trim().toLowerCase()).filter(Boolean);
      if (new Set(emails).size !== emails.length) next.members = 'Each participant must use a different email address.';
    }
    if (index === 3) {
      if (!form.utr.trim()) next.utr = 'UTR ID is required.';
      if (!form.paymentScreenshot) next.paymentScreenshot = 'Payment screenshot is required.';
      if (!payment?.configured) next.payment = 'Payment instructions are not configured yet.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep((value) => Math.min(value + 1, steps.length - 1)); };
  const chooseFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : '');
    setValue('paymentScreenshot', file);
  };

  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const result = await api.submitSpotRegistration({
        ...form,
        teamLeader: { ...form.teamLeader, collegeName: form.collegeName },
      });
      setSuccess(result.registration);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.payload?.errors || []).map((entry) => [entry.field, entry.message]));
      setErrors({ ...fieldErrors, submit: error.message || 'Unable to submit Spot Registration.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="spot-page">
        <section className="spot-success" aria-live="polite">
          <FiCheckCircle />
          <span className="section-subtitle">Submission complete</span>
          <h1>Spot Registration Submitted</h1>
          <p>Your details and payment proof are saved for organiser confirmation.</p>
          <div><small>Registration Number</small><strong>{success.registrationNumber}</strong></div>
          <div><small>Status</small><strong>Pending Confirmation</strong></div>
          <a className="spot-primary-button" href="/">Return to Hack With Vizag</a>
        </section>
      </main>
    );
  }

  return (
    <main className="spot-page">
      <section className="spot-shell">
        <header className="spot-header">
          <span className="section-subtitle">Direct Offline Event Entry</span>
          <h1>Spot Registration</h1>
          <p>No account or project submission is required. Register your 3- or 4-member team and submit the payment proof.</p>
        </header>

        <ol className="spot-progress" aria-label="Registration progress">
          {steps.map((label, index) => (
            <li key={label} className={index === step ? 'active' : index < step ? 'complete' : ''}>
              <span>{index < step ? <FiCheck /> : index + 1}</span><small>{label}</small>
            </li>
          ))}
        </ol>

        <div className="spot-card" ref={cardRef}>
          {step === 0 && (
            <div className="spot-step">
              <div className="spot-step-title"><FiUsers /><div><small>Step 1</small><h2>Team Details</h2></div></div>
              <div className="spot-form-grid">
                <Field label="Team Name" error={errors.teamName}><input value={form.teamName} onChange={(e) => setValue('teamName', e.target.value)} required /></Field>
                <Field label="College Name" error={errors.collegeName}><input value={form.collegeName} onChange={(e) => setValue('collegeName', e.target.value)} required /></Field>
                <Field label="Team Size" hint="The team leader counts as one member.">
                  <select value={form.teamSize} onChange={(e) => changeTeamSize(e.target.value)}><option value="3">3 members</option><option value="4">4 members</option></select>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="spot-step">
              <div className="spot-step-title"><span>02</span><div><small>Step 2</small><h2>Team Leader</h2></div></div>
              <p className="spot-note">Phone is stored exactly as entered and is not format-validated.</p>
              <div className="spot-form-grid">
                <Field label="Leader Name" error={errors['teamLeader.name']}><input value={form.teamLeader.name} onChange={(e) => setLeader('name', e.target.value)} required /></Field>
                <Field label="Leader Email" error={errors['teamLeader.email']}><input type="email" value={form.teamLeader.email} onChange={(e) => setLeader('email', e.target.value)} required /></Field>
                <Field label="Leader Phone" error={errors['teamLeader.phone']}><input type="text" value={form.teamLeader.phone} onChange={(e) => setLeader('phone', e.target.value)} required /></Field>
                <Field label="College"><input value={form.collegeName} readOnly /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="spot-step">
              <div className="spot-step-title"><span>03</span><div><small>Step 3</small><h2>Team Members</h2></div></div>
              {errors.members && <p className="spot-error-banner">{errors.members}</p>}
              <div className="spot-members">
                {form.members.map((member, index) => (
                  <article className="spot-member-card" key={index}>
                    <h3>Member {index + 2}</h3>
                    <div className="spot-form-grid">
                      <Field label="Name" error={errors[`members.${index}.name`]}><input value={member.name} onChange={(e) => setMember(index, 'name', e.target.value)} required /></Field>
                      <Field label="Email" error={errors[`members.${index}.email`]}><input type="email" value={member.email} onChange={(e) => setMember(index, 'email', e.target.value)} required /></Field>
                      <Field label="Phone" error={errors[`members.${index}.phone`]}><input type="text" value={member.phone} onChange={(e) => setMember(index, 'phone', e.target.value)} required /></Field>
                      <Field label="College" error={errors[`members.${index}.collegeName`]}><input value={member.collegeName} onChange={(e) => setMember(index, 'collegeName', e.target.value)} required /></Field>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="spot-step">
              <div className="spot-step-title"><span>04</span><div><small>Step 4</small><h2>Payment</h2></div></div>
              {paymentError && <p className="spot-error-banner">{paymentError}</p>}
              {payment && !payment.configured && <p className="spot-error-banner">Payment instructions are being configured by the organisers. Submission is unavailable until then.</p>}
              {payment?.configured && (
                <div className="spot-payment-grid">
                  <div className="spot-amount"><small>Registration Amount</small><strong>{currency.format(payment.expectedAmount)}</strong><p>Fee for a {payment.teamSize}-member team, calculated by the server.</p></div>
                  <a className="spot-qr" href={buildAssetUrl(payment.qrCodeUrl)} target="_blank" rel="noreferrer"><img src={buildAssetUrl(payment.qrCodeUrl)} alt={`Payment QR for ${payment.teamSize}-member team`} /><small>Tap to enlarge QR</small></a>
                </div>
              )}
              <div className="spot-form-grid spot-payment-fields">
                <Field label="UTR ID" error={errors.utr}><input value={form.utr} onChange={(e) => setValue('utr', e.target.value)} required /></Field>
                <Field label="Payment Screenshot" hint="JPG, PNG or WebP; maximum 5 MB" error={errors.paymentScreenshot}>
                  <label className="spot-file-button"><FiUpload /> {form.paymentScreenshot?.name || 'Choose screenshot'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /></label>
                </Field>
                {preview && <img className="spot-proof-preview" src={preview} alt="Selected payment screenshot" />}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="spot-step">
              <div className="spot-step-title"><span>05</span><div><small>Step 5</small><h2>Review & Submit</h2></div></div>
              <div className="spot-review-grid">
                <Review title="Team"><p><b>{form.teamName}</b></p><p>{form.collegeName}</p><p>{form.teamSize} members</p></Review>
                <Review title="Payment"><p><b>{payment?.expectedAmount ? currency.format(payment.expectedAmount) : 'Unavailable'}</b></p><p>UTR: {form.utr}</p><p>{form.paymentScreenshot?.name}</p></Review>
              </div>
              <div className="spot-review-members">
                {allParticipants.map((person) => <Review key={person.email} title={person.role}><p><b>{person.name}</b></p><p>{person.email}</p><p>{person.phone}</p><p>{person.collegeName}</p></Review>)}
              </div>
              {errors.submit && <p className="spot-error-banner">{errors.submit}</p>}
            </div>
          )}

          <footer className="spot-actions">
            {step > 0 ? <button type="button" className="spot-secondary-button" onClick={() => setStep((value) => value - 1)}><FiArrowLeft /> Back</button> : <span />}
            {step < steps.length - 1
              ? <button type="button" className="spot-primary-button" onClick={nextStep}>Continue <FiArrowRight /></button>
              : <button type="button" className="spot-primary-button" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Spot Registration'} <FiCheckCircle /></button>}
          </footer>
        </div>
      </section>
    </main>
  );
}

function Field({ label, hint, error, children }) {
  return <label className="spot-field"><span>{label} *</span>{children}{hint && <small>{hint}</small>}{error && <em>{error}</em>}</label>;
}

function Review({ title, children }) {
  return <article className="spot-review-card"><small>{title}</small>{children}</article>;
}
