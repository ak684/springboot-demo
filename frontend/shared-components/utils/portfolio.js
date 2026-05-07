import { isDefined } from "./lo";

const portfolioFields = ['name', 'description', 'mission', 'country', 'address', 'website', 'reportingPeriod', 'currency', 'hashtags', 'formationDate', 'profitOrientation', 'legalForm', 'address', 'phone', 'employees', 'volunteers', 'team', 'logo'];

const fieldFilled = (portfolio, field) => {
  if (Array.isArray(portfolio[field])) {
    return portfolio[field].length > 0 && (portfolio[field][0] instanceof Object || portfolio[field][0].length > 0);
  } else {
    return isDefined(portfolio[field]) && portfolio[field] !== "";
  }
};

export const getProfileCompletion = (portfolio) => {
  let fullProfileItems = portfolioFields.length;
  let completedItems = portfolioFields.reduce((acc, f) => acc + Number(fieldFilled(portfolio, f)), 0);

  return Math.min(Math.round(completedItems / fullProfileItems * 100), 100)
};
