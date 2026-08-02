import { FiCheckCircle, FiClock, FiEdit3, FiThumbsDown, FiZap } from 'react-icons/fi';
import { getStatusConfig } from '../../utils/submissionStatus';

const statusIcons = {
  draft: <FiEdit3 />,
  submitted: <FiCheckCircle />,
  under_review: <FiClock />,
  selected: <FiZap />,
  rejected: <FiThumbsDown />,
};

export default function StatusCard({ status }) {
  const config = getStatusConfig(status);

  return (
    <article className={`status-card status-${status}`}>
      <div className="status-icon">{statusIcons[status] || statusIcons.draft}</div>
      <div>
        <span className={`status-badge status-${status}`}>{config.label}</span>
        <h3>Current Stage</h3>
        <p>{config.description}</p>
      </div>
    </article>
  );
}
