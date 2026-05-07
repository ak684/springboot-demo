import React, { memo } from 'react';
import { Box, Grid, InputAdornment } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import QuantificationNetOutcomeChart from "./QuantificationNetOutcomeChart";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import { getTypography } from "shared-components/utils/typography";
import QuantificationImpactPotentialCard from "./QuantificationImpactPotentialCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const QuantificationDeadweightInput = ({ values, index, impact, indicator, nextStep }) => {
  const value = values.indicators[index].deadweight;

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Deadweight</StepperTitle>
          <StepperDescription>
            Explain below if and how much of the outcome would be achieved without your contribution (how much in %)?
          </StepperDescription>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormikTextInput
                fullWidth
                name={`indicators[${index}].deadweight`}
                type='number'
                placeholder='Please indicate'
                inputProps={{ style: { ...getTypography('h4') } }}
                InputProps={{
                  endAdornment:
                    <InputAdornment position="end">%{value === 0 ? ' (no deadweight)' : ''}</InputAdornment>
                }}
              />
              {value > 0 && (
                <Box mt={4}>
                  <FormikTextInput
                    fullWidth
                    name={`indicators[${index}].deadweightComment`}
                    placeholder='Please explain here'
                    multiline
                    inputProps={{ maxLength: 250 }}
                    letterCounter
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={4}>
              <QuantificationNetOutcomeChart values={values} index={index} />
            </Grid>
            <Grid item xs={4}>
              <QuantificationImpactPotentialCard impact={values} indicator={values.indicators[index]} />
            </Grid>
          </Grid>
          <Box mt={2}>
            <StepperNextButton nextStep={nextStep}>
              <StepperNotesButton screen='deadweight' impact={impact} indicator={indicator} />
            </StepperNextButton>
          </Box>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationDeadweightInput);
