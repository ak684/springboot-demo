import React, { memo } from 'react';
import { useField } from 'formik';
import TextInput from './TextInput';

const FormikTextInput = ({ name, disableError, onBlur, onChange, ...rest }) => {
  const [{ onBlur: formikOnBlur, onChange: formikOnChange, ...field }, state] = useField(name);
  const handleBlur = (e) => {
    formikOnBlur(e);
    onBlur && onBlur(e);
  }

  const handleChange = (e) => {
    formikOnChange(e);
    onChange && onChange(e);
  }

  return (
    <TextInput
      {...field}
      {...rest}
      onBlur={handleBlur}
      onChange={handleChange}
      error={!disableError && !!state.error && state.touched}
      helperText={!disableError && !!state.error && state.touched && state.error}
    />
  );
};

export default memo(FormikTextInput);
