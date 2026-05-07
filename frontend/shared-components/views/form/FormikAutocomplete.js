import React, { memo } from 'react';
import { useField } from 'formik';
import { Autocomplete, FormHelperText, useTheme } from '@mui/material';

const FormikAutocomplete = ({ name, onChange: customOnChange, ...rest }) => {
  const theme = useTheme();
  const [{ onChange, ...field }, state, { setValue }] = useField(name);

  const handleChange = (e, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Autocomplete {...field} {...rest} onChange={customOnChange || handleChange} />
      {!!state.error && state.touched && (
        <FormHelperText sx={{ color: theme.palette.error.main }}>
          {state.touched && state.error}
        </FormHelperText>
      )}
    </>
  );
};

export default memo(FormikAutocomplete);
