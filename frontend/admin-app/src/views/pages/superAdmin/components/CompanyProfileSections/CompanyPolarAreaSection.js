import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Alert, Typography, Grid, Divider, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Chart as ChartJS,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PolarArea } from 'react-chartjs-2';
import BaseSection from './BaseSection';

ChartJS.register(
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Category color mapping similar to the Riccardo chart
const CATEGORY_COLORS = {
  'Innovation': '#66BB6A',        // Green
  'Size': '#FFE0B2',              // Beige/Sand (like possession in Riccardo)
  'Business & Growth': '#D6D6D6',  // Light gray
  'Impact potential': '#4FC3F7',   // Light blue
  'Growth Likelihood': '#B39DDB',  // Light purple for growth drivers
  'ESG risk': '#EF5350',          // More red, less orange
  'Emissions': '#FF8A65'         // Soft orange (inverted - lower is better)
};

// Slightly transparent versions for better visibility
const CATEGORY_FILL_COLORS = {
  'Innovation': 'rgba(102, 187, 106, 0.75)',
  'Size': 'rgba(255, 224, 178, 0.75)',
  'Business & Growth': 'rgba(214, 214, 214, 0.75)',
  'Impact potential': 'rgba(79, 195, 247, 0.75)',
  'Growth Likelihood': 'rgba(179, 157, 219, 0.75)',
  'ESG risk': 'rgba(239, 83, 80, 0.75)',  // Updated to match new red
  'Emissions': 'rgba(255, 138, 101, 0.75)' // Updated to match new soft orange
};

const formatPercentValue = (value) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return Math.round(value * 100);
};

