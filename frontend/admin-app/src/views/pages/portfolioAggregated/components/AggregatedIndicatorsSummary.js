import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Skeleton
} from '@mui/material';
import { useSelector } from 'react-redux';
import { portfolioAggregatedSelectors } from 'store/ducks/portfolioAggregated';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const AggregatedIndicatorsSummary = ({ portfolioId }) => {
  const indicators = useSelector(portfolioAggregatedSelectors.getAggregatedIndicators);
  const loading = useSelector(portfolioAggregatedSelectors.getLoading);
  
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'number') {
      return `${value.toLocaleString()} ${unit || ''}`.trim();
    }
    
    return value;
  };
  
  const getTrendIcon = (change) => {
    if (!change || change === 0) return null;
    return change > 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
  };
  
  const getTrendColor = (change) => {
    if (!change || change === 0) return 'default';
    return change > 0 ? 'success' : 'error';
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  if (!indicators || indicators.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              No aggregated indicators created yet. Create your first indicator to see portfolio-level KPIs here.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Portfolio Indicators
      </Typography>
      
      <Grid container spacing={2}>
        {indicators.map(indicator => (
          <Grid item xs={12} md={6} key={indicator.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {indicator.name}
                </Typography>
                
                <Chip 
                  label={indicator.aggregationType || 'N/A'} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                {indicator.calculatedValues && (
                  <Box>
                    {Object.entries(indicator.calculatedValues).map(([period, value]) => (
                      <Box key={period} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {period}: {formatValue(value)}
                        </Typography>
                        
                        {data.components && data.components.length > 0 && (
                          <Box sx={{ mt: 1, ml: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Components:
                            </Typography>
                            {data.components.slice(0, 3).map((comp, idx) => (
                              <Typography key={idx} variant="caption" display="block" sx={{ ml: 1 }}>
                                • {comp.name}: {formatValue(comp.value)}
                              </Typography>
                            ))}
                            {data.components.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ...and {data.components.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AggregatedIndicatorsSummary;
