import { isDefined } from "./lo";
import { IMPACT_SORT, PUBLIC_SORT } from "./constants";

const ventureFields = ['name', 'description', 'country', 'website', 'reportingPeriod', 'currency', 'industries', 'hashtags'];
const legalEntityFields = ['formationDate', 'profitOrientation', 'legalForm', 'address', 'city', 'zipCode', 'phone', 'employees', 'volunteers'];

const fieldFilled = (venture, field) => {
  if (Array.isArray(venture[field])) {
    return venture[field].length > 0 && (venture[field][0] instanceof Object || venture[field][0].length > 0);
  } else {
    return isDefined(venture[field]) && venture[field] !== "";
  }
};

export const getProfileCompletion = (venture) => {
  let fullProfileItems = ventureFields.length;
  let completedItems = ventureFields.reduce((acc, f) => acc + Number(fieldFilled(venture, f)), 0);

  if (venture.legalEntityFormed) {
    fullProfileItems += legalEntityFields.length;
    completedItems += legalEntityFields.reduce((acc, f) => acc + Number(fieldFilled(venture, f)), 0);
  }

  return Math.min(Math.round(completedItems / fullProfileItems * 100), 100)
};

export const getVentureAddress = (venture, defaultValue = 'Venture address goes here') => {
  if (!venture.address && !venture.city && !venture.region && !venture.zipCode && !venture.country) {
    return defaultValue;
  }

  return [venture.address, venture.city, venture.region, venture.zipCode, venture.country?.title]
    .filter(val => val)
    .join(", ");
};

export const sortedPublicVentures = (ventures, sort) => ventures.sort((v1, v2) => {
  if (sort === PUBLIC_SORT.BY_EMPLOYEES) {
    return (v2.employees || 0) - (v1.employees || 0);
  } else if (sort === PUBLIC_SORT.BY_FOLLOWERS) {
    return 0;
    // toDO: Implement
  } else if (sort === PUBLIC_SORT.BY_CERTIFICATION) {
    return (v2.certification || 0) - (v1.certification || 0);
  } else if (sort === PUBLIC_SORT.BY_AGE_ASC) {
    return getDateOrDefault(v1.formationDate, new Date()) - getDateOrDefault(v2.formationDate, new Date());
  } else if (sort === PUBLIC_SORT.BY_AGE_DESC) {
    return getDateOrDefault(v2.formationDate, new Date(0)) - getDateOrDefault(v1.formationDate, new Date(0));
  }

  return 0;
});

const getDateOrDefault = (date, defaultDate) => isDefined(date) ? new Date(date) : defaultDate;
