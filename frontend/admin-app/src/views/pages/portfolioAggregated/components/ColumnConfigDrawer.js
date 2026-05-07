import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Divider,
  Button,
  List,
  ListItem,
  IconButton
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { portfolioAggregatedSelectors, portfolioAggregatedActions } from 'store/ducks/portfolioAggregated';
import CloseIcon from '@mui/icons-material/Close';

const ColumnConfigDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const columnConfig = useSelector(portfolioAggregatedSelectors.getColumnConfig);
  const visibleColumns = useSelector(portfolioAggregatedSelectors.getVisibleColumns);
  
  const handleColumnToggle = (columnId, checked) => {
    let newVisibleColumns;
    if (checked) {
      newVisibleColumns = [...visibleColumns, columnId];
    } else {
      newVisibleColumns = visibleColumns.filter(id => id !== columnId);
    }
    dispatch(portfolioAggregatedActions.setVisibleColumns(newVisibleColumns));
  };
  
  const handleSelectAll = (groupColumns) => {
    const groupColumnIds = groupColumns.map(col => col.id);
    const newVisibleColumns = [...new Set([...visibleColumns, ...groupColumnIds])];
    dispatch(portfolioAggregatedActions.setVisibleColumns(newVisibleColumns));
  };
  
  const handleDeselectAll = (groupColumns) => {
    const groupColumnIds = groupColumns.map(col => col.id);
    const newVisibleColumns = visibleColumns.filter(id => !groupColumnIds.includes(id));
    dispatch(portfolioAggregatedActions.setVisibleColumns(newVisibleColumns));
  };
  
  const renderColumnGroup = (groupName, columns) => {
    if (!columns || !Array.isArray(columns)) return null;
    
    const groupTitle = groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/([A-Z])/g, ' $1');
    const allSelected = columns.every(col => visibleColumns.includes(col.id));
    const someSelected = columns.some(col => visibleColumns.includes(col.id));
    
    return (
      <Box key={groupName} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {groupTitle}
          </Typography>
          <Box>
            <Button 
              size="small" 
              onClick={() => handleSelectAll(columns)}
              disabled={allSelected}
            >
              All
            </Button>
            <Button 
              size="small" 
              onClick={() => handleDeselectAll(columns)}
              disabled={!someSelected}
            >
              None
            </Button>
          </Box>
        </Box>
        
        <List dense>
          {columns.map(column => (
            <ListItem key={column.id} sx={{ py: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={visibleColumns.includes(column.id)}
                    onChange={(e) => handleColumnToggle(column.id, e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{column.label}</Typography>
                    {column.description && (
                      <Typography variant="caption" color="text.secondary">
                        {column.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ width: '100%', m: 0 }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };
  
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Configure Columns</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose which columns to display in the aggregated portfolio view. Your preferences will be saved automatically.
        </Typography>
        
        {columnConfig && Object.entries(columnConfig).map(([groupName, columns]) => (
          <React.Fragment key={groupName}>
            {renderColumnGroup(groupName, columns)}
            <Divider sx={{ my: 2 }} />
          </React.Fragment>
        ))}
        
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {visibleColumns.length} of {
              Object.values(columnConfig || {}).flat().length
            } available columns
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ColumnConfigDrawer;
