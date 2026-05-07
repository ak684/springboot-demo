import React, { memo, useMemo, useState, useEffect } from 'react';
import { Box, Typography, useTheme, Card } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import { GoogleMap, LoadScriptNext, Polygon } from '@react-google-maps/api';
import geoJson from 'shared-components/views/pages/publicDatabase/data/custom.geo.json';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_VERSION,
} from 'shared-components/utils/googleMaps';
import { mapOptions, mapOverlayStyles } from 'shared-components/utils/maps';
import { getCountryCodesFromGeographyValue } from 'shared-components/utils/geography';
import BaseSection from './BaseSection';

const POSITIVE_COLOR_LIGHT = '#c8e6c9';
const POSITIVE_COLOR_DARK = '#2e7d32';
const NEGATIVE_COLOR_LIGHT = '#ffcdd2';
const NEGATIVE_COLOR_DARK = '#c62828';

const buildGeographyData = (theoryOfChange = [], impactScoring = []) => {
  const scoringMap = new Map();
  impactScoring.forEach((item, index) => {
    const id = String(item.id || index + 1);
    scoringMap.set(id, item);
  });

  const positiveByCountry = {};
  const negativeByCountry = {};
  const globalCommunityImpacts = { positive: [], negative: [] };

  theoryOfChange.forEach((impact, index) => {
    const id = String(impact.id || index + 1);
    const scoring = scoringMap.get(id) || impactScoring[index] || {};
    const isPositive = !impact.type?.toLowerCase().includes('negative');

    const degreeOfChange = Number(scoring.degreeOfChange) || 0;
    const scalability = Number(scoring.scalability) || 0;
    const duration = Number(scoring.duration) || 0;
    const contribution = Number(scoring.contribution) || 0;
    const stakeholderSituation = Number(scoring.stakeholderSituation) || 0;

    const problemImportanceInputs = [
      Number(scoring.urgency),
      Number(scoring.irreversibility),
      Number(scoring.fairness),
      Number(scoring.interconnectedness),
      Number(scoring.problemImportance),
    ].filter(Number.isFinite);

    const problemImportance = problemImportanceInputs.length > 0
      ? problemImportanceInputs.reduce((a, b) => a + b, 0) / problemImportanceInputs.length
      : 0;

    const importance = (problemImportance * 2 / 3 + stakeholderSituation * 1 / 3) * 20;
    const howMuchSolved = ((1 + degreeOfChange * 9 / 100) * 6 / 7 + duration * 2 / 7) / 10;
    const contributionFactor = (1 + contribution * 9 / 100) / 10;
    const magnitude = Math.max(0, importance * howMuchSolved * (scalability / 10) * contributionFactor);

    const stakeholders = impact.stakeholders || '';
    const isGlobalCommunity = stakeholders.toLowerCase().includes('global community') ||
      stakeholders.toLowerCase().includes('the planet') ||
      stakeholders.toLowerCase().includes('global population');

    if (isGlobalCommunity) {
      const impactInfo = {
        title: impact.title,
        stakeholders,
        change: impact.change,
        magnitude
      };
      if (isPositive) {
        globalCommunityImpacts.positive.push(impactInfo);
      } else {
        globalCommunityImpacts.negative.push(impactInfo);
      }
      return;
    }

    const geography = scoring.geography || impact.geography || [];
    const targetMap = isPositive ? positiveByCountry : negativeByCountry;

    geography.forEach(geo => {
      const codes = getCountryCodesFromGeographyValue(geo);
      codes.forEach(code => {
        if (!targetMap[code]) {
          targetMap[code] = {
            value: 0,
            impacts: []
          };
        }
        targetMap[code].value += magnitude / codes.length;
        targetMap[code].impacts.push({
          title: impact.title,
          stakeholders,
          change: impact.change,
          magnitude
        });
      });
    });
  });

  return {
    positiveByCountry,
    negativeByCountry,
    globalCommunityImpacts
  };
};

const interpolateColor = (color1, color2, fraction) => {
  const hexToRgb = (hex) => {
    const aRgbHex = hex.replace('#', '').match(/.{1,2}/g);
    return aRgbHex.map(val => parseInt(val, 16));
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const newRgb = [
    Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * fraction),
    Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * fraction),
    Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * fraction)
  ];

  return '#' + newRgb.map(val => ('0' + val.toString(16)).slice(-2)).join('');
};

const getPolygonOptions = (progress, isPositive) => {
  const colorStart = isPositive ? POSITIVE_COLOR_LIGHT : NEGATIVE_COLOR_LIGHT;
  const colorEnd = isPositive ? POSITIVE_COLOR_DARK : NEGATIVE_COLOR_DARK;
  return {
    fillColor: interpolateColor(colorStart, colorEnd, progress),
    fillOpacity: 0.8,
    strokeColor: '#999',
    strokeOpacity: 0.5,
    strokeWeight: 0.5
  };
};

