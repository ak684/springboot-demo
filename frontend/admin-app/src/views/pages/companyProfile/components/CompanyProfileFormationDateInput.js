import React, { memo } from 'react';
import { Box, useTheme } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikDatepicker from "shared-components/views/form/FormikDatepicker";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileFormationDateInput = ({ nextStep }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Date of legal entity formation</StepperTitle>
          <StepperDescription>Please provide the date when your legal entity was formed</StepperDescription>
          <Box>
            <FormikDatepicker name='formationDate' />
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileFormationDateInput);
