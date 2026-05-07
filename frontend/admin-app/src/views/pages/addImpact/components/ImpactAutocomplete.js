import React, { memo } from 'react';
import { Autocomplete, Box, useTheme } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { useSelector } from "react-redux";
import { impactSelectors } from "../../../../store/ducks/impact";
import TextInput from "shared-components/views/form/TextInput";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactAutocomplete = ({ nextStep, name, title, description, tooltip, values, setFieldValue }) => {
  const theme = useTheme();
  const autofillValues = useSelector(impactSelectors.getImpactAutofillValues());

  const handleChange = (e, value) => {
    setFieldValue(name, value || '');
  };

  const handleBlur = (e) => {
    setFieldValue(name, e.target.value);
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>{title}</StepperTitle>
          <StepperDescription tooltip={tooltip}>{description}</StepperDescription>
          <Autocomplete
            sx={{ mr: 0.25 }}
            selectOnFocus
            options={autofillValues[name]}
            freeSolo
            value={values[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            renderInput={(params) => (
              <TextInput
                {...params}
                multiline
                value={params.inputProps.value}
                variant='standard'
                placeholder='Type your answer here...'
                inputProps={{ ...params.inputProps, maxLength: 100, style: { ...getTypography('h1') } }}
                letterCounter
              />
            )}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactAutocomplete);
