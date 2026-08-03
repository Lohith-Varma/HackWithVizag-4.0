import { FiMinusCircle, FiPlusCircle, FiTrash2 } from 'react-icons/fi';

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'];

const createEmptyMember = () => ({
  fullName: '',
  email: '',
  phone: '',
  college: '',
  department: '',
  year: '',
});

export default function StepTeam({ data, errors, onChange, eventConfig = {} }) {
  const minSize = eventConfig.minTeamSize || 1;
  const maxSize = eventConfig.maxTeamSize || 4;

  const setTeamField = (field, value) => onChange({ ...data, [field]: value });

  const setMembersForSize = (targetCount) => {
    // Note: total team count includes leader + additional members
    const additionalTarget = Math.max(0, Math.min(maxSize - 1, targetCount - 1));
    const members = [...data.members];
    while (members.length < additionalTarget) members.push(createEmptyMember());
    onChange({
      ...data,
      numberOfMembers: 1 + additionalTarget,
      members: members.slice(0, additionalTarget),
    });
  };

  const updateMember = (index, field, value) => {
    const members = data.members.map((member, memberIndex) =>
      memberIndex === index ? { ...member, [field]: value } : member
    );
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  const addMember = () => {
    if (1 + data.members.length >= maxSize) return;
    const members = [...data.members, createEmptyMember()];
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  const removeMember = (index) => {
    if (1 + data.members.length <= minSize) return;
    const members = data.members.filter((_, memberIndex) => memberIndex !== index);
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 2</span>
        <h2>Team Details</h2>
        <p>Teams must have between {minSize} and {maxSize} members (including Team Leader).</p>
      </div>

      <div className="form-grid compact">
        <label className="field">
          <span>Team Name *</span>
          <input value={data.teamName} onChange={(e) => setTeamField('teamName', e.target.value)} placeholder="Code Coasters" />
          {errors.teamName && <small>{errors.teamName}</small>}
        </label>

        <label className="field">
          <span>Team Leader Name *</span>
          <input value={data.teamLeader} onChange={(e) => setTeamField('teamLeader', e.target.value)} placeholder="Team Leader Full Name" />
          {errors.teamLeader && <small>{errors.teamLeader}</small>}
        </label>

        <label className="field team-size-field">
          <span>Total Team Size *</span>
          <div className="stepper">
            <button
              type="button"
              onClick={() => setMembersForSize(1 + data.members.length - 1)}
              disabled={1 + data.members.length <= minSize}
              aria-label="Decrease team size"
            >
              <FiMinusCircle />
            </button>
            <input
              type="number"
              min={minSize}
              max={maxSize}
              value={1 + data.members.length}
              onChange={(e) => setMembersForSize(Number(e.target.value))}
            />
            <button
              type="button"
              onClick={() => setMembersForSize(1 + data.members.length + 1)}
              disabled={1 + data.members.length >= maxSize}
              aria-label="Increase team size"
            >
              <FiPlusCircle />
            </button>
          </div>
          {errors.membersCount && <small>{errors.membersCount}</small>}
        </label>
      </div>

      <div className="members-header">
        <h3>Additional Team Members ({data.members.length})</h3>
        <button
          type="button"
          className="ghost-action"
          onClick={addMember}
          disabled={1 + data.members.length >= maxSize}
        >
          <FiPlusCircle /> Add Member
        </button>
      </div>

      <div className="member-list">
        {data.members.map((member, index) => {
          const memberErrors = errors.members?.[index] || {};
          return (
            <div className="member-card" key={`member-${index + 1}`}>
              <div className="member-card-header">
                <h4>Member {index + 2}</h4>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  disabled={1 + data.members.length <= minSize}
                  aria-label={`Remove member ${index + 2}`}
                >
                  <FiTrash2 />
                </button>
              </div>
              <div className="form-grid member-fields">
                <label className="field">
                  <span>Full Name *</span>
                  <input value={member.fullName} onChange={(e) => updateMember(index, 'fullName', e.target.value)} />
                  {memberErrors.fullName && <small>{memberErrors.fullName}</small>}
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={member.email} onChange={(e) => updateMember(index, 'email', e.target.value)} />
                  {memberErrors.email && <small>{memberErrors.email}</small>}
                </label>
                <label className="field">
                  <span>Phone *</span>
                  <input type="tel" value={member.phone} onChange={(e) => updateMember(index, 'phone', e.target.value)} />
                  {memberErrors.phone && <small>{memberErrors.phone}</small>}
                </label>
                <label className="field">
                  <span>College *</span>
                  <input value={member.college} onChange={(e) => updateMember(index, 'college', e.target.value)} />
                  {memberErrors.college && <small>{memberErrors.college}</small>}
                </label>
                <label className="field">
                  <span>Department *</span>
                  <input value={member.department} onChange={(e) => updateMember(index, 'department', e.target.value)} />
                  {memberErrors.department && <small>{memberErrors.department}</small>}
                </label>
                <label className="field">
                  <span>Year *</span>
                  <select value={member.year} onChange={(e) => updateMember(index, 'year', e.target.value)}>
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
