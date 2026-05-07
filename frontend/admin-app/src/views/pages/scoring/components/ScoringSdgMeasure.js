import React from 'react';
import { Box, Card, styled } from '@mui/material';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { useField } from 'formik';
import { clone } from 'shared-components/utils/lo';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import SdgItem from 'views/common/SdgItem';
import { getTypography } from "shared-components/utils/typography";
import FormikSlider from "shared-components/views/form/FormikSlider";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledSliderWrapper = styled(Card)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3, 2, 2),
  overflowY: 'visible',
}));

const StyledSlider = styled(FormikSlider)(({ theme }) => ({
  '.MuiSlider-markLabel': {
    ...getTypography('caption'),
  }
}));

const ScoringSdgMeasure = ({ nextStep }) => {
  const goals = useSelector(dictionarySelectors.getGoals());
  const [, { value }, { setValue }] = useField('goals');

  // Always keep sum of all sliders equal to 100. If one slider updated - update the others accordingly
  const handleSliderChange = (val, index) => {
    let diff = val - value[index].rate;

    if (diff === 0 || value.length === 1) {
      return;
    }

    const updatedGoals = clone(value);
    updatedGoals[index].rate = val;

    if (diff > 0) {
      while (diff > 0) {
        const goalToChangeIndex = updatedGoals.findLastIndex((g, i) => g.rate > 0 && index !== i);
        const initialValue = updatedGoals[goalToChangeIndex].rate;
        updatedGoals[goalToChangeIndex].rate = Math.max(updatedGoals[goalToChangeIndex].rate - diff, 0);
        diff -= initialValue;
      }
    } else {
      updatedGoals[index === value.length - 1 ? value.length - 2 : value.length - 1].rate -= diff;
    }

    setValue(updatedGoals);
  };

  const goalItems = value
    .map(goal => goals.find(g => g.name === goal.goal.name))
    .map((g, index) => (
      <StyledSliderWrapper sx={{ gap: 2 }} key={g.name}>
        <SdgItem goal={g} />
        <Box flexGrow={1}>
          <StyledSlider
            name={`goals[${index}.rate`}
            min={0}
            max={100}
            step={5}
            onChange={(val) => handleSliderChange(val, index)}
            valueLabelFormat={(val) => `${val}%`}
            marks={[
              { value: 0, label: '0%' },
              { value: 25, label: '25%' },
              { value: 50, label: '50%' },
              { value: 75, label: '75%' },
              { value: 100, label: '100%' }
            ]}
          />
        </Box>
      </StyledSliderWrapper>
    ));

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Selecting Sustainable Development Goals</StepperTitle>
          <StepperDescription>Assign percentage to your SDGs</StepperDescription>
          <Box display='flex' gap={2} flexDirection='column'>
            {goalItems}
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default ScoringSdgMeasure;
