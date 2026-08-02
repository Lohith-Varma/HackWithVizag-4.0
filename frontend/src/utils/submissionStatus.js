export const statusConfig = {
  draft: {
    label: 'Draft',
    description: 'Your registration is saved locally. Complete the wizard and submit it for screening.',
  },
  submitted: {
    label: 'Submitted',
    description: 'Your registration has been submitted and is queued for screening.',
  },
  under_review: {
    label: 'Under Review',
    description: 'Your idea is currently being reviewed by the Hack With Vizag screening team.',
  },
  selected: {
    label: 'Selected',
    description: 'Congratulations! Your team has been shortlisted for the offline round.',
  },
  rejected: {
    label: 'Rejected',
    description: 'Your team was not shortlisted for this edition. Thank you for submitting.',
  },
};

export const getStatusConfig = (status) => statusConfig[status] || statusConfig.draft;
