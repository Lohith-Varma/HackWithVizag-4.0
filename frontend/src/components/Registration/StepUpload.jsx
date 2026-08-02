import { useState } from 'react';
import { FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import { fileRules, formatBytes } from '../../utils/registrationValidation';

function UploadDropzone({ field, file, error, onFileChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const rules = fileRules[field];
  const accept = rules.extensions.map((extension) => `.${extension}`).join(',');

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
        <strong>{rules.label}{rules.required ? ' *' : ''}</strong>
        <span>{accept} up to {rules.maxSizeMb} MB</span>
      </label>

      {file && (
        <div className="selected-file">
          <FiFileText />
          <div>
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
          <button type="button" onClick={() => setFile(null)} aria-label={`Remove ${rules.label}`}>
            <FiX />
          </button>
        </div>
      )}
      {error && <small>{error}</small>}
    </div>
  );
}

export default function StepUpload({ data, errors, onFileChange }) {
  return (
    <div className="wizard-step">
      <div className="step-copy">
        <span className="section-subtitle">Step 4</span>
        <h2>Upload Documents</h2>
        <p>Attach the screening documents. Drag files into the upload area or choose them manually.</p>
      </div>

      <div className="upload-grid">
        {Object.keys(fileRules).map((field) => (
          <UploadDropzone
            key={field}
            field={field}
            file={data[field]}
            error={errors[field]}
            onFileChange={onFileChange}
          />
        ))}
      </div>
    </div>
  );
}
