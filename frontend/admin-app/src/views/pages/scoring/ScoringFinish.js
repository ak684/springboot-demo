import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSelector } from 'react-redux';
import { userSelectors } from 'store/ducks/user';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const ScoringFinish = () => {
  const { ventureId } = useParams();
  const user = useSelector(userSelectors.getCurrentUser());

  return (
    <CustomErrorBoundary>
      <Box display='flex'
        justifyContent='center'
        alignItems='center'
        sx={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <Box maxWidth={700}>
          <Typography align='center' variant='h1' sx={{ mb: 4 }}>
            Congratulations, {user.name}!
          </Typography>
          <Typography align='center' sx={{ fontSize: 24, lineHeight: '32px' }}>
            On the next page have a look at your Scored Impact Chain(s).
          </Typography>
          <Typography align='center' color='text.secondary' sx={{ mb: 4, fontSize: 24, lineHeight: '32px' }}>
            The score itself is not so important. What is relevant will be your progress how you improve your scores in
            future.
          </Typography>
          <Box display='flex' justifyContent='center'>
            <Button
              component={Link}
              to={`/ventures/${ventureId}/scoring-wizard`}
              sx={{ my: 1 }}
              endIcon={<ChevronRightIcon />}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringFinish);
