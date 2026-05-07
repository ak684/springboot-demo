import React from 'react';
import { Typography } from '@mui/material';
import AppTooltip from '../AppTooltip';

const StepperTitle = ({ children, tooltip }) => {
  return (
    <>
      <Typography sx={{ mb: 4, display: 'inline-flex', gap: 1 }} color='text.secondary'>
        {children}
        {tooltip && <AppTooltip>{tooltip}</AppTooltip>}
      </Typography>
    </>
  );
};

export default StepperTitle;
