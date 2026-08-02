import { formatBytes } from '../../utils/registrationValidation';

const display = (value) => value || 'Not provided';

function SummarySection({ title, children, onEdit }) {
  return (
    <article className="summary-section">
      <div className="summary-section-header">
        <h3>{title}</h3>
        {onEdit && <button type="button" onClick={onEdit}>Edit</button>}
      </div>
      {children}
    </article>
  );
}

function Row({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{display(value)}</strong>
    </div>
  );
}

export default function RegistrationSummary({ data, onEditSection }) {
  return (
    <div className="registration-summary">
      <SummarySection title="Personal Details" onEdit={onEditSection ? () => onEditSection(0) : null}>
        <Row label="Full Name" value={data.personal.fullName} />
        <Row label="Email" value={data.personal.email} />
        <Row label="Phone" value={data.personal.phone} />
        <Row label="College" value={data.personal.collegeName} />
        <Row label="University" value={data.personal.university} />
        <Row label="Department" value={data.personal.department} />
        <Row label="Year" value={data.personal.year} />
        <Row label="City / State" value={`${display(data.personal.city)} / ${display(data.personal.state)}`} />
      </SummarySection>

      <SummarySection title="Team Details" onEdit={onEditSection ? () => onEditSection(1) : null}>
        <Row label="Team Name" value={data.team.teamName} />
        <Row label="Team Leader" value={data.team.teamLeader} />
        <Row label="Members" value={data.team.members.length} />
        <div className="summary-member-list">
          {data.team.members.map((member, index) => (
            <div className="summary-member" key={`${member.email}-${index}`}>
              <strong>{index + 1}. {display(member.fullName)}</strong>
              <span>{display(member.email)} | {display(member.phone)}</span>
              <span>{display(member.college)} | {display(member.department)} | {display(member.year)}</span>
            </div>
          ))}
        </div>
      </SummarySection>

      <SummarySection title="Project Details" onEdit={onEditSection ? () => onEditSection(2) : null}>
        <Row label="Project Title" value={data.project.title} />
        <Row label="Theme" value={data.project.theme} />
        <Row label="Technology Stack" value={data.project.technologyStack} />
        <Row label="GitHub" value={data.project.githubRepository} />
        <Row label="Demo Video" value={data.project.demoVideoUrl} />
        <div className="summary-long">
          <span>Problem Statement</span>
          <p>{display(data.project.problemStatement)}</p>
        </div>
        <div className="summary-long">
          <span>Abstract</span>
          <p>{display(data.project.abstract)}</p>
        </div>
        <div className="summary-long">
          <span>Innovation Summary</span>
          <p>{display(data.project.innovationSummary)}</p>
        </div>
      </SummarySection>

      <SummarySection title="Documents" onEdit={onEditSection ? () => onEditSection(3) : null}>
        {Object.entries({
          projectDeck: 'Project PPT',
          synopsis: 'Project Synopsis',
          teamPhoto: 'Team Photo',
        }).map(([field, label]) => (
          <Row
            key={field}
            label={label}
            value={data.uploads[field] ? `${data.uploads[field].name} (${formatBytes(data.uploads[field].size)})` : ''}
          />
        ))}
      </SummarySection>
    </div>
  );
}
