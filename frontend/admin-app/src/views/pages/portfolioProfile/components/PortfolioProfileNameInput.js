import React, { memo } from 'react';
import { Box, Button } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PortfolioProfileNameInput = ({ nextStep, openAiModal }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Please provide your portfolio name below</StepperTitle>
          <StepperDescription>You can change it later if needed</StepperDescription>
          <Box display='flex' alignItems='center' gap={8}>
            <FormikTextInput
              name='name'
              placeholder='Type your answer here...'
              inputProps={{ maxLength: 250, style: { ...getTypography('h1') } }}
              InputLabelProps={{ style: { ...getTypography('h1') } }}
              onKeyDown={handleKeyDown}
              autoFocus
              fullWidth
            />
            <Button onClick={openAiModal} sx={{ p: 1, minWidth: 'unset' }}>
              <Box component='img' src='/images/icons/openai.svg' />
            </Button>
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioProfileNameInput);
