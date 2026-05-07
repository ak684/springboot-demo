import React, { memo, useEffect } from 'react';
import { Box, Button, styled } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1),
  minWidth: 0,
  minHeight: 0,
}));

const StepperControls = ({ step, next, previous, last, onSkip, forwardOnEnter = true, backAllowed = true }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !last) {
      e.preventDefault();
      next();
    }
  }

  useEffect(() => {
    if (forwardOnEnter) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [last, next]);

  return (
    <CustomErrorBoundary>
      <Box display='flex' justifyContent='flex-end' gap={1} mr={{ xs: 3, lg: 9 }}>
        {onSkip && (
          <Button variant='outlined' onClick={onSkip} endIcon={<SkipNextIcon />}>
            Save and exit
          </Button>
        )}
        <StyledButton color='secondary' onClick={previous} disabled={step === 0 || !backAllowed}>
          <ArrowUpwardIcon />
        </StyledButton>
        <StyledButton color='secondary' onClick={next} disabled={last}>
          <ArrowDownwardIcon />
        </StyledButton>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(StepperControls);
