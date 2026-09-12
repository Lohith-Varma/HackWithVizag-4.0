import { useCallback, useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiCopy,
  FiEye,
  FiFileText,
  FiFolder,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { api } from '../../services/api';
import './AdminOfflineRegistrations.css';

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const memberRole = (member, leader) => {
  const memberId = member?._id || member?.id;
  const leaderId = leader?._id || leader?.id;
  return String(memberId) === String(leaderId) || member?.email === leader?.email ? 'Team Leader' : 'Team Member';
};

export default function AdminOfflineRegistrations({ onToast }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await api.getAdminOfflineRegistrations({
        page,
        limit: 25,
        search: appliedSearch,
        status: 'OFFLINE_SUBMITTED',
      });
      setItems(result.offlineRegistrations || []);
      setPagination(result.pagination || { page, limit: 25, total: 0, pages: 1 });
      setSelected((current) => {
        if (!current) return null;
        return (result.offlineRegistrations || []).some((item) => item.id === current.team?.id) ? current : null;
      });
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to load offline registered teams.' });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, onToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(1), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => () => {
    if (screenshotPreview?.url) window.URL.revokeObjectURL(screenshotPreview.url);
  }, [screenshotPreview]);

  const openDetails = async (teamId) => {
    setDetailLoading(true);
    try {
      const result = await api.getAdminOfflineRegistration(teamId);
      setSelected(result);
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to load offline registration details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const viewScreenshot = async () => {
    if (!selected?.team?.id) return;
    setScreenshotLoading(true);
    try {
      const preview = await api.getAdminPaymentScreenshot(
        selected.team.id,
        selected.offlineRegistration?.paymentScreenshot?.originalName || 'payment-screenshot',
      );
      setScreenshotPreview(preview);
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Payment screenshot unavailable.' });
    } finally {
      setScreenshotLoading(false);
    }
  };

  const closeScreenshot = () => {
    setScreenshotPreview(null);
  };

  const copyUtr = async () => {
    const utr = selected?.offlineRegistration?.utrId;
    if (!utr) return;
    try {
      await navigator.clipboard.writeText(utr);
      onToast({ type: 'success', message: 'UTR ID copied.' });
    } catch {
      onToast({ type: 'error', message: 'Unable to copy the UTR ID.' });
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const team = selected?.team;
  const registration = selected?.offlineRegistration;
  const project = selected?.project || team?.project;
  const problemStatement = selected?.problemStatement;
  const members = selected?.members || team?.members || [];

  return (
    <div className="offline-admin-view">
      <div className="workspace-header offline-admin-header">
        <div>
          <span className="section-subtitle">Database-backed registrations</span>
          <h2>Offline Registered Teams</h2>
          <p>Teams with a completed <code>OFFLINE_SUBMITTED</code> record.</p>
        </div>
        <button type="button" className="secondary-action" onClick={() => load(pagination.page)} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <form className="offline-admin-toolbar" onSubmit={submitSearch}>
        <label className="offline-admin-search">
          <FiSearch />
          <span className="sr-only">Search offline registrations</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search team, team ID, lead, college or UTR"
          />
        </label>
        <button type="submit" className="primary-action">Search</button>
        {appliedSearch && (
          <button type="button" className="secondary-action" onClick={() => { setSearch(''); setAppliedSearch(''); }}>
            Clear
          </button>
        )}
        <span className="offline-status-filter"><FiCheckCircle /> OFFLINE_SUBMITTED</span>
      </form>

      <div className="offline-admin-layout">
        <section className="offline-admin-list" aria-label="Offline registered teams">
          <div className="offline-list-summary">
            <strong>{pagination.total} registered team{pagination.total === 1 ? '' : 's'}</strong>
            <span>Newest submissions first</span>
          </div>
          {loading ? (
            <div className="offline-empty"><div className="loading-spinner" /><p>Loading registrations…</p></div>
          ) : items.length === 0 ? (
            <div className="offline-empty"><FiFolder /><h3>No offline registrations found</h3><p>Refresh or adjust the search.</p></div>
          ) : (
            <div className="offline-table-wrap">
              <table className="offline-table">
                <thead>
                  <tr>
                    <th>Team</th><th>Lead / College</th><th>Size</th><th>Project / Problem</th><th>UTR</th><th>Submitted</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const offline = item.offlineRegistration;
                    return (
                      <tr key={item.id} onClick={() => openDetails(item.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') openDetails(item.id); }}>
                        <td data-label="Team"><strong>{item.teamName}</strong><small>{item.id}</small></td>
                        <td data-label="Lead / College"><strong>{item.leader?.name || 'Not available'}</strong><small>{item.college || 'Not available'}</small></td>
                        <td data-label="Size">{offline.teamSize}</td>
                        <td data-label="Project / Problem"><strong>{item.projectTitle || 'Not available'}</strong><small>{item.problemCode || 'Not available'}</small></td>
                        <td data-label="UTR"><code>{offline.utrId}</code></td>
                        <td data-label="Submitted">{formatDate(offline.submittedAt)}</td>
                        <td data-label="Status"><span className="offline-submitted-badge">OFFLINE_SUBMITTED</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pagination.pages > 1 && (
            <div className="offline-pagination">
              <button type="button" className="secondary-action" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}>Previous</button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button type="button" className="secondary-action" disabled={pagination.page >= pagination.pages || loading} onClick={() => load(pagination.page + 1)}>Next</button>
            </div>
          )}
        </section>

        <aside className="offline-admin-details" aria-live="polite">
          {detailLoading ? (
            <div className="offline-empty"><div className="loading-spinner" /><p>Loading team details…</p></div>
          ) : !selected ? (
            <div className="offline-empty"><FiUsers /><h3>Select a team</h3><p>Open a row to view the full registration and payment details.</p></div>
          ) : (
            <>
              <div className="offline-detail-heading">
                <div><span className="section-subtitle">Team details</span><h3>{team?.teamName}</h3><code>{team?.id}</code></div>
                <span className="offline-submitted-badge">{registration?.status}</span>
              </div>

              <section className="offline-detail-section">
                <h4>Team Information</h4>
                <dl className="offline-detail-grid">
                  <div><dt>Team Lead</dt><dd>{team?.leader?.name || 'Not available'}</dd></div>
                  <div><dt>College</dt><dd>{team?.college || 'Not available'}</dd></div>
                  <div><dt>Team Size</dt><dd>{registration?.teamSize} members</dd></div>
                  <div><dt>Project Name</dt><dd>{project?.title || team?.projectTitle || 'Not available'}</dd></div>
                  <div><dt>Problem Statement</dt><dd>{problemStatement?.title || project?.problemStatement || 'Not available'}</dd></div>
                  <div><dt>Problem Code</dt><dd>{problemStatement?.code || project?.problemCode || team?.problemCode || 'Not available'}</dd></div>
                </dl>
              </section>

              <section className="offline-detail-section">
                <h4>Team Members</h4>
                <div className="offline-members-grid">
                  {members.map((member) => (
                    <article key={member._id || member.id || member.email} className="offline-member-card">
                      <div><strong>{member.name || 'Participant'}</strong><span>{memberRole(member, team?.leader)}</span></div>
                      <a href={`mailto:${member.email}`}>{member.email || 'Email unavailable'}</a>
                      {member.phone && <a href={`tel:${member.phone}`}>{member.phone}</a>}
                      <small>{member.collegeName || member.college || 'College not available'}</small>
                      <small>{member.registeredNumber || 'Reg. number unavailable'} · {member.department || 'Branch unavailable'} · {member.year || 'Year unavailable'}</small>
                      {member.gender && <small>Gender: {member.gender}</small>}
                    </article>
                  ))}
                </div>
              </section>

              <section className="offline-detail-section offline-payment-details">
                <h4>Offline Registration Details</h4>
                <dl className="offline-detail-grid">
                  <div><dt>Status</dt><dd><span className="offline-submitted-badge">{registration?.status}</span></dd></div>
                  <div><dt>Submission Date / Time</dt><dd>{formatDate(registration?.submittedAt)}</dd></div>
                  <div><dt>Team Size</dt><dd>{registration?.teamSize} members</dd></div>
                  <div><dt>Applicable Fee</dt><dd>{formatCurrency(registration?.expectedAmount)}</dd></div>
                  <div className="offline-utr-row"><dt>UTR ID</dt><dd><code>{registration?.utrId}</code><button type="button" onClick={copyUtr} title="Copy UTR ID"><FiCopy /></button></dd></div>
                  <div><dt>Payment Screenshot</dt><dd>{registration?.paymentScreenshot?.available ? registration.paymentScreenshot.originalName : 'Payment screenshot unavailable'}</dd></div>
                </dl>
                <button type="button" className="primary-action offline-view-screenshot" onClick={viewScreenshot} disabled={!registration?.paymentScreenshot?.available || screenshotLoading}>
                  {screenshotLoading ? <FiRefreshCw /> : <FiEye />} {screenshotLoading ? 'Opening…' : 'View Payment Screenshot'}
                </button>
                {!registration?.paymentScreenshot?.available && <p className="offline-unavailable"><FiFileText /> Payment screenshot unavailable</p>}
              </section>
            </>
          )}
        </aside>
      </div>

      {screenshotPreview && (
        <div className="offline-screenshot-modal" role="dialog" aria-modal="true" aria-label="Payment screenshot">
          <div className="offline-screenshot-dialog">
            <div className="offline-screenshot-header">
              <div><span className="section-subtitle">Payment Screenshot</span><h3>{screenshotPreview.filename}</h3></div>
              <button type="button" className="secondary-action" onClick={closeScreenshot}>Close</button>
            </div>
            <img src={screenshotPreview.url} alt={`Payment screenshot for ${team?.teamName || 'offline registration'}`} />
          </div>
        </div>
      )}
    </div>
  );
}
