import { useState } from 'react';
import { FiCheckCircle, FiDownload, FiFileText, FiUsers } from 'react-icons/fi';
import { api } from '../../services/api';
import './AdminPaidRegistrationsReport.css';

const sourceOptions = [
  { value: 'all', label: 'All Paid Teams', detail: 'Offline submitted + confirmed spot registrations' },
  { value: 'offline', label: 'Offline Registration Only', detail: 'OFFLINE_SUBMITTED teams' },
  { value: 'spot', label: 'Spot Registration Only', detail: 'SPOT_CONFIRMED teams' },
];

export default function AdminPaidRegistrationsReport({ onToast }) {
  const [source, setSource] = useState('all');
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    setIsDownloading(true);
    try {
      await api.downloadPaidTeamsReport(source);
      onToast?.({ type: 'success', message: 'Excel downloaded successfully.' });
    } catch (error) {
      onToast?.({ type: 'error', message: error.message || 'Unable to generate the Excel report.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const selected = sourceOptions.find((option) => option.value === source);

  return (
    <section className="paid-report-view" aria-labelledby="paid-report-title">
      <div className="workspace-header paid-report-header">
        <div>
          <span className="section-subtitle">Event Operations Report</span>
          <h2 id="paid-report-title">Paid Teams &amp; Students</h2>
          <p>Download team-wise attendance and payment details for the offline event population.</p>
        </div>
      </div>

      <article className="paid-report-card">
        <div className="paid-report-card-icon" aria-hidden="true"><FiFileText /></div>
        <div className="paid-report-copy">
          <h3>Excel Registration Workbook</h3>
          <p>The workbook contains Teams, Students, and Summary sheets. Payment screenshots are never included.</p>
          <div className="paid-report-inclusions">
            <span><FiCheckCircle /> Offline: OFFLINE_SUBMITTED</span>
            <span><FiCheckCircle /> Spot: SPOT_CONFIRMED</span>
            <span><FiUsers /> Every stored team member</span>
          </div>
        </div>

        <div className="paid-report-controls">
          <label htmlFor="paid-report-source">Export</label>
          <select
            id="paid-report-source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            disabled={isDownloading}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <small>{selected?.detail}</small>
          <button type="button" className="primary-action" onClick={download} disabled={isDownloading}>
            <FiDownload /> {isDownloading ? 'Downloading...' : 'Download Excel'}
          </button>
        </div>
      </article>
    </section>
  );
}
