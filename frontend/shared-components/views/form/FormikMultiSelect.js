import React, { memo } from 'react';
import { useField } from 'formik';
import { Box, FormHelperText, useTheme } from '@mui/material';
import MultiSelect from './MultiSelect';

const FormikMultiSelect = ({ name, ...rest }) => {
  const theme = useTheme();
  const [{ onChange, onBlur, ...field }, state, { setValue }] = useField(name);

  const handleChange = (value) => {
    setValue(value);
  };

  const removeItem = (item) => {
    setValue(field.value.filter(v => v !== item));
  };

  return (
    <Box>
      <MultiSelect {...field} onChange={handleChange} onDelete={removeItem} {...rest} />
      {!!state.error && state.touched && (
        <FormHelperText sx={{ color: theme.palette.error.main, marginLeft: 0 }}>
          {state.touched && state.error}
        </FormHelperText>
      )}
    </Box>
  );
};

export default memo(FormikMultiSelect);
