import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiEdit3, FiEye, FiFolder, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import { api } from '../../services/api';
import './AdminSpotRegistrations.css';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const date = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const emptyMember = () => ({ name: '', email: '', phone: '', collegeName: '' });

export default function AdminSpotRegistrations({ onToast }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [screenshot, setScreenshot] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await api.getAdminSpotRegistrations({ page, limit: 25, search: search.trim(), status });
      setItems(result.spotRegistrations || []);
      setStats(result.stats || { total: 0, pending: 0, confirmed: 0 });
      setPagination(result.pagination || { page, pages: 1, total: 0 });
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to load Spot Registrations.' });
    } finally {
      setLoading(false);
    }
  }, [onToast, search, status]);

  useEffect(() => { const timer = window.setTimeout(() => load(1), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => () => { if (screenshot?.url) window.URL.revokeObjectURL(screenshot.url); }, [screenshot]);

  const open = async (id) => {
    setBusy(true);
    try {
      const result = await api.getAdminSpotRegistration(id);
      setSelected(result.spotRegistration);
      setEditing(null);
      return true;
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to load Spot Registration.' });
      return false;
    } finally { setBusy(false); }
  };

  const beginEdit = () => setEditing({
    teamName: selected.teamName,
    collegeName: selected.collegeName,
    teamSize: selected.teamSize,
    teamLeader: { ...selected.teamLeader },
    members: selected.members.map((member) => ({ ...member })),
    utr: selected.payment.utr,
    paymentScreenshot: null,
  });

  const updateEdit = (field, value) => setEditing((current) => ({ ...current, [field]: value }));
  const updateLeader = (field, value) => setEditing((current) => ({ ...current, teamLeader: { ...current.teamLeader, [field]: value } }));
  const updateMember = (index, field, value) => setEditing((current) => ({ ...current, members: current.members.map((member, i) => i === index ? { ...member, [field]: value } : member) }));
  const changeTeamSize = (value) => {
    const teamSize = Number(value);
    setEditing((current) => ({ ...current, teamSize, members: Array.from({ length: teamSize - 1 }, (_, index) => current.members[index] || { ...emptyMember(), collegeName: current.collegeName }) }));
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.updateAdminSpotRegistration(selected._id, editing);
      setSelected(result.spotRegistration);
      setEditing(null);
      onToast({ type: 'success', message: 'Spot Registration updated.' });
      await load(pagination.page);
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to update Spot Registration.' });
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await api.confirmAdminSpotRegistration(selected._id);
      setSelected(result.spotRegistration);
      setConfirming(false);
      onToast({ type: 'success', message: 'Spot Registration confirmed.' });
      await load(pagination.page);
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Unable to confirm Spot Registration.' });
    } finally { setBusy(false); }
  };

  const viewScreenshot = async () => {
    setBusy(true);
    try {
      const value = await api.getAdminSpotPaymentScreenshot(selected._id, selected.payment.screenshot.originalName);
      if (screenshot?.url) window.URL.revokeObjectURL(screenshot.url);
      setScreenshot(value);
    } catch (error) {
      onToast({ type: 'error', message: error.message || 'Payment screenshot unavailable.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="spot-admin-view">
      <div className="workspace-header spot-admin-header">
        <div><span className="section-subtitle">Independent event records</span><h2>Spot Registrations</h2><p>Direct registrations remain separate from online teams and Offline Registration.</p></div>
        <button type="button" className="secondary-action" onClick={() => load(pagination.page)} disabled={loading}><FiRefreshCw /> Refresh</button>
      </div>

      <div className="spot-admin-stats">
        <article><span>Total Spot Registrations</span><strong>{stats.total}</strong></article>
        <article><span>Pending Confirmation</span><strong>{stats.pending}</strong></article>
        <article><span>Confirmed</span><strong>{stats.confirmed}</strong></article>
      </div>

      <form className="spot-admin-toolbar" onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <label><FiSearch /><span className="sr-only">Search Spot Registrations</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Registration, team, college, leader, email or UTR" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option><option value="SPOT_SUBMITTED">Pending</option><option value="SPOT_CONFIRMED">Confirmed</option></select>
        <button type="submit" className="primary-action">Search</button>
      </form>

      <div className="spot-admin-layout">
        <section className="spot-admin-list" aria-label="Spot Registration list">
          {loading ? <Empty text="Loading Spot Registrations…" /> : items.length === 0 ? <Empty icon={<FiFolder />} text="No Spot Registrations found." /> : (
            <div className="spot-admin-table-wrap"><table className="spot-admin-table">
              <thead><tr><th>Registration</th><th>Team / College</th><th>Leader</th><th>Size</th><th>Amount / UTR</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>{items.map((item) => <tr key={item._id}>
                <td data-label="Registration"><code>{item.registrationNumber}</code></td>
                <td data-label="Team / College"><strong>{item.teamName}</strong><small>{item.collegeName}</small></td>
                <td data-label="Leader"><strong>{item.teamLeader.name}</strong><small>{item.teamLeader.email}</small></td>
                <td data-label="Members">{item.teamSize}</td>
                <td data-label="Amount / UTR"><strong>{currency.format(item.calculatedFee)}</strong><small>{item.payment.utr}</small></td>
                <td data-label="Status"><Status value={item.status} /></td>
                <td data-label="Created">{date(item.createdAt)}</td>
                <td data-label="Actions"><div className="spot-row-actions"><button type="button" onClick={() => open(item._id)}><FiEye /> View</button>{item.status === 'SPOT_SUBMITTED' && <button type="button" onClick={async () => { if (await open(item._id)) setConfirming(true); }}><FiCheckCircle /> Confirm</button>}</div></td>
              </tr>)}</tbody>
            </table></div>
          )}
          {pagination.pages > 1 && <div className="spot-admin-pagination"><button type="button" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next</button></div>}
        </section>

        <aside className="spot-admin-detail">
          {busy && !selected ? <Empty text="Loading details…" /> : !selected ? <Empty icon={<FiUsers />} text="Select a registration to view its full details." /> : editing ? (
            <EditForm value={editing} busy={busy} onChange={updateEdit} onLeader={updateLeader} onMember={updateMember} onTeamSize={changeTeamSize} onCancel={() => setEditing(null)} onSubmit={save} />
          ) : (
            <>
              <div className="spot-detail-heading"><div><span className="section-subtitle">{selected.registrationNumber}</span><h3>{selected.teamName}</h3><p>{selected.collegeName}</p></div><Status value={selected.status} /></div>
              <section><h4>Team Leader</h4><Info person={selected.teamLeader} /></section>
              <section><h4>Members</h4><div className="spot-detail-members">{selected.members.map((member, index) => <Info key={member.email} person={member} title={`Member ${index + 2}`} />)}</div></section>
              <section><h4>Payment</h4><dl className="spot-detail-grid"><div><dt>Calculated Amount</dt><dd>{currency.format(selected.calculatedFee)}</dd></div><div><dt>UTR</dt><dd>{selected.payment.utr}</dd></div><div><dt>Submitted</dt><dd>{date(selected.submittedAt)}</dd></div><div><dt>Confirmed</dt><dd>{date(selected.confirmedAt)}</dd></div></dl><button type="button" className="primary-action" onClick={viewScreenshot} disabled={busy || !selected.payment.screenshot.available}><FiEye /> View Payment Screenshot</button></section>
              <div className="spot-detail-actions"><button type="button" className="secondary-action" onClick={beginEdit}><FiEdit3 /> Edit</button>{selected.status === 'SPOT_SUBMITTED' && <button type="button" className="primary-action" onClick={() => setConfirming(true)}><FiCheckCircle /> Confirm Registration</button>}</div>
            </>
          )}
        </aside>
      </div>

      {confirming && selected && <div className="spot-admin-modal" role="dialog" aria-modal="true" aria-labelledby="spot-confirm-title"><div><h3 id="spot-confirm-title">Confirm Spot Registration?</h3><p>Registration: <b>{selected.registrationNumber}</b></p><p>Team: <b>{selected.teamName}</b></p><p>Amount: <b>{currency.format(selected.calculatedFee)}</b></p><div className="spot-modal-actions"><button type="button" className="secondary-action" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button><button type="button" className="primary-action" onClick={confirm} disabled={busy}>{busy ? 'Confirming…' : 'Confirm'}</button></div></div></div>}
      {screenshot && <div className="spot-admin-modal screenshot" role="dialog" aria-modal="true" aria-label="Spot Registration payment screenshot"><div><div className="spot-modal-heading"><h3>{screenshot.filename}</h3><button type="button" className="secondary-action" onClick={() => setScreenshot(null)}>Close</button></div><img src={screenshot.url} alt={`Payment screenshot for ${selected?.teamName}`} /></div></div>}
    </div>
  );
}

function Status({ value }) { return <span className={`spot-status ${value === 'SPOT_CONFIRMED' ? 'confirmed' : 'pending'}`}>{value}</span>; }
function Empty({ icon, text }) { return <div className="spot-admin-empty">{icon}<p>{text}</p></div>; }
function Info({ person, title = 'Team Leader' }) { return <article className="spot-person"><small>{title}</small><strong>{person.name}</strong><a href={`mailto:${person.email}`}>{person.email}</a><span>{person.phone}</span><span>{person.collegeName}</span></article>; }

function EditForm({ value, busy, onChange, onLeader, onMember, onTeamSize, onCancel, onSubmit }) {
  return <form className="spot-admin-edit" onSubmit={onSubmit}>
    <div className="spot-detail-heading"><div><span className="section-subtitle">Admin edit</span><h3>Edit Spot Registration</h3></div></div>
    <div className="spot-edit-grid">
      <label><span>Team Name</span><input required value={value.teamName} onChange={(e) => onChange('teamName', e.target.value)} /></label>
      <label><span>College</span><input required value={value.collegeName} onChange={(e) => onChange('collegeName', e.target.value)} /></label>
      <label><span>Team Size</span><select value={value.teamSize} onChange={(e) => onTeamSize(e.target.value)}><option value="3">3 members</option><option value="4">4 members</option></select></label>
      <label><span>UTR</span><input required value={value.utr} onChange={(e) => onChange('utr', e.target.value)} /></label>
    </div>
    <ParticipantFields title="Team Leader" value={value.teamLeader} onChange={onLeader} />
    {value.members.map((member, index) => <ParticipantFields key={index} title={`Member ${index + 2}`} value={member} onChange={(field, fieldValue) => onMember(index, field, fieldValue)} />)}
    <label className="spot-edit-file"><span>Replace Payment Screenshot (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onChange('paymentScreenshot', e.target.files?.[0] || null)} /></label>
    <div className="spot-detail-actions"><button type="button" className="secondary-action" onClick={onCancel} disabled={busy}>Cancel</button><button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button></div>
  </form>;
}

function ParticipantFields({ title, value, onChange }) {
  return <fieldset className="spot-edit-participant"><legend>{title}</legend><div className="spot-edit-grid"><label><span>Name</span><input required value={value.name} onChange={(e) => onChange('name', e.target.value)} /></label><label><span>Email</span><input required type="email" value={value.email} onChange={(e) => onChange('email', e.target.value)} /></label><label><span>Phone</span><input required type="text" value={value.phone} onChange={(e) => onChange('phone', e.target.value)} /></label><label><span>College</span><input required value={value.collegeName} onChange={(e) => onChange('collegeName', e.target.value)} /></label></div></fieldset>;
}
