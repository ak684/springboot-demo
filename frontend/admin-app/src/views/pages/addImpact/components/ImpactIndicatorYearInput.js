import React, { memo } from 'react';
import { Box } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { yearOptions } from "shared-components/utils/constants";
import FormikRadioGroup from "shared-components/views/form/FormikRadioGroup";
import FormikRadioButton from "shared-components/views/form/FormikRadioButton";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactIndicatorInput = ({ nextStep, index }) => {
  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Indicators</StepperTitle>
          <StepperDescription>
            In what year have you started or do you believe will it be possible to start collecting data for this
            indicator?
          </StepperDescription>
          <FormikRadioGroup name={`indicators[${index}].year`} onClick={nextStep}>
            {yearOptions.map(y => <FormikRadioButton key={y.value} value={y.value} label={y.label} />)}
          </FormikRadioGroup>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactIndicatorInput);
