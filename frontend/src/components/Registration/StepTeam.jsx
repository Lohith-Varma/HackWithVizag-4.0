import { useState } from 'react';
import { FiCheckCircle, FiMinusCircle, FiPlusCircle, FiSearch, FiTrash2, FiUser, FiAlertCircle } from 'react-icons/fi';
import { api } from '../../services/api';

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const createEmptyMember = () => ({
  fullName: '',
  email: '',
  phone: '',
  registeredNumber: '',
  gender: '',
  department: '',
  year: '',
  college: '',
  isVerifiedUser: false,
});

export default function StepTeam({ data, errors, onChange, eventConfig = {}, leadName = '', leadCollege = '' }) {
  const minSize = eventConfig.minTeamSize || 1;
  const maxSize = eventConfig.maxTeamSize || 4;
  const effectiveLeadName = leadName || data.teamLeader || 'Logged-in Account';
  const effectiveLeadCollege = leadCollege || data.teamLeaderCollege || 'Profile College';

  const [lookupLoading, setLookupLoading] = useState({});
  const [lookupMessage, setLookupMessage] = useState({});

  const setTeamField = (field, value) => onChange({ ...data, [field]: value });

  const setMembersForSize = (targetCount) => {
    const additionalTarget = Math.max(0, Math.min(maxSize - 1, targetCount - 1));
    const members = [...(data.members || [])];
    while (members.length < additionalTarget) members.push(createEmptyMember());
    onChange({
      ...data,
      numberOfMembers: 1 + additionalTarget,
      members: members.slice(0, additionalTarget),
    });
  };

  const updateMember = (index, field, value) => {
    const members = (data.members || []).map((member, memberIndex) =>
      memberIndex === index ? { ...member, [field]: value } : member
    );
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  const handleLookupMember = async (index, emailToLookup) => {
    const email = (emailToLookup || data.members?.[index]?.email || '').trim().toLowerCase();
    if (!email) return;

    setLookupLoading((prev) => ({ ...prev, [index]: true }));
    setLookupMessage((prev) => ({ ...prev, [index]: null }));

    try {
      const res = await api.lookupUser({ email });
      if (res?.user) {
        const u = res.user;
        const userCollege = (u.collegeName || u.college || '').trim().toLowerCase();
        const leadCol = effectiveLeadCollege.trim().toLowerCase();

        if (userCollege && leadCol && userCollege !== leadCol) {
          setLookupMessage((prev) => ({
            ...prev,
            [index]: {
              type: 'error',
              text: 'All team members must belong to the same college. Cross-college teams are not allowed.',
            },
          }));
          return;
        }

        const members = (data.members || []).map((member, memberIndex) => {
          if (memberIndex !== index) return member;
          return {
            ...member,
            fullName: u.name || member.fullName,
            phone: u.phone || member.phone,
            registeredNumber: u.registeredNumber || member.registeredNumber,
            gender: u.gender || member.gender,
            department: u.department || member.department,
            year: u.year === 'Final Year' ? '4th Year' : (u.year || member.year),
            college: u.collegeName || u.college || effectiveLeadCollege,
            isVerifiedUser: true,
          };
        });

        onChange({ ...data, members, numberOfMembers: 1 + members.length });
        setLookupMessage((prev) => ({
          ...prev,
          [index]: {
            type: 'success',
            text: `Found registered profile for ${u.name}. Details auto-populated.`,
          },
        }));
      } else {
        setLookupMessage((prev) => ({
          ...prev,
          [index]: {
            type: 'info',
            text: 'No existing account found. Please fill in member details manually (they will be registered under the same college).',
          },
        }));
      }
    } catch {
      // Lookup failed gracefully
    } finally {
      setLookupLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const addMember = () => {
    if (1 + (data.members || []).length >= maxSize) return;
    const members = [...(data.members || []), createEmptyMember()];
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  const removeMember = (index) => {
    if (1 + (data.members || []).length <= minSize) return;
    const members = (data.members || []).filter((_, memberIndex) => memberIndex !== index);
    onChange({ ...data, members, numberOfMembers: 1 + members.length });
  };

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 2</span>
        <h2>Team Details</h2>
        <p>Teams must have between {minSize} and {maxSize} members. Cross-college teams are strictly not permitted.</p>
      </div>

      <div className="form-grid compact">
        <label className="field">
          <span>Team Name *</span>
          <input
            value={data.teamName || ''}
            onChange={(e) => setTeamField('teamName', e.target.value)}
            placeholder="e.g. Code Coasters"
          />
          {errors.teamName && <small>{errors.teamName}</small>}
        </label>

        <div className="field">
          <span>Team Leader</span>
          <div className="readonly-box team-lead-display" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ fontSize: '1rem', color: '#fff' }}>👑 {effectiveLeadName}</strong>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>College: {effectiveLeadCollege}</span>
          </div>
        </div>

        <label className="field team-size-field">
          <span>Total Team Size *</span>
          <div className="stepper">
            <button
              type="button"
              onClick={() => setMembersForSize(1 + (data.members?.length || 0) - 1)}
              disabled={1 + (data.members?.length || 0) <= minSize}
              aria-label="Decrease team size"
            >
              <FiMinusCircle />
            </button>
            <input
              type="number"
              min={minSize}
              max={maxSize}
              value={1 + (data.members?.length || 0)}
              onChange={(e) => setMembersForSize(Number(e.target.value))}
            />
            <button
              type="button"
              onClick={() => setMembersForSize(1 + (data.members?.length || 0) + 1)}
              disabled={1 + (data.members?.length || 0) >= maxSize}
              aria-label="Increase team size"
            >
              <FiPlusCircle />
            </button>
          </div>
          {errors.membersCount && <small>{errors.membersCount}</small>}
        </label>
      </div>

      <div className="members-header">
        <div>
          <h3>Additional Team Members ({(data.members || []).length})</h3>
          <span className="text-dim font-xs" style={{ display: 'block', marginTop: '2px', color: '#94a3b8' }}>
            All team members must belong to <strong>{effectiveLeadCollege}</strong>.
          </span>
        </div>
        <button
          type="button"
          className="ghost-action"
          onClick={addMember}
          disabled={1 + (data.members || []).length >= maxSize}
        >
          <FiPlusCircle /> Add Member
        </button>
      </div>

      <div className="member-list">
        {(data.members || []).map((member, index) => {
          const memberErrors = errors.members?.[index] || {};
          const msg = lookupMessage[index];

          return (
            <div className="member-card" key={`member-${index + 1}`}>
              <div className="member-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4>Member {index + 2}</h4>
                  {member.isVerifiedUser && (
                    <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                      <FiCheckCircle style={{ display: 'inline', marginRight: '4px' }} /> Verified Account
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  disabled={1 + (data.members || []).length <= minSize}
                  aria-label={`Remove member ${index + 2}`}
                >
                  <FiTrash2 />
                </button>
              </div>

              {msg && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    marginBottom: '12px',
                    background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: msg.type === 'error' ? '#fca5a5' : msg.type === 'success' ? '#86efac' : '#93c5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {msg.type === 'error' ? <FiAlertCircle /> : msg.type === 'success' ? <FiCheckCircle /> : <FiSearch />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="form-grid member-fields">
                <label className="field">
                  <span>Email Address *</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => updateMember(index, 'email', e.target.value)}
                      onBlur={(e) => handleLookupMember(index, e.target.value)}
                      placeholder="member@example.com"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="ghost-action"
                      onClick={() => handleLookupMember(index, member.email)}
                      disabled={lookupLoading[index] || !member.email}
                      title="Look up registered account"
                      style={{ padding: '0 12px', whiteSpace: 'nowrap' }}
                    >
                      {lookupLoading[index] ? '...' : <FiSearch />}
                    </button>
                  </div>
                  {memberErrors.email && <small>{memberErrors.email}</small>}
                </label>

                <label className="field">
                  <span>Full Name *</span>
                  <input
                    value={member.fullName || ''}
                    onChange={(e) => updateMember(index, 'fullName', e.target.value)}
                    placeholder="Full Name"
                  />
                  {memberErrors.fullName && <small>{memberErrors.fullName}</small>}
                </label>

                <label className="field">
                  <span>Phone Number *</span>
                  <input
                    type="tel"
                    value={member.phone || ''}
                    onChange={(e) => updateMember(index, 'phone', e.target.value)}
                    placeholder="10-digit mobile"
                  />
                  {memberErrors.phone && <small>{memberErrors.phone}</small>}
                </label>

                <label className="field">
                  <span>Registered Number (College Reg. No.) *</span>
                  <input
                    value={member.registeredNumber || ''}
                    onChange={(e) => updateMember(index, 'registeredNumber', e.target.value)}
                    placeholder="e.g. 23NU1A0502"
                  />
                  {memberErrors.registeredNumber && <small>{memberErrors.registeredNumber}</small>}
                </label>

                <label className="field">
                  <span>Gender</span>
                  <select
                    value={member.gender || ''}
                    onChange={(e) => updateMember(index, 'gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>

                <label className="field">
                  <span>Department / Branch *</span>
                  <input
                    value={member.department || ''}
                    onChange={(e) => updateMember(index, 'department', e.target.value)}
                    placeholder="CSE / ECE / AIML"
                  />
                  {memberErrors.department && <small>{memberErrors.department}</small>}
                </label>

                <label className="field">
                  <span>Year of Study *</span>
                  <select
                    value={member.year === 'Final Year' ? '4th Year' : (member.year || '')}
                    onChange={(e) => updateMember(index, 'year', e.target.value)}
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                  {memberErrors.year && <small>{memberErrors.year}</small>}
                </label>

                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <span>College (Auto-assigned)</span>
                  <div className="readonly-box" style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)' }}>
                    🏛️ <strong>{member.college || effectiveLeadCollege}</strong> (Single-college team rule enforced)
                  </div>
                  {memberErrors.college && <small style={{ color: '#ef4444' }}>{memberErrors.college}</small>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