const GeographyMap = ({ countryData, isPositive, title, center }) => {
  const theme = useTheme();
  const [mapRef, setMapRef] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', position: null });

  const hasData = Object.keys(countryData).length > 0;
  const maxValue = Math.max(...Object.values(countryData).map(d => d.value), 1);
  const minValue = Math.min(...Object.values(countryData).filter(d => d.value > 0).map(d => d.value), 0);

  const getProgress = (val) => (val - minValue) / (maxValue - minValue) || 0;

  const handleMouseOver = (e, code) => {
    const data = countryData[code];
    const feature = geoJson.features.find(f => f.properties.iso_a2 === code);
    setTooltip({
      show: true,
      position: { left: e.domEvent.clientX + 10, top: e.domEvent.clientY - 60 },
      code,
      name: feature?.properties?.name || code,
      value: data?.value || 0,
      impacts: data?.impacts || []
    });
  };

  const handleMouseOut = () => {
    setTooltip({ ...tooltip, show: false });
  };

  const renderPolygons = () => {
    const highlightedCountries = Object.keys(countryData).filter(code => countryData[code].value > 0);

    return highlightedCountries.flatMap((code) => {
      const feature = geoJson.features.find(c => c.properties.iso_a2 === code);
      if (!feature) return [];

      const progress = getProgress(countryData[code].value);

      if (feature.geometry.type === 'Polygon') {
        return (
          <Polygon
            key={code}
            paths={feature.geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }))}
            options={getPolygonOptions(progress, isPositive)}
            onMouseOver={(e) => handleMouseOver(e, code)}
            onMouseOut={handleMouseOut}
          />
        );
      } else if (feature.geometry.type === 'MultiPolygon') {
        return feature.geometry.coordinates.map((polygon, polyIndex) => (
          <Polygon
            key={`${code}_${polyIndex}`}
            paths={polygon[0].map(coord => ({ lat: coord[1], lng: coord[0] }))}
            options={getPolygonOptions(progress, isPositive)}
            onMouseOver={(e) => handleMouseOver(e, code)}
            onMouseOut={handleMouseOut}
          />
        ));
      }
      return [];
    });
  };

  useEffect(() => {
    if (mapRef && hasData) {
      const bounds = new window.google.maps.LatLngBounds();
      Object.keys(countryData).forEach(code => {
        const feature = geoJson.features.find(c => c.properties.iso_a2 === code);
        if (feature) {
          bounds.extend(new window.google.maps.LatLng(
            feature.properties.label_y,
            feature.properties.label_x
          ));
        }
      });
      mapRef.fitBounds(bounds);
      if (mapRef.getZoom() > 4) {
        mapRef.setZoom(4);
      }
    }
  }, [mapRef, countryData, hasData]);

  if (!hasData) {
    return (
      <Box flex={1} textAlign="center" py={4} minWidth={280}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box
          sx={{
            height: 200,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No geographic data
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} minWidth={280}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom align="center">
        {title}
      </Typography>
      <Box sx={{ height: 220, borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
        <LoadScriptNext
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}
          libraries={GOOGLE_MAPS_LIBRARIES}
          version={GOOGLE_MAPS_VERSION}
        >
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            zoom={1}
            center={center || { lat: 20, lng: 0 }}
            options={{
              ...mapOptions,
              styles: mapOverlayStyles,
              gestureHandling: 'cooperative'
            }}
            onLoad={setMapRef}
          >
            {renderPolygons()}
          </GoogleMap>
        </LoadScriptNext>
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: 'rgba(255,255,255,0.9)',
            px: 1,
            py: 0.5,
            borderRadius: 0.5
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 10 }}>Low</Typography>
          <Box
            sx={{
              width: 60,
              height: 8,
              background: `linear-gradient(to right, ${isPositive ? POSITIVE_COLOR_LIGHT : NEGATIVE_COLOR_LIGHT}, ${isPositive ? POSITIVE_COLOR_DARK : NEGATIVE_COLOR_DARK})`
            }}
          />
          <Typography variant="caption" sx={{ fontSize: 10 }}>High</Typography>
        </Box>
      </Box>
      {tooltip.show && (
        <Card
          sx={{
            position: 'fixed',
            zIndex: 9999,
            p: 1.5,
            minWidth: 200,
            maxWidth: 320,
            ...tooltip.position
          }}
        >
          <Typography variant="subtitle1">{tooltip.name}</Typography>
          <Typography variant="body1" color="text.secondary">
            Score: {tooltip.value.toFixed(1)}
          </Typography>
          {tooltip.impacts?.length > 0 && (
            <Box mt={1}>
              {tooltip.impacts.map((imp, idx) => (
                <Typography key={idx} variant="body2" display="block">
                  • {imp.title}
                </Typography>
              ))}
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

const generateMapDescription = (positiveByCountry, negativeByCountry, globalCommunityImpacts, theoryOfChange) => {
  const descriptions = [];

  const getTopRegions = (data, limit = 3) => {
    return Object.entries(data)
      .filter(([, d]) => d.value > 0)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, limit)
      .map(([code]) => {
        const feature = geoJson.features.find(f => f.properties.iso_a2 === code);
        return feature?.properties?.name || code;
      });
  };

  const getUniqueStakeholders = (data) => {
    const stakeholders = new Set();
    Object.values(data).forEach(d => {
      d.impacts?.forEach(i => {
        if (i.stakeholders) {
          const first = i.stakeholders.split(',')[0].trim();
          if (first.length < 50) stakeholders.add(first);
        }
      });
    });
    return Array.from(stakeholders).slice(0, 2);
  };

  const getUniqueChanges = (data) => {
    const changes = new Set();
    Object.values(data).forEach(d => {
      d.impacts?.forEach(i => {
        if (i.change && i.change.length < 60) {
          changes.add(i.change);
        }
      });
    });
    return Array.from(changes).slice(0, 1);
  };

  const topPositive = getTopRegions(positiveByCountry);
  const topNegative = getTopRegions(negativeByCountry);

  if (topPositive.length > 0) {
    const stakeholders = getUniqueStakeholders(positiveByCountry);
    const changes = getUniqueChanges(positiveByCountry);
    const regionText = topPositive.length > 1
      ? `${topPositive.slice(0, -1).join(', ')} and ${topPositive[topPositive.length - 1]}`
      : topPositive[0];

    descriptions.push({
      type: 'positive',
      text: `Positive impact concentrated in ${regionText}${stakeholders.length > 0 ? ` benefiting ${stakeholders.join(' and ')}` : ''}${changes.length > 0 ? ` through ${changes[0].toLowerCase()}` : ''}.`
    });
  }

  if (topNegative.length > 0) {
    const stakeholders = getUniqueStakeholders(negativeByCountry);
    const regionText = topNegative.length > 1
      ? `${topNegative.slice(0, -1).join(', ')} and ${topNegative[topNegative.length - 1]}`
      : topNegative[0];

    descriptions.push({
      type: 'negative',
      text: `Negative impact occurs in ${regionText}${stakeholders.length > 0 ? ` affecting ${stakeholders.join(' and ')}` : ''}.`
    });
  }

  if (globalCommunityImpacts.positive.length > 0) {
    const impact = globalCommunityImpacts.positive[0];
    descriptions.push({
      type: 'global',
      text: `Global community benefits from ${impact.title?.toLowerCase() || 'environmental improvements'}.`
    });
  }

  if (globalCommunityImpacts.negative.length > 0 && descriptions.length < 3) {
    const impact = globalCommunityImpacts.negative[0];
    descriptions.push({
      type: 'global-negative',
      text: `Global community affected by ${impact.title?.toLowerCase() || 'environmental challenges'}.`
    });
  }

  return descriptions.slice(0, 3);
};

const CompanyStakeholderGeographySection = ({ data }) => {
  const { positiveByCountry, negativeByCountry, globalCommunityImpacts } = useMemo(
    () => buildGeographyData(data?.theory_of_change || [], data?.impact_scoring || []),
    [data?.theory_of_change, data?.impact_scoring]
  );

  const hasPositiveData = Object.keys(positiveByCountry).length > 0;
  const hasNegativeData = Object.keys(negativeByCountry).length > 0;
  const hasGlobalData = globalCommunityImpacts.positive.length > 0 ||
    globalCommunityImpacts.negative.length > 0;

  // Use AI-generated summary if available, otherwise fall back to template-based
  const aiSummary = data?.stakeholder_geography_summary;
  const descriptions = useMemo(
    () => generateMapDescription(
      positiveByCountry,
      negativeByCountry,
      globalCommunityImpacts,
      data?.theory_of_change || []
    ),
    [positiveByCountry, negativeByCountry, globalCommunityImpacts, data?.theory_of_change]
  );

  if (!hasPositiveData && !hasNegativeData && !hasGlobalData) {
    return null;
  }

  return (
    <BaseSection
      title="Stakeholder impact geography"
      subtitle="Where stakeholders experience positive and negative outcomes"
      icon={<PublicIcon />}
    >
      <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
        <GeographyMap
          countryData={positiveByCountry}
          isPositive={true}
          title="Positive Impact"
        />
        <GeographyMap
          countryData={negativeByCountry}
          isPositive={false}
          title="Negative Impact"
        />
      </Box>

      {(aiSummary || descriptions.length > 0) && (
        <Box mt={3} px={1}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Impact Summary
          </Typography>
          {aiSummary ? (
            <Typography variant="body2" color="text.secondary">
              {aiSummary}
            </Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {descriptions.map((desc, idx) => (
                <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {desc.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </BaseSection>
  );
};

export default memo(CompanyStakeholderGeographySection);
