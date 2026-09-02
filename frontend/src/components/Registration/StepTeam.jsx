import { useEffect, useState } from 'react';
import { FiCheckCircle, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { api } from '../../services/api';

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const createEmptyMember = (college = '') => ({
  fullName: '',
  email: '',
  phone: '',
  registeredNumber: '',
  gender: '',
  department: '',
  year: '',
  college: college,
  isVerifiedUser: false,
});

export default function StepTeam({ data, errors, onChange, leadName = '', leadCollege = '' }) {
  const effectiveLeadName = leadName || data.teamLeader || 'Logged-in Account';
  const effectiveLeadCollege = leadCollege || data.teamLeaderCollege || 'Profile College';

  const [lookupLoading, setLookupLoading] = useState({});
  const [lookupMessage, setLookupMessage] = useState({});

  // Team size includes the Team Lead (1 Lead + N Members)
  const currentTotalSize = 1 + (data.members?.length || 0);
  const selectedSize = currentTotalSize === 4 ? 4 : 3;

  // Ensure initial member array matches size (default 2 additional members = 3 total)
  useEffect(() => {
    const memberCount = (data.members || []).length;
    if (memberCount !== 2 && memberCount !== 3) {
      const targetAdditional = 2; // Default to 3 total
      const members = [...(data.members || [])];
      while (members.length < targetAdditional) {
        members.push(createEmptyMember(effectiveLeadCollege));
      }
      onChange({
        ...data,
        numberOfMembers: 1 + targetAdditional,
        members: members.slice(0, targetAdditional),
      });
    }
  }, []);

  const setTeamField = (field, value) => onChange({ ...data, [field]: value });

  const handleSelectTeamSize = (targetTotalSize) => {
    const targetAdditional = targetTotalSize === 4 ? 3 : 2;
    const members = [...(data.members || [])];

    while (members.length < targetAdditional) {
      members.push(createEmptyMember(effectiveLeadCollege));
    }

    const nextMembers = members.slice(0, targetAdditional);
    onChange({
      ...data,
      numberOfMembers: targetTotalSize,
      members: nextMembers,
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

        // Check if user is already registered in a team
        if (res.isAlreadyInTeam) {
          setLookupMessage((prev) => ({
            ...prev,
            [index]: {
              type: 'error',
              text: `This user is already registered with team "${res.existingTeamName || 'registered team'}" and cannot be added to another team.`,
            },
          }));
          return;
        }

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
            text: 'No existing account found. Please enter member details manually (they will be registered under your college).',
          },
        }));
      }
    } catch {
      // Lookup failed gracefully
    } finally {
      setLookupLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 2</span>
        <h2>Team Details</h2>
        <p>Team size is strictly <strong>3 or 4 members</strong> (including Team Leader). Cross-college teams are not allowed.</p>
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

        {/* TEAM SIZE SELECTION (STRICTLY 3 OR 4 ONLY) */}
        <div className="field" style={{ gridColumn: 'span 2' }}>
          <span>Team Size (Total Members Including Leader) *</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '0.35rem',
            }}
          >
            <button
              type="button"
              className={`team-size-option-card ${selectedSize === 3 ? 'active' : ''}`}
              onClick={() => handleSelectTeamSize(3)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                border: selectedSize === 3 ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: selectedSize === 3 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                <strong style={{ fontSize: '1.05rem', color: selectedSize === 3 ? '#a5b4fc' : '#fff' }}>
                  👥 3 Members
                </strong>
                {selectedSize === 3 && <FiCheckCircle style={{ color: '#6366f1', fontSize: '1.2rem' }} />}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                1 Team Leader + 2 Team Members
              </span>
            </button>

            <button
              type="button"
              className={`team-size-option-card ${selectedSize === 4 ? 'active' : ''}`}
              onClick={() => handleSelectTeamSize(4)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                border: selectedSize === 4 ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: selectedSize === 4 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                <strong style={{ fontSize: '1.05rem', color: selectedSize === 4 ? '#a5b4fc' : '#fff' }}>
                  👥 4 Members
                </strong>
                {selectedSize === 4 && <FiCheckCircle style={{ color: '#6366f1', fontSize: '1.2rem' }} />}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                1 Team Leader + 3 Team Members
              </span>
            </button>
          </div>
          {errors.membersCount && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.membersCount}</small>}
        </div>
      </div>

      <div className="members-header" style={{ marginTop: '2rem' }}>
        <div>
          <h3>Additional Team Members ({(data.members || []).length} Required)</h3>
          <span className="text-dim font-xs" style={{ display: 'block', marginTop: '2px', color: '#94a3b8' }}>
            All team members must belong to <strong>{effectiveLeadCollege}</strong>.
          </span>
        </div>
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
