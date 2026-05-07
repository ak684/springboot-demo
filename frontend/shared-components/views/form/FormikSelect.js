import React, { memo } from 'react';
import { useField } from 'formik';
import Select from './Select';
import { FormHelperText, useTheme } from '@mui/material';

const FormikSelect = ({ name, ...rest }) => {
  const theme = useTheme();
  const [field, state] = useField(name);

  return (
    <>
      <Select {...field} {...rest} sendEvent />
      {!!state.error && state.touched && (
        <FormHelperText sx={{ color: theme.palette.error.main }}>
          {state.touched && state.error}
        </FormHelperText>
      )}
    </>
  );
};

export default memo(FormikSelect);
