import * as React from 'react';
import { memo } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Paper, Step, StepContent, StepLabel, Stepper, styled, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Logo from "shared-components/views/components/Logo";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledStep = styled(Step)(({ theme }) => ({
  '.MuiStepLabel-iconContainer': {
    marginRight: theme.spacing(2),
  },
  '.MuiStepContent-root': {
    paddingLeft: theme.spacing(4.5),
  }
}));

const EmptyIcon = () => <Box sx={{
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '2px solid #C0C0C0',
}} />;

const CreationSteps = () => {
  return (
    <CustomErrorBoundary>
      <Grid container component='main' sx={{ height: '100vh' }}>
        <Grid
          item
          sm={false}
          md={6}
          lg={7}
          sx={{
            backgroundImage: 'url(/images/background/start.jpg)',
            backgroundSize: 'cover'
          }}
          display={{ xs: 'none', sm: 'none', md: 'block' }}
        >
          <Box ml={12.5} mr={17.5} mt='70vh'>
            <Typography color='white' variant='h1'>It's easy to start managing your impact!</Typography>
          </Box>
        </Grid>
        <Grid item sm={12} md={6} lg={5} component={Paper} elevation={6} square>
          <Box mt={12} mx={12}>
            <Logo mb='35vh' />
            <Stepper orientation='vertical'>
              <StyledStep completed>
                <StepLabel><Typography variant='h5'>Create a subscription</Typography></StepLabel>
                <StepContent>
                  <Typography variant='caption'>
                    Upgrade and downgrade flexibly, invite team members without extra cost to collaborate.
                  </Typography>
                </StepContent>
              </StyledStep>
              <StyledStep active>
                <StepLabel StepIconComponent={EmptyIcon}>
                  <Typography variant='h5'>Create a company profile</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant='caption'>
                    Key data you can use for reporting output, benchmarking and automating data collection.
                  </Typography>
                </StepContent>
              </StyledStep>
              <StyledStep active>
                <StepLabel StepIconComponent={EmptyIcon}>
                  <Typography variant='h5'>Manage your impact</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant='caption'>
                    Iterative, step by step wizards, automated, growing in complexity with your venture.
                  </Typography>
                </StepContent>
              </StyledStep>
            </Stepper>

            <Button sx={{ mt: 5 }} component={Link} to='/ventures/profile-wizard?step=0' startIcon={<AddIcon />}>
              Create company profile
            </Button>
          </Box>
        </Grid>
      </Grid>
    </CustomErrorBoundary>
  );
};

export default memo(CreationSteps);
