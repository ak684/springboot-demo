import React, { memo } from 'react';
import { Card, Typography } from '@mui/material';

const SliderWrapper = ({ image, label, children, ...rest }) => {
  return (
    <Card sx={{ p: (theme) => theme.spacing(3, 4, 2), overflow: 'visible' }} {...rest} >
      {children}
      {label && <Typography variant='caption'>{label}</Typography>}
    </Card>
  );
};

export default memo(SliderWrapper);
