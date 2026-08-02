import { FiMinusCircle, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import { TEAM_LIMITS, createEmptyMember } from '../../utils/registrationStorage';

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'];

export default function StepTeam({ data, errors, onChange }) {
  const setTeamField = (field, value) => onChange({ ...data, [field]: value });

  const setMembersForSize = (size) => {
    const normalized = Math.min(TEAM_LIMITS.max, Math.max(TEAM_LIMITS.min, Number(size)));
    const members = [...data.members];
    while (members.length < normalized) members.push(createEmptyMember());
    onChange({ ...data, numberOfMembers: normalized, members: members.slice(0, normalized) });
  };

  const updateMember = (index, field, value) => {
    const members = data.members.map((member, memberIndex) => (
      memberIndex === index ? { ...member, [field]: value } : member
    ));
    onChange({ ...data, members, numberOfMembers: members.length });
  };

  const addMember = () => {
    if (data.members.length >= TEAM_LIMITS.max) return;
    const members = [...data.members, createEmptyMember()];
    onChange({ ...data, members, numberOfMembers: members.length });
  };

  const removeMember = (index) => {
    if (data.members.length <= TEAM_LIMITS.min) return;
    const members = data.members.filter((_, memberIndex) => memberIndex !== index);
    onChange({ ...data, members, numberOfMembers: members.length });
  };

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 2</span>
        <h2>Team Details</h2>
        <p>Teams must have {TEAM_LIMITS.min} to {TEAM_LIMITS.max} members. You can adjust members before submitting.</p>
      </div>

      <div className="form-grid compact">
        <label className="field">
          <span>Team Name *</span>
          <input value={data.teamName} onChange={(event) => setTeamField('teamName', event.target.value)} placeholder="Code Coast" />
          {errors.teamName && <small>{errors.teamName}</small>}
        </label>

        <label className="field">
          <span>Team Leader *</span>
          <input value={data.teamLeader} onChange={(event) => setTeamField('teamLeader', event.target.value)} placeholder="Leader full name" />
          {errors.teamLeader && <small>{errors.teamLeader}</small>}
        </label>

        <label className="field team-size-field">
          <span>Number of Members *</span>
          <div className="stepper">
            <button type="button" onClick={() => setMembersForSize(data.members.length - 1)} aria-label="Decrease team size">
              <FiMinusCircle />
            </button>
            <input
              type="number"
              min={TEAM_LIMITS.min}
              max={TEAM_LIMITS.max}
              value={data.numberOfMembers}
              onChange={(event) => setMembersForSize(event.target.value)}
            />
            <button type="button" onClick={() => setMembersForSize(data.members.length + 1)} aria-label="Increase team size">
              <FiPlusCircle />
            </button>
          </div>
          {errors.numberOfMembers && <small>{errors.numberOfMembers}</small>}
        </label>
      </div>

      <div className="members-header">
        <h3>Members</h3>
        <button type="button" className="ghost-action" onClick={addMember} disabled={data.members.length >= TEAM_LIMITS.max}>
          <FiPlusCircle /> Add Member
        </button>
      </div>

      <div className="member-list">
        {data.members.map((member, index) => {
          const memberErrors = errors.members?.[index] || {};
          return (
            <div className="member-card" key={`member-${index + 1}`}>
              <div className="member-card-header">
                <h4>Member {index + 1}</h4>
                <button type="button" onClick={() => removeMember(index)} disabled={data.members.length <= TEAM_LIMITS.min} aria-label={`Remove member ${index + 1}`}>
                  <FiTrash2 />
                </button>
              </div>
              <div className="form-grid member-fields">
                <label className="field">
                  <span>Full Name *</span>
                  <input value={member.fullName} onChange={(event) => updateMember(index, 'fullName', event.target.value)} />
                  {memberErrors.fullName && <small>{memberErrors.fullName}</small>}
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={member.email} onChange={(event) => updateMember(index, 'email', event.target.value)} />
                  {memberErrors.email && <small>{memberErrors.email}</small>}
                </label>
                <label className="field">
                  <span>Phone *</span>
                  <input type="tel" value={member.phone} onChange={(event) => updateMember(index, 'phone', event.target.value)} />
                  {memberErrors.phone && <small>{memberErrors.phone}</small>}
                </label>
                <label className="field">
                  <span>College *</span>
                  <input value={member.college} onChange={(event) => updateMember(index, 'college', event.target.value)} />
                  {memberErrors.college && <small>{memberErrors.college}</small>}
                </label>
                <label className="field">
                  <span>Department *</span>
                  <input value={member.department} onChange={(event) => updateMember(index, 'department', event.target.value)} />
                  {memberErrors.department && <small>{memberErrors.department}</small>}
                </label>
                <label className="field">
                  <span>Year *</span>
                  <select value={member.year} onChange={(event) => updateMember(index, 'year', event.target.value)}>
                    <option value="">Select year</option>
                    {yearOptions.map((year) => <option key={year}>{year}</option>)}
                  </select>
                  {memberErrors.year && <small>{memberErrors.year}</small>}
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
