import React, { memo } from 'react';
import { useField } from 'formik';
import Typography from '@mui/material/Typography';
import { Grid, RadioGroup } from '@mui/material';

const FormikRadioGroup = ({ name, children, onClick, type, gridItemProps = {}, ...rest }) => {
  const [{ onChange, ...field }, state, { setValue }] = useField(name);

  const handleChange = (e) => {
    const value = e.target.value;
    let processedValue;
    if (['false', 'true'].includes(value)) {
      processedValue = value === 'true';
      setValue(processedValue);
    } else if (type === 'number') {
      processedValue = Number(value);
      setValue(processedValue);
    } else if (type === 'object') {
      processedValue = JSON.parse(value);
      setValue(processedValue);
    } else {
      processedValue = value;
      setValue(processedValue);
    }
    onClick && onClick(processedValue);
  };

  const defaultGridItemProps = { xs: 12, sm: 6 };
  const itemProps = { ...defaultGridItemProps, ...gridItemProps };

  const childrenWithProps = React.Children.map(
    children,
    (child, index) => React.isValidElement(child) ?
      <Grid item key={index} {...itemProps}>
        {React.cloneElement(child, { name, index })}
      </Grid>
      : child
  );

  return (
    <>
      <RadioGroup {...field} onChange={handleChange} {...rest} name={name}>
        <Grid container spacing={1}>
          {childrenWithProps}
        </Grid>
      </RadioGroup>
      {!!state.error && state.touched && <Typography color='error' variant='caption'>{state.error}</Typography>}
    </>
  );
};

export default memo(FormikRadioGroup);
