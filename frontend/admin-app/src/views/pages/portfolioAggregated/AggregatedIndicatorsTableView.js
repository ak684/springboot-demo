import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Skeleton,
  Menu,
  MenuItem,
  TextField,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { portfolioAggregatedThunks } from 'store/ducks/portfolioAggregated';
import { portfolioAggregatedSelectors } from 'store/ducks/portfolioAggregated';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from 'shared-components/views/components/modal/ConfirmModal';
import useModal from 'shared-components/hooks/useModal';

const AggregatedIndicatorsTableView = () => {
  const { portfolioId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const indicators = useSelector(portfolioAggregatedSelectors.getAggregatedIndicators);
  const loading = useSelector(portfolioAggregatedSelectors.getLoading);
  const [tableData, setTableData] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [deleteModalOpen, openDeleteModal, closeDeleteModal] = useModal();
  const [editingRowNumber, setEditingRowNumber] = useState(null);
  const [tempRowNumber, setTempRowNumber] = useState('');
  
  useEffect(() => {
    // Load aggregated indicators
    dispatch(portfolioAggregatedThunks.fetchAggregatedIndicators(portfolioId));
  }, [dispatch, portfolioId]);
  
  useEffect(() => {
    // Transform indicators into table rows format
    if (indicators && indicators.length > 0) {
      const rows = [];
      
      // Group indicators by main/hover relationship
      const mainIndicators = indicators.filter(ind => ind.isMain !== false);
      const hoverIndicators = indicators.filter(ind => ind.isMain === false);
      
      // Create hover lookup map
      const hoverMap = {};
      hoverIndicators.forEach(hover => {
        if (hover.parentIndicatorId) {
          if (!hoverMap[hover.parentIndicatorId]) {
            hoverMap[hover.parentIndicatorId] = {};
          }
          hoverMap[hover.parentIndicatorId][hover.hoverSlot || 1] = hover;
        }
      });
      
      // Build rows with main + hovers
      mainIndicators.forEach((main, index) => {
        const hovers = hoverMap[main.id] || {};
        rows.push({
          number: index + 1,
          main: main,
          hover1: hovers[1] || null,
          hover2: hovers[2] || null,
          hover3: hovers[3] || null
        });
      });
      
      setTableData(rows);
    }
  }, [indicators]);
  
  const handleCreateIndicator = () => {
    navigate(`/portfolios/${portfolioId}/aggregated-indicator/create`);
  };
  
  const handleEditIndicator = (indicatorId) => {
    navigate(`/portfolios/${portfolioId}/aggregated-indicator/${indicatorId}/edit`);
  };
  
  const confirmDeleteIndicator = () => {
    if (selectedIndicator) {
      dispatch(portfolioAggregatedThunks.deleteAggregatedIndicator({
        portfolioId,
        indicatorId: selectedIndicator.id
      }));
    }

    // Clear selectedIndicator and close modal
    setSelectedIndicator(null);
    closeDeleteModal();
  };

  const openMenu = (e, indicator) => {
    setMenuAnchorEl(e.currentTarget);
    setSelectedIndicator(indicator);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setSelectedIndicator(null);
  };

  const handleMenuEdit = () => {
    if (selectedIndicator) {
      handleEditIndicator(selectedIndicator.id);
    }
    closeMenu();
  };

  const handleMenuDelete = () => {
    // selectedIndicator is already set from the menu, just open the modal
    openDeleteModal();
    // Close the menu but keep selectedIndicator for the modal
    setMenuAnchorEl(null);
  };

  const handleRowNumberClick = (rowIndex) => {
    setEditingRowNumber(rowIndex);
    setTempRowNumber((rowIndex + 1).toString());
  };

  const handleRowNumberChange = (e) => {
    setTempRowNumber(e.target.value);
  };

  const handleRowNumberSubmit = async (currentRowIndex) => {
    const newPosition = parseInt(tempRowNumber);
    const maxPosition = tableData.length;

    // Validate input
    if (isNaN(newPosition) || newPosition < 1 || newPosition > maxPosition) {
      setEditingRowNumber(null);
      setTempRowNumber('');
      return;
    }

    const newRowIndex = newPosition - 1; // Convert to 0-based index

    // If position hasn't changed, just exit edit mode
    if (newRowIndex === currentRowIndex) {
      setEditingRowNumber(null);
      setTempRowNumber('');
      return;
    }

    // Calculate the new display orders for all affected indicators
    const orderUpdates = [];
    const currentIndicator = tableData[currentRowIndex].main;

    if (newRowIndex > currentRowIndex) {
      // Moving down: shift indicators between current+1 and new position up by 1
      // Example: moving row 2 to position 5
      // Rows 3,4,5 become 2,3,4 and row 2 becomes 5
      for (let i = currentRowIndex + 1; i <= newRowIndex; i++) {
        const indicator = tableData[i].main;
        orderUpdates.push({
          id: indicator.id,
          displayOrder: i // 1-based position after shifting up
        });
      }
    } else {
      // Moving up: shift indicators between new position and current-1 down by 1
      // Example: moving row 5 to position 2
      // Rows 2,3,4 become 3,4,5 and row 5 becomes 2
      for (let i = newRowIndex; i < currentRowIndex; i++) {
        const indicator = tableData[i].main;
        orderUpdates.push({
          id: indicator.id,
          displayOrder: i + 2 // 1-based position after shifting down
        });
      }
    }

    // Add the moved indicator with its new position
    orderUpdates.push({
      id: currentIndicator.id,
      displayOrder: newPosition
    });

    try {
      // Call the reorder API
      await dispatch(portfolioAggregatedThunks.reorderAggregatedIndicators({
        portfolioId,
        orderUpdates
      }));
    } catch (error) {
      console.error('Failed to reorder indicators:', error);
    }

    setEditingRowNumber(null);
    setTempRowNumber('');
  };

  const handleRowNumberKeyPress = (e, currentRowIndex) => {
    if (e.key === 'Enter') {
      handleRowNumberSubmit(currentRowIndex);
    } else if (e.key === 'Escape') {
      setEditingRowNumber(null);
      setTempRowNumber('');
    }
  };

  const handleRowNumberBlur = (currentRowIndex) => {
    handleRowNumberSubmit(currentRowIndex);
  };

  const getIndicatorTypeText = (indicator) => {
    if (!indicator) return '';
    if (indicator.isMain !== false) {
      return 'Main Indicator';
    }
    // For hover indicators, check the hoverSlot
    const slot = indicator.hoverSlot || 1;
    return `Hover ${slot} Indicator`;
  };
  
  // Continuous counter state
  const [counterValues, setCounterValues] = useState({});
  const intervalRef = useRef(null);
  
  // Set up continuous counter updates
  useEffect(() => {
    if (indicators && indicators.length > 0) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Find indicators with continuous counter enabled
      const continuousIndicators = indicators.filter(ind => 
        ind.continuousCounter && ['ytd', 'mtd', 'today', 'sinceInception'].includes(ind.timePeriod)
      );
      
      if (continuousIndicators.length > 0) {
        // Calculate initial values and rates
        const rates = {};
        continuousIndicators.forEach(ind => {
          // Calculate day of year
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = now - start;
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          // Calculate annual total (simplified - in real implementation would use actual data)
          const annualTotal = ind.calculatedValue * (365 / dayOfYear);
          const ratePerSecond = annualTotal / 365 / 24 / 3600;
          
          rates[ind.id] = {
            baseValue: ind.calculatedValue,
            ratePerSecond: ratePerSecond,
            startTime: Date.now()
          };
        });
        
        // Update counter values every second
        intervalRef.current = setInterval(() => {
          const now = Date.now();
          const newValues = {};
          
          Object.entries(rates).forEach(([id, rate]) => {
            const elapsedSeconds = (now - rate.startTime) / 1000;
            newValues[id] = rate.baseValue + (rate.ratePerSecond * elapsedSeconds);
          });
          
          setCounterValues(newValues);
        }, 1000);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [indicators]);
  
  const formatValue = (value, indicator) => {
    if (value === null || value === undefined) return '-';
    if (typeof value !== 'number') return value;
    
    // Get formatting options
    const decimalPlaces = indicator?.decimalPlaces || 0;
    const numberFormat = indicator?.numberFormat || 'US';
    
    // Format based on locale
    const locale = numberFormat === 'EU' ? 'de-DE' : 'en-US';
    
    return value.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  };
  
  const getDisplayValue = (indicator) => {
    // Use continuous counter value if available
    if (indicator.continuousCounter && counterValues[indicator.id]) {
      return formatValue(counterValues[indicator.id], indicator);
    }
    return formatValue(indicator.calculatedValue, indicator);
  };
  
  const timeLabels = {
    'ytd': 'Year to Date',
    'mtd': 'Month to Date',
    'today': 'Today',
    'currentYearFull': 'Current Year (Full)',
    'lastYearFull': 'Last Year (Full)',
    'last5Years': 'Last 5 Years',
    'sinceInception': 'Since Inception'
  };
  
  const renderIndicatorCell = (indicator, isHover = false) => {
    if (!indicator) {
      return (
        <React.Fragment>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
          <TableCell align="center">-</TableCell>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <TableCell sx={{ position: 'relative', pl: isHover ? 2 : 3, pr: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2">{indicator.name}</Typography>
          </Box>
          <IconButton
            aria-haspopup='true'
            onClick={(e) => openMenu(e, indicator)}
            sx={{ position: 'absolute', top: 8, right: 8, p: 0.5 }}
            size="small"
          >
            <MoreVertOutlinedIcon />
          </IconButton>
        </TableCell>
        <TableCell>{indicator.nameSlovak || '-'}</TableCell>
        <TableCell align="center">
          {indicator.continuousCounter && (
            <Chip 
              size="small" 
              label="LIVE" 
              color="success" 
              sx={{ mr: 1, fontSize: '0.7rem', height: 20 }}
            />
          )}
          {getDisplayValue(indicator)}
        </TableCell>
        <TableCell>{indicator.unit || '-'}</TableCell>
        <TableCell>{indicator.unitSlovak || '-'}</TableCell>
        <TableCell>
          <Typography variant="body2">
            {timeLabels[indicator.timePeriod] || indicator.timePeriod || '-'}
            {indicator.selectedYear && ` (${indicator.selectedYear})`}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {indicator.timePeriodEnglish || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {indicator.timePeriodSlovak || '-'}
          </Typography>
        </TableCell>
      </React.Fragment>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Aggregated Indicators</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateIndicator}
          >
            Create New Indicator
          </Button>
        </Box>
        
        <TableContainer
          component={Paper}
          sx={{
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '12px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#a8a8a8',
              },
            },
            // Add a subtle shadow to indicate more content on the right
            background: `linear-gradient(90deg, transparent 0%, transparent calc(100% - 20px), rgba(0,0,0,0.05) 100%)`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '20px',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 100%)',
              pointerEvents: 'none',
              zIndex: 1,
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Category</TableCell>
                <TableCell>#</TableCell>
                
                {/* Main indicator columns */}
                <TableCell colSpan={8} align="center" sx={{ borderLeft: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Main Indicator</Typography>
                </TableCell>

                {/* Hover 1 columns */}
                <TableCell colSpan={8} align="center" sx={{ borderLeft: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Hover Value 1</Typography>
                </TableCell>

                {/* Hover 2 columns */}
                <TableCell colSpan={8} align="center" sx={{ borderLeft: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Hover Value 2</Typography>
                </TableCell>

                {/* Hover 3 columns */}
                <TableCell colSpan={8} align="center" sx={{ borderLeft: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Hover Value 3</Typography>
                </TableCell>
              </TableRow>
              
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell />
                <TableCell />
                
                {/* Repeat column headers for each section */}
                {[...Array(4)].map((_, sectionIndex) => (
                  <React.Fragment key={sectionIndex}>
                    <TableCell sx={{
                      borderLeft: sectionIndex > 0 ? '2px solid' : 'none',
                      borderColor: 'divider',
                      minWidth: '180px',
                      maxWidth: '200px'
                    }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ minWidth: '120px', maxWidth: '150px' }}>Name (SK)</TableCell>
                    <TableCell align="center" sx={{ minWidth: '80px', maxWidth: '100px' }}>Value</TableCell>
                    <TableCell sx={{ minWidth: '80px', maxWidth: '100px' }}>Unit</TableCell>
                    <TableCell sx={{ minWidth: '80px', maxWidth: '100px' }}>Unit (SK)</TableCell>
                    <TableCell sx={{ minWidth: '120px', maxWidth: '140px' }}>Time Period Unit</TableCell>
                    <TableCell sx={{ minWidth: '140px', maxWidth: '160px' }}>Time Period Label</TableCell>
                    <TableCell sx={{ minWidth: '140px', maxWidth: '160px' }}>Time Period Label (SK)</TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={34} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No aggregated indicators created yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, rowIndex) => (
                  <TableRow key={row.main.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {row.main.category || 'Uncategorized'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {editingRowNumber === rowIndex ? (
                        <TextField
                          value={tempRowNumber}
                          onChange={handleRowNumberChange}
                          onKeyDown={(e) => handleRowNumberKeyPress(e, rowIndex)}
                          onBlur={() => handleRowNumberBlur(rowIndex)}
                          size="small"
                          variant="outlined"
                          autoFocus
                          sx={{
                            width: '60px',
                            '& .MuiOutlinedInput-root': {
                              height: '32px',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }
                          }}
                          inputProps={{
                            style: { textAlign: 'center', padding: '6px 8px' },
                            min: 1,
                            max: tableData.length
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          onClick={() => handleRowNumberClick(rowIndex)}
                          sx={{
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          {row.number}
                        </Typography>
                      )}
                    </TableCell>
                    
                    {/* Main indicator data */}
                    {renderIndicatorCell(row.main, false)}

                    {/* Hover 1 data */}
                    {renderIndicatorCell(row.hover1, true)}

                    {/* Hover 2 data */}
                    {renderIndicatorCell(row.hover2, true)}

                    {/* Hover 3 data */}
                    {renderIndicatorCell(row.hover3, true)}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {tableData.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">
              Total indicators: {indicators.length} ({tableData.length} main indicators)
            </Typography>
          </Box>
        )}

        <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu}>
          <MenuItem onClick={handleMenuEdit}>
            <EditIcon sx={{ mr: 1, color: 'text.primary' }} />
            <Typography>Edit {getIndicatorTypeText(selectedIndicator)}</Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuDelete}>
            <DeleteIcon sx={{ mr: 1, color: 'text.primary' }} />
            <Typography>Delete {getIndicatorTypeText(selectedIndicator)}</Typography>
          </MenuItem>
        </Menu>

        <ConfirmModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          confirm={confirmDeleteIndicator}
          title='Delete Aggregated Indicator'
          primary='Are you sure you want to delete this indicator? Doing so will break any webpages that currently use it. It might be more optimal to edit this indicator instead.'
          secondary='This action cannot be undone'
        />
      </Box>
  );
};

export default AggregatedIndicatorsTableView;
