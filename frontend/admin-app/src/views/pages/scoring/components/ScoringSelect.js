import React, { memo } from 'react';
import { Box } from '@mui/material';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikRadioGroup from "shared-components/views/form/FormikRadioGroup";
import FormikRadioButton from "shared-components/views/form/FormikRadioButton";
import ScoringAiExplanation from "./ScoringAiExplanation";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ScoringSelect = (
  { nextStep, name, fieldName, title, description, items, values, indicator, last, setFieldValue, isSubmitting }
) => {
  const explanation = indicator
    ? values.indicatorScores.find(is => is.indicator.id === indicator.id)[fieldName + 'Explanation']
    : values[fieldName + 'Explanation'];

  const itemSelected = () => {
    setFieldValue(fieldName + 'Explanation', '');
    if (!last) {
      nextStep();
    }
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          {indicator && <StepperTitle>{indicator.name}</StepperTitle>}
          <Box display='flex' alignItems='center' gap={2}>
            {title && <StepperTitle>{title}</StepperTitle>}
            {explanation && <ScoringAiExplanation>{explanation}</ScoringAiExplanation>}
          </Box>
          <StepperDescription>{description}</StepperDescription>
          <FormikRadioGroup name={name} onClick={itemSelected} type='object'>
            {items.map(i => <FormikRadioButton key={i.name} value={JSON.stringify(i)} label={i.description} />)}
          </FormikRadioGroup>
          <StepperNextButton nextStep={nextStep} last={last} disabled={isSubmitting} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringSelect);
