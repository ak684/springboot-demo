import React, { memo } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { default as MuiSelect } from '@mui/material/Select';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material';

const StyledSelect = styled(MuiSelect)(({ theme }) => ({
  height: theme.spacing(5),
}));

const Select = (
  { fullWidth, label, value, onChange, sendEvent = false, disabled = false, children, variant, ...props }
) => {
  const theme = useTheme();

  const handleChange = e => {
    onChange(e.target.value);
  };

  const select = (
    <StyledSelect
      value={value}
      label={label}
      onChange={sendEvent ? onChange : handleChange}
      disabled={disabled}
      variant={variant}
      {...props}
    >
      {children}
    </StyledSelect>
  );

  // toDO: Find different way to handle this so the root element is always the same
  return label ?
    (
      <FormControl fullWidth={fullWidth} disabled={disabled} variant={variant} sx={{ minWidth: 200 }} size={300}>
        <InputLabel>{label}</InputLabel>
        {select}
      </FormControl>
    )
    : select;
};

export default memo(Select);
