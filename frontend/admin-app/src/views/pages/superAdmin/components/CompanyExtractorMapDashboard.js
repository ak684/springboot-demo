import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  Autocomplete,
  TextField,
  Chip
} from '@mui/material';
import { v1 } from "services/api";
import { debounce } from 'lodash';
import CompanyExtractorMap from './CompanyExtractorMap';
import MetricCards from './MetricCards';
import SbmoDistributionChart from './SbmoDistributionChart';

const CompanyExtractorMapDashboard = ({ portfolioId, portfolioName, selectedTags, onTagsChange, allTags = [], onOpenProfile }) => {
  const [mapBounds, setMapBounds] = useState(null);
  const [filteredMetrics, setFilteredMetrics] = useState({});
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [companiesInView, setCompaniesInView] = useState(0);
  const [totalCompaniesUnfiltered, setTotalCompaniesUnfiltered] = useState(0);
  const [geographicFilterActive, setGeographicFilterActive] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const isFirstMapLoadRef = useRef(true);
  const mapInitializedRef = useRef(false);

  // Debounced function to fetch metrics when map bounds change
  const updateMetricsForBounds = useMemo(
    () => debounce(async (bounds) => {
      if (!bounds) {
        console.log('[MapDashboard] No bounds provided, skipping metrics update');
        return;
      }

      console.log('[MapDashboard] Updating metrics for bounds:', bounds);
      setIsLoadingMetrics(true);
      setGeographicFilterActive(true);

      try {
        const response = await v1.get('/companies/metrics-for-bounds', {
          params: {
            minLat: bounds.getSouthWest().lat(),
            maxLat: bounds.getNorthEast().lat(),
            minLng: bounds.getSouthWest().lng(),
            maxLng: bounds.getNorthEast().lng(),
            portfolioId: portfolioId || undefined,
            tags: selectedTags && selectedTags.length > 0 ? selectedTags.join(',') : undefined
          }
        });

        console.log('[MapDashboard] Received metrics:', response.data);
        setFilteredMetrics(response.data);
        setCompaniesInView(response.data.totalCompanies || 0);
      } catch (error) {
        console.error('[MapDashboard] Error fetching metrics for bounds:', error);
        // On error, show empty metrics
        setFilteredMetrics({
          totalCompanies: 0,
          totalEmployees: 0,
          totalPatents: 0,
          totalSocialMediaFollowers: 0,
          totalDailyTraffic: 0,
          companiesWithReports: 0,
          totalSales: 'N/A',
          totalCarbonEmissions: 0,
          totalSalesRaw: 0,
          totalSalesCurrency: null,
          continuousCounters: {}
        });
        setCompaniesInView(0);
      } finally {
        setIsLoadingMetrics(false);
      }
    }, 500),
    [portfolioId, selectedTags]
  );

  useEffect(() => {
    return () => {
      updateMetricsForBounds.cancel();
    };
  }, [updateMetricsForBounds]);

  // Fetch global metrics (no geographic filter)
  const fetchGlobalMetrics = useCallback(async () => {
    console.log('[MapDashboard] Fetching global metrics, tags:', selectedTags);
    setIsLoadingMetrics(true);

    try {
      const response = await v1.get('/companies/totals', {
        params: {
          portfolioId: portfolioId || undefined,
          tags: selectedTags && selectedTags.length > 0 ? selectedTags.join(',') : undefined
        }
      });

      console.log('[MapDashboard] Received global metrics:', response.data);
      setFilteredMetrics(response.data);
      setCompaniesInView(response.data.totalCompanies || 0);
      setTotalCompaniesUnfiltered(response.data.totalCompanies || 0);
    } catch (error) {
      console.error('[MapDashboard] Error fetching global metrics:', error);
      setFilteredMetrics({});
      setCompaniesInView(0);
    } finally {
      setIsLoadingMetrics(false);
      setIsInitialLoad(false);
    }
  }, [portfolioId, selectedTags]);

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds) => {
    console.log('[MapDashboard] Map bounds changed, mapInitialized:', mapInitializedRef.current);
    setMapBounds(bounds);

    // Skip initial map events during startup
    if (!mapInitializedRef.current) {
      // Wait a bit to ensure map is fully loaded, then mark as initialized
      setTimeout(() => {
        mapInitializedRef.current = true;
        console.log('[MapDashboard] Map initialization complete');
      }, 1000);
      console.log('[MapDashboard] Skipping metrics update during map initialization');
    } else {
      updateMetricsForBounds(bounds);
    }
  }, [updateMetricsForBounds]);

  // Reset to show all companies (remove geographic filter)
  const handleResetView = useCallback(() => {
    console.log('[MapDashboard] Resetting view to show all companies');
    setGeographicFilterActive(false);
    setMapBounds(null);
    mapInitializedRef.current = false;  // Temporarily disable to prevent immediate re-trigger
    setTimeout(() => {
      mapInitializedRef.current = true;
    }, 1000);
    // Fetch global metrics
    fetchGlobalMetrics();
  }, [fetchGlobalMetrics]);

  // Load initial metrics on mount
  useEffect(() => {
    fetchGlobalMetrics();
  }, [fetchGlobalMetrics]);

  return (
    <Box>
      {/* Header with status indicators */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4">
            {portfolioName ? `${portfolioName} - ` : ''}Company Data Dashboard
          </Typography>
          {isLoadingMetrics && !isInitialLoad && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Updating...
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tag Filter */}
          {allTags.length > 0 && onTagsChange && (
            <Autocomplete
              multiple
              options={allTags}
              value={selectedTags || []}
              onChange={(_, newValue) => onTagsChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Filter by tags..."
                  size="small"
                  sx={{
                    minWidth: 300,
                    '& .MuiInputBase-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    size="small"
                    label={option}
                    {...getTagProps({ index })}
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      '& .MuiChip-label': {
                        padding: '0 6px',
                        fontSize: '0.7rem'
                      },
                      '& .MuiChip-deleteIcon': {
                        fontSize: '14px',
                        margin: '0 2px 0 -2px'
                      }
                    }}
                  />
                ))
              }
            />
          )}
          <FormControlLabel
            control={
              <Switch
                size="small"
                color="primary"
                checked={continuousMode}
                onChange={(event) => setContinuousMode(event.target.checked)}
              />
            }
            label="Continuous counters"
          />
        </Box>
      </Box>

      {/* Main content - metrics on top, map below */}
      <Box>
        {/* Metrics */}
        <Box sx={{ mb: 3 }}>
          <MetricCards
            portfolioTotals={filteredMetrics}
            extractionStats={{}}
            isLoading={isInitialLoad && isLoadingMetrics}
            showGeographicIndicator={geographicFilterActive && companiesInView !== totalCompaniesUnfiltered}
            continuousMode={continuousMode}
          />
        </Box>

        {/* SBMO Distribution */}
        <Box sx={{ mb: 3 }}>
          <SbmoDistributionChart
            portfolioId={portfolioId}
            selectedTags={selectedTags}
          />
        </Box>

        {/* Map */}
        <Card sx={{ height: '700px', position: 'relative' }}>
          <CompanyExtractorMap
            selectedTags={selectedTags}
            portfolioId={portfolioId}
            onBoundsChange={handleBoundsChange}
            highlightedCompanies={selectedCompanies}
            showBoundsIndicator={geographicFilterActive}
            onOpenProfile={onOpenProfile}
            companiesInView={companiesInView}
            totalCompaniesUnfiltered={totalCompaniesUnfiltered}
          />
        </Card>
      </Box>

    </Box>
  );
};

export default CompanyExtractorMapDashboard;
