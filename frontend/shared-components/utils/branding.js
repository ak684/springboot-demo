const ensureBrandingLoaded = () => {
  const branding = window.__BRANDING__;
  if (!branding || typeof branding !== 'object') {
    throw new Error('Branding configuration missing. Ensure branding.js is loaded.');
  }
  return branding;
};

export const getBranding = () => ensureBrandingLoaded();

export const getAppBaseUrl = () => {
  const { appBaseUrl } = ensureBrandingLoaded();
  if (typeof appBaseUrl !== 'string' || appBaseUrl.length === 0) {
    throw new Error('Branding appBaseUrl is not defined.');
  }
  return appBaseUrl.endsWith('/') ? appBaseUrl.slice(0, -1) : appBaseUrl;
};

export const buildAppUrl = (path = '') => {
  const base = getAppBaseUrl();
  if (!path) {
    return base;
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getBrandingField = (field) => {
  const branding = ensureBrandingLoaded();
  return branding[field];
};

export const getAuthBackgroundColor = () => {
  const branding = ensureBrandingLoaded();
  const whiteLabel = branding.whiteLabel || {};
  return whiteLabel.authBackgroundColor || '#203E5C';
};

export const getAuthBackground = () => {
  const branding = ensureBrandingLoaded();
  const whiteLabel = branding.whiteLabel || {};
  const start = whiteLabel.authBackgroundColor || '#203E5C';
  const end = whiteLabel.authBackgroundGradientEnd;
  if (!end) {
    return start;
  }
  return `linear-gradient(100deg, ${start} 0%, ${start} 50%, ${end} 100%)`;
};

export const isWhiteLabelEnabled = () => {
  const branding = ensureBrandingLoaded();
  return branding.whiteLabel?.enabled === true;
};
