import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import { GoogleMap, LoadScriptNext, Marker, InfoWindow, MarkerClusterer } from "@react-google-maps/api";
import { v1LongTimeout } from "services/api";
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_VERSION,
} from 'shared-components/utils/googleMaps';

// Map options - gestureHandling 'greedy' ensures map always responds to zoom/pan gestures
const mapOptions = {
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  gestureHandling: 'greedy',
};
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 20, // More centered globally
  lng: 0
};

// Cluster styles
const clusterStyles = [
  {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#1976d2"/>
      </svg>
    `)}`,
    height: 40,
    width: 40,
    textColor: '#ffffff',
    textSize: 14
  },
  {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="25" fill="#f57c00"/>
      </svg>
    `)}`,
    height: 50,
    width: 50,
    textColor: '#ffffff',
    textSize: 16
  },
  {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="30" fill="#d32f2f"/>
      </svg>
    `)}`,
    height: 60,
    width: 60,
    textColor: '#ffffff',
    textSize: 18
  }
];

const CompanyExtractorMap = ({ selectedTags = [], portfolioId, onBoundsChange, highlightedCompanies = [], showBoundsIndicator = false, companiesInView = null, totalCompaniesUnfiltered = null, onOpenProfile }) => {
  const [companies, setCompanies] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRef, setMapRef] = useState(null);
  const geocodedCache = useRef({});
  const activeProcessIdRef = useRef(0);
  const googleReadyRetryTimerRef = useRef(null);

  // Load all company locations from dedicated endpoint
  const loadCompanyLocations = async () => {
    try {
      console.log('[CompanyExtractorMap] Loading company locations...');

      // Show cached data immediately (if available)
      const cacheKey = portfolioId
        ? `companyExtractor.locations.${portfolioId}`
        : 'companyExtractor.locations.all';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.log('[CompanyExtractorMap] Showing cached locations immediately for', cacheKey);
        setCompanies(JSON.parse(cached));
      }

      setIsLoading(true);

      // Fetch fresh data from server
      const response = await v1LongTimeout.get('/companies/locations', {
        params: { portfolioId: portfolioId ? parseInt(portfolioId, 10) : undefined }
      });
      console.log('[CompanyExtractorMap] Loaded', response.data.length, 'company locations for portfolio:', portfolioId);

      // Update state with fresh data
      setCompanies(response.data || []);

      // Cache the fresh data with portfolio-specific key
      localStorage.setItem(cacheKey, JSON.stringify(response.data || []));
      console.log('[CompanyExtractorMap] Cached locations with key:', cacheKey);

    } catch (error) {
      console.error('[CompanyExtractorMap] Error loading company locations:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // One-time cleanup of old cache format on component mount
  useEffect(() => {
    try {
      const oldLocationsCache = localStorage.getItem('companyExtractor.locations');
      if (oldLocationsCache) {
        console.log('[CompanyExtractorMap] Cleaning up old locations cache');
        localStorage.removeItem('companyExtractor.locations');
      }
    } catch (error) {
      console.error('[CompanyExtractorMap] Error cleaning up old cache:', error);
    }
  }, []);

  // Load company locations on component mount or when portfolioId changes
  useEffect(() => {
    loadCompanyLocations();
  }, [portfolioId]);

  // Filter companies by selected tags
  const filteredCompanies = useMemo(() => {
    if (!selectedTags || selectedTags.length === 0) {
      return companies;
    }

    return companies.filter(company => {
      const companyTags = company.tags || [];
      return selectedTags.some(tag => companyTags.includes(tag));
    });
  }, [companies, selectedTags]);

  // Geocode a single address
  const geocodeAddress = async (address) => {
    // Check cache first
    if (geocodedCache.current[address]) {
      return geocodedCache.current[address];
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const result = { lat: location.lat(), lng: location.lng() };
          geocodedCache.current[address] = result;
          resolve(result);
        } else {
          console.warn(`Geocoding failed for ${address}: ${status}`);
          resolve(null);
        }
      });
    });
  };


  // Process companies - use stored coordinates first, then geocode if needed
  useEffect(() => {
    const processId = activeProcessIdRef.current + 1;
    activeProcessIdRef.current = processId;
    let isCancelled = false;
    const isStaleProcess = () => isCancelled
      || activeProcessIdRef.current !== processId;

    const processCompanies = async () => {
      if (!window.google || !window.google.maps) {
        // Try again in a second if Google Maps isn't loaded yet
        googleReadyRetryTimerRef.current = setTimeout(() => {
          if (!isStaleProcess()) {
            processCompanies();
          }
        }, 1000);
        return;
      }

      // Don't process if we have no filtered companies (but only clear markers if we had companies before)
      if (!filteredCompanies || filteredCompanies.length === 0) {
        console.log('[CompanyExtractorMap] No filtered companies to process');
        // Only clear markers if we're filtering (selectedTags is not empty)
        if (selectedTags && selectedTags.length > 0) {
          setMarkers([]);
        }
        if (!isStaleProcess()) {
          setIsLoading(false);
        }
        return;
      }

      console.log('[CompanyExtractorMap] Processing', filteredCompanies.length, 'companies for map display');
      if (isStaleProcess()) {
        return;
      }
      setIsLoading(true);
      const newMarkers = [];
      const companiesNeedingGeocoding = [];

      // First, add all companies that already have coordinates
      filteredCompanies.forEach(company => {
        if (company.latitude && company.longitude &&
            company.latitude !== null && company.longitude !== null) {
          newMarkers.push({
            position: { lat: parseFloat(company.latitude), lng: parseFloat(company.longitude) },
            company: company
          });
          console.log('[CompanyExtractorMap] Added marker for', company.company_name, 'at', company.latitude, company.longitude);
        } else if (company.headquarter_address &&
                   company.headquarter_address !== 'N/A' &&
                   company.headquarter_address.trim() !== '') {
          companiesNeedingGeocoding.push(company);
          console.log('[CompanyExtractorMap] Company needs geocoding:', company.company_name, '-', company.headquarter_address);
        } else {
          console.log('[CompanyExtractorMap] Company has no location data:', company.company_name);
        }
      });

      console.log('[CompanyExtractorMap] Found', newMarkers.length, 'companies with coordinates,', companiesNeedingGeocoding.length, 'need geocoding');

      // Group companies by location
      const groupMarkersByLocation = (companyMarkers) => {
        const groups = {};
        companyMarkers.forEach(marker => {
          const key = `${marker.position.lat.toFixed(6)},${marker.position.lng.toFixed(6)}`;
          if (!groups[key]) {
            groups[key] = {
              position: marker.position,
              companies: []
            };
          }
          groups[key].companies.push(marker.company);
        });

        // Convert groups to array of markers
        const groupedMarkers = Object.values(groups).map(group => ({
          position: group.position,
          companies: group.companies,
          isMultiple: group.companies.length > 1
        }));

        console.log(`[CompanyExtractorMap] Grouped ${companyMarkers.length} companies into ${groupedMarkers.length} location markers`);
        return groupedMarkers;
      };

      // Group and show markers immediately for companies with coordinates
      const groupedMarkers = groupMarkersByLocation(newMarkers);
      if (isStaleProcess()) {
        return;
      }
      setMarkers(groupedMarkers);

      // If all companies have coordinates, we're done!
      if (companiesNeedingGeocoding.length === 0) {
        if (!isStaleProcess()) {
          setIsLoading(false);
        }
        return;
      }

      // Process companies needing geocoding in batches
      const batchSize = 10;
      
      try {
        for (let i = 0; i < companiesNeedingGeocoding.length; i += batchSize) {
          if (isStaleProcess()) {
            return;
          }
          const batch = companiesNeedingGeocoding.slice(i, i + batchSize);
          
          // Geocode batch in parallel
          const geocodePromises = batch.map(async (company) => {
            try {
              const coords = await geocodeAddress(company.headquarter_address);
              if (coords) {
                console.log('[CompanyExtractorMap] Geocoded', company.company_name, 'to', coords);
                return {
                  position: coords,
                  company: company
                };
              }
              console.log('[CompanyExtractorMap] Failed to geocode', company.company_name, '-', company.headquarter_address);
              return null;
            } catch (error) {
              console.error('[CompanyExtractorMap] Geocoding error for', company.company_name, ':', error);
              return null;
            }
          });

          const results = await Promise.all(geocodePromises);
          if (isStaleProcess()) {
            return;
          }
          const validResults = results.filter(r => r !== null);

          // Add new markers incrementally so user sees them appear
          if (validResults.length > 0) {
            setMarkers(prevMarkers => {
              if (isStaleProcess()) {
                return prevMarkers;
              }
              // Get all company markers from existing grouped markers
              const existingCompanyMarkers = [];
              prevMarkers.forEach(marker => {
                if (marker.companies) {
                  marker.companies.forEach(company => {
                    existingCompanyMarkers.push({
                      position: marker.position,
                      company: company
                    });
                  });
                } else if (marker.company) {
                  existingCompanyMarkers.push(marker);
                }
              });

              // Combine with new results and regroup
              const allMarkers = [...existingCompanyMarkers, ...validResults];
              return groupMarkersByLocation(allMarkers);
            });
            console.log('[CompanyExtractorMap] Added', validResults.length, 'new markers from geocoding');
          }

          // Small delay between batches to avoid rate limits
          if (i + batchSize < companiesNeedingGeocoding.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (isStaleProcess()) {
              return;
            }
          }
        }
      } catch (error) {
        if (!isStaleProcess()) {
          console.error('[CompanyExtractorMap] Error geocoding companies:', error);
        }
      }

      // Final marker count
      console.log('[CompanyExtractorMap] Geocoding complete. Total markers:', newMarkers.length);
      if (!isStaleProcess()) {
        setIsLoading(false);
      }
    };

    processCompanies();

    return () => {
      isCancelled = true;
      if (googleReadyRetryTimerRef.current) {
        clearTimeout(googleReadyRetryTimerRef.current);
      }
    };
  }, [filteredCompanies, selectedTags]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef && markers.length > 0 && !isLoading) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      mapRef.fitBounds(bounds);
      
      // Don't zoom in too much for single markers
      const listener = mapRef.addListener('idle', () => {
        if (mapRef.getZoom() > 15) mapRef.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [mapRef, markers, isLoading]);

  const onMapLoad = (map) => {
    setMapRef(map);

    // Add bounds change listener if callback provided
    if (onBoundsChange) {
      console.log('[CompanyExtractorMap] Adding bounds change listener');
      map.addListener('idle', () => {
        const bounds = map.getBounds();
        console.log('[CompanyExtractorMap] Map idle, bounds:', bounds);
        onBoundsChange(bounds);
      });
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  return (
    <Card sx={{ p: 3, height: '700px', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">Company Locations</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {selectedTags.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Filtered by tags: {filteredCompanies.length} companies
            </Typography>
          )}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Geocoding addresses...
              </Typography>
            </Box>
          )}
          {!isLoading && (
            <Typography variant="body2" color="text.secondary">
              {markers.length} locations
              {showBoundsIndicator && companiesInView !== null && totalCompaniesUnfiltered !== null && companiesInView !== totalCompaniesUnfiltered && (
                <span> ({companiesInView} shown)</span>
              )}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ height: '600px', width: '100%' }}>
        <LoadScriptNext 
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}
          libraries={GOOGLE_MAPS_LIBRARIES}
          version={GOOGLE_MAPS_VERSION}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={2}
            center={defaultCenter}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            <MarkerClusterer
              options={{
                styles: clusterStyles,
                maxZoom: 18, // Show more individual pins - only cluster when zoomed way out
                gridSize: 30, // Smaller grid = tighter clusters, more pins visible
                minimumClusterSize: 5, // Only cluster when 5+ markers are really close
                // Custom calculator to count total companies, not just markers
                calculator: (markers, numStyles) => {
                  // Count total companies across all markers in this cluster
                  let totalCompanies = 0;
                  markers.forEach(marker => {
                    // Check if marker has custom companies data
                    if (marker.companies && marker.companies.length > 0) {
                      totalCompanies += marker.companies.length;
                    } else if (marker.company) {
                      totalCompanies += 1;
                    } else {
                      // Fallback - count the marker itself
                      totalCompanies += 1;
                    }
                  });

                  // Determine which cluster style to use based on count
                  let index = 0;
                  const count = totalCompanies;
                  if (count < 10) {
                    index = 0;
                  } else if (count < 50) {
                    index = 1;
                  } else if (count < 100) {
                    index = 2;
                  } else if (count < 200) {
                    index = 3;
                  } else {
                    index = 4;
                  }

                  return {
                    text: String(totalCompanies),
                    index: Math.min(index, numStyles)
                  };
                }
              }}
            >
              {(clusterer) =>
                markers.map((marker, index) => {
                  // Check if any company in this marker is highlighted
                  const hasHighlighted = marker.companies ?
                    marker.companies.some(c => highlightedCompanies.includes(c.id)) :
                    (marker.company && highlightedCompanies.includes(marker.company.id));

                  // Attach companies data to the Google Maps marker for the cluster calculator
                  const markerProps = {
                    key: index,
                    position: marker.position,
                    clusterer: clusterer,
                    onClick: () => handleMarkerClick(marker),
                    // Store the companies data on the marker itself for the calculator
                    companies: marker.companies,
                    company: marker.company,
                    icon: {
                        url: `data:image/svg+xml;utf8,${encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
                            <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${
                              hasHighlighted ? '#4CAF50' : '#FF5252'
                            }"/>
                            <circle cx="15" cy="15" r="8" fill="white"/>
                          </svg>
                        `)}`,
                        scaledSize: new window.google.maps.Size(30, 40),
                      }
                    };

                    return <Marker {...markerProps} />;
                  })
                }
            </MarkerClusterer>

            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <Box sx={{ minWidth: selectedMarker.companies && selectedMarker.companies.length > 1 ? 400 : 300, maxWidth: 400, p: 2 }}>
                  {/* Handle multiple companies at same location */}
                  {selectedMarker.companies && selectedMarker.companies.length > 1 ? (
                    <>
                      {/* Company count header */}
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                        {selectedMarker.companies.length} companies at this address
                      </Typography>
                      {/* List of companies - no custom scroll, InfoWindow handles it */}
                      {selectedMarker.companies.map((company, idx) => (
                          <Box
                            key={company.id || idx}
                            sx={{
                              mb: idx < selectedMarker.companies.length - 1 ? 3 : 0,
                              pb: idx < selectedMarker.companies.length - 1 ? 3 : 0,
                              borderBottom: idx < selectedMarker.companies.length - 1 ? 1 : 0,
                              borderColor: 'divider'
                            }}
                          >
                            <Typography variant="h6" gutterBottom>
                              {company.company_name}
                            </Typography>

                            {company.company_logo && company.company_logo !== 'N/A' && (
                              <Box sx={{ mb: 2 }}>
                                <img
                                  src={company.company_logo}
                                  alt={company.company_name}
                                  style={{ maxHeight: 50, maxWidth: 150, objectFit: 'contain' }}
                                />
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {company.industry_sectors && company.industry_sectors !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Industry</Typography>
                                    <Typography variant="body2">{company.industry_sectors}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {company.headquarter_address && company.headquarter_address !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <LocationOnIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                    <Typography variant="body2">{company.headquarter_address}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {company.number_of_employees && company.number_of_employees !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <GroupIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Employees</Typography>
                                    <Typography variant="body2">{company.number_of_employees}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {(company.contact_email || company.phone_number) && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                  {company.contact_email && company.contact_email !== 'N/A' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="caption">{company.contact_email}</Typography>
                                    </Box>
                                  )}
                                  {company.phone_number && company.phone_number !== 'N/A' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="caption">{company.phone_number}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {company.tags && company.tags.length > 0 && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {company.tags.map((tag, tagIdx) => (
                                      <Chip key={tagIdx} label={tag} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* View Profile Button */}
                              {onOpenProfile && (
                                <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={() => {
                                      setSelectedMarker(null);
                                      onOpenProfile(company);
                                    }}
                                    size="medium"
                                  >
                                    View Full Profile
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ))}
                    </>
                  ) : (
                    // Single company (backward compatibility)
                    <>
                      <Typography variant="h6" gutterBottom>
                        {selectedMarker.companies ? selectedMarker.companies[0].company_name : selectedMarker.company.company_name}
                      </Typography>

                      {(() => {
                        const company = selectedMarker.companies ? selectedMarker.companies[0] : selectedMarker.company;
                        return (
                          <>
                            {company.company_logo && company.company_logo !== 'N/A' && (
                              <Box sx={{ mb: 2 }}>
                                <img
                                  src={company.company_logo}
                                  alt={company.company_name}
                                  style={{ maxHeight: 50, maxWidth: 150, objectFit: 'contain' }}
                                />
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {company.industry_sectors && company.industry_sectors !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Industry</Typography>
                                    <Typography variant="body2">{company.industry_sectors}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {company.headquarter_address && company.headquarter_address !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <LocationOnIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                    <Typography variant="body2">{company.headquarter_address}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {company.number_of_employees && company.number_of_employees !== 'N/A' && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <GroupIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Employees</Typography>
                                    <Typography variant="body2">{company.number_of_employees}</Typography>
                                  </Box>
                                </Box>
                              )}

                              {(company.contact_email || company.phone_number) && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                  {company.contact_email && company.contact_email !== 'N/A' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="caption">{company.contact_email}</Typography>
                                    </Box>
                                  )}
                                  {company.phone_number && company.phone_number !== 'N/A' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="caption">{company.phone_number}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {company.tags && company.tags.length > 0 && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {company.tags.map((tag, idx) => (
                                      <Chip key={idx} label={tag} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* View Profile Button */}
                              {onOpenProfile && (
                                <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={() => {
                                      setSelectedMarker(null);
                                      onOpenProfile(company);
                                    }}
                                    size="medium"
                                  >
                                    View Full Profile
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </>
                        );
                      })()}
                    </>
                  )}
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScriptNext>
      </Box>
    </Card>
  );
};

export default memo(CompanyExtractorMap);