const CompanyPolarAreaSection = ({ polarData, loading, error, onRerun, companyId }) => {
  const [isRerunning, setIsRerunning] = useState(false);

  // All hooks must be called unconditionally before any early returns to satisfy
  // the Rules of Hooks (otherwise React throws minified error #310 when the
  // loading/error/empty branches resolve and the component re-renders with
  // additional hooks).
  const availableMetrics = useMemo(() => {
    if (!polarData || !Array.isArray(polarData.metrics)) {
      return [];
    }
    return polarData.metrics.filter(
      (metric) => !metric.missing && metric.percentile !== null && metric.percentile !== undefined
    );
  }, [polarData]);

  const chartData = useMemo(() => {
    // Split labels into multiple lines for better readability
    const labels = availableMetrics.map((metric) => {
      const label = metric.label;
      const words = label.split(' ');

      // Split into roughly equal lines
      if (words.length <= 2) {
        return label; // Keep short labels on one line
      }

      const midpoint = Math.ceil(words.length / 2);
      const line1 = words.slice(0, midpoint).join(' ');
      const line2 = words.slice(midpoint).join(' ');
      return [line1, line2];
    });
    const data = availableMetrics.map((metric) => Math.round(metric.percentile * 100));

    // Map each metric to its category color
    const backgroundColors = availableMetrics.map((metric) => {
      return CATEGORY_FILL_COLORS[metric.category] || 'rgba(158, 158, 158, 0.85)';
    });

    const borderColors = availableMetrics.map((metric) => {
      return '#666666'; // Gray border for all segments
    });

    // Create subtly visible background colors for the full circle effect
    const veryLightBackgrounds = availableMetrics.map((metric) => {
      const baseColor = CATEGORY_COLORS[metric.category] || '#9E9E9E';
      // Convert hex to rgba with subtle opacity
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.12)`; // 12% opacity
    });

    return {
      labels,
      datasets: [
        // Background dataset (full radius with very light colors)
        {
          data: Array(data.length).fill(100), // Full radius for all segments
          backgroundColor: veryLightBackgrounds,
          borderColor: 'rgba(0, 0, 0, 0.05)', // Subtle gray border
          borderWidth: 1,
          datalabels: {
            display: false // Don't show labes on background
          }
        },
        // Main dataset (actual values)
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,  // Thinner border
          borderAlign: 'center'
        }
      ]
    };
  }, [availableMetrics]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    layout: {
      padding: 0  // Zero padding to maximize chart
    },
    plugins: {
      legend: {
        display: false // We'll create our own custom legend
      },
      tooltip: {
        filter: (tooltipItem) => {
          // Only show tooltip for the main dataset (index 1), not the background (index 0)
          return tooltipItem.datasetIndex === 1;
        },
        callbacks: {
          label: (context) => {
            const metric = availableMetrics[context.dataIndex];
            const percentileValue = formatPercentValue(metric.percentile);
            const rawValue = metric.formattedValue || (metric.rawValue != null ? metric.rawValue : 'N/A');
            return [
              `${metric.category}: ${metric.label}`,
              `Percentile: ${percentileValue}`,
              `Value: ${rawValue}`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        },
        padding: 10
      },
      datalabels: {
        display: function(context) {
          // Only display labels for the main dataset (index 1), not background (index 0)
          return context.datasetIndex === 1;
        },
        color: function(context) {
          // Use black for light backgrounds, white for dark backgrounds
          const backgroundColor = context.dataset.backgroundColor[context.dataIndex];
          const rgb = backgroundColor.match(/\d+/g);
          if (rgb) {
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            return brightness > 128 ? '#000000' : '#FFFFFF';
          }
          return '#000000';
        },
        font: {
          size: 16,
          weight: '500'
        },
        formatter: (value) => value,
        anchor: function(context) {
          // Use different anchor based on value size
          const value = context.dataset.data[context.dataIndex];
          return value >= 50 ? 'center' : 'end';
        },
        align: function(context) {
          // Position inside for large values, outside for small values
          const value = context.dataset.data[context.dataIndex];
          return value >= 50 ? 'end' : 'start';
        },
        offset: function(context) {
          // Different offset for inside vs outside positioning
          const value = context.dataset.data[context.dataIndex];
          if (value <= 10) {
            return -70;  // Extra distance for very small values
          }
          return value >= 50 ? -15 : -45;
        },
        clamp: true        // Keep labels inside canvas
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 25,
          display: false, // Hide the scale numbers
          backdropColor: 'transparent',
          maxTicksLimit: 5
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Darker grid lines
          circular: true,
          lineWidth: 1  // Thicker lines
        },
        angleLines: {
          display: false
        },
        pointLabels: {
          display: true, // Show labels aligned with segments
          font: {
            size: 14,
            family: 'Arial, sans-serif',
            weight: '600'
          },
          color: '#000000', // Black for visibility
          padding: 5, // Some padding for readability
          centerPointLabels: true, // Centers labels on each segment
          // No truncation - show full labels
        }
      }
    },
    elements: {
      arc: {
        angle: availableMetrics.length > 0 ? 360 / availableMetrics.length : 360
      }
    }
  }), [availableMetrics]);

  const handleRerun = async () => {
    if (!onRerun) return;
    setIsRerunning(true);
    try {
      await onRerun('narrative', companyId);
    } finally {
      setIsRerunning(false);
    }
  };

  const regenerateAction = onRerun && (
    <MuiTooltip
      title="Regenerate the AI-generated narrative based on the latest company data"
      enterDelay={200}
      enterNextDelay={200}
    >
      <IconButton
        onClick={handleRerun}
        disabled={isRerunning}
        size="small"
        sx={{
          ml: 1,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          opacity: 0.7
        }}
      >
        {isRerunning ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
      </IconButton>
    </MuiTooltip>
  );

  if (loading) {
    return (
      <BaseSection
        title="Foresight Portfolio Intelligence Snapshot"
        subtitle="Percentile comparison against companies in this portfolio"
        icon={<DonutLargeIcon />}
        actions={regenerateAction}
      >
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Box>
      </BaseSection>
    );
  }

  if (error) {
    return (
      <BaseSection
        title="Foresight Portfolio Intelligence Snapshot"
        subtitle="Percentile comparison against companies in this portfolio"
        icon={<DonutLargeIcon />}
        actions={regenerateAction}
      >
        <Alert severity="error">
          Unable to load polar-area chart data. Please try again later.
        </Alert>
      </BaseSection>
    );
  }

  if (!polarData || !Array.isArray(polarData.metrics) || polarData.metrics.length === 0) {
    return null;
  }

  if (availableMetrics.length === 0) {
    return null;
  }

  const companyName = polarData.companyName || 'Company';
  const portfolioRank = polarData.portfolioRank ?? null;
  const rankedCompanyCount = polarData.rankedCompanyCount ?? polarData.sampleSize ?? null;
  const venturePlatformScore = polarData.venturePlatformScore ?? null;
  const metricsConsidered = polarData.metricsConsidered ?? availableMetrics.length;
  const averagePercentileDisplay = venturePlatformScore != null
    ? Math.round(venturePlatformScore * 100)
    : null;
  const rankLabel = portfolioRank != null ? `#${portfolioRank}` : 'N/A';
  const rankSuffix = rankedCompanyCount != null ? `(of ${rankedCompanyCount})` : '';
  const narrativeFallback = 'Narrative in progress. Check back soon.';
  const strengthsText = polarData.portfolioStrengthsText || narrativeFallback;
  const weaknessesText = polarData.portfolioWeaknessesText || narrativeFallback;
  const impactText = polarData.portfolioImpactText || narrativeFallback;
  const potentialNeedsText = polarData.portfolioPotentialNeedsText || narrativeFallback;
  const narrativeGeneratedAt = polarData.portfolioNarrativeGeneratedAt
    ? new Date(polarData.portfolioNarrativeGeneratedAt).toLocaleString()
    : null;

  return (
    <BaseSection
      title="Foresight Portfolio Intelligence Snapshot"
      subtitle="Percentile comparison against companies in this portfolio"
      icon={<DonutLargeIcon />}
      actions={regenerateAction}
      noPadding
    >
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column - Portfolio Rank and Text Sections */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              backgroundColor: '#f9f9f9',
              borderRadius: 1,
              p: 2,
              height: '100%'
            }}>
              {/* Portfolio Rank */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Box>
                    <Typography sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#666666',
                      letterSpacing: '0.5px',
                      lineHeight: 1.3
                    }}>
                      {companyName}'s
                    </Typography>
                    <Typography sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#666666',
                      letterSpacing: '0.5px',
                      lineHeight: 1.3
                    }}>
                      Portfolio Rank
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1976d2',
                      lineHeight: 1.2
                    }}>
                      {rankLabel}
                    </Typography>
                    <Typography sx={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#999999',
                      mt: 0.5
                    }}>
                      {rankSuffix}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Box>

              {/* Strengths Section */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#666666',
                  letterSpacing: '0.5px',
                  mb: 1
                }}>
                  Strengths
                </Typography>
                <Typography sx={{
                  fontSize: '14px',
                  color: '#333333',
                  lineHeight: 1.6
                }}>
                  {strengthsText}
                </Typography>
              </Box>

              {/* Weaknesses Section */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#666666',
                  letterSpacing: '0.5px',
                  mb: 1
                }}>
                  Weaknesses
                </Typography>
                <Typography sx={{
                  fontSize: '14px',
                  color: '#333333',
                  lineHeight: 1.6
                }}>
                  {weaknessesText}
                </Typography>
              </Box>

              {/* Impact Section */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#666666',
                  letterSpacing: '0.5px',
                  mb: 1
                }}>
                  Impact
                </Typography>
                <Typography sx={{
                  fontSize: '14px',
                  color: '#333333',
                  lineHeight: 1.6
                }}>
                  {impactText}
                </Typography>
              </Box>

              {/* Potential Needs Section */}
              <Box>
                <Typography sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#666666',
                  letterSpacing: '0.5px',
                  mb: 1
                }}>
                  Potential Needs
                </Typography>
                <Typography sx={{
                  fontSize: '14px',
                  color: '#333333',
                  lineHeight: 1.6
                }}>
                  {potentialNeedsText}
                </Typography>
              </Box>

              {narrativeGeneratedAt && (
                <Typography sx={{
                  fontSize: '12px',
                  color: '#999999',
                  mt: 2
                }}>
                  Narrative updated {narrativeGeneratedAt}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Right Column - Chart */}
          <Grid item xs={12} md={8}>
            {/* Chart Container */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 930,
                mx: 'auto',
                position: 'relative',
                pb: 4
              }}
            >
              <div style={{
                width: '100%',
                height: '798px',
                position: 'relative'
              }}>
                <PolarArea
                  data={chartData}
                  options={chartOptions}
                />
              </div>
            </Box>

            {/* Chart subtitle */}
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#999999',
                fontStyle: 'italic',
                mt: 2,
                maxWidth: 930,
                mx: 'auto'
              }}
            >
              Larger areas indicate higher percentiles and better performance
            </Typography>

            {polarData.hasCappedMetrics && (
              <Alert severity="info" sx={{ mt: 3, maxWidth: 760, mx: 'auto' }}>
                Extremely large values were capped at the 95th percentile to keep the chart readable.
              </Alert>
            )}
          </Grid>
        </Grid>
      </Box>
    </BaseSection>
  );
};

export default CompanyPolarAreaSection;
