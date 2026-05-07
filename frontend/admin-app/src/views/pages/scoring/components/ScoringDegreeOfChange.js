import React, { memo } from 'react';
import { Box } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikSlider from "shared-components/views/form/FormikSlider";
import SliderWrapper from "shared-components/views/form/SliderWrapper";
import FormikRadioButton from "shared-components/views/form/FormikRadioButton";
import FormikRadioGroup from "shared-components/views/form/FormikRadioGroup";
import ScoringAiExplanation from "./ScoringAiExplanation";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ScoringDegreeOfChange = ({ nextStep, name, title, description, items, values, setFieldValue }) => {
  const valueBreakpoints = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const explanation = values[name + 'Explanation'];

  const clearExplanation = () => {
    setFieldValue(name + 'Explanation', '');
  }

  const itemSelected = () => {
    clearExplanation();
    nextStep();
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <Box display='flex' alignItems='center' gap={2}>
            <StepperTitle>{title}</StepperTitle>
            {explanation && <ScoringAiExplanation>{explanation}</ScoringAiExplanation>}
          </Box>
          <StepperDescription>{description}</StepperDescription>
          <FormikRadioGroup name={name} onClick={itemSelected} type='number' sx={{ mb: 4 }}>
            {items.map((i, index) => <FormikRadioButton key={i.name}
              value={valueBreakpoints[index]}
              label={i.description} />)}
          </FormikRadioGroup>
          <SliderWrapper label={`${values.degreeOfChange}% involvement`}>
            <FormikSlider
              name={name}
              min={1}
              max={100}
              valueLabelFormat={(val) => `${val}%`}
              onChange={clearExplanation}
            />
          </SliderWrapper>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringDegreeOfChange);
