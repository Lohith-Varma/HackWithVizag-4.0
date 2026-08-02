import { TEAM_LIMITS } from './registrationStorage';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?\d[\d\s-]{7,14}\d$/;
const urlPattern = /^https?:\/\/.+\..+/i;

export const fileRules = {
  projectDeck: {
    label: 'Project PPT',
    required: true,
    maxSizeMb: 15,
    extensions: ['ppt', 'pptx', 'pdf'],
  },
  synopsis: {
    label: 'Project Synopsis',
    required: false,
    maxSizeMb: 10,
    extensions: ['pdf', 'doc', 'docx'],
  },
  teamPhoto: {
    label: 'Team Photo',
    required: false,
    maxSizeMb: 8,
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
};

const required = (value) => !String(value || '').trim();
const extensionOf = (file) => (file?.name?.split('.').pop() || '').toLowerCase();

export const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const validateFile = (file, rules) => {
  if (!file) return rules.required ? `${rules.label} is required` : '';
  const extension = extensionOf(file);
  if (!rules.extensions.includes(extension)) {
    return `${rules.label} must be ${rules.extensions.map((item) => `.${item}`).join(', ')}`;
  }
  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return `${rules.label} must be under ${rules.maxSizeMb} MB`;
  }
  return '';
};

export const validatePersonal = (personal) => {
  const errors = {};
  [
    ['fullName', 'Full name is required'],
    ['email', 'Email address is required'],
    ['phone', 'Phone number is required'],
    ['collegeName', 'College name is required'],
    ['university', 'University is required'],
    ['department', 'Department / Branch is required'],
    ['year', 'Year of study is required'],
    ['city', 'City is required'],
    ['state', 'State is required'],
  ].forEach(([field, message]) => {
    if (required(personal[field])) errors[field] = message;
  });

  if (personal.email && !emailPattern.test(personal.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (personal.phone && !phonePattern.test(personal.phone)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (personal.profilePhoto) {
    const photoError = validateFile(personal.profilePhoto, {
      label: 'Profile Photo',
      required: false,
      maxSizeMb: 5,
      extensions: ['jpg', 'jpeg', 'png', 'webp'],
    });
    if (photoError) errors.profilePhoto = photoError;
  }
  return errors;
};

export const validateTeam = (team) => {
  const errors = { members: [] };
  if (required(team.teamName)) errors.teamName = 'Team name is required';
  if (required(team.teamLeader)) errors.teamLeader = 'Team leader is required';
  const size = Number(team.numberOfMembers);
  if (size < TEAM_LIMITS.min || size > TEAM_LIMITS.max) {
    errors.numberOfMembers = `Team size must be between ${TEAM_LIMITS.min} and ${TEAM_LIMITS.max}`;
  }
  if (team.members.length !== size) {
    errors.numberOfMembers = `Add details for all ${size} team members`;
  }

  team.members.forEach((member, index) => {
    const memberErrors = {};
    [
      ['fullName', 'Full name is required'],
      ['email', 'Email is required'],
      ['phone', 'Phone is required'],
      ['college', 'College is required'],
      ['department', 'Department is required'],
      ['year', 'Year is required'],
    ].forEach(([field, message]) => {
      if (required(member[field])) memberErrors[field] = message;
    });
    if (member.email && !emailPattern.test(member.email)) memberErrors.email = 'Enter a valid email';
    if (member.phone && !phonePattern.test(member.phone)) memberErrors.phone = 'Enter a valid phone';
    errors.members[index] = memberErrors;
  });

  if (!errors.members.some((memberErrors) => Object.keys(memberErrors).length)) {
    delete errors.members;
  }
  return errors;
};

export const validateProject = (project) => {
  const errors = {};
  [
    ['title', 'Project title is required'],
    ['theme', 'Theme is required'],
    ['problemStatement', 'Problem statement is required'],
    ['abstract', 'Abstract is required'],
    ['innovationSummary', 'Innovation summary is required'],
    ['technologyStack', 'Technology stack is required'],
  ].forEach(([field, message]) => {
    if (required(project[field])) errors[field] = message;
  });

  if (project.githubRepository && !urlPattern.test(project.githubRepository)) {
    errors.githubRepository = 'Enter a valid repository URL';
  }
  if (project.demoVideoUrl && !urlPattern.test(project.demoVideoUrl)) {
    errors.demoVideoUrl = 'Enter a valid demo video URL';
  }
  return errors;
};

export const validateUploads = (uploads) => {
  const errors = {};
  Object.entries(fileRules).forEach(([field, rules]) => {
    const error = validateFile(uploads[field], rules);
    if (error) errors[field] = error;
  });
  return errors;
};

export const validators = [
  validatePersonal,
  validateTeam,
  validateProject,
  validateUploads,
  () => ({}),
];

export const hasErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return false;
  return Object.values(errors).some((value) => {
    if (!value) return false;
    if (typeof value === 'string') return true;
    return hasErrors(value);
  });
};
