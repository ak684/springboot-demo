import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import TextField from "@mui/material/TextField";
import { escapeRegExp } from "shared-components/utils/helpers";
import FormikAutocomplete from "shared-components/views/form/FormikAutocomplete";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileCurrencyInput = ({ nextStep }) => {
  const units = useSelector(dictionarySelectors.getUnits());
  const currencies = units.filter(u => u.isoCode);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>What is the main currency of your venture?</StepperTitle>
          <StepperDescription>Financial figures will be shown in this currency</StepperDescription>
          <FormikAutocomplete
            name='currency'
            sx={{ '.MuiInputBase-root': { height: 40 }, maxWidth: 400 }}
            options={currencies}
            getOptionLabel={(option) => option ? `${option.isoCode} (${option.symbol})` : ''}
            renderOption={(props, option) => (
              <li {...props} style={{ fontSize: 20 }} key={option.name}>
                <Box display='flex' justifyContent='space-between' gap={4} width='100%'>
                  <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
                  <Typography sx={{ width: 50, flexGrow: 0, flexShrink: 0 }} color='text.disabled'>
                    {option.isoCode}
                  </Typography>
                  <Typography sx={{ width: 50, flexGrow: 0, flexShrink: 0 }}>
                    {option.symbol}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                placeholder='Currency'
              />
            )}
            filterOptions={(arr, search) => {
              const escapedInput = escapeRegExp(search.inputValue || '');
              return arr.filter(i => new RegExp(escapedInput, 'i').test(i.label)
                || new RegExp(escapedInput, 'i').test(i.isoCode)
                || new RegExp(escapedInput, 'i').test(i.symbol))
                .slice(0, 24);
            }}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            onKeyDown={onKeyDown}
          />
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileCurrencyInput);
