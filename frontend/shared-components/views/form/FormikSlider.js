import React from 'react';
import { useField } from 'formik';
import { Slider, styled } from '@mui/material';

const StyledSlider = styled(Slider)(({ theme }) => ({
  '.MuiSlider-valueLabel': {
    background: theme.palette.text.secondary,
    opacity: 0.80,
    borderRadius: '4px',
    '& *': {
      background: theme.palette.text.secondary,
    }
  },
  '.MuiSlider-track': {
    height: 10,
  },
  '.MuiSlider-rail': {
    height: 6,
    backgroundColor: theme.palette.background.fade,
  }
}));

const FormikSlider = ({ name, children, onChange, ...rest }) => {
  const [{ onChange: formikOnChange, ...field }] = useField(name);

  const handleChange = (e) => {
    formikOnChange(e);
    onChange && onChange(e.target.value);
  };

  return (
    <StyledSlider defaultValue={0} valueLabelDisplay='on' {...field} onChange={handleChange} {...rest} />
  );
};

export default FormikSlider;
