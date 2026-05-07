import React, { memo } from 'react';
import { Typography } from "@mui/material";

const FieldLabel = ({ children, sx = {}, ...rest }) => {
  return (
    <Typography
      sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', ...sx }}
      color='secondary.dark'
      {...rest}
    >
      {children}
    </Typography>
  );
};

export default memo(FieldLabel);
