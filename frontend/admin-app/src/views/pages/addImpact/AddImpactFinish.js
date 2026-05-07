import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { useSelector } from 'react-redux';
import { userSelectors } from 'store/ducks/user';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AddImpactFinish = () => {
  const { ventureId } = useParams();
  const user = useSelector(userSelectors.getCurrentUser());

  return (
    <CustomErrorBoundary>
      <Box display='flex'
        justifyContent='center'
        alignItems='center'
        sx={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <Box width={650}>
          <Typography align='center' variant='h1' sx={{ mb: 4 }}>
            Congratulations, {user.name}!
          </Typography>
          <Typography align='center' color='text.secondary' sx={{ fontSize: 24, lineHeight: '32px' }}>
            On the next page have a look at your Theory of Change.
          </Typography>
          <Typography align='center' color='text.secondary' sx={{ mb: 4, fontSize: 24, lineHeight: '32px' }}>
            We recommend to use 3-5 positive and 1-2 negative impact chains to describe your venture's innovation
            impact.
          </Typography>
          <Box display='flex' justifyContent='center'>
            <Button
              component={Link}
              to={`/ventures/${ventureId}/table`}
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

export default memo(AddImpactFinish);
