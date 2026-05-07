import React, { memo } from 'react';
import { Typography } from '@mui/material';
import AppTooltip from '../AppTooltip';

const StepperTitle = ({ children, tooltip, sx = {}, ...rest }) => {
  return (
    <Typography variant='h2' sx={{ mb: 0.5, display: 'flex', gap: 1, alignItems: 'center', ...sx }} {...rest}>
      {children}
      {tooltip && <AppTooltip>{tooltip}</AppTooltip>}
    </Typography>
  );
};

export default memo(StepperTitle);
