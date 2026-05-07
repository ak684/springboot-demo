import React, { memo } from 'react';
import { Autocomplete, Box } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import InfoAlert from 'views/common/InfoAlert';
import { useSelector } from "react-redux";
import { impactSelectors } from "../../../../store/ducks/impact";
import TextInput from "shared-components/views/form/TextInput";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactSpecificStakeholderInput = ({ nextStep, values, setFieldValue }) => {
  const autofillValues = useSelector(impactSelectors.getImpactAutofillValues());

  const stakeholdersOnChange = (e, value) => {
    setFieldValue('stakeholders', value || '');
  };

  const stakeholdersOnBlur = (e) => {
    setFieldValue('stakeholders', e.target.value);
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Who benefits? (Stakeholders)</StepperTitle>
          <StepperDescription>Who are the stakeholders benefiting from the change?</StepperDescription>
          <Autocomplete
            sx={{ mr: 0.25 }}
            selectOnFocus
            options={autofillValues.stakeholders}
            freeSolo
            value={values.stakeholders}
            onChange={stakeholdersOnChange}
            onBlur={stakeholdersOnBlur}
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
          <InfoAlert title='Suggestion' sx={{ mt: 4 }}>
            <Box>
              You will quantify later "how many" stakeholders your reach. So best is referring to the smallest unit,
              i.e.
              individuals belonging to a stakeholder group.
            </Box>
          </InfoAlert>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactSpecificStakeholderInput);
