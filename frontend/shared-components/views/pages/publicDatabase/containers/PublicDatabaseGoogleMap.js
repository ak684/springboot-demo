import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box, Card, Divider, MenuItem, styled, Tooltip, Typography, useTheme } from "@mui/material";
import { GoogleMap, LoadScriptNext, Polygon } from "@react-google-maps/api";
import geoJson from '../data/custom.geo.json';
import { MAP_VIEW, mapOptions, mapOverlayStyles, zoomAndCenterMap } from "shared-components/utils/maps";
import TextInput from "../../../form/TextInput";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import PublicDatabaseMapTooltipSdgItem from "../components/PublicDatabaseMapTooltipSdgItem";
import { arraySum } from "shared-components/utils/helpers";
import { useNavigate } from "react-router-dom";
import { getVentureTotalScore } from "shared-components/utils/scoring";
import { distinctBy, sortBy } from "shared-components/utils/lo";
import theme from "../../../../theme";
import GoogleMapMarker from "../../../components/GoogleMapMarker";
import { getBranding } from 'shared-components/utils/branding';
import {
  getCountryCodesFromGeographyEntries,
  isGlobalGeographyValue,
} from 'shared-components/utils/geography';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_VERSION,
} from 'shared-components/utils/googleMaps';

const MAP_COUNTRY_CODES = geoJson.features
  .map(feature => feature?.properties?.iso_a2)
  .filter(code => typeof code === 'string' && code.length === 2);
const NUMBER_OF_COUNTRIES = MAP_COUNTRY_CODES.length;

const StyledTooltipIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: theme.spacing(5),
  height: theme.spacing(5),
  marginBottom: theme.spacing(1.5),
  marginLeft: 'auto',
  marginRight: 'auto',
  borderRadius: theme.spacing(0.5),
  background: theme.palette.secondary.subtle,
}));

