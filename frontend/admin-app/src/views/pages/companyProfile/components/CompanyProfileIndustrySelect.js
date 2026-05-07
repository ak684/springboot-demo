import React, { memo } from 'react';
import { Autocomplete, Box, Checkbox, styled, TextField, Typography, useTheme } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperDescription from 'views/common/stepper/StepperDescription';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { useSelector } from 'react-redux';
import { escapeRegExp } from "shared-components/utils/helpers";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const icon = <CheckBoxOutlineBlankIcon fontSize='small' />;
const checkedIcon = <CheckBoxIcon fontSize='small' />;

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  paddingRight: theme.spacing(1),
  '.MuiFormLabel-root': {
    top: -4,
  },
  '.MuiChip-root': {
    backgroundColor: theme.palette.primary.subtle,
    borderRadius: 8,
  },
  '.MuiChip-label': {
    padding: theme.spacing(0, 2),
    ...getTypography('h5'),
  }
}));

const CompanyProfileIndustrySelect = ({ values, nextStep, setFieldValue }) => {
  const industries = useSelector(dictionarySelectors.getIndustries());
  const theme = useTheme();

  const onChange = (e, value) => {
    setFieldValue('industries', value.map(val => val.name).filter(val => val));
  };

  const onKeyDown = (e) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>In what industry will your venture be mainly active?</StepperTitle>
          <StepperDescription>Select 1-3 below</StepperDescription>
          <StyledAutocomplete
            multiple
            options={industries}
            getOptionLabel={(option) => option?.title || ''}
            value={values.industries.map(v => industries.find(i => i.name === v))}
            onChange={onChange}
            renderOption={(props, option, { selected }) => (
              <li {...props} style={{ fontSize: 20 }} key={option.name}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                <Box display='inline-flex' justifyContent='space-between' gap={4}>
                  <Typography color='text.disabled'>{option.group.title}</Typography>
                  <Typography>{option.title}</Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                label='Industries'
                placeholder='Start typing industry name here'
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

export default memo(CompanyProfileIndustrySelect);
