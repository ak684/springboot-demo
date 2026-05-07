import React, { memo } from 'react';
import { Stack, Typography } from '@mui/material';
import WarningIcon from "@mui/icons-material/Warning";

const Error = ({ message }) => {
  return (
    <Stack direction='row' justifyContent='center' alignItems='center' p={2} gap={1} height='100%'>
      <WarningIcon sx={{ color: 'error.main' }} />
      <Typography variant='body2' color='error'>{message}</Typography>
    </Stack>
  );
};

export default memo(Error);
