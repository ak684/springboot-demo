import React, { memo } from 'react';
import { Box, useTheme } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactTextInput = ({ submit }) => {
  const theme = useTheme();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle
            tooltip='In many cases, titles refer to your key activities (if you have different ones), or different stakeholder groups (if you have different ones) or different impact types (if you have different ones).'
          >
            Before saving, please add a short title describing your impact chain
          </StepperTitle>
          <FormikTextInput
            name='name'
            placeholder='Title'
            inputProps={{ maxLength: 60, style: { ...getTypography('h1') } }}
            InputLabelProps={{ style: { ...getTypography('h1') } }}
            onKeyDown={handleKeyDown}
            autoFocus
            multiline
            fullWidth
            letterCounter
          />
          <StepperNextButton last />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactTextInput);
