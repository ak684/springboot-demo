import theme from "../theme";

export const API_TOKEN = 'token';
export const AUTH_HEADER = 'authorization';

export const HEADER_HEIGHT = 80;

export const IMPACT_FILTER = {
  NEGATIVE: 'negative',
  POSITIVE: 'positive',
  DRAFT: 'draft',
  NOT_DRAFT: 'not_draft',
};

export const IMPACT_SORT = {
  BY_SCORE: 'score',
  BY_MAGNITUDE: 'magnitude',
  BY_LIKELIHOOD: 'likelihood',
  CUSTOM: 'custom',
};

export const VENTURE_SORT = {
  BY_SCORE: 'score',
  BY_LAST_EDIT: 'last_edit',
  BY_PROGRESS: 'progress',
};

export const PORTFOLIO_SORT = {
  BY_LAST_ACCESSED: 'last_accessed',
  BY_NAME: 'name',
};

export const PUBLIC_SORT = {
  BY_EMPLOYEES: 'employees',
  BY_FOLLOWERS: 'followers',
  BY_CERTIFICATION: 'certification',
  BY_AGE_ASC: 'age_asc',
  BY_AGE_DESC: 'age_desc',
};

export const VENTURE_ACCESS = {
  EDIT: 'EDIT',
  VIEW: 'VIEW',
  KEY_DATA: 'KEY_DATA',
  PUBLIC_PROFILE_ONLY: 'PUBLIC_PROFILE_ONLY'
}

export const GLOBAL_COMMUNITY_INPUT = 'Global community / the planet';

export const yearOptions = [
  { value: 2023, label: '2023 or earlier', },
  { value: 2024, label: '2024', },
  { value: 2025, label: '2025', },
  { value: 2026, label: '2026', },
  { value: 2027, label: '2027', },
  { value: 2028, label: '2028', },
  { value: 2029, label: '2029', },
  { value: 2030, label: '2030 or later' },
];

export const socialMedia = {
  youtube: {
    label: 'YouTube',
    color: theme.palette.error.main,
  },
  facebook: {
    label: 'Facebook',
    color: theme.palette.success.main,
  },
  linkedin: {
    label: 'LinkedIn',
    color: theme.palette.primary.main,
  },
  instagram: {
    label: 'Instagram',
    color: theme.palette.warning.main,
  },
  twitter: {
    label: 'Twitter',
    color: theme.palette.secondary.main,
  },
}

export const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const IMPACT_CARD_VIEW = {
  DETAILED: "detailed",
  COMPACT: "compact"
}

export const SUBSCRIPTIONS = {
  IMPACT_LOGIC: "IMPACT_LOGIC",
  PRO: "PRO",
}
