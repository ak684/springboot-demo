import geoJson from '../views/pages/publicDatabase/data/custom.geo.json';

const GEO_PROPERTIES = ['name', 'name_long', 'admin', 'formal_en', 'name_sort',
  'name_ciawf', 'brk_name', 'abbrev', 'postal'];
const REGION_PROPERTIES = ['continent', 'region_un', 'region_wb', 'subregion'];
const GLOBAL_KEYS = new Set([
  'GLOBAL',
  'GLOBAL_COMMUNITY',
  'THE_PLANET',
  'GLOBAL_POPULATION',
  'WORLD',
  'WORLDWIDE',
]);
const GEOGRAPHY_ALIASES = {
  UK: 'GB',
  U_K: 'GB',
  USA: 'US',
  U_S: 'US',
  U_S_A: 'US',
  UNITED_STATES: 'US',
  EU: 'EUROPE',
};

const normalizeGeographyKey = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/&/g, ' AND ')
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const isIsoCountryCode = (value) => typeof value === 'string'
  && /^[A-Z]{2}$/.test(value);

const geoFeatures = geoJson.features
  .filter(feature => isIsoCountryCode(feature?.properties?.iso_a2));

const countryMetaByCode = {};
const countryCodeByKey = {};
const regionCodesByKey = {};

geoFeatures.forEach(feature => {
  const properties = feature.properties || {};
  const code = properties.iso_a2;
  const title = properties.name_long || properties.name || code;
  const meta = {
    code,
    name: normalizeGeographyKey(title),
    title,
  };

  countryMetaByCode[code] = meta;
  countryCodeByKey[normalizeGeographyKey(code)] = code;

  GEO_PROPERTIES.forEach(key => {
    const rawValue = properties[key];
    if (!rawValue) {
      return;
    }

    const normalized = normalizeGeographyKey(rawValue);
    if (normalized) {
      countryCodeByKey[normalized] = code;
    }
  });

  REGION_PROPERTIES.forEach(key => {
    const rawValue = properties[key];
    if (!rawValue) {
      return;
    }

    const normalized = normalizeGeographyKey(rawValue);
    if (!normalized) {
      return;
    }

    if (!regionCodesByKey[normalized]) {
      regionCodesByKey[normalized] = new Set();
    }
    regionCodesByKey[normalized].add(code);
  });
});

const getEntryValue = (entry) => {
  if (!entry) {
    return '';
  }

  if (typeof entry === 'string') {
    return entry;
  }

  return entry.name || entry.code || entry.title || '';
};

const buildGeographyEntry = (code, geographyDict = []) => {
  const matchedGeography = geographyDict.find(item => item.code === code);
  if (matchedGeography) {
    return matchedGeography;
  }

  const fallbackMeta = countryMetaByCode[code] || {};

  return {
    code,
    name: fallbackMeta.name || code,
    title: fallbackMeta.title || code,
  };
};

export const isGlobalGeographyValue = (value) => {
  const normalized = normalizeGeographyKey(getEntryValue(value));
  return GLOBAL_KEYS.has(normalized);
};

export const getCountryCodesFromGeographyValue = (value) => {
  if (!value || isGlobalGeographyValue(value)) {
    return [];
  }

  const normalized = normalizeGeographyKey(getEntryValue(value));
  const aliased = GEOGRAPHY_ALIASES[normalized] || normalized;

  if (countryMetaByCode[aliased]) {
    return [aliased];
  }

  if (countryCodeByKey[aliased]) {
    return [countryCodeByKey[aliased]];
  }

  if (regionCodesByKey[aliased]) {
    return Array.from(regionCodesByKey[aliased]);
  }

  return [];
};

export const getCountryCodesFromGeographyEntries = (entries = []) => {
  const codes = new Set();
  const safeEntries = Array.isArray(entries) ? entries : [];

  safeEntries.forEach(entry => {
    getCountryCodesFromGeographyValue(entry).forEach(code => {
      if (countryMetaByCode[code]) {
        codes.add(code);
      }
    });
  });

  return Array.from(codes);
};

export const normalizeGeographyEntries = (
  entries = [],
  geographyDict = []
) => {
  const normalized = new Map();
  const safeEntries = Array.isArray(entries) ? entries : [];

  safeEntries.forEach(entry => {
    if (isGlobalGeographyValue(entry)) {
      normalized.set('GLOBAL', {
        code: null,
        name: 'GLOBAL',
        title: 'Global',
      });
      return;
    }

    getCountryCodesFromGeographyValue(entry).forEach(code => {
      normalized.set(code, buildGeographyEntry(code, geographyDict));
    });
  });

  return Array.from(normalized.values());
};

export const parseGeographicScopeToEntries = (
  scopeStr,
  geographyDict = []
) => {
  if (!scopeStr || scopeStr === 'N/A') {
    return [];
  }

  if (Array.isArray(scopeStr)) {
    return normalizeGeographyEntries(scopeStr, geographyDict);
  }

  try {
    const parsed = JSON.parse(scopeStr);
    return Array.isArray(parsed)
      ? normalizeGeographyEntries(parsed, geographyDict)
      : [];
  } catch {
    return [];
  }
};

export const geographyHasCountryCode = (entries = [], code) =>
  (Array.isArray(entries) ? entries : []).some(isGlobalGeographyValue)
  || getCountryCodesFromGeographyEntries(entries).includes(code);
