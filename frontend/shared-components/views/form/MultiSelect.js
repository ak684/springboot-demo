import React, { memo } from 'react';
import Select from './Select';
import { Chip, Input, styled } from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { getTypography } from "../../utils/typography";

const StyledFormControl = styled(FormControl)(() => ({
  '.MuiInputBase-root': {
    height: 'unset',
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '.MuiChip-root': {
    backgroundColor: theme.palette.primary.subtle,
    borderRadius: 8,
  },
  '.MuiChip-label': {
    padding: theme.spacing(0, 2),
    ...getTypography('h5'),
  },
}));

const StyledInputLabel = styled(InputLabel)(() => ({
  transform: 'translate(0, 16px) scale(1)',
  '&.MuiInputLabel-shrink': {
    transform: 'translate(0, -9px) scale(0.75)',
  }
}));

const MultiSelect = ({ name, value, onChange, onDelete, label, children, labelPath, keyPath, ...rest }) => {
  return (
    <StyledFormControl {...rest}>
      {label && <StyledInputLabel>{label}</StyledInputLabel>}
      <StyledSelect
        multiple
        name={name}
        value={value}
        onChange={onChange}
        input={<Input label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((item) => (
              <Chip
                key={item[keyPath]}
                label={item[labelPath]}
                onDelete={onDelete && !item.disabled ? () => onDelete(item) : undefined}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ))}
          </Box>
        )}
      >
        {children}
      </StyledSelect>
    </StyledFormControl>
  );
};

export default memo(MultiSelect);
