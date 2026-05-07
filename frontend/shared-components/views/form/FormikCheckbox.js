import React, { memo } from 'react';
import { default as MuiCheckbox } from '@mui/material/Checkbox';
import { useField } from 'formik';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';

const FormikCheckbox = ({ name, label, ...rest }) => {
  const [field, state] = useField(name);

  return (
    <FormControl>
      <FormControlLabel
        {...rest}
        label={label}
        control={<MuiCheckbox {...field} color='error' checked={!!field.value} />}
      />
      {!!state.error && state.touched && <Typography color='error' variant='caption'>{state.error}</Typography>}
    </FormControl>
  );
};

export default memo(FormikCheckbox);
