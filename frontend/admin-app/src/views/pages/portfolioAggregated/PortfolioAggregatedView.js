import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Toolbar,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { portfolioAggregatedSelectors, portfolioAggregatedThunks, portfolioAggregatedActions } from 'store/ducks/portfolioAggregated';
import { portfolioSelectors, portfolioThunks } from 'store/ducks/portfolio';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import Loader from 'shared-components/views/components/Loader';
import ColumnConfigDrawer from './components/ColumnConfigDrawer';
// import AggregatedIndicatorsTable from './components/AggregatedIndicatorsTable'; // Removed - now using dedicated page
import CustomErrorBoundary from '../../containers/CustomErrorBoundary';
import { exportAggregatedData } from './utils/exportUtils';

const PortfolioAggregatedView = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const ventures = useSelector(portfolioSelectors.getPortfolioVentures()) || [];
  const data = useSelector(portfolioAggregatedSelectors.getVisibleData);
  const fullData = useSelector(portfolioAggregatedSelectors.getFilteredData);
  const allColumns = useSelector(portfolioAggregatedSelectors.getAllColumns);
  const visibleColumns = useSelector(portfolioAggregatedSelectors.getVisibleColumns);
  const filters = useSelector(portfolioAggregatedSelectors.getFilters);
  const loading = useSelector(portfolioAggregatedSelectors.getLoading);
  
  const [columnDrawerOpen, setColumnDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedVentures, setSelectedVentures] = useState(filters.ventureIds || []);
  
  useEffect(() => {
    if (portfolioId) {
      // Load saved column preferences
      dispatch(portfolioAggregatedActions.loadVisibleColumnsFromStorage());
      
      // Fetch ventures for filtering
      dispatch(portfolioThunks.fetchPortfolioVentures(portfolioId));
      
      // Fetch data
      dispatch(portfolioAggregatedThunks.fetchAggregatedData({ portfolioId, filters }));
      dispatch(portfolioAggregatedThunks.fetchColumnConfig(portfolioId));
      // dispatch(portfolioAggregatedThunks.fetchAggregatedIndicators(portfolioId)); // Removed - not needed for this view
    }
  }, [dispatch, portfolioId]);
  
  useEffect(() => {
    // Update filters when search term changes
    const timeoutId = setTimeout(() => {
      dispatch(portfolioAggregatedActions.setFilters({ search: searchTerm }));
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, dispatch]);
  
  useEffect(() => {
    // Update filters when ventures selection changes
    dispatch(portfolioAggregatedActions.setFilters({ ventureIds: selectedVentures }));
    // Refetch data with new filters
    if (portfolioId && selectedVentures !== undefined) {
      dispatch(portfolioAggregatedThunks.fetchAggregatedData({ 
        portfolioId, 
        filters: { ventureIds: selectedVentures } 
      }));
    }
  }, [selectedVentures, dispatch, portfolioId]);
  
  const handleCreateIndicator = () => {
    navigate(`/portfolios/${portfolioId}/aggregated-indicators/create`);
  };
  
  const handleExport = () => {
    const portfolioName = portfolio?.name || 'Portfolio';
    
    exportAggregatedData(
      fullData || data, 
      visibleColumns, 
      allColumns,
      portfolioName
    );
  };
  
  const getColumnLabel = (columnId) => {
    const column = allColumns.find(col => col.id === columnId);
    return column ? column.label : columnId;
  };

  const getColumnWidth = (columnId) => {
    const column = allColumns.find(col => col.id === columnId);
    return column && column.width ? column.width : 120; // Default to 120px if no width specified
  };
  
  const formatCellValue = (value, columnId) => {
    if (value === null || value === undefined) return '-';

    // Handle logo columns - render as image
    if (columnId === 'ventureLogo' && typeof value === 'string' && value.trim() !== '') {
      return (
        <Box
          component="img"
          src={value}
          alt="Company Logo"
          sx={{
            maxHeight: 48,
            maxWidth: 120,
            objectFit: 'contain',
            borderRadius: 1
          }}
          onError={(e) => {
            // Fallback to placeholder on error
            e.target.src = 'https://via.placeholder.com/120x48?text=No+Logo';
            e.target.alt = 'Logo not available';
          }}
        />
      );
    }

    // Handle different data types
    if (columnId.includes('actual') || columnId.includes('forecast')) {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }

    if (Array.isArray(value)) {
      // Handle arrays of objects (like industries)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return value.map(item => {
          // Try different property names that might contain the display value
          if (item.name) return item.name;
          if (item.title) return item.title;
          if (item.label) return item.label;
          // Fallback to JSON string if no recognizable property
          return JSON.stringify(item);
        }).join(', ');
      }
      // Handle arrays of primitives (strings, numbers, etc.)
      return value.join(', ');
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle objects (like geography, etc.)
    if (typeof value === 'object' && value !== null) {
      // If it has a name property, use that
      if (value.name) return value.name;
      // If it has a title property, use that
      if (value.title) return value.title;
      // If it has a code property, use that
      if (value.code) return value.code;
      // Otherwise, convert to JSON string as fallback
      return JSON.stringify(value);
    }

    return value;
  };
  
  if (loading) {
    return <Loader />;
  }
  
  return (
    <CustomErrorBoundary>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Header Toolbar */}
        <Paper elevation={1} sx={{ borderRadius: 0 }}>
          <Toolbar sx={{ px: 3, py: 2 }}>
            <Typography variant="h5" sx={{ flexGrow: 0, mr: 3 }}>
              Aggregated Portfolio View
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel>Filter by Ventures</InputLabel>
              <Select
                multiple
                value={selectedVentures}
                onChange={(e) => setSelectedVentures(e.target.value)}
                input={<OutlinedInput label="Filter by Ventures" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.length === 0 ? (
                      <em>All Ventures</em>
                    ) : (
                      `${selected.length} selected`
                    )}
                  </Box>
                )}
              >
                {ventures.map((venture) => {
                  // Handle both venture structures
                  const ventureId = venture.venture?.id || venture.id;
                  const ventureName = venture.venture?.name || venture.name || 'Unknown';
                  return (
                    <MenuItem key={ventureId} value={ventureId}>
                      {ventureName}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              placeholder="Search ventures, impacts, indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {(selectedVentures.length > 0 || searchTerm) && (
              <Button
                size="small"
                onClick={() => {
                  setSelectedVentures([]);
                  setSearchTerm('');
                }}
                sx={{ mr: 2 }}
              >
                Clear Filters
              </Button>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateIndicator}
              sx={{ mr: 1 }}
            >
              Create Indicator
            </Button>
            
            <IconButton onClick={() => setColumnDrawerOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </Paper>

        {/* Aggregated Indicators Table removed - now using dedicated page */}

        {/* Main Table */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Paper elevation={1} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {visibleColumns.map(columnId => (
                      <TableCell
                        key={columnId}
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          minWidth: getColumnWidth(columnId),
                          width: getColumnWidth(columnId)
                        }}
                      >
                        {getColumnLabel(columnId)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No data available. Make sure your portfolio has ventures with impact chains and indicators.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow 
                        key={`${row.ventureId}-${row.impactId}-${row.indicatorId}`}
                        hover
                        sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                      >
                        {visibleColumns.map(columnId => (
                          <TableCell key={columnId} sx={{ py: 1 }}>
                            {formatCellValue(row[columnId], columnId)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
        
        {/* Column Configuration Drawer */}
        <ColumnConfigDrawer 
          open={columnDrawerOpen}
          onClose={() => setColumnDrawerOpen(false)}
        />
      </Box>
    </CustomErrorBoundary>
  );
};

export default PortfolioAggregatedView;
