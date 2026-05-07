import React, { useEffect } from 'react';
import { Box, Button, CircularProgress, styled, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { userSelectors, userThunks } from 'store/ducks/user';
import { useDispatch, useSelector } from 'react-redux';
import WizardStartButton from '../../common/stepper/WizardStartButton';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import { getBranding } from 'shared-components/utils/branding';

const StyledPageWrapper = styled(Box)(({ theme }) => ({
  height: '100vh',
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/welcome.jpg)',
  backgroundSize: 'cover',
}));

const Activation = () => {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(userSelectors.getUserIntro());
  const loading = useSelector(userSelectors.userIntroLoading());
  const companyName = getBranding().companyName;

  useEffect(() => {
    setTimeout(() => {
      dispatch(userThunks.fetchUserIntroBySession(sessionId));
    }, 3000);
  }, []);

  return (
    <CustomErrorBoundary>
      <StyledPageWrapper>
        <Box sx={{ maxWidth: 700 }}>
          <Typography color='white' variant='display' sx={{ mb: 3 }}>
            Welcome to {companyName}
          </Typography>
          <Typography color='white' variant='body'>
            We will help you identify how our actions (innovations) lead to positive changes for stakeholders and how
            you
            can measure it.
          </Typography>
          {!user && loading && (
            <Typography sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 4 }} color='white'>
              Your account is being activated, this might take a few moments... <CircularProgress />
            </Typography>
          )}
          {!user && !loading && (
            <Box mt={4}>
              <Typography color='white'>Something went wrong</Typography>
              <Button sx={{ mt: 4 }} onClick={() => window.location.reload()}>Try again</Button>
            </Box>
          )}
          {user && (
            <Box mt={4}>
              <WizardStartButton component={Link} to='/create-account' />
            </Box>
          )}
        </Box>
      </StyledPageWrapper>
    </CustomErrorBoundary>
  );
};

export default Activation;
