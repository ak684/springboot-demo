import React from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export const InfoRow = ({ label, value, dataType = null, icon = null, onEdit = null, fieldName = null }) => {
  const isEmpty = !value || value === 'N/A' || value === '';
  
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'flex-start',
      py: 1.5,
      borderBottom: '1px solid #f5f5f5',
      '&:last-child': {
        borderBottom: 'none'
      },
      position: 'relative',
      '&:hover .edit-button': {
        opacity: onEdit ? 1 : 0
      },
      gap: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        minWidth: '140px',
        flexShrink: 0
      }}>
        {icon && (
          <Box sx={{ color: '#999999', display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography sx={{ 
          fontSize: '16px',
          color: '#666666',
          fontWeight: 400
        }}>
          {label}
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        flex: 1,
        justifyContent: 'flex-end'
      }}>
        <Typography sx={{ 
          fontSize: '16px',
          color: isEmpty ? '#999999' : '#333333',
          fontWeight: 500,
          fontStyle: isEmpty ? 'italic' : 'normal',
          textAlign: 'right',
          lineHeight: 1.4
        }}>
          {isEmpty ? 'Not specified' : value}
        </Typography>
        {dataType && !isEmpty && (
          <Tooltip title={dataType === 'actual' ? 'Actual data' : 'Estimated data'}>
            <Box sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: dataType === 'actual' ? '#4caf50' : '#ff9800',
              flexShrink: 0,
              mt: 0.5
            }} />
          </Tooltip>
        )}
        {onEdit && fieldName ? (
          <Tooltip title={`Edit ${label}`}>
            <IconButton 
              size="small" 
              onClick={() => onEdit(fieldName, value)}
              className="edit-button"
              sx={{ 
                ml: 1,
                opacity: 0,
                transition: 'opacity 0.2s',
                minWidth: 'auto',
                padding: '4px',
                alignSelf: 'flex-start',
                mt: -0.5
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : onEdit ? null : (
          // Spacer to maintain alignment when there's no edit button
          <Box sx={{ 
            width: 32, // Same width as small IconButton
            ml: 1,     // Same margin as edit button
            flexShrink: 0
          }} />
        )}
      </Box>
    </Box>
  );
};

export const CompactCard = ({ children, ...props }) => (
  <Box
    sx={{
      backgroundColor: '#ffffff',
      borderRadius: 1,
      p: 2,
      height: '100%',
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Box>
);

// Updated EditableField to use InfoRow
export const EditableField = ({ 
  label, 
  value, 
  fieldName, 
  onEdit, 
  icon,
  multiline = false,
  rows = 1,
  editable = true,
  dataType = null 
}) => {
  const displayValue = value || 'Not specified';
  const isEmpty = !value || value === 'N/A';

  return (
    <InfoRow 
      label={label}
      value={displayValue}
      dataType={dataType}
      icon={icon}
      onEdit={editable ? onEdit : null}
      fieldName={fieldName}
    />
  );
};

export const EmptyState = ({ message, icon }) => (
  <Box 
    sx={{ 
      textAlign: 'center', 
      py: 6,
      px: 3,
      backgroundColor: '#f8f8f8',
      borderRadius: 1
    }}
  >
    {icon && (
      <Box sx={{ 
        color: 'text.disabled', 
        mb: 2,
        '& svg': { fontSize: 48 }
      }}>
        {icon}
      </Box>
    )}
    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '13px' }}>
      {message}
    </Typography>
  </Box>
);

export const DataChip = ({ label, value, color = 'default' }) => (
  <Chip
    label={
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    }
    sx={{ 
      height: 'auto',
      py: 1,
      '& .MuiChip-label': {
        display: 'block',
        whiteSpace: 'normal'
      }
    }}
    color={color}
  />
);

export const getScoreColor = (score, max) => {
  const ratio = score / max;
  if (ratio >= 0.8) return 'success.main';
  if (ratio >= 0.6) return 'warning.main';
  return 'error.main';
};