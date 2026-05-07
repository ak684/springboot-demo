import React, { memo } from 'react';
import { Autocomplete, Box, Checkbox, styled, TextField } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperDescription from 'views/common/stepper/StepperDescription';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { useSelector } from 'react-redux';
import InfoAlert from 'views/common/InfoAlert';
import { escapeRegExp } from "shared-components/utils/helpers";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const icon = <CheckBoxOutlineBlankIcon fontSize='small' />;
const checkedIcon = <CheckBoxIcon fontSize='small' />;

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
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

const ScoringStakeholderGeographyInput = ({ values, nextStep, setFieldValue }) => {
  const geography = useSelector(dictionarySelectors.getGeography());

  const geographyOnChange = (e, value) => {
    setFieldValue('geography', value.filter(val => val));
  };

  const geographyCustomOnChange = (e, value) => {
    setFieldValue('geographyCustom', value);
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Geographic boundary</StepperTitle>
          <StepperDescription>
            Wherever possible, indicate countries or regions where your stakeholders are located
          </StepperDescription>
          <StyledAutocomplete
            multiple
            options={geography}
            getOptionLabel={(option) => option?.title || ''}
            value={values.geography}
            onChange={geographyOnChange}
            renderOption={(props, option, { selected }) => (
              <li {...props} style={{
                paddingLeft: ['CONTINENT', 'REGION'].includes(option.geographicType) ? 0 : 32,
                fontSize: 20
              }}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.title}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                label='Stakeholder geography'
                placeholder='Stakeholder geography'
                InputLabelProps={{ style: { ...getTypography('h5') } }}
              />
            )}
            onKeyDown={(e) => e.stopPropagation()}
            filterOptions={(arr, search) => {
              const escapedInput = escapeRegExp(search.inputValue || '');
              return escapedInput.length >= 1 ?
                arr.filter(i => new RegExp(escapedInput, 'i').test(i.title)).slice(0, 24) :
                [];
            }}
            freeSolo
          />
          <InfoAlert sx={{ mt: 4, mb: 2 }}>
            If you cannot find the region you are looking for in the list above, indicate all the regions you need in
            the
            input below. Press Enter after typing each region name to create a record for it. If you want your custom
            region to be added to the system, send us a message about it by clicking the feedback button at the bottom
            right of the screen
          </InfoAlert>
          <StyledAutocomplete
            multiple
            selectOnFocus
            clearOnBlur
            options={[]}
            renderOption={(props, option) => <li {...props}>{option}</li>}
            freeSolo
            value={values.geographyCustom}
            onChange={geographyCustomOnChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                label='Custom regions'
                placeholder='Custom regions'
                InputLabelProps={{ style: { ...getTypography('h5') } }}
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

export default memo(ScoringStakeholderGeographyInput);
