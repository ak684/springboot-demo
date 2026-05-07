import React from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikSdgItem from './FormikSdgItem';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ScoringSdgSelect = ({ nextStep }) => {
  const goals = useSelector(dictionarySelectors.getGoals());

  const checkLength = (newValue) => {
    if (newValue.length === 3) {
      nextStep();
    }
  };

  const goalItems = goals.map(g =>
    <FormikSdgItem goal={g} key={g.name} selectable showTooltip size={130} onClick={checkLength} />
  );

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Selecting Sustainable Development Goals</StepperTitle>
          <StepperDescription>Click on 1-3 SDGs to which your impact chain on the left contributes</StepperDescription>
          <Box display='flex' flexWrap='wrap' gap={1}>
            {goalItems}
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default ScoringSdgSelect;
