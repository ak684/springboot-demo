import React, { memo } from 'react';
import { Box, styled, Typography, useTheme } from "@mui/material";
import { alpha } from '@mui/material/styles';

const StyledTextWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  zIndex: 1,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  padding: theme.spacing(),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(),
}))

const VenturesOverviewChartLine = ({ left, right, text, progress }) => {
  const theme = useTheme();

  return (
    <Box position='relative' height={32} backgroundColor={theme.palette.background.fade}>
      <Box backgroundColor={alpha(theme.palette.primary.main, 0.5)} width={progress + '%'} height='100%' />
      <StyledTextWrapper>
        <Typography variant='captionBold'>{left}</Typography>
        <Typography variant='caption' noWrap title={text}>{text}</Typography>
        <Typography variant='captionBold'>{right}</Typography>
      </StyledTextWrapper>
    </Box>
  );
};

export default memo(VenturesOverviewChartLine);
