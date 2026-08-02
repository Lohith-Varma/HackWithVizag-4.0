const DRAFT_KEY = 'hwv.registrationDraft.v1';
const SUBMISSION_KEY = 'hwv.registrationSubmission.v1';
const USER_KEY = 'hwv.currentUser.v1';

export const TEAM_LIMITS = {
  min: 2,
  max: 4,
};

export const createEmptyMember = () => ({
  fullName: '',
  email: '',
  phone: '',
  college: '',
  department: '',
  year: '',
});

export const createInitialRegistration = () => ({
  personal: {
    fullName: '',
    email: '',
    phone: '',
    collegeName: '',
    university: '',
    department: '',
    year: '',
    city: '',
    state: '',
    profilePhoto: null,
  },
  team: {
    teamName: '',
    teamLeader: '',
    numberOfMembers: TEAM_LIMITS.min,
    members: [createEmptyMember(), createEmptyMember()],
  },
  project: {
    title: '',
    theme: '',
    problemStatement: '',
    abstract: '',
    innovationSummary: '',
    technologyStack: '',
    githubRepository: '',
    demoVideoUrl: '',
  },
  uploads: {
    projectDeck: null,
    synopsis: null,
    teamPhoto: null,
  },
});

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const stripFileObjects = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('name' in value && 'size' in value && 'type' in value) {
    return {
      name: value.name,
      size: value.size,
      type: value.type,
      lastModified: value.lastModified,
      persistedMetaOnly: true,
    };
  }

  if (Array.isArray(value)) return value.map(stripFileObjects);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, stripFileObjects(entry)])
  );
};

export const loadDraftRegistration = () => {
  const draft = safeParse(localStorage.getItem(DRAFT_KEY), null);
  return draft ? { ...createInitialRegistration(), ...draft } : createInitialRegistration();
};

export const saveDraftRegistration = (data) => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(stripFileObjects(data)));
};

export const clearDraftRegistration = () => {
  localStorage.removeItem(DRAFT_KEY);
};

export const loadSubmission = () => safeParse(localStorage.getItem(SUBMISSION_KEY), null);

export const saveSubmission = (submission) => {
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(stripFileObjects(submission)));
};

export const loadCurrentUser = () => safeParse(localStorage.getItem(USER_KEY), null);

export const saveCurrentUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
  localStorage.removeItem(USER_KEY);
};
