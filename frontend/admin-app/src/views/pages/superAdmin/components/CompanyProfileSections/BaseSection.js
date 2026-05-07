import React from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const BaseSection = ({ 
  title, 
  subtitle,
  icon, 
  children, 
  collapsible = false,
  defaultExpanded = true,
  actions,
  noPadding = false 
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section Title in Grey Background Area */}
      {(title || icon) && (
        <Box 
          sx={{ 
            mb: 1,
            pt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: collapsible ? 'pointer' : 'default'
          }}
          onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        >
          <Box>
            <Typography 
              sx={{ 
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: '#666666',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              {icon && (
                <Box sx={{ 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiSvgIcon-root': {
                    fontSize: 22
                  }
                }}>
                  {icon}
                </Box>
              )}
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#999999',
                  fontSize: '14px',
                  mt: 0.5,
                  display: 'block'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {actions}
            {collapsible && (
              <IconButton size="small" sx={{ color: '#999999' }}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>
      )}
      
      {/* White Card Content */}
      <Box sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 2,
        overflow: 'visible'
      }}>
        <Collapse in={!collapsible || expanded}>
          <Box sx={{ p: noPadding ? 0 : 3 }}>
            {children}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default BaseSection;