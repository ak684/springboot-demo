import React, { memo } from 'react';
import { Box, styled } from '@mui/material';

const StyledBox = styled(Box)(({ theme, percent }) => ({
  width: theme.spacing(2),
  height: theme.spacing(2),
  flexShrink: 0,
  position: 'relative',
  backgroundColor: theme.palette.secondary.light,
  borderRadius: '50%',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${theme.palette.secondary.dark} calc(${percent * 100} * 1%), #0000 0)`,
    mask: 'radial-gradient(farthest-side, #000 0, #000 0)'
  }
}));

const ProgressPie = ({ percent, ...rest }) => {
  return (
    <StyledBox percent={percent} {...rest} />
  );
};

export default memo(ProgressPie);
