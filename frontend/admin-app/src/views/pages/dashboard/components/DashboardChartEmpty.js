import React from 'react';
import { Box, styled, Typography } from '@mui/material';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 62,
  height: 62,
  background: theme.palette.secondary.subtle,
  borderRadius: 8,
}));

const DashboardChartEmpty = () => {
  return (
    <CustomErrorBoundary>
      <Box display='flex' alignItems='center' justifyContent='center' gap={2} flexDirection='column' height={200}>
        <StyledIconWrapper>
          <Box component='img' src='/images/icons/search.svg' alt='Not found'></Box>
        </StyledIconWrapper>
        <Typography align='center' variant='overline' color='secondary.main'>No data found</Typography>
      </Box>
    </CustomErrorBoundary>
  );
};

export default DashboardChartEmpty;
