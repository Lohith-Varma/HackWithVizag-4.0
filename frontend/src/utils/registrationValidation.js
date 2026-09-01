const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?\d[\d\s-]{7,14}\d$/;
const urlPattern = /^https?:\/\/.+\..+/i;
const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

const required = (value) => !String(value || '').trim();

export const countWords = (text = '') => {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
};

export const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const validateFile = (file, rules = {}) => {
  if (!file) {
    return rules.required ? `${rules.label || 'File'} is required` : '';
  }
  const extension = `.${(file.name || '').split('.').pop()}`.toLowerCase();
  const allowed = (rules.extensions || ['.ppt', '.pptx', '.pdf']).map((ext) =>
    ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  );

  if (!allowed.includes(extension)) {
    return `${rules.label || 'File'} must be of type: ${allowed.join(', ')}`;
  }

  const maxSizeMb = rules.maxSizeMb || 15;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `${rules.label || 'File'} must be under ${maxSizeMb} MB`;
  }

  return '';
};

const githubRepoPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

export const validatePersonal = (personal = {}) => {
  const errors = {};
  [
    ['fullName', 'Full name is required'],
    ['email', 'Email address is required'],
    ['phone', 'Phone number is required'],
    ['collegeName', 'College name is required'],
    ['registeredNumber', 'College registered number is required'],
    ['department', 'Department / Branch is required'],
    ['year', 'Year of study is required'],
  ].forEach(([field, message]) => {
    if (required(personal[field])) errors[field] = message;
  });

  if (personal.email && !emailPattern.test(personal.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (personal.phone && !phonePattern.test(personal.phone)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (personal.year === 'Final Year') {
    errors.year = 'Please select 4th Year (Final Year is no longer an option)';
  }
  return errors;
};

export const validateTeam = (team = {}, eventConfig = {}, leadCollege = '') => {
  const errors = { members: [] };
  const minTeamSize = eventConfig.minTeamSize || 1;
  const maxTeamSize = eventConfig.maxTeamSize || 4;

  if (required(team.teamName)) errors.teamName = 'Team name is required';

  const memberList = Array.isArray(team.members) ? team.members : [];
  const totalCount = 1 + memberList.length; // Leader + Members

  if (totalCount < minTeamSize || totalCount > maxTeamSize) {
    errors.membersCount = `Total team members (including Leader) must be between ${minTeamSize} and ${maxTeamSize}. Current: ${totalCount}`;
  }

  const normalizedLeadCollege = (leadCollege || team.teamLeaderCollege || '').trim().toLowerCase();

  memberList.forEach((member, index) => {
    const memberErrors = {};
    [
      ['fullName', 'Full name is required'],
      ['email', 'Email is required'],
      ['phone', 'Phone is required'],
      ['registeredNumber', 'Registered number is required'],
      ['department', 'Department is required'],
      ['year', 'Year is required'],
    ].forEach(([field, message]) => {
      if (required(member[field])) memberErrors[field] = message;
    });

    if (member.email && !emailPattern.test(member.email)) memberErrors.email = 'Enter a valid email';
    if (member.phone && !phonePattern.test(member.phone)) memberErrors.phone = 'Enter a valid phone';
    if (member.year === 'Final Year') memberErrors.year = 'Please select 4th Year';

    if (member.college && normalizedLeadCollege) {
      const memberCollege = member.college.trim().toLowerCase();
      if (memberCollege !== normalizedLeadCollege) {
        memberErrors.college = 'All team members must belong to the same college. Cross-college teams are not allowed.';
      }
    }

    errors.members[index] = memberErrors;
  });

  if (!errors.members.some((mErr) => Object.keys(mErr).length > 0)) {
    delete errors.members;
  }

  return errors;
};

export const validateProject = (project = {}, eventConfig = {}) => {
  const errors = {};
  const minWords = eventConfig.minAbstractWords || 50;
  const maxWords = eventConfig.maxAbstractWords || 500;

  if (required(project.title)) errors.title = 'Project title is required';
  if (required(project.theme)) errors.theme = 'Theme is required';
  if (required(project.problemStatement)) errors.problemStatement = 'Problem statement is required';

  if (required(project.abstract)) {
    errors.abstract = 'Abstract is required';
  } else {
    const words = countWords(project.abstract);
    if (words < minWords || words > maxWords) {
      errors.abstract = `Abstract must be between ${minWords} and ${maxWords} words. Current: ${words} words.`;
    }
  }

  if (required(project.githubRepository)) {
    errors.githubRepository = 'GitHub repository link is required.';
  } else if (!githubRepoPattern.test(project.githubRepository.trim())) {
    errors.githubRepository = 'Enter a valid GitHub repository URL (e.g. https://github.com/username/repository)';
  }

  if (project.demoVideoUrl) {
    if (!urlPattern.test(project.demoVideoUrl)) {
      errors.demoVideoUrl = 'Enter a valid URL';
    } else if (!youtubePattern.test(project.demoVideoUrl)) {
      errors.demoVideoUrl = 'Demo video must be a valid YouTube URL (e.g. youtube.com or youtu.be)';
    }
  }

  return errors;
};

export const validateUploads = (uploads = {}, eventConfig = {}) => {
  const errors = {};

  const pptError = validateFile(uploads.pptFile, {
    label: 'Project PPT',
    required: true,
    maxSizeMb: eventConfig.maxPptSizeMb || 15,
    extensions: eventConfig.allowedPptFormats || ['.ppt', '.pptx', '.pdf'],
  });
  if (pptError) errors.pptFile = pptError;

  if (uploads.supportingDocFile) {
    const docError = validateFile(uploads.supportingDocFile, {
      label: 'Supporting Document',
      required: false,
      maxSizeMb: eventConfig.maxSupportingDocSizeMb || 15,
      extensions: eventConfig.allowedSupportingDocFormats || ['.pdf', '.zip', '.rar', '.doc', '.docx'],
    });
    if (docError) errors.supportingDocFile = docError;
  }

  return errors;
};

export const hasErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return false;
  return Object.values(errors).some((value) => {
    if (!value) return false;
    if (typeof value === 'string') return true;
    return hasErrors(value);
  });
};
