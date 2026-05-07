import React, { memo, useEffect, useMemo, useState } from 'react';
import { Badge, Box, IconButton, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ResearchDatabaseTabs from './ResearchDatabaseTabs';
import PublicDatabaseFilters from 'shared-components/views/pages/publicDatabase/containers/PublicDatabaseFilters';
import PublicDatabaseGoogleMap from 'shared-components/views/pages/publicDatabase/containers/PublicDatabaseGoogleMap';
import { scoredSdgImpacts } from 'shared-components/utils/scoring';
import { sortedPublicVentures } from 'shared-components/utils/venture';
import { HEADER_HEIGHT } from 'shared-components/utils/constants';
import {
  geographyHasCountryCode,
  parseGeographicScopeToEntries
} from 'shared-components/utils/geography';
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import { appSelectors } from 'store/ducks/app';

const SDG_ENUM_NAMES = [
  'POVERTY', 'HUNGER', 'HEALTH', 'EDUCATION', 'GENDER',
  'SANITATION', 'ENERGY', 'GROWTH', 'INNOVATION', 'INEQUALITY',
  'CITIES', 'SUSTAINABILITY', 'CLIMATE', 'OCEANS', 'BIODIVERSITY',
  'INSTITUTIONS', 'PARTNERSHIPS'
];

const parseSdgString = (sdgStr) => {
  if (!sdgStr || sdgStr === 'N/A') return [];
  const numbers = [];
  const matches = sdgStr.match(/\d+/g);
  if (matches) {
    matches.forEach(m => {
      const num = parseInt(m, 10);
      if (num >= 1 && num <= 17) numbers.push(num);
    });
  }
  return [...new Set(numbers)];
};

const parseTocData = (toc) => {
  if (Array.isArray(toc)) return toc;
  if (typeof toc === 'string') {
    try { const parsed = JSON.parse(toc); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
};

const parseImpactSummary = (summary) => {
  if (!summary) return null;
  if (typeof summary === 'string') {
    try {
      const parsed = JSON.parse(summary);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof summary === 'object' ? summary : null;
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTotalFollowers = (counts) => {
  if (!counts || typeof counts !== 'object') return 0;
  return Object.values(counts)
    .map(value => toNumber(value))
    .reduce((sum, value) => sum + value, 0);
};

const buildGoals = (sdgs) => {
  if (!Array.isArray(sdgs)) return [];
  return sdgs
    .filter(s => toNumber(s?.number) >= 1 && toNumber(s?.number) <= 17)
    .map(s => ({
      goal: { name: SDG_ENUM_NAMES[toNumber(s.number) - 1] },
      rate: toNumber(s.percent),
    }));
};

const buildIndicators = (indicatorCount, createdAt, impactId) =>
  Array.from({ length: Math.max(0, indicatorCount) }, (_, idx) => ({
    id: `${impactId}-indicator-${idx}`,
    createdAt,
  }));

const buildSummaryImpacts = (summary, company, geographyDict, fallbackGeography) => {
  const impacts = Array.isArray(summary?.impacts) ? summary.impacts : [];

  return impacts.map((impact, idx) => {
    const impactId = impact.id || idx;
    const geography = impact.geography && impact.geography.length > 0
      ? parseGeographicScopeToEntries(impact.geography, geographyDict)
      : fallbackGeography;
    const indicatorCount = toNumber(impact.indicator_count);
    const score = toNumber(
      impact.score,
      toNumber(company.overall_impact_potential_score, 0)
    );

    return {
      id: impactId,
      draft: false,
      positive: Boolean(impact.positive),
      publicEnabled: true,
      image: null,
      scoring: [{
        score,
        magnitude: toNumber(impact.magnitude),
        likelihood: toNumber(impact.likelihood),
        createdAt: company.created_at || null,
      }],
      indicators: buildIndicators(
        indicatorCount,
        company.created_at || null,
        impactId
      ),
      geography,
      goals: buildGoals(impact.sdgs),
    };
  });
};

const buildTocImpacts = (tocData, company, fallbackGeography) =>
  tocData.map((pathway, idx) => {
    const positive = !(pathway.type || '').toLowerCase().includes('negative');
    const sdgs = Array.isArray(pathway.sdgs) ? pathway.sdgs : [];
    const indicators = Array.isArray(pathway.indicators) ? pathway.indicators : [];
    const baseMagnitude = positive
      ? toNumber(company.impact_magnitude_5_year)
      : toNumber(company.impact_magnitude_5_year_negative);
    const countForType = Math.max(
      1,
      tocData.filter(item => {
        const itemPositive = !(item.type || '').toLowerCase().includes('negative');
        return itemPositive === positive;
      }).length
    );
    const likelihood = toNumber(company.impact_likelihood, positive ? 100 : 0);
    const magnitude = baseMagnitude > 0 ? baseMagnitude / countForType : 0;
    const score = magnitude > 0
      ? magnitude * likelihood / 100
      : (positive ? Math.max(1, toNumber(company.overall_impact_potential_score, 0)) : 0);

    return {
      id: idx,
      draft: false,
      positive,
      publicEnabled: true,
      image: null,
      scoring: [{
        score,
        magnitude,
        likelihood,
        createdAt: company.created_at || null,
      }],
      indicators: indicators.map((indicator, indicatorIdx) => ({
        id: `${idx}-indicator-${indicator.id || indicatorIdx}`,
        name: indicator.name || '',
        createdAt: company.created_at || null,
      })),
      geography: fallbackGeography,
      goals: sdgs
        .filter(s => toNumber(s.number) >= 1 && toNumber(s.number) <= 17)
        .map(s => ({
          goal: { name: SDG_ENUM_NAMES[toNumber(s.number) - 1] },
          rate: toNumber(s.percent),
        })),
    };
  });

const companyToVenture = (company, geographyDict) => {
  const sdgNumbers = parseSdgString(company.sdgs);
  const tocData = parseTocData(company.theory_of_change);
  const impactSummary = parseImpactSummary(company.public_impact_summary);
  const geoScope = parseGeographicScopeToEntries(
    company.geographic_scope_estimated,
    geographyDict
  );

  let impacts = [];

  if (impactSummary?.impacts?.length > 0) {
    impacts = buildSummaryImpacts(
      impactSummary,
      company,
      geographyDict,
      geoScope
    );
  } else if (tocData.length > 0) {
    impacts = buildTocImpacts(tocData, company, geoScope);
  } else if (sdgNumbers.length > 0) {
    const equalRate = Math.round(100 / sdgNumbers.length);
    impacts = [{
      id: 0,
      draft: false,
      positive: true,
      publicEnabled: true,
      image: null,
      scoring: [{
        score: toNumber(company.overall_impact_potential_score, 1),
        magnitude: toNumber(company.impact_magnitude_5_year),
        likelihood: toNumber(company.impact_likelihood, 100),
        createdAt: company.created_at || null,
      }],
      indicators: [],
      geography: geoScope,
      goals: sdgNumbers.map(n => ({
        goal: { name: SDG_ENUM_NAMES[n - 1] },
        rate: equalRate,
      })),
    }];
  }

  const rawEmp = company.number_of_employees;
  const employeesRaw = rawEmp && rawEmp !== 'N/A' ? rawEmp : null;
  const employees = rawEmp && rawEmp !== 'N/A'
    ? parseInt(String(rawEmp).replace(/,/g, ''), 10) || 0 : 0;
  const followers = getTotalFollowers(company.social_media_follower_counts);

  return {
    id: company.id,
    name: company.company_name || '',
    logo: (company.company_logo && company.company_logo !== 'N/A') ? company.company_logo : null,
    description: (company.company_description && company.company_description !== 'N/A')
      ? company.company_description : '',
    employees,
    employeesRaw,
    technologyCluster: company.technology_cluster || null,
    certification: company.certification_name ? 1 : 0,
    profitOrientation: '',
    formationDate: (company.legal_entity_formation_date && company.legal_entity_formation_date !== 'N/A')
      ? company.legal_entity_formation_date : null,
    lat: company.latitude || null,
    lng: company.longitude || null,
    city: '',
    country: { title: company.headquarter_address || '' },
    industries: company.industry_sectors && company.industry_sectors !== 'N/A'
      ? company.industry_sectors.split(',').map(s => ({ title: s.trim() })) : [],
    currency: { isoCode: company.funding_currency || 'EUR' },
    aux: { traction: 0, followers, followerChange: 0 },
    pitchSettings: { description: null },
    impacts,
    funding: company.total_funding_amount && company.total_funding_amount !== 'N/A'
      ? [{ amount: Number(company.total_funding_amount), createdAt: company.created_at }] : [],
    ventureId: company.venture_id || null,
    _companyData: company,
  };
};

const ResearchDatabase = ({ gridData }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ sdg: [], profitOrientation: [], sector: [], countries: [] });
  const [mapVentures, setMapVentures] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredVenture, setHoveredVenture] = useState(null);
  const [activeTab, setActiveTab] = useState('organization');
  const goals = useSelector(dictionarySelectors.getGoals());
  const geographyDict = useSelector(dictionarySelectors.getGeography());
  const publicSort = useSelector(appSelectors.getPublicSort());

  useEffect(() => {
    if (!goals || goals.length === 0) {
      dispatch(dictionaryThunks.fetchGoals());
    }
    if (!geographyDict || geographyDict.length === 0) {
      dispatch(dictionaryThunks.fetchGeography());
    }
  }, []);

  const ventures = useMemo(() => {
    if (!gridData || gridData.length === 0) return [];
    return gridData.map(c => companyToVenture(c, geographyDict || []));
  }, [gridData, geographyDict]);

  const filteredVentures = useMemo(() => ventures
    .filter(v => filters.sdg.length === 0
      || scoredSdgImpacts(v).some(i => i.goals.find(g => filters.sdg.includes(g.goal.name))))
    .filter(v => filters.profitOrientation.length === 0
      || filters.profitOrientation.includes(v.profitOrientation))
    .filter(v => filters.countries.length === 0
      || filters.countries.some(c => v.impacts.some(i => geographyHasCountryCode(i.geography, c)))),
  [ventures, filters, publicSort]);

  const sortedVentures = sortedPublicVentures(filteredVentures, publicSort);
  const numberOfFilters = filters.sdg.length + filters.profitOrientation.length + filters.sector.length;
  const isEarthView = activeTab === 'earth';

  return (
    <Box display='flex' gap={2}>
      {!isEarthView && (
        <Box
          sx={{
            width: drawerOpen ? 300 : 0,
            minWidth: drawerOpen ? 300 : 0,
            overflow: 'hidden',
            transition: theme.transitions.create(
              ['width', 'min-width'],
              { duration: theme.transitions.duration.enteringScreen }
            ),
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 300,
              maxHeight: `calc(100vh - ${HEADER_HEIGHT}px - 32px)`,
              overflowY: 'auto',
            }}
          >
            <PublicDatabaseFilters
              filters={filters}
              setFilters={setFilters}
              ventures={ventures}
            />
          </Box>
        </Box>
      )}
      <Box
        flexGrow={1}
        display={{ xs: 'flex', lg: 'block' }}
        flexDirection='column'
        position='relative'
        minWidth={0}
      >
        {!isEarthView && (
          <Box position='absolute' zIndex={1}>
            <Badge
              badgeContent={numberOfFilters}
              color='success'
              overlap='circular'
            >
              <IconButton
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
                onClick={() => setDrawerOpen(!drawerOpen)}
              >
                <FilterAltIcon sx={{ color: 'white' }} />
              </IconButton>
            </Badge>
          </Box>
        )}
        <ResearchDatabaseTabs
          ventures={mapVentures}
          allVentures={sortedVentures}
          totalVentures={ventures.length}
          setHoveredVenture={setHoveredVenture}
          tab={activeTab}
          onTabChange={setActiveTab}
        />
        {!isEarthView && (
          <PublicDatabaseGoogleMap
            ventures={sortedVentures}
            setMapVentures={setMapVentures}
            hoveredVenture={hoveredVenture}
            setFilters={setFilters}
            display={{ xs: 'flex', lg: 'block' }}
            order={1}
            position={{ xs: 'relative', lg: 'fixed' }}
            height={{ xs: 300, sm: 360, lg: 'unset' }}
            top={{ xs: 64, lg: HEADER_HEIGHT + 96 }}
            bottom={{ xs: 'unset', lg: 0 }}
            right={0}
            left={{ xs: 0, lg: 'calc(50% + 24px)', xl: 1012 }}
            mx={{ xs: -4, lg: 0 }}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(ResearchDatabase);
