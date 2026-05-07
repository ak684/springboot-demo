import React, { memo } from 'react';
import { Autocomplete, Box, Paper, styled, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { escapeRegExp } from "shared-components/utils/helpers";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  paddingRight: theme.spacing(1),
  '.MuiFormLabel-root': {
    top: -4,
  },
  '.MuiInputBase-root': {
    marginTop: 14,
  },
  '.MuiInputBase-input': {
    ...getTypography('bodyBold'),
  },
}));

const StyledPaper = (props) => (
  <Paper {...props} style={{ width: 350 }} />
);

const MeasurementUnitSelector = ({ indicator, values, setFieldValue, ...rest }) => {
  const units = useSelector(dictionarySelectors.getUnits());
  const editedIndicator = values.indicators.find(i => i.id === indicator.id);

  const onChange = (e, value) => {
    setFieldValue(`indicators[${values.indicators.indexOf(editedIndicator)}].unit`, value);
  };

  return (
    <CustomErrorBoundary>
      <StyledAutocomplete
        options={units}
        getOptionLabel={(option) => option ? `${option.isoCode ? option.isoCode + ' ' : ''}(${option.symbol})` : ''}
        value={editedIndicator.unit || null}
        onChange={onChange}
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
            placeholder='Start typing unit name here'
          />
        )}
        filterOptions={(arr, search) => {
          const escapedInput = escapeRegExp(search.inputValue || '');
          return escapedInput.length >= 1 ?
            arr.filter(i => new RegExp(escapedInput, 'i').test(i.label)
              || new RegExp(escapedInput, 'i').test(i.isoCode)
              || new RegExp(escapedInput, 'i').test(i.symbol))
              .slice(0, 24)
            : [];
        }}
        PaperComponent={StyledPaper}
        isOptionEqualToValue={(option, value) => option.name === value.name}
        {...rest}
      />
    </CustomErrorBoundary>
  );
};

export default memo(MeasurementUnitSelector);