const customClusterIcon = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" stroke="white" stroke-width="4" fill="${theme.palette.primary.main}" />
    <text x="50%" y="50%" dy=".3em" text-anchor="middle" fill="white" font-size="12" font-weight="700"></text>
  </svg>`
);

// toDO: Delete if clusters are not used
// const clusterStyles = [{
//   url: `data:image/svg+xml;charset=UTF-8,${customClusterIcon}`,
//   height: 44,
//   width: 44,
//   textColor: '#fff',
//   textSize: 12,
//   fontWeight: '700',
// }];

const interpolateColor = (color1, color2, fraction) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const aRgbHex = hex.replace("#", "").match(/.{1,2}/g);
    return aRgbHex.map(function (val) {
      return parseInt(val, 16);
    });
  }

  // Interpolate between the two colors
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const newRgb = [
    Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * fraction),
    Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * fraction),
    Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * fraction)
  ];

  // Convert RGB back to hex
  return "#" + newRgb.map((val) => ('0' + val.toString(16)).slice(-2)).join('');
}

const getPolygonOptions = (progress, view) => {
  const colorStart = view.includes('negative') ? theme.palette.error.light : theme.palette.success.light;
  const colorEnd = view.includes('negative') ? theme.palette.error.dark : theme.palette.success.dark;
  return {
    fillColor: interpolateColor(colorStart, colorEnd, progress),
    fillOpacity: 1,
    strokeOpacity: 0,
  };
};

const getMinValue = (stats, view) => Math.min(
  ...Object.values(stats).map(stat => stat[view]).filter(val => val > 0)
);

const getMaxValue = (stats, view) => Math.max(...Object.values(stats).map(stat => stat[view]));

const getProgress = (val, min, max) => (val - min) / (max - min) || 0;

const getHighlightedCountries = (countries, countryStats, view) => Object.keys(countryStats)
  .filter(code => view.includes('negative')
    ? countryStats[code].negativeScore > 0
    : countryStats[code].score > 0
  );

const renderPolygons = (countries, countryStats, view, handleMouseOver, handleMouseOut, handleClick) => {
  const highlightedCountries = getHighlightedCountries(countries, countryStats, view);
  const min = getMinValue(countryStats, view);
  const max = getMaxValue(countryStats, view);

  return highlightedCountries.map((code, index) => {
    const feature = countries.find(c => c.properties.iso_a2 === code);
    const countryData = countryStats[code];

    if (feature.geometry.type === 'Polygon') {
      return (
        <Polygon
          key={index}
          paths={feature.geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }))}
          options={getPolygonOptions(getProgress(countryData[view], min, max), view)}
          onMouseOver={(e) => handleMouseOver(e, feature.properties.iso_a2)}
          onMouseOut={handleMouseOut}
          onClick={(e) => handleClick(e, feature.properties.iso_a2)}
        />
      );
    } else if (feature.geometry.type === 'MultiPolygon') {
      return feature.geometry.coordinates.map((polygon, polyIndex) => (
        <Polygon
          key={`${index}_${polyIndex}`}
          paths={polygon[0].map(coord => ({ lat: coord[1], lng: coord[0] }))}
          options={getPolygonOptions(getProgress(countryData[view], min, max), view)}
          onMouseOver={(e) => handleMouseOver(e, feature.properties.iso_a2)}
          onMouseOut={handleMouseOut}
          onClick={(e) => handleClick(e, feature.properties.iso_a2)}
        />
      ));
    }
    return null;
  });
};

const updateVisibleVentures = (mapRef, markers, setMapVentures) => {
  const mapBounds = mapRef.getBounds();

  if (mapBounds) {
    const visible = markers.filter(m => {
      const { lat, lng } = m.position;
      return mapBounds.contains(new window.google.maps.LatLng(lat, lng));
    });
    setMapVentures && setMapVentures(visible.map(m => m.venture));
  }
}

const PublicDatabaseGoogleMap = ({ ventures, setMapVentures, hoveredVenture, setFilters, ...rest }) => {
  const companyName = useMemo(() => getBranding().companyName, []);
  const [center, setCenter] = useState({ lat: 40, lng: 0 });
  const [countryTooltip, setCountryTooltip] = useState({ show: false, content: '', position: null });
  const [ventureTooltip, setVentureTooltip] = useState({ show: false, venture: null, position: null });
  const [view, setView] = useState(MAP_VIEW.VENTURES);
  const [mapRef, setMapRef] = useState(null);
  const goals = useSelector(dictionarySelectors.getGoals());
  const theme = useTheme();
  const navigate = useNavigate();

  // toDO: The code to prepare country stats is not optimized. Check it's performance with live data, optimize when needed
  const countryStats = MAP_COUNTRY_CODES.reduce((acc, val) => {
    acc[val] = {
      score: 0,
      negativeScore: 0,
      ventures: 0,
      negativeVentures: 0,
      magnitude: 0,
      negativeMagnitude: 0,
      likelihood: 0,
      negativeLikelihood: 0,
      impacts: 0,
      indicators: 0,
      sdgs: goals.reduce((acc, goal) => {
        acc[goal.name] = {
          name: goal.name,
          value: 0,
        };
        return acc;
      }, {}),
      negativeSdgs: goals.reduce((acc, goal) => {
        acc[goal.name] = {
          name: goal.name,
          value: 0,
        };
        return acc;
      }, {}),
    };
    return acc;
  }, {});
  const countryCodes = Object.keys(countryStats);

  ventures.forEach(venture => {
    const impacts = venture.impacts
      .filter(i => !i.draft)
      .filter(i => i.scoring.at(-1)?.score)
      .map(impact => {
        const geographyEntries = Array.isArray(impact.geography)
          ? impact.geography : [];

        return {
          impact,
          countryCodes: getCountryCodesFromGeographyEntries(geographyEntries)
            .filter(code => countryStats[code]),
          hasGlobal: geographyEntries.some(isGlobalGeographyValue),
        };
      })
      .filter(({ countryCodes, hasGlobal }) => countryCodes.length > 0 || hasGlobal);

    const positiveCountries = new Set();
    const negativeCountries = new Set();
    let hasPositiveGlobal = false;
    let hasNegativeGlobal = false;

    impacts.forEach(({ impact, countryCodes: normalizedCountryCodes, hasGlobal }) => {
      const score = impact.scoring.at(-1).score;
      const magnitude = impact.scoring.at(-1).magnitude;
      const likelihood = impact.scoring.at(-1).likelihood;
      const countryCount = normalizedCountryCodes.length || 1;

      if (impact.positive) {
        normalizedCountryCodes.forEach(code => {
          positiveCountries.add(code);
          countryStats[code].score += score / countryCount;
          countryStats[code].magnitude += magnitude / countryCount;
          countryStats[code].likelihood += likelihood;
          countryStats[code].impacts += 1;
          countryStats[code].indicators += impact.indicators.length;
          impact.goals.forEach(g => {
            countryStats[code].sdgs[g.goal.name].value += g.rate * score / 100 / countryCount;
          });
        });
        if (hasGlobal) {
          hasPositiveGlobal = true;
        }
      } else {
        normalizedCountryCodes.forEach(code => {
          negativeCountries.add(code);
          countryStats[code].negativeScore += score / countryCount;
          countryStats[code].negativeMagnitude += magnitude / countryCount;
          countryStats[code].negativeLikelihood += likelihood;
          impact.goals.forEach(g => {
            countryStats[code].negativeSdgs[g.goal.name].value += g.rate * score / 100 / countryCount;
          });
        });
        if (hasGlobal) {
          hasNegativeGlobal = true;
        }
      }
    });

    countryCodes.forEach(code => {
      if (hasPositiveGlobal || positiveCountries.has(code)) {
        countryStats[code].ventures += 1;
      }

      if (hasNegativeGlobal || negativeCountries.has(code)) {
        countryStats[code].negativeVentures += 1;
      }
    });
  });

  const globalCommunityImpacts = ventures
    .flatMap(v => v.impacts)
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .filter(i => Array.isArray(i.geography)
      && i.geography.some(isGlobalGeographyValue));

  // Attribute global community values to all countries that already have some data
  globalCommunityImpacts.forEach(impact => {
    Object.values(countryStats).forEach(countryData => {
      const score = impact.scoring.at(-1).score;
      const magnitude = impact.scoring.at(-1).magnitude;
      const likelihood = impact.scoring.at(-1).likelihood;
      if (countryData.score > 0 && impact.positive) {
        countryData.score += score / NUMBER_OF_COUNTRIES;
        countryData.magnitude += magnitude / NUMBER_OF_COUNTRIES;
        countryData.likelihood += likelihood;
        countryData.impacts += 1;
        countryData.indicators += impact.indicators.length;
        impact.goals.forEach(g => {
          countryData.sdgs[g.goal.name].value += g.rate * score / 100 / NUMBER_OF_COUNTRIES;
        })
      }

      if (countryData.negativeScore > 0 && !impact.positive) {
        countryData.negativeScore += score / NUMBER_OF_COUNTRIES;
        countryData.negativeMagnitude += magnitude / NUMBER_OF_COUNTRIES;
        countryData.negativeLikelihood += likelihood;
        impact.goals.forEach(g => {
          countryData.negativeSdgs[g.goal.name].value += g.rate * score / 100 / NUMBER_OF_COUNTRIES;
        })
      }
    });
  });

  // Calculate average likelihood
  Object.values(countryStats).forEach(countryData => {
    if (countryData.likelihood > 0) {
      countryData.likelihood /= countryData.impacts;
    }

    if (countryData.negativeLikelihood > 0) {
      countryData.negativeLikelihood /= countryData.impacts;
    }
  });

  const countryMouseOver = (event, code) => {
    setCountryTooltip({
      show: true,
      position: { left: event.domEvent.clientX + 50, top: event.domEvent.clientY - 100 },
      code,
    });
  }

  const countryMouseOut = () => {
    setCountryTooltip({ ...countryTooltip, show: false });
  }

  const countryClick = (event, code) => {
    setFilters && setFilters(filters => ({ ...filters, countries: [code] }));
  }

  const ventureMouseOver = (event, venture) => {
    const tooltipX = event.domEvent.clientX > 400 ? event.domEvent.clientX - 400 : event.domEvent.clientX + 30;
    setVentureTooltip({
      show: true,
      position: { left: tooltipX, top: event.domEvent.clientY - 250 },
      venture,
    });
  }

  const ventureMouseOut = () => {
    setVentureTooltip({ ...ventureTooltip, show: false });
  }

  const ventureGoals = sortBy(ventureTooltip.venture?.impacts
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .flatMap(i => i.goals)
    .map(g => g.goal)
    .filter(distinctBy('name')), 'number');

  const updateMapView = (e) => {
    setView(e.target.value);
    setFilters && setFilters(filters => ({ ...filters, countries: [] }));
  }

  const markers = useMemo(() => ventures.filter(v => v.lat && v.lng).map((venture) => ({
    position: { lat: venture.lat, lng: venture.lng },
    label: venture.name,
    venture,
  })), [ventures]);

  const onIdle = () => {
    if (mapRef) {
      updateVisibleVentures(mapRef, markers, setMapVentures);
    }
  }

  useEffect(() => {
    if (mapRef) {
      updateVisibleVentures(mapRef, markers, setMapVentures);
    }
  }, [markers, mapRef]);

  useEffect(() => {
    if (view === MAP_VIEW.VENTURES) {
      const markerPositions = markers.map(m => m.position);
      zoomAndCenterMap(mapRef, 15, markerPositions, setCenter);
    } else {
      const highlightedCountries = getHighlightedCountries(geoJson.features, countryStats, view);
      const countryPositions = highlightedCountries.map(code => {
        const feature = geoJson.features.find(c => c.properties.iso_a2 === code);
        return { lat: feature.properties.label_y, lng: feature.properties.label_x };
      });
      zoomAndCenterMap(mapRef, 5, countryPositions, setCenter);
    }
  }, [mapRef, view]);

  const onMapLoad = (map) => {
    setMapRef(map);
  };

  const mapStyles = {
    height: "100%",
    width: "100%"
  };

  return (
    <Box {...rest}>
      <LoadScriptNext
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
        version={GOOGLE_MAPS_VERSION}
      >
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={2}
          center={center}
          options={{
            ...mapOptions,
            restriction: {
              latLngBounds: { north: 75, south: -75, east: 180, west: -180 },
              strictBounds: true,
            },
            styles: view === MAP_VIEW.VENTURES ? [] : mapOverlayStyles,
            zoomControlOptions: {
              position: window.google?.maps.ControlPosition.TOP_RIGHT,
            },
          }}
          onIdle={onIdle}
          onLoad={onMapLoad}
        >
          {view !== MAP_VIEW.VENTURES && renderPolygons(geoJson.features, countryStats, view, countryMouseOver, countryMouseOut, countryClick)}
          {view === MAP_VIEW.VENTURES &&
            // <MarkerClusterer options={{ styles: clusterStyles }}>
            //   {(clusterer) => (
            markers.map((marker, index) => (
              <Tooltip key={index} title='Test tooltip'>
                <Box>
                  <GoogleMapMarker
                    key={index}
                    position={marker.position}
                    onMouseOver={(e) => ventureMouseOver(e, marker.venture)}
                    onMouseOut={ventureMouseOut}
                    enlarge={marker.venture.id === hoveredVenture?.id}
                    fill={marker.venture.id === hoveredVenture?.id ? 'black' : undefined}
                    onClick={() => navigate(`/public-profile/ventures/${marker.venture?.id}`)}
                    // clusterer={clusterer}
                  />
                </Box>
              </Tooltip>
            ))
            // )}
            // </MarkerClusterer>
          }
        </GoogleMap>
      </LoadScriptNext>
      <Box position='absolute' left={16} right={16} bottom={16} display='flex' justifyContent='center'>
        <Card
          sx={{
            p: 1,
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: { xs: 1, sm: 3 },
            borderRadius: '8px',
            width: '100%',
            maxWidth: 600
          }}
        >
          {view !== MAP_VIEW.VENTURES && (
            <Box
              flexGrow={1}
              display='flex'
              gap={1}
              width={{ xs: '100%', sm: 'unset' }}
              alignItems='center'
            >
              <Typography variant='subtitle'>
                {Math.round(getMinValue(countryStats, view))}
              </Typography>
              <Box
                height={12}
                flexGrow={1}
                sx={{
                  background: `linear-gradient(
                to right, 
                ${view.includes('negative') ? theme.palette.error.light : theme.palette.success.light}, 
                ${view.includes('negative') ? theme.palette.error.dark : theme.palette.success.dark}
                )`,
                }}
              />
              <Typography variant='subtitle'>
                {Math.round(getMaxValue(countryStats, view))}
              </Typography>
            </Box>
          )}
          <Box display='flex' alignItems='center' gap={2} height={22}>
            <Typography>Show:</Typography>
            <TextInput
              name='impact-sort'
              select
              onChange={updateMapView}
              value={view}
              InputProps={{ disableUnderline: true }}
              sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
            >
              <MenuItem value={MAP_VIEW.IP_SCORE}>IP score</MenuItem>
              <MenuItem value={MAP_VIEW.IP_MAGNITUDE}>IP magnitude</MenuItem>
              <MenuItem value={MAP_VIEW.IP_LIKELIHOOD}>IP likelihood</MenuItem>
              <MenuItem value={MAP_VIEW.NEGATIVE_IP_SCORE}>Negative IP score</MenuItem>
              <MenuItem value={MAP_VIEW.NEGATIVE_IP_MAGNITUDE}>Negative IP magnitude</MenuItem>
              <MenuItem value={MAP_VIEW.NEGATIVE_IP_LIKELIHOOD}>Negative IP likelihood</MenuItem>
              <MenuItem value={MAP_VIEW.IMPACTS}>Number of impact areas</MenuItem>
              <MenuItem value={MAP_VIEW.INDICATORS}>Number of indicators</MenuItem>
              <MenuItem value={MAP_VIEW.VENTURES}>Venture headquarters</MenuItem>
            </TextInput>
          </Box>
        </Card>
      </Box>
      {countryTooltip.show && (
        <Card
          sx={{
            width: 250,
            p: 2,
            position: 'fixed',
            zIndex: 1, ...countryTooltip.position,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderRadius: '4px',
          }}
        >
          <Typography variant='bodyBold'>
            {geoJson.features.find(f => f.properties.iso_a2 === countryTooltip.code).properties.name}
          </Typography>
          <Box display='flex' gap={1}>
            <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
              <Typography sx={{ fontSize: 10 }}>Companies</Typography>
              <Typography variant='captionBold'>
                {countryStats[countryTooltip.code][view.includes('negative') ? 'negativeVentures' : 'ventures']}
              </Typography>
            </Box>
            {[MAP_VIEW.IP_SCORE, MAP_VIEW.NEGATIVE_IP_SCORE].includes(view) && (
              <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
                <Typography sx={{ fontSize: 10 }}>Total score</Typography>
                <Typography variant='captionBold'>
                  {Math.round(countryStats[countryTooltip.code][view.includes('negative') ? 'negativeScore' : 'score'])}
                </Typography>
              </Box>
            )}
            {[MAP_VIEW.IP_MAGNITUDE, MAP_VIEW.NEGATIVE_IP_MAGNITUDE].includes(view) && (
              <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
                <Typography sx={{ fontSize: 10 }}>Total magnitude</Typography>
                <Typography variant='captionBold'>
                  {Math.round(countryStats[countryTooltip.code][view.includes('negative') ? 'negativeMagnitude' : 'magnitude'])}
                </Typography>
              </Box>
            )}
            {[MAP_VIEW.IP_LIKELIHOOD, MAP_VIEW.NEGATIVE_IP_LIKELIHOOD].includes(view) && (
              <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
                <Typography sx={{ fontSize: 10 }}>Average likelihood</Typography>
                <Typography variant='captionBold'>
                  {Math.round(countryStats[countryTooltip.code][view.includes('negative') ? 'negativeLikelihood' : 'likelihood'])}%
                </Typography>
              </Box>
            )}
            {view === MAP_VIEW.IMPACTS && (
              <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
                <Typography sx={{ fontSize: 10 }}>Impact chains</Typography>
                <Typography variant='captionBold'>
                  {Math.round(countryStats[countryTooltip.code].impacts)}
                </Typography>
              </Box>
            )}
            {view === MAP_VIEW.INDICATORS && (
              <Box p={1} backgroundColor='secondary.subtle' flexGrow={1}>
                <Typography sx={{ fontSize: 10 }}>Indicators</Typography>
                <Typography variant='captionBold'>
                  {Math.round(countryStats[countryTooltip.code].indicators)}
                </Typography>
              </Box>
            )}
          </Box>
          {view === MAP_VIEW.IP_SCORE && (
            Object.values(countryStats[countryTooltip.code].sdgs)
              .sort(((v1, v2) => v2.value - v1.value))
              .filter(v => v.value > 0)
              .map(((sdg, index, arr) =>
                <PublicDatabaseMapTooltipSdgItem key={sdg.name} sdg={sdg} total={arraySum(arr.map(i => i.value))} />)
              )
          )}
          {view === MAP_VIEW.NEGATIVE_IP_SCORE && (
            Object.values(countryStats[countryTooltip.code].negativeSdgs)
              .sort(((v1, v2) => v2.value - v1.value))
              .filter(v => v.value > 0)
              .map(((sdg, index, arr) =>
                <PublicDatabaseMapTooltipSdgItem key={sdg.name} sdg={sdg} total={arraySum(arr.map(i => i.value))} />)
              )
          )}
        </Card>
      )}
      {ventureTooltip.show && (
        <Card
          sx={{
            width: 375,
            p: 2,
            position: 'fixed',
            zIndex: 10,
            ...ventureTooltip.position,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: '8px',
          }}
        >
          <Box display='flex' alignItems='center' gap={2}>
            {ventureTooltip.venture.logo && (
              <Box
                flexShrink={0}
                component='img'
                width={42}
                height={42}
                src={ventureTooltip.venture.logo}
                sx={{ objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
            <Typography variant='h5' noWrap minWidth={0}>{ventureTooltip.venture.name}</Typography>
          </Box>
          {ventureTooltip.venture.certification > 0 && (
            <Box
              p={1}
              backgroundColor='secondary.subtle'
              display='flex'
              alignItems='center'
              gap={2}
            >
              <Box
                component='img'
                width={32}
                height={32}
                src={`/images/certification/level${ventureTooltip.venture.certification}.png`}
                alt={`${companyName} certification badge`}
              />
              <Typography variant='subtitleBold'>Impact Venture
                Level: {ventureTooltip.venture.certification}</Typography>
            </Box>
          )}
          {ventureTooltip.venture.pitchSettings?.description &&
            <Typography variant='subtitle'>{ventureTooltip.venture.pitchSettings?.description}</Typography>
          }
          <Typography variant='bodyBold' sx={{ pt: 1 }}>About</Typography>
          <Box display='flex' flexDirection='column' gap={1.5}>
            <Divider flexItem />
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='subtitle'>Industry sector</Typography>
              <Typography variant='subtitleBold' noWrap>
                {ventureTooltip.venture.industries.map(i => i.title).join(', ')}
              </Typography>
            </Box>
            <Divider flexItem />
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='subtitle'>Size</Typography>
              <Typography variant='subtitleBold'>{ventureTooltip.venture.employees || 0} employees</Typography>
            </Box>
            <Divider flexItem />
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='subtitle'>Location</Typography>
              <Typography variant='subtitleBold'>
                {ventureTooltip.venture.city}, {ventureTooltip.venture.country?.title}
              </Typography>
            </Box>
            <Divider flexItem />
          </Box>
          <Typography variant='bodyBold' sx={{ pt: 1 }}>Highlights</Typography>
          <Box display='flex'>
            <Box flexGrow={1} textAlign='center'>
              <StyledTooltipIconWrapper>
                <Box component='img' width={26} height={26} src='/images/icons/star.svg' />
              </StyledTooltipIconWrapper>
              <Typography variant='caption'>Impact potential</Typography>
              <Typography variant='subtitleBold'>
                {`${getVentureTotalScore(ventureTooltip.venture)} / 500`}
              </Typography>
            </Box>
            <Box flexGrow={1} textAlign='center'>
              <StyledTooltipIconWrapper>
                <Box component='img' width={26} height={26} src='/images/icons/checks.svg' />
              </StyledTooltipIconWrapper>
              <Typography variant='caption'>Impact areas</Typography>
              <Typography variant='subtitleBold'>{ventureTooltip.venture.impacts.length}</Typography>
            </Box>
            <Box flexGrow={1} textAlign='center'>
              <StyledTooltipIconWrapper>
                <Box component='img' width={26} height={26} src='/images/icons/bulb.svg' />
              </StyledTooltipIconWrapper>
              <Typography variant='caption'>Indicators</Typography>
              <Typography variant='subtitleBold'>
                {arraySum(ventureTooltip.venture.impacts.map(i => i.indicators.length))}
              </Typography>
            </Box>
          </Box>
          {ventureGoals.length > 0 && <Divider />}
          {ventureGoals.length > 0 && (
            <Box>
              <Typography variant='bodyBold'>We contribute to:</Typography>
              <Box mt={2} display='flex' alignItems='center' gap={0.25}>
                {ventureGoals.slice(0, 4).map(g => (
                  <Box key={g.name} component='img' src={g.image} alt={g.shortName} width={64} height={64} />
                ))}
                {ventureGoals.length > 4 && (
                  <Typography variant='overline' color='primary.main' sx={{ ml: 1 }}>
                    + {ventureGoals.length - 4} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default memo(PublicDatabaseGoogleMap);
