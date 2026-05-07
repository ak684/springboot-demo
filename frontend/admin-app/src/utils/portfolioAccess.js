const STORAGE_KEY = 'portfolioAccessTimes';

export const recordPortfolioAccess = (portfolioId) => {
  const accessTimes = getPortfolioAccessTimes();
  accessTimes[portfolioId] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accessTimes));
};

export const getPortfolioAccessTimes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const getPortfolioAccessTime = (portfolioId) => {
  const accessTimes = getPortfolioAccessTimes();
  return accessTimes[portfolioId] || 0;
};
