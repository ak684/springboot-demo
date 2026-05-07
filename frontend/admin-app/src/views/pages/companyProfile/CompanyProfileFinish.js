import React, { memo } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { useSelector } from 'react-redux';
import { userSelectors } from 'store/ducks/user';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ventureSelectors } from 'store/ducks/venture';
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { getProfileCompletion } from "shared-components/utils/venture";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledPieChart = styled(Box)(({ theme, percent }) => ({
  position: 'relative',
  display: 'inline-grid',
  placeContent: 'center',
  width: theme.spacing(25),
  height: theme.spacing(25),
  marginBottom: theme.spacing(8),
  marginLeft: 'auto',
  marginRight: 'auto',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${theme.palette.primary.main} calc(${percent} * 1%), ${theme.palette.primary.subtle} 0)`,
    mask: `radial-gradient(farthest-side, #0000 calc(99% - 20px), #000 calc(100% - 20px))`,
  }
}));

const CompanyProfileFinish = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const percentCompletion = getProfileCompletion(venture);
  const user = useSelector(userSelectors.getCurrentUser());

  return (
    <CustomErrorBoundary>
      <Box display='flex'
        justifyContent='center'
        alignItems='center'
        sx={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <Box width={900} display='flex' flexDirection='column' alignItems='center'>
          <StyledPieChart percent={percentCompletion}>
            <Typography align='center' sx={{ fontSize: 28, fontWeight: 'bold' }}>{percentCompletion}%</Typography>
            <Typography align='center' variant='caption' sx={{ mt: 0.5 }}>Profile completeness</Typography>
          </StyledPieChart>
          <Typography variant='h1' sx={{ mb: 4 }}>
            {percentCompletion >= 50 ? 'Great work' : 'Still a bit of work to do here'}, {user.name}!
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: 24, lineHeight: '32px' }}>
            You can update your venture's profile any time.
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 4, fontSize: 24, lineHeight: '32px' }}>
            Hit next to manage your venture's impact
          </Typography>
          <Box mt={1} display='flex' alignItems='center' gap={2}>
            <Button
              color='secondary'
              component={Link}
              to={`/ventures/${ventureId}/profile-wizard`}
              sx={{ my: 1 }}
              startIcon={<ChevronLeftIcon />}
            >
              Back
            </Button>
            <Button
              component={Link}
              to={`/ventures/${ventureId}`}
              sx={{ my: 1 }}
              endIcon={<ChevronRightIcon />}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileFinish);
