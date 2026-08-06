import { FiImage } from 'react-icons/fi';
import { formatBytes } from '../../utils/registrationValidation';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'];

export default function StepPersonal({ data, errors, onChange, onFileChange }) {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 1</span>
        <h2>Personal Details</h2>
        <p>Tell us who you are and where you are joining from.</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Full Name *</span>
          <input value={data.fullName} onChange={update('fullName')} placeholder="Your full name" />
          {errors.fullName && <small>{errors.fullName}</small>}
        </label>

        <label className="field">
          <span>Email Address *</span>
          <input type="email" value={data.email} onChange={update('email')} placeholder="you@example.com" />
          {errors.email && <small>{errors.email}</small>}
        </label>

        <label className="field">
          <span>Phone Number *</span>
          <input type="tel" value={data.phone} onChange={update('phone')} placeholder="+91 98765 43210" />
          {errors.phone && <small>{errors.phone}</small>}
        </label>

        <label className="field">
          <span>College Name *</span>
          <input value={data.collegeName} onChange={update('collegeName')} placeholder="NSRIT" />
          {errors.collegeName && <small>{errors.collegeName}</small>}
        </label>

        <label className="field">
          <span>University *</span>
          <input value={data.university} onChange={update('university')} placeholder="Affiliated university" />
          {errors.university && <small>{errors.university}</small>}
        </label>

        <label className="field">
          <span>Department / Branch *</span>
          <input value={data.department} onChange={update('department')} placeholder="CSE / ECE / AIML" />
          {errors.department && <small>{errors.department}</small>}
        </label>

        <label className="field">
          <span>Year of Study *</span>
          <select value={data.year} onChange={update('year')}>
            <option value="">Select year</option>
            {years.map((year) => <option key={year}>{year}</option>)}
          </select>
          {errors.year && <small>{errors.year}</small>}
        </label>

        <label className="field">
          <span>Gender</span>
          <select value={data.gender || ''} onChange={update('gender')}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other / Prefer not to say</option>
          </select>
        </label>

        <label className="field">
          <span>Resume URL (Optional)</span>
          <input value={data.resumeUrl || data.resume || ''} onChange={update('resumeUrl')} placeholder="https://drive.google.com/..." />
          {errors.resumeUrl && <small>{errors.resumeUrl}</small>}
        </label>

        <label className="field">
          <span>GitHub Profile</span>
          <input value={data.githubUrl || data.github || ''} onChange={update('githubUrl')} placeholder="https://github.com/username" />
          {errors.githubUrl && <small>{errors.githubUrl}</small>}
        </label>

        <label className="field">
          <span>LinkedIn Profile</span>
          <input value={data.linkedinUrl || data.linkedin || ''} onChange={update('linkedinUrl')} placeholder="https://linkedin.com/in/username" />
          {errors.linkedinUrl && <small>{errors.linkedinUrl}</small>}
        </label>

        <label className="field">
          <span>Portfolio / Website</span>
          <input value={data.portfolioUrl || data.portfolio || ''} onChange={update('portfolioUrl')} placeholder="https://yourportfolio.dev" />
          {errors.portfolioUrl && <small>{errors.portfolioUrl}</small>}
        </label>

        <label className="field">
          <span>City *</span>
          <input value={data.city} onChange={update('city')} placeholder="Visakhapatnam" />
          {errors.city && <small>{errors.city}</small>}
        </label>

        <label className="field">
          <span>State *</span>
          <input value={data.state} onChange={update('state')} placeholder="Andhra Pradesh" />
          {errors.state && <small>{errors.state}</small>}
        </label>

        <label className="field upload-inline">
          <span>Profile Photo</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) => onFileChange('profilePhoto', event.target.files?.[0] || null)}
          />
          <div className="file-pill">
            <FiImage />
            {data.profilePhoto ? `${data.profilePhoto.name} (${formatBytes(data.profilePhoto.size)})` : 'Optional JPG, PNG, or WebP'}
          </div>
          {errors.profilePhoto && <small>{errors.profilePhoto}</small>}
        </label>
      </div>
    </div>
  );
}
