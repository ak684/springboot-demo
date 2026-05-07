import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const FinishIndicatorInput = ({ nextStep, setFieldValue, values }) => {
  const addIndicator = () => {
    setFieldValue('indicators', [...values.indicators, { name: '', year: '' }]);
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box display='flex' alignItems='center' justifyContent='center'>
          <Box width={400} sx={{ textAlign: 'center' }}>
            <Typography variant='h2' sx={{ mb: 4 }}>Add another indicator?</Typography>
            <Button color='secondary' sx={{ mb: 2 }} onClick={addIndicator} fullWidth>
              Add new indicator
            </Button>
            <Button color='secondary' onClick={nextStep} fullWidth>Finish</Button>
          </Box>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default FinishIndicatorInput;
