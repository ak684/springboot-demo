import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Collapse,
  IconButton,
  Paper,
  Chip,
  Skeleton,
  Tooltip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { portfolioAggregatedSelectors } from 'store/ducks/portfolioAggregated';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const AggregatedIndicatorsTable = ({ portfolioId }) => {
  const indicators = useSelector(portfolioAggregatedSelectors.getAggregatedIndicators);
  const loading = useSelector(portfolioAggregatedSelectors.getLoading);
  const [expanded, setExpanded] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'number') {
      const formatted = value.toLocaleString();
      return unit ? `${formatted} ${unit}` : formatted;
    }
    
    return value;
  };

  const timeLabels = {
    'current': 'Current Year',
    'lastYear': 'Last Year', 
    'last5': 'Last 5 Years',
    'inception': 'Since Inception',
    'forecast5': '5 Year Forecast',
    'monthToDate': 'Month to Date',
    'today': 'Today'
  };

  const toggleRowExpanded = (indicatorId) => {
    setExpandedRows(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
  };

  // Render time period values and components
  const renderTimePeriodValues = (indicator) => {
    if (!indicator.calculatedValues) return '-';
    
    const isExpanded = expandedRows[indicator.id];
    
    return (
      <Box>
        {/* Main values summary */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {Object.entries(indicator.calculatedValues).map(([period, value]) => (
            <Chip
              key={period}
              label={`${timeLabels[period] || period}: ${formatValue(value, indicator.unit)}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ))}
        </Box>
        
        {/* Expandable components breakdown */}
        {indicator.componentBreakdowns && Object.keys(indicator.componentBreakdowns).length > 0 && (
          <Box>
            <IconButton 
              size="small" 
              onClick={() => toggleRowExpanded(indicator.id)}
              sx={{ p: 0.5 }}
            >
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                Component Details
              </Typography>
            </IconButton>
            
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 1, pl: 2 }}>
                {Object.entries(indicator.componentBreakdowns).map(([period, components]) => (
                  <Box key={period} sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      {timeLabels[period] || period}:
                    </Typography>
                    <Box sx={{ ml: 2, mt: 0.5 }}>
                      {components.map((comp, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ flex: 1 }}>
                            • {comp.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, ml: 2 }}>
                            {formatValue(comp.value, indicator.unit)}
                          </Typography>
                          <Chip
                            label={comp.type}
                            size="small"
                            sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Skeleton variant="rectangular" height={100} />
      </Box>
    );
  }
  
  if (!indicators || indicators.length === 0) {
    return null; // Don't show anything if no indicators
  }
  
  return (
    <Paper elevation={1} sx={{ mx: 2, mb: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          cursor: 'pointer',
          bgcolor: 'primary.light',
          '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Portfolio Indicators ({indicators.length})
        </Typography>
        <IconButton size="small" sx={{ color: 'inherit' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Values & Components</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indicators.map(indicator => (
                <TableRow key={indicator.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {indicator.name}
                      </Typography>
                      {indicator.description && (
                        <Tooltip title={indicator.description}>
                          <InfoOutlinedIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {indicator.category || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={indicator.aggregationType || 'N/A'} 
                      size="small" 
                      color={indicator.aggregationType === 'SUM' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {renderTimePeriodValues(indicator)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(indicator.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AggregatedIndicatorsTable;