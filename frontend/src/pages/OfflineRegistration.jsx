import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiImage, FiUpload } from 'react-icons/fi';
import { api, buildAssetUrl } from '../services/api';
import './Portal.css';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function OfflineRegistration() {
  const [data, setData] = useState(null);
  const [utrId, setUtrId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setError('');
    try {
      const dashboard = await api.getParticipantDashboard();
      if (!dashboard.team?._id || !dashboard.isEligibleForOffline) {
        setError('Offline registration is available only after your team is selected.');
        return;
      }
      setData(await api.getOfflineRegistrationEligibility(dashboard.team._id));
    } catch (err) {
      setError(err.message || 'Unable to load offline registration.');
    }
  };

  useEffect(() => {
    // Defer the initial request so React's effect is used for the external fetch,
    // rather than synchronously deriving state during render.
    const requestId = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(requestId);
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (preview) URL.revokeObjectURL(preview);
    setPaymentScreenshot(file);
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!data?.team?._id || !paymentScreenshot) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.submitOfflineRegistration(data.team._id, { utrId, paymentScreenshot });
      setData({ ...data, offlineRegistration: result.offlineRegistration });
    } catch (err) {
      setError(err.message || 'Unable to submit offline registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const registration = data?.offlineRegistration;
  const members = data?.team?.members || [];
  const project = data?.project;

  return (
    <main className="portal-page participant-dashboard-page">
      <section className="portal-shell dashboard-shell offline-payment-page">
        <button type="button" className="btn-link-action" onClick={() => { window.location.hash = '#dashboard'; }}><FiArrowLeft /> Back to dashboard</button>
        <div className="workspace-header mt-3">
          <div><span className="section-subtitle">Selected Team</span><h1>Offline Registration</h1></div>
        </div>
        {error && <div className="offline-error"><FiAlertTriangle /> {error}</div>}
        {!data && !error && <p className="text-dim mt-3">Loading your selected-team details…</p>}
        {data && registration?.status === 'OFFLINE_SUBMITTED' && (
          <div className="offline-complete-alert mt-3"><FiCheckCircle className="alert-check-icon" /><div><h3>Offline Registration Submitted ✓</h3><p>Your offline registration and payment details have been submitted successfully. No further action is required.</p><small>Submitted {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString('en-IN') : ''}</small></div></div>
        )}
        {data && !registration && (
          <>
            <section className="dash-card mt-3">
              <div className="card-top-header"><div><span className="section-subtitle">Your saved registration</span><h3 className="card-heading">Team Details</h3></div><span className="unlocked-badge"><FiCheckCircle /> Selected</span></div>
              <div className="info-grid mt-3">
                <div className="info-item-box"><span className="info-label">Team Name</span><strong>{data.team.teamName}</strong></div>
                <div className="info-item-box"><span className="info-label">Team ID</span><strong>HWV-{String(data.team._id).slice(-6).toUpperCase()}</strong></div>
                <div className="info-item-box"><span className="info-label">Team Size</span><strong>{data.payment.teamSize} Members</strong></div>
                <div className="info-item-box"><span className="info-label">Team Lead</span><strong>{data.team.leader?.name || 'Team Lead'}</strong></div>
                <div className="info-item-box span-2"><span className="info-label">Selected Problem Statement</span><strong>{project?.problemStatementId?.code || project?.problemCode || 'Selected challenge'} — {project?.title || project?.problemStatementId?.title || 'Project submission'}</strong></div>
              </div>
              <p className="mt-3 text-dim">Members: {members.map((member) => member.name || member.email || 'Participant').join(', ')}</p>
            </section>
            <section className="dash-card offline-payment-card mt-3">
              <div className="card-top-header"><div><span className="section-subtitle">Manual UPI payment</span><h3 className="card-heading">Payment Details</h3></div></div>
              <div className="offline-payment-grid mt-3">
                <div><p className="text-dim">Team Size</p><h3>{data.payment.teamSize} Members</h3><p className="text-dim mt-3">Registration Fee</p><div className="offline-fee">{currency.format(data.payment.expectedAmount)}</div><p className="mt-3">Scan the QR code below using your preferred UPI app, then submit the transaction proof.</p>
                  <ol className="payment-instructions"><li>Scan the QR code and pay the displayed fee.</li><li>Keep the payment confirmation screenshot.</li><li>Enter the UTR ID from the transaction.</li><li>Upload the screenshot and submit once.</li><li>Your registration is marked submitted immediately.</li></ol>
                </div>
                <div className="qr-panel"><strong>Scan to Pay</strong><a href={buildAssetUrl(data.payment.qrCodeUrl)} target="_blank" rel="noreferrer"><img className="payment-qr" src={buildAssetUrl(data.payment.qrCodeUrl)} alt={`QR code for ${data.payment.teamSize}-member team`} /></a><small>Tap the QR code to enlarge it.</small></div>
              </div>
              <form className="form-grid compact mt-4" onSubmit={submit}>
                <label className="field span-2"><span>UTR ID *</span><input required minLength="6" maxLength="64" value={utrId} onChange={(e) => setUtrId(e.target.value)} placeholder="Enter your payment UTR ID" /></label>
                <label className="field span-2"><span>Payment Screenshot * <small>(JPG, PNG or WebP; max 5 MB)</small></span><input required type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} /></label>
                {preview && <img className="payment-proof-preview span-2" src={preview} alt="Selected payment proof preview" />}
                <div className="span-2"><button className="primary-action" type="submit" disabled={submitting || !paymentScreenshot}><FiUpload /> {submitting ? 'Submitting…' : 'Submit Offline Registration'}</button></div>
              </form>
            </section>
          </>
        )}
        {data && registration && registration.status !== 'OFFLINE_SUBMITTED' && <p className="offline-error mt-3"><FiImage /> Your offline registration is unavailable. Please contact the organisers.</p>}
      </section>
    </main>
  );
}
