import React, { memo } from 'react';
import { Autocomplete, Box, styled, TextField } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { useSelector } from 'react-redux';
import { escapeRegExp } from "shared-components/utils/helpers";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  marginTop: theme.spacing(4),
  paddingRight: theme.spacing(1),
  '.MuiFormLabel-root': {
    top: -4,
  },
  '.MuiInputBase-input': {
    ...getTypography('h2'),
  }
}));

const CompanyProfileGeographyInput = ({ values, nextStep, setFieldValue }) => {
  const geography = useSelector(dictionarySelectors.getGeography());

  const onChange = (e, value) => {
    setFieldValue('country', value || null);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const countries = geography
    .filter(g => g.geographicType === 'COUNTRY')
    .sort((c1, c2) => c1.name.localeCompare(c2.name));

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>
            {
              values.legalEntityFormed ?
                'In which country are you venture\'s headquarters / main office?' :
                'In which country do you believe your venture will be created'
            }
          </StepperTitle>
          <StyledAutocomplete
            options={countries}
            getOptionLabel={(option) => option?.title || ''}
            value={values.country || null}
            onChange={onChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                label='Country'
                placeholder='Start typing country name here'
                InputLabelProps={{ style: { ...getTypography('h5') } }}
              />
            )}
            onKeyDown={onKeyDown}
            filterOptions={(arr, search) => {
              const escapedInput = escapeRegExp(search.inputValue || '');
              return escapedInput.length >= 1 ?
                arr.filter(i => new RegExp(escapedInput, 'i').test(i.title)).slice(0, 24) :
                [];
            }}
            freeSolo
          />
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileGeographyInput);
