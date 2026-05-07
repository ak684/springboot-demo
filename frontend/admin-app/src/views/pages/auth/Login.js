import * as React from 'react';
import { memo, useState } from 'react';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { IconButton, InputAdornment, Paper, Tooltip, Typography } from '@mui/material';
import { Form, withFormik } from 'formik';
import store from 'store';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Logo from 'shared-components/views/components/Logo';
import AuthLeftPart from './AuthLeftPart';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import {
  getAuthBackground,
  getAuthBackgroundColor,
  getBranding,
  isWhiteLabelEnabled,
} from 'shared-components/utils/branding';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const Login = ({ values }) => {
  const user = useSelector(userSelectors.getCurrentUser());
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const pricingUrl = branding.pricingUrl;
  const [showPassword, setShowPassword] = useState(false);
  const whiteLabelEnabled = isWhiteLabelEnabled();

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const hasPasswordInput = values?.password?.length > 0;
  const submitLabel = whiteLabel.authLoginSubmitLabel || 'Log In';

  if (user) {
    return <Navigate to='/' replace />;
  }

  const passwordInput = (
    <FormikTextInput
      sx={{ my: 2 }}
      name='password'
      type={showPassword ? 'text' : 'password'}
      placeholder='Password'
      autoComplete='current-password'
      fullWidth
      InputProps={{
        endAdornment: hasPasswordInput ? (
          <InputAdornment position='end'>
            <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
              <IconButton
                aria-label='toggle password visibility'
                onClick={handleTogglePasswordVisibility}
                edge='end'
                size='small'
              >
                {showPassword
                  ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : null,
      }}
    />
  );

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
            <Box mt={{ xs: 6, sm: 12 }} mx={{ xs: 3, sm: 17 }}>
              <Logo mb={{ xs: 10, sm: 33 }} />
              <Typography variant='h1'>Login</Typography>
              <Box component={Form} sx={{ mt: 1 }}>
                <FormikTextInput
                  sx={{ my: 2 }}
                  name='email'
                  placeholder='Email address'
                  autoComplete='email'
                  fullWidth
                />
                {passwordInput}
                <Box mt={2}>
                  <Link component={RouterLink} to='/forgot' variant='subtitle'>
                    Forgot password?
                  </Link>
                </Box>
                <Button type='submit' fullWidth sx={{ my: 2 }}>
                  {submitLabel}
                </Button>
                {!(whiteLabel.hideStripeSignup || !pricingUrl) && (
                  <Box my={2}>
                    <Typography variant='subtitle'>Don&apos;t have an account?</Typography>&nbsp;
                    <Link href={pricingUrl} target='_blank' variant='subtitle'>Sign Up</Link>
                  </Box>
                )}
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
            <Typography variant='h1' sx={{ mb: 3 }}>Login</Typography>
            <Box component={Form}>
              <FormikTextInput
                sx={{ my: 2 }}
                name='email'
                placeholder='Email address'
                autoComplete='email'
                fullWidth
              />
              {passwordInput}
              <Box mt={1} mb={3}>
                <Link
                  component={RouterLink}
                  to='/forgot'
                  variant='subtitle'
                  sx={whiteLabel.authBackgroundColor ? { color: whiteLabel.authBackgroundColor } : {}}
                >
                  Forgot password?
                </Link>
              </Box>
              <Button
                type='submit'
                fullWidth
                sx={{
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
              {!(whiteLabel.hideStripeSignup || !pricingUrl) && (
                <Box mt={3} sx={{ textAlign: 'center' }}>
                  <Typography variant='subtitle' component='span'>
                    Don&apos;t have an account?
                  </Typography>
                  &nbsp;
                  <Link
                    href={pricingUrl}
                    target='_blank'
                    variant='subtitle'
                    sx={whiteLabel.authBackgroundColor ? { color: whiteLabel.authBackgroundColor } : {}}
                  >
                    Sign up
                  </Link>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  email: Yup.string().required(() => messages.errors.validation.required),
  password: Yup.string().required(() => messages.errors.validation.required)
});

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      email: '',
      password: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      store.dispatch(userThunks.login(data));
      helpers.setSubmitting(false);
    },
  })
  (Login)
);
