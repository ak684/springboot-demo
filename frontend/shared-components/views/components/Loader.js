import React from 'react';
import { Backdrop, Box, CircularProgress } from '@mui/material';

const Loader = ({ fullscreen, p = 2, size = 40, color = 'primary' }) => {
  return fullscreen ? (
    <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open>
      <CircularProgress color={color} size={size} />
    </Backdrop>
  ) : (
    <Box p={p} display='flex' justifyContent='center'>
      <CircularProgress color={color} size={size} />
    </Box>
  );
};

export default Loader;
