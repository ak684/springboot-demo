import React, { memo, useEffect } from 'react';
import { Box, Grid, MenuItem, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import QuantificationDurationChart from "./QuantificationDurationChart";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import QuantificationImpactPotentialCard from "./QuantificationImpactPotentialCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const durationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30, 35, 40, 45, 50];

const QuantificationDurationInput = ({ values, setFieldValue, index, impact, indicator, nextStep }) => {
  useEffect(() => {
    const duration = values.indicators[index].duration;
    const dropoff = [...values.indicators[index].dropoff];
    if (dropoff.length + 1 > duration) {
      dropoff.length = duration - 1;
    } else if (dropoff.length + 1 < duration) {
      const valuesToAdd = Math.min(duration - dropoff.length - 1, values.productsData.length - dropoff.length - 1);
      for (let i = 0; i < valuesToAdd; i++) {
        dropoff.push(0);
      }
    }
    setFieldValue(`indicators[${index}].dropoff`, dropoff);
  }, [values.indicators[index].duration]);

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Duration</StepperTitle>
          <Grid mt={4} container spacing={2}>
            <Grid item xs={4}>
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='body'>
                  For how many years in total will the outcome occur (including the current year)?
                </Typography>
                <FormikTextInput name={`indicators[${index}].duration`} select sx={{ minWidth: 80 }}>
                  {durationOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </FormikTextInput>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <QuantificationDurationChart values={values} index={index} />
            </Grid>
            <Grid item xs={4}>
              <QuantificationImpactPotentialCard impact={values} indicator={values.indicators[index]} />
            </Grid>
          </Grid>
          <StepperNextButton nextStep={nextStep}>
            <StepperNotesButton screen='duration' impact={impact} indicator={indicator} />
          </StepperNextButton>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationDurationInput);
