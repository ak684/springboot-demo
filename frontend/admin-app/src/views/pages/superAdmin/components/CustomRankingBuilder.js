import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { v1 } from 'services/api';

const CustomRankingBuilder = ({ open, onClose, onApply, initialMetrics = [] }) => {
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAvailableMetrics();
      setSelectedMetrics(initialMetrics);
    }
  }, [open, initialMetrics]);

  const fetchAvailableMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await v1.get('/companies/cluster-rankings/available-metrics');
      setAvailableMetrics(response.data);
    } catch (error) {
      console.error('Error fetching available metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMetric = (metricId) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

  const handleApply = () => {
    onApply(selectedMetrics);
    onClose();
  };

  const handleClear = () => {
    setSelectedMetrics([]);
  };

  // Group metrics by category
  const metricsByCategory = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  const categoryOrder = [
    'Size',
    'Innovation',
    'Business & Growth',
    '5-year Impact Potential',
    'Sustainable Business Model Orientation',
    'Growth Likelihood',
    'ESG risk',
    'Emissions'
  ];

  const sortedCategories = Object.keys(metricsByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={600}>
            Build Custom Ranking
          </Typography>
          {selectedMetrics.length > 0 && (
            <Chip
              label={`${selectedMetrics.length} selected`}
              color="primary"
              size="small"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Select one or more metrics to create a custom ranking. Companies will be ranked by their
          average percentile across the selected metrics.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {sortedCategories.map((category, categoryIndex) => (
              <Box key={category} mb={categoryIndex < sortedCategories.length - 1 ? 3 : 0}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="primary"
                  mb={1}
                >
                  {category}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: 1
                  }}
                >
                  {metricsByCategory[category].map((metric) => (
                    <FormControlLabel
                      key={metric.id}
                      control={
                        <Checkbox
                          checked={selectedMetrics.includes(metric.id)}
                          onChange={() => handleToggleMetric(metric.id)}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            {metric.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        m: 0,
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: selectedMetrics.includes(metric.id)
                          ? 'primary.main'
                          : 'divider',
                        backgroundColor: selectedMetrics.includes(metric.id)
                          ? 'primary.lighter'
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    />
                  ))}
                </Box>
                {categoryIndex < sortedCategories.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClear} disabled={selectedMetrics.length === 0}>
          Clear All
        </Button>
        <Box flex={1} />
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={selectedMetrics.length === 0}
        >
          Apply Ranking
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomRankingBuilder;
