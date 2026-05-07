import React, { memo } from 'react';
import { Box, styled, Tooltip } from '@mui/material';
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledItem = styled(Box,
  { shouldForwardProp: prop => prop !== 'selectable' })
(({ theme, selected, selectable, size }) => ({
  position: 'relative',
  width: size,
  height: size,
  padding: '2px',
  border: selectable ? selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent' : 'none',
  cursor: selectable ? 'pointer' : 'default',
  borderRadius: '10px',
}));

const SdgItem = ({ goal, showTooltip, selectable, selected, onClick, size = 100, children, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <Tooltip title={showTooltip ? goal.description : null} placement='top'>
        <StyledItem
          onClick={onClick}
          selected={selected}
          selectable={selectable}
          size={size}
          {...rest}
        >
          <Box
            component='img'
            src={goal.image}
            alt={goal.description}
            width='100%'
            height='100%'
            sx={{ borderRadius: '10px' }}
          />
          {children}
        </StyledItem>
      </Tooltip>
    </CustomErrorBoundary>
  );
};

export default memo(SdgItem);
