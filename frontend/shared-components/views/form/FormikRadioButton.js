import React, { memo } from 'react';
import { Box, FormControlLabel, Radio, styled } from '@mui/material';
import { useField } from 'formik';
import { alpha } from '@mui/material/styles';
import { getTypography } from "../../utils/typography";

const StyledFormControlLabel = styled(FormControlLabel)(({ theme, selected }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  marginLeft: 0,
  marginRight: 0,
  background: 'white',
  borderRadius: 16,
  boxShadow: selected ? `inset 0 0 0 2px ${theme.palette.primary.main}` : `inset 0 0 0 1px ${theme.palette.border}`,
  '& .MuiRadio-root': {
    display: 'none',
  }
}));

const StyledIndexLetter = styled(Box)(({ theme, selected }) => ({
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.secondary.main, 0.2),
  color: selected ? theme.palette.primary.main : theme.palette.secondary.main,
  borderRadius: theme.shape.borderRadius,
  ...getTypography('h4'),
}));

const numberToCharacter = number => {
  const A = 'A'.charCodeAt(0);
  return String.fromCharCode(A + number);
};

const CustomLabel = ({ label, index, selected }) => (
  <Box display='flex' alignItems='center' gap={2}>
    <StyledIndexLetter selected={selected}>{numberToCharacter(index)}</StyledIndexLetter>
    <Box>{label}</Box>
  </Box>
);

const FormikRadioButton = ({ value, label, index, name }) => {
  const [field] = useField(name);
  const selected = field.value === value || JSON.stringify(field.value) === value;

  return (
    <StyledFormControlLabel
      selected={selected}
      value={value}
      label={<CustomLabel label={label} index={index} selected={selected} />}
      control={<Radio />}
    />
  );
};

export default memo(FormikRadioButton);
