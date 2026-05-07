import * as React from 'react';
import { memo } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { userThunks } from 'store/ducks/user';
import { Paper, Typography } from '@mui/material';
import { Form, withFormik } from 'formik';
import store from 'store';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Logo from 'shared-components/views/components/Logo';
import { Link } from 'react-router-dom';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import AuthLeftPart from './AuthLeftPart';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import {
  getAuthBackground,
  getAuthBackgroundColor,
  getBranding,
  isWhiteLabelEnabled,
} from 'shared-components/utils/branding';

const ForgotPassword = () => {
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const submitLabel = whiteLabel.authForgotSubmitLabel || 'Send instructions';
  const description = whiteLabel.authForgotPasswordDescription
    || 'Enter the email address associated with your account and we\'ll send you a link to reset your password.';
  const whiteLabelEnabled = isWhiteLabelEnabled();

  if (!whiteLabelEnabled) {
    return (
      <CustomErrorBoundary>
        <Grid container component='main' sx={{ height: '100vh' }}>
          <Grid
            item
            sm={false}
            md={6}
            lg={7}
            sx={{ backgroundColor: getAuthBackgroundColor() }}
            display={{ xs: 'none', sm: 'none', md: 'block' }}
          >
            <AuthLeftPart />
          </Grid>
          <Grid item sm={12} md={6} lg={5} component={Paper} elevation={6} square>
            <Box mt={12} mx={17}>
              <Logo mb={33} />
              <Typography variant='h1' sx={{ mb: 3 }}>Forgot your password?</Typography>
              <Typography variant='subtitle'>
                {description}
              </Typography>
              <Box component={Form} sx={{ mt: 1 }}>
                <FormikTextInput
                  sx={{ my: 2 }}
                  name='email'
                  placeholder='Email address'
                  autoComplete='email'
                  autoFocus
                  fullWidth
                />
                <Button type='submit' fullWidth sx={{ my: 2 }}>
                  {submitLabel}
                </Button>
                <Button component={Link} to='/login' fullWidth color='secondary'>Cancel</Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CustomErrorBoundary>
    );
  }

  return (
    <CustomErrorBoundary>
      <Grid container component='main' sx={{ height: '100vh' }}>
        <Grid
          item
          sm={false}
          md={6}
          lg={7}
          sx={{ background: getAuthBackground() }}
          display={{ xs: 'none', sm: 'none', md: 'block' }}
        >
          <AuthLeftPart />
        </Grid>
        <Grid
          item
          sm={12}
          md={6}
          lg={5}
          component={Paper}
          elevation={6}
          square
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ mx: { xs: 3, sm: 17 }, mt: { xs: 6, sm: 12 } }}>
            <Logo />
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              mx: { xs: 3, sm: 17 },
              py: { xs: 4, sm: 6 },
            }}
          >
            <Typography variant='h1' sx={{ mb: 2 }}>Forgot your password?</Typography>
            <Typography variant='subtitle' sx={{ mb: 2 }}>
              {description}
            </Typography>
            <Box component={Form}>
              <FormikTextInput
                sx={{ my: 2 }}
                name='email'
                placeholder='Email address'
                autoComplete='email'
                autoFocus
                fullWidth
              />
              <Button
                type='submit'
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.5,
                  ...(whiteLabel.authBackgroundColor && {
                    backgroundColor: whiteLabel.authBackgroundColor,
                    '&:hover': {
                      backgroundColor: whiteLabel.authBackgroundColor,
                      filter: 'brightness(0.9)',
                    },
                  }),
                }}
              >
                {submitLabel}
              </Button>
              <Button component={Link} to='/login' fullWidth color='secondary' sx={{ mt: 2 }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  email: Yup.string().required(() => messages.errors.validation.required).email(() => messages.errors.validation.email),
});

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      email: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      store.dispatch(userThunks.forgotPassword(data));
      helpers.setSubmitting(false);
      helpers.resetForm();
    },
  })
  (ForgotPassword)
);
