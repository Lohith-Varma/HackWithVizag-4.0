import { useState } from 'react';
import { FiFileText, FiUploadCloud, FiX, FiVideo, FiCheckCircle } from 'react-icons/fi';
import { formatBytes } from '../../utils/registrationValidation';

function UploadDropzone({ title, field, file, error, rules, onFileChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const accept = (rules.extensions || ['.pdf', '.ppt', '.pptx']).join(',');

  const setFile = (candidate) => {
    onFileChange(field, candidate || null);
    setIsDragging(false);
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''} ${error ? 'has-error' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        id={field}
        type="file"
        accept={accept}
        onChange={(event) => setFile(event.target.files?.[0])}
      />
      <label htmlFor={field}>
        <FiUploadCloud />
        <strong>{title}{rules.required ? ' *' : ''}</strong>
        <span>Allowed: {accept} | Max: {rules.maxSizeMb || 15} MB</span>
      </label>

      {file && (
        <div className="selected-file">
          <FiFileText />
          <div>
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
          <button type="button" onClick={() => setFile(null)} aria-label={`Remove ${title}`}>
            <FiX />
          </button>
        </div>
      )}
      {error && <small>{error}</small>}
    </div>
  );
}

export default function StepUpload({ data, errors, onFileChange, eventConfig = {} }) {
  const pptRules = {
    required: true,
    maxSizeMb: eventConfig.maxPptSizeMb || 15,
    extensions: eventConfig.allowedPptFormats || ['.ppt', '.pptx', '.pdf'],
  };

  const docRules = {
    required: false,
    maxSizeMb: eventConfig.maxSupportingDocSizeMb || 15,
    extensions: eventConfig.allowedSupportingDocFormats || ['.pdf', '.zip', '.rar', '.doc', '.docx'],
  };

  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 5</span>
        <h2>Uploads & Media</h2>
        <p>Upload your presentation PPT, optional supporting documentation, and verify demo video URL.</p>
      </div>

      <div className="upload-grid">
        <UploadDropzone
          title="Project Presentation (PPT)"
          field="pptFile"
          file={data.pptFile}
          error={errors.pptFile}
          rules={pptRules}
          onFileChange={onFileChange}
        />

        <UploadDropzone
          title="Supporting Document (Architecture / Deck / Docs)"
          field="supportingDocFile"
          file={data.supportingDocFile}
          error={errors.supportingDocFile}
          rules={docRules}
          onFileChange={onFileChange}
        />
      </div>

      {data.demoVideoUrl && (
        <div className="video-preview-card mt-4">
          <FiVideo className="video-icon" />
          <div className="video-info">
            <strong>Demo Video URL Configured</strong>
            <span>{data.demoVideoUrl}</span>
          </div>
          <FiCheckCircle className="check-icon" />
        </div>
      )}
    </div>
  );
}
