import React, { memo } from 'react';
import { Box, useTheme } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactIndicatorInput = ({ nextStep, index }) => {
  const theme = useTheme();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      nextStep();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Indicators</StepperTitle>
          <StepperDescription
            tooltip={(
              <ol>
                <li>Try to find an indicator that could help you measuring the change that you have described above.
                </li>
                <li>Do not spend too much time on this initially. You will still refine this several times later.</li>
                <li>
                  We suggest to use indicators that are realistically measurable, i.e. rather "income increase per
                  stakeholder pre vs. post intervention" rather than "improve peoples lives".
                </li>
                <li>
                  For the quantification later it is better to use indicators with absolute numbers, rather than
                  percentage changes.
                </li>
              </ol>
            )}
          >
            Which proxy could measure the change that you describe in step "Change (impact)"?
          </StepperDescription>
          <FormikTextInput
            name={`indicators[${index}].name`}
            onKeyDown={handleKeyDown}
            placeholder='Type your answer here...'
            inputProps={{ maxLength: 100, style: { ...getTypography('h1') } }}
            InputLabelProps={{ style: { ...getTypography('h1') } }}
            autoFocus
            multiline
            fullWidth
            letterCounter
          />
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactIndicatorInput);
