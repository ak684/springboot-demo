import React from 'react';
import directionIcon from 'theme/icons/direction.svg';
import { Box } from '@mui/material';

const StepperDivider = () => {
  return (
    <Box component='img' src={directionIcon} ml={6} width={3} />
  );
};

export default StepperDivider;
