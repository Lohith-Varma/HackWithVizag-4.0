import { formatBytes } from '../../utils/registrationValidation';

const display = (value) => value || 'Not provided';

function SummarySection({ title, children, onEdit }) {
  return (
    <article className="summary-section">
      <div className="summary-section-header">
        <h3>{title}</h3>
        {onEdit && (
          <button type="button" className="ghost-action text-sm" onClick={onEdit}>
            Edit Section
          </button>
        )}
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
  const personal = data.personal || {};
  const team = data.team || {};
  const project = data.project || {};
  const uploads = data.uploads || {};

  return (
    <div className="registration-summary">
      <SummarySection title="1. Profile Information" onEdit={onEditSection ? () => onEditSection(0) : null}>
        <Row label="Full Name" value={personal.fullName} />
        <Row label="Email Address" value={personal.email} />
        <Row label="Phone Number" value={personal.phone} />
        <Row label="Registered Number" value={personal.registeredNumber} />
        <Row label="Gender" value={personal.gender} />
        <Row label="College Name" value={personal.collegeName} />
        <Row label="Department / Branch" value={personal.department} />
        <Row label="Year of Study" value={personal.year} />
      </SummarySection>

      <SummarySection title="2. Team Details" onEdit={onEditSection ? () => onEditSection(1) : null}>
        <Row label="Team Name" value={team.teamName} />
        <Row label="Team Leader" value={personal.fullName || team.teamLeader} />
        <Row label="Team College" value={personal.collegeName || team.teamLeaderCollege} />
        <Row label="Total Members" value={1 + (team.members?.length || 0)} />
        {team.members && team.members.length > 0 && (
          <div className="summary-member-list mt-2">
            <strong>Additional Members:</strong>
            {team.members.map((member, index) => (
              <div className="summary-member" key={`${member.email}-${index}`}>
                <strong>Member {index + 2}: {display(member.fullName)}</strong>
                <span>{display(member.email)} | {display(member.phone)}</span>
                <span>Reg No: {display(member.registeredNumber)} {member.gender ? `| Gender: ${member.gender}` : ''}</span>
                <span>{display(member.college || personal.collegeName || team.teamLeaderCollege)} | {display(member.department)} | {display(member.year)}</span>
              </div>
            ))}
          </div>
        )}
      </SummarySection>

      <SummarySection title="3. Problem Statement & Track" onEdit={onEditSection ? () => onEditSection(2) : null}>
        <Row label="Track Code" value={project.problemCode || 'Selected Track'} />
        <Row label="Track Type" value={project.problemType === 'open' ? 'Open Innovation' : 'Official Track'} />
        <Row label="Track / Problem Title" value={project.title} />
        <Row label="Theme" value={project.theme} />
        <div className="summary-long">
          <span>Problem Statement</span>
          <p>{display(project.problemStatement)}</p>
        </div>
      </SummarySection>

      <SummarySection title="4. Project Details & Abstract" onEdit={onEditSection ? () => onEditSection(3) : null}>
        <Row label="Project Title" value={project.title} />
        <Row label="Technology Stack" value={project.technologyStack} />
        <Row label="GitHub Repository" value={project.githubRepository} />
        <Row label="Demo Video Link" value={project.demoVideoUrl} />
        <div className="summary-long">
          <span>Project Abstract</span>
          <p>{display(project.abstract)}</p>
        </div>
      </SummarySection>

      <SummarySection title="5. Uploads & Documents" onEdit={onEditSection ? () => onEditSection(4) : null}>
        <Row
          label="Project Presentation (PPT)"
          value={uploads.pptFile ? `${uploads.pptFile.name} (${formatBytes(uploads.pptFile.size)})` : 'Uploaded'}
        />
        <Row
          label="Supporting Document"
          value={uploads.supportingDocFile ? `${uploads.supportingDocFile.name} (${formatBytes(uploads.supportingDocFile.size)})` : 'Optional / None'}
        />
      </SummarySection>
    </div>
  );
}
