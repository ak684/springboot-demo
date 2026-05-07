import React, { memo } from 'react';
import { Box } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikRadioGroup from "shared-components/views/form/FormikRadioGroup";
import FormikRadioButton from "shared-components/views/form/FormikRadioButton";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileSelect = ({ nextStep, name, title, description, tooltip, items }) => {
  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>{title}</StepperTitle>
          <StepperDescription tooltip={tooltip}>{description}</StepperDescription>
          <FormikRadioGroup name={name} onClick={nextStep} gridItemProps={{ sm: 12, md: 6, lg: 4 }}>
            {items.map(i => <FormikRadioButton key={i.name} value={i.name} label={i.title} />)}
          </FormikRadioGroup>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileSelect);
