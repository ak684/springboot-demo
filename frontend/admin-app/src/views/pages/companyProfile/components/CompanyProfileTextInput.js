import React, { memo } from 'react';
import { Box } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileTextInput = (
  { nextStep, name, title, description, placeholder = 'Type your answer here...', tooltip, type = 'text', last = false }
) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (!last) {
        e.stopPropagation();
        nextStep();
      }
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>{title}</StepperTitle>
          <StepperDescription tooltip={tooltip}>{description}</StepperDescription>
          <FormikTextInput
            name={name}
            type={type}
            placeholder={placeholder}
            inputProps={{ maxLength: 250, style: { ...getTypography('h1') } }}
            InputLabelProps={{ style: { ...getTypography('h1') } }}
            onKeyDown={handleKeyDown}
            autoFocus
            multiline={type === 'text'}
            fullWidth
          />
          <StepperNextButton type={last ? 'submit' : 'button'} nextStep={last ? null : nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileTextInput);
