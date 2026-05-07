import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Link,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { Link as RouterLink } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { getVentureGoals } from 'shared-components/utils/scoring';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_VERSION } from 'shared-components/utils/googleMaps';
import { lineClamp } from 'shared-components/utils/styles';
import { isDefined } from 'shared-components/utils/lo';
import smartRound from 'shared-components/filters/smartRound';
import PublicDatabaseSearchInfo from '../components/PublicDatabaseSearchInfo';
import ResearchDatabaseVentureCard from '../components/ResearchDatabaseVentureCard';

const DEFAULT_CAMERA = { lat: 20, lng: 10, altitude: 22000000, tilt: 15, heading: 0 };
const ZOOMED_ALTITUDE = 250;
const ZOOMED_TILT = 65;
const FLY_DURATION = 3500;
const ORBIT_DURATION = 60000;
const STEADY_STATE_EVENTS = ['gmp-steadystate', 'gmp-steadychange'];

const getVentureImage = (v) => v.impacts?.find(i => isDefined(i.image))?.image || 'https://placehold.co/120x85';

const EarthViewSidebar = memo(({
  ventures,
  totalVentures,
  selectedVentureId,
  onSelectVenture,
  onResetView,
  mapApp,
  cardVariant,
}) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());

  return (
    <Box height='100%' display='flex' flexDirection='column'>
      <Box px={2} pt={2} pb={1} display='flex' alignItems='center' gap={1}>
        <Box flexGrow={1}>
          <PublicDatabaseSearchInfo
            shownVentures={ventures.length}
            totalVentures={totalVentures}
            showSort
          />
        </Box>
        {selectedVentureId && (
          <Tooltip title='Back to globe overview'>
            <IconButton size='small' onClick={onResetView}>
              <ZoomOutMapIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />
      <Box flexGrow={1} overflow='auto' p={cardVariant === 'research' ? 1 : 1.5}>
        {cardVariant === 'research' ? (
          <Grid container spacing={1}>
            {ventures.map(v => (
              <Grid key={v.id} item xs={12}>
                <ResearchDatabaseVentureCard
                  venture={v}
                  selected={selectedVentureId === v.id}
                  onClick={() => onSelectVenture(v)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box display='flex' flexDirection='column' gap={1}>
            {ventures.map(v => {
              const isSelected = selectedVentureId === v.id;
              const ventureGoals = goals && goals.length > 0
                ? getVentureGoals(v, goals)
                : [];

              return (
                <Card
                  key={v.id}
                  onClick={() => onSelectVenture(v)}
                  sx={{
                    p: isSelected ? 2 : '17px',
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.border}`,
                    flexShrink: 0,
                    '&:hover': {
                      p: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  <Typography variant='bodyBold'>{v.name}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box display='flex' gap={2}>
                    <Box flexBasis={120} flexGrow={0} flexShrink={0}>
                      <Box
                        width={120}
                        height={85}
                        src={v.logo || getVentureImage(v)}
                        component='img'
                        sx={{ objectFit: 'cover', borderRadius: '4px' }}
                        alt={v.name}
                      />
                      <Box mt={1} display='flex' gap={0.5}>
                        {v.employees > 0 && (
                          <Box flexBasis='50%' p={0.75} backgroundColor='secondary.subtle'>
                            <Typography sx={{ fontSize: 9 }}>Employees</Typography>
                            <Typography variant='captionBold' sx={{ mt: 0.25 }}>{v.employees}</Typography>
                          </Box>
                        )}
                        {Number.isFinite(v.aux?.traction) && (
                          <Box flexBasis='50%' p={0.75} backgroundColor='secondary.subtle'>
                            <Typography sx={{ fontSize: 9 }}>Traction</Typography>
                            <Typography variant='captionBold' sx={{ mt: 0.25 }}>
                              {v.aux.traction > 0 ? '+' : ''}{smartRound(v.aux.traction)}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box flexGrow={1} minWidth={0}>
                      <Typography variant='subtitleBold' sx={{ mb: 0.5 }}>Short venture activity description goes here</Typography>
                      <Typography variant='subtitle' style={lineClamp(3)}>{v.description}</Typography>
                    </Box>
                    <Box
                      display='flex'
                      flexDirection='column'
                      justifyContent='space-between'
                      flexBasis={120}
                      flexGrow={0}
                      flexShrink={0}
                    >
                      <Box display='flex' flexDirection='column' gap={1}>
                        {ventureGoals.slice(0, 3).map(goal => (
                          <Box key={goal.name} display='flex' gap={0.5} alignItems='center'>
                            <Box component='img' src={goal.image} width={20} height={20} sx={{ borderRadius: '2px' }} />
                            <Box minWidth={0}>
                              <Typography sx={{ fontSize: 9 }} noWrap>{goal.shortName}</Typography>
                              <Typography variant='captionBold' sx={{ mt: 0.25 }}>{Math.round(goal.rate)}%</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                      <Link
                        component={RouterLink}
                        to={mapApp ? `/ventures/${v.id}` : `/public-profile/ventures/${v.id}`}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ fontSize: 12, cursor: 'pointer', textAlign: 'right', mt: 1 }}
                      >
                        See details
                      </Link>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
});

const PublicDatabaseEarthView = ({
  ventures,
  totalVentures,
  mapApp,
  cardVariant = 'public',
}) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAP_API_KEY;
  const mapRef = useRef(null);
  const mapHostRef = useRef(null);
  const markersRef = useRef([]);
  const restartOrbitTimeoutRef = useRef(null);
  const mapEventsRef = useRef({
    handleError: null,
    handleSteadyState: null,
    timeoutId: null,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedVentureId, setSelectedVentureId] = useState(null);
  const [orbitMode, setOrbitMode] = useState('active');
  const [isOrbiting, setIsOrbiting] = useState(false);
  const { isLoaded: isMapsApiLoaded, loadError: mapsApiLoadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: GOOGLE_MAPS_VERSION,
  });

  const venturesWithLocation = useMemo(
    () => ventures.filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lng)),
    [ventures]
  );
  const isResearchLayout = cardVariant === 'research';

  const clearRestartOrbitTimeout = useCallback(() => {
    if (restartOrbitTimeoutRef.current) {
      window.clearTimeout(restartOrbitTimeoutRef.current);
      restartOrbitTimeoutRef.current = null;
    }
  }, []);

  const stopOrbit = useCallback(() => {
    clearRestartOrbitTimeout();

    const map = mapRef.current;
    if (map && map.stopCameraAnimation) {
      try {
        map.stopCameraAnimation();
      } catch (e) {
        // stopCameraAnimation may not be available during teardown
      }
    }

    setIsOrbiting(false);
  }, [clearRestartOrbitTimeout]);

  const startOrbit = useCallback(() => {
    stopOrbit();

    const map = mapRef.current;
    if (!map || !map.flyCameraAround) return;

    try {
      map.flyCameraAround({
        camera: {
          center: { lat: DEFAULT_CAMERA.lat, lng: DEFAULT_CAMERA.lng, altitude: 0 },
          range: DEFAULT_CAMERA.altitude,
          tilt: DEFAULT_CAMERA.tilt,
          heading: DEFAULT_CAMERA.heading,
        },
        durationMillis: ORBIT_DURATION,
        repeatCount: Infinity,
      });
      setOrbitMode('active');
      setIsOrbiting(true);
    } catch (e) {
      // flyCameraAround may not be available
    }
  }, [stopOrbit]);

  const scheduleOrbitRestart = useCallback(() => {
    clearRestartOrbitTimeout();
    restartOrbitTimeoutRef.current = window.setTimeout(() => {
      restartOrbitTimeoutRef.current = null;
      startOrbit();
    }, FLY_DURATION + 500);
  }, [clearRestartOrbitTimeout, startOrbit]);

  const flyToVenture = useCallback((venture) => {
    setSelectedVentureId(venture.id);
    setOrbitMode('stopped');
    stopOrbit();

    const map = mapRef.current;
    if (!map) return;

    if (!map.flyCameraTo) {
      map.setAttribute('center', `${venture.lat},${venture.lng}`);
      map.setAttribute('range', `${ZOOMED_ALTITUDE}`);
      map.setAttribute('tilt', `${ZOOMED_TILT}`);
      return;
    }

    try {
      map.flyCameraTo({
        endCamera: {
          center: { lat: venture.lat, lng: venture.lng, altitude: 0 },
          range: ZOOMED_ALTITUDE,
          tilt: ZOOMED_TILT,
          heading: 0,
        },
        durationMillis: FLY_DURATION,
      });
    } catch (e) {
      map.setAttribute('center', `${venture.lat},${venture.lng}`);
      map.setAttribute('range', `${ZOOMED_ALTITUDE}`);
      map.setAttribute('tilt', `${ZOOMED_TILT}`);
    }
  }, [stopOrbit]);

  const flyBackToGlobe = useCallback(() => {
    setSelectedVentureId(null);
    setOrbitMode('resume-pending');
    stopOrbit();

    const map = mapRef.current;
    if (!map) return;

    if (!map.flyCameraTo) {
      map.setAttribute('center', `${DEFAULT_CAMERA.lat},${DEFAULT_CAMERA.lng}`);
      map.setAttribute('range', `${DEFAULT_CAMERA.altitude}`);
      map.setAttribute('tilt', '0');
      startOrbit();
      return;
    }

    try {
      map.flyCameraTo({
        endCamera: {
          center: { lat: DEFAULT_CAMERA.lat, lng: DEFAULT_CAMERA.lng, altitude: 0 },
          range: DEFAULT_CAMERA.altitude,
          tilt: DEFAULT_CAMERA.tilt,
          heading: DEFAULT_CAMERA.heading,
        },
        durationMillis: FLY_DURATION,
      });
      scheduleOrbitRestart();
    } catch (e) {
      map.setAttribute('center', `${DEFAULT_CAMERA.lat},${DEFAULT_CAMERA.lng}`);
      map.setAttribute('range', `${DEFAULT_CAMERA.altitude}`);
      map.setAttribute('tilt', `${DEFAULT_CAMERA.tilt}`);
      startOrbit();
    }
  }, [scheduleOrbitRestart, startOrbit, stopOrbit]);

  const teardownMap = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    clearRestartOrbitTimeout();

    if (mapEventsRef.current.timeoutId) {
      window.clearTimeout(mapEventsRef.current.timeoutId);
      mapEventsRef.current.timeoutId = null;
    }

    if (mapRef.current && mapEventsRef.current.handleError) {
      mapRef.current.removeEventListener('gmp-error', mapEventsRef.current.handleError);
    }

    if (mapRef.current && mapEventsRef.current.handleSteadyState) {
      STEADY_STATE_EVENTS.forEach(eventName => {
        mapRef.current.removeEventListener(
          eventName,
          mapEventsRef.current.handleSteadyState
        );
      });
    }

    if (mapRef.current?.parentNode) {
      mapRef.current.parentNode.removeChild(mapRef.current);
      mapRef.current = null;
    }

    mapEventsRef.current = {
      handleError: null,
      handleSteadyState: null,
      timeoutId: null,
    };
    setIsOrbiting(false);
  }, [clearRestartOrbitTimeout]);

  const handleLoadError = useCallback((message, error = null) => {
    console.error('[PublicDatabaseEarthView] Failed to load 3D map', error);
    teardownMap();
    setMapLoaded(false);
    setLoadError(message);
  }, [teardownMap]);

  const initMap = useCallback(async () => {
    if (mapRef.current) return;

    const mapHost = mapHostRef.current;
    if (!mapHost) return;

    setLoadError('');
    setMapLoaded(false);

    try {
      if (window.google?.maps?.importLibrary) {
        await window.google.maps.importLibrary('maps3d');
      }
    } catch (error) {
      handleLoadError('3D map library failed to initialize.', error);
      return;
    }

    const mapEl = document.createElement('gmp-map-3d');
    mapEl.setAttribute('mode', 'hybrid');
    mapEl.setAttribute('center', `${DEFAULT_CAMERA.lat},${DEFAULT_CAMERA.lng}`);
    mapEl.setAttribute('range', `${DEFAULT_CAMERA.altitude}`);
    mapEl.setAttribute('tilt', `${DEFAULT_CAMERA.tilt}`);
    mapEl.setAttribute('heading', `${DEFAULT_CAMERA.heading}`);
    mapEl.setAttribute('gesture-handling', 'greedy');
    mapEl.setAttribute('default-ui-hidden', '');
    mapEl.style.width = '100%';
    mapEl.style.height = '100%';

    const handleSteadyState = (event) => {
      const isSteady = event?.isSteady ?? event?.detail?.isSteady ?? true;
      if (!isSteady) return;

      if (mapEventsRef.current.timeoutId) {
        window.clearTimeout(mapEventsRef.current.timeoutId);
        mapEventsRef.current.timeoutId = null;
      }

      setMapLoaded(true);
      setLoadError('');
    };

    const handleError = (event) => {
      handleLoadError(
        '3D map is unavailable on this device or Google Maps configuration.',
        event
      );
    };

    STEADY_STATE_EVENTS.forEach(eventName => {
      mapEl.addEventListener(eventName, handleSteadyState);
    });
    mapEl.addEventListener('gmp-error', handleError);

    mapHost.replaceChildren(mapEl);
    mapRef.current = mapEl;
    mapEventsRef.current = {
      handleError,
      handleSteadyState,
      timeoutId: window.setTimeout(() => {
        setMapLoaded(true);
        mapEventsRef.current.timeoutId = null;
      }, 1500),
    };
  }, [handleLoadError]);

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Google Maps API key is missing.');
      return;
    }

    if (mapsApiLoadError) {
      handleLoadError('Google Maps script failed to load.', mapsApiLoadError);
      return;
    }

    if (!isMapsApiLoaded) return;

    let isCancelled = false;

    const loadMaps3d = async () => {
      try {
        await window.google.maps.importLibrary('maps3d');
        if (!isCancelled) {
          initMap();
        }
      } catch (error) {
        if (!isCancelled) {
          handleLoadError('3D map library failed to initialize.', error);
        }
      }
    };

    loadMaps3d();

    return () => {
      isCancelled = true;
      stopOrbit();
      teardownMap();
    };
  }, [
    apiKey,
    handleLoadError,
    initMap,
    isMapsApiLoaded,
    mapsApiLoadError,
    stopOrbit,
    teardownMap,
  ]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    venturesWithLocation.forEach(venture => {
      try {
        const marker = document.createElement('gmp-marker-3d-interactive');
        marker.setAttribute('position', `${venture.lat},${venture.lng}`);
        marker.setAttribute('altitude-mode', 'clamp-to-ground');
        marker.setAttribute('label', venture.name);
        marker.setAttribute('title', venture.name);
        marker.addEventListener('gmp-click', () => {
          flyToVenture(venture);
        });
        mapRef.current.appendChild(marker);
        markersRef.current.push(marker);
      } catch (e) {
        // Marker creation may fail if API not fully ready
      }
    });
  }, [flyToVenture, mapLoaded, venturesWithLocation]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || selectedVentureId || orbitMode !== 'active') {
      return undefined;
    }

    startOrbit();
    return () => stopOrbit();
  }, [mapLoaded, orbitMode, selectedVentureId, startOrbit, stopOrbit]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;

    const handleUserInteraction = () => {
      stopOrbit();
      setOrbitMode('stopped');
      setSelectedVentureId(null);
    };

    map.addEventListener('pointerdown', handleUserInteraction);
    map.addEventListener('wheel', handleUserInteraction);

    return () => {
      map.removeEventListener('pointerdown', handleUserInteraction);
      map.removeEventListener('wheel', handleUserInteraction);
    };
  }, [mapLoaded, stopOrbit]);

  return (
    <Box
      display='flex'
      width='100%'
      height={isResearchLayout
        ? { xs: 'auto', lg: 'calc(100vh - 212px)' }
        : { xs: 'calc(100vh - 180px)', lg: 'calc(100vh - 160px)' }}
      position='relative'
      flexDirection={isResearchLayout
        ? { xs: 'column', lg: 'row' }
        : { xs: 'column', md: 'row' }}
    >
      <Card
        sx={{
          width: isResearchLayout
            ? { xs: '100%', lg: 'calc(50vw - 120px)', xl: 700 }
            : { xs: '100%', md: 440, lg: '35%' },
          minWidth: isResearchLayout ? 0 : { md: 440 },
          maxWidth: isResearchLayout
            ? { xs: 'unset', xl: 700 }
            : { lg: 600 },
          height: isResearchLayout
            ? { xs: 'auto', lg: '100%' }
            : { xs: 300, md: '100%' },
          order: isResearchLayout ? { xs: 2, lg: 1 } : { xs: 2, md: 1 },
          borderRadius: isResearchLayout
            ? { xs: '0 0 8px 8px', lg: '8px 0 0 8px' }
            : { xs: '0 0 8px 8px', md: '8px 0 0 8px' },
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <EarthViewSidebar
          ventures={venturesWithLocation}
          totalVentures={totalVentures || ventures.length}
          selectedVentureId={selectedVentureId}
          onSelectVenture={flyToVenture}
          onResetView={flyBackToGlobe}
          mapApp={mapApp}
          cardVariant={cardVariant}
        />
      </Card>

      <Box
        flexGrow={1}
        order={isResearchLayout ? { xs: 1, lg: 2 } : { xs: 1, md: 2 }}
        sx={{
          position: 'relative',
          height: isResearchLayout
            ? { xs: 300, sm: 360, lg: '100%' }
            : { xs: 'calc(100vh - 480px)', md: '100%' },
          minHeight: isResearchLayout ? { lg: 400 } : 400,
          backgroundColor: '#000',
          borderRadius: isResearchLayout
            ? { xs: '8px 8px 0 0', lg: '0 8px 8px 0' }
            : { xs: '8px 8px 0 0', md: '0 8px 8px 0' },
          overflow: 'hidden',
          minWidth: 0,
          '& gmp-map-3d': {
            width: '100%',
            height: '100%',
          },
        }}
      >
        <Box
          id='earth-view-map'
          ref={mapHostRef}
          position='absolute'
          top={0}
          right={0}
          bottom={0}
          left={0}
        />
        {mapLoaded && orbitMode === 'stopped' && !isOrbiting && (
          <Tooltip title='Resume auto-rotation'>
            <IconButton
              onClick={flyBackToGlobe}
              size='small'
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 2,
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                boxShadow: 2,
              }}
            >
              <AutorenewIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
        {!mapLoaded && !loadError && (
          <Box
            position='absolute'
            top={0}
            right={0}
            bottom={0}
            left={0}
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            gap={2}
            zIndex={1}
            sx={{ pointerEvents: 'none' }}
          >
            <CircularProgress sx={{ color: 'common.white' }} />
            <Typography variant='subtitleBold' color='common.white'>
              Loading 3D earth view
            </Typography>
          </Box>
        )}
        {loadError && (
          <Box
            position='absolute'
            top={0}
            right={0}
            bottom={0}
            left={0}
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            gap={1}
            px={3}
            textAlign='center'
            zIndex={1}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.82)' }}
          >
            <Typography variant='subtitleBold' color='common.white'>
              3D earth view unavailable
            </Typography>
            <Typography variant='subtitle' color='grey.300'>
              {loadError}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default memo(PublicDatabaseEarthView);
