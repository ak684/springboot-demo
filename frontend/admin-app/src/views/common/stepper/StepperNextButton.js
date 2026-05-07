import React, { memo } from 'react';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const StepperNextButton = ({ last, nextStep, children, ...rest }) => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = (e) => {
    if (last) {
      // For last step, let the form handle submission
      return;
    } else {
      if (nextStep) {
        nextStep();
      }
    }
  };

  return (
    <Box
      mt={{ xs: 0, sm: 4 }}
      display='flex'
      flexDirection={{ xs: 'column', sm: 'row' }}
      alignItems='center'
      gap={2}
      width={{ xs: '100%', sm: 'unset' }}
    >
      <Button
        type={last ? 'submit' : 'button'}
        onClick={handleClick}
        endIcon={<CheckIcon />}
        fullWidth={isMobileView}
        {...rest}
      >
        {last ? 'Save' : 'Next'}
      </Button>
      {children}
    </Box>
  );
};

export default memo(StepperNextButton);
