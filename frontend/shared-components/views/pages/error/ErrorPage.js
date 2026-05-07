import React, { memo } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { HEADER_HEIGHT } from "../../../utils/constants";

const StyledWrapper = styled(Box, { shouldForwardProp: prop => prop !== 'withHeader' })(({ withHeader }) => ({
  height: withHeader ? `calc(100vh - ${HEADER_HEIGHT}px)` : '100vh',
  backgroundImage: 'url(/images/background/error.jpg)',
  backgroundSize: 'cover',
}));

const ErrorPage = (
  {
    title = 'Something went wrong',
    message = 'It appears something went wrong on our end. We are working to resolve the problem. Please try again later.',
    withHeader,
  }
) => {
  const reloadPage = () => {
    window.location.assign('/');
  };

  return (
    <StyledWrapper withHeader={withHeader}>
      <Box pt={25} pl={22} sx={{ maxWidth: 800 }}>
        <Typography variant='display' color='white'>{title}</Typography>
        <Box mt={3}>
          <Typography variant='body' color='white'>{message}</Typography>
        </Box>
        <Box mt={4}>
          <Button startIcon={<ChevronLeftIcon />} onClick={reloadPage}>Back to dashboard</Button>
        </Box>
      </Box>
    </StyledWrapper>
  );
};

export default memo(ErrorPage);
