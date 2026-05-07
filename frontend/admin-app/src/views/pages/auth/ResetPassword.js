import * as React from 'react';
import { memo, useEffect } from 'react';
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
import { Link, useParams } from 'react-router-dom';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import AuthLeftPart from './AuthLeftPart';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import {
  getAuthBackground,
  getAuthBackgroundColor,
  getBranding,
  isWhiteLabelEnabled,
} from 'shared-components/utils/branding';

const ResetPassword = ({ setFieldValue }) => {
  const { token } = useParams();
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const title = whiteLabel.authResetTitle || 'Set your password';
  const submitLabel = whiteLabel.authResetSubmitLabel || 'Change password';
  const passwordPlaceholder = whiteLabel.authResetPasswordPlaceholder || 'Password';
  const confirmPlaceholder = whiteLabel.authResetConfirmPlaceholder || 'Confirm password';
  const whiteLabelEnabled = isWhiteLabelEnabled();

  useEffect(() => {
    setFieldValue('token', token);
  }, []);

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
              <Typography variant='h1'>{title}</Typography>
              <Box component={Form} sx={{ mt: 1 }}>
                <FormikTextInput
                  sx={{ my: 2 }}
                  name='password'
                  type='password'
                  placeholder={passwordPlaceholder}
                  fullWidth
                />
                <FormikTextInput
                  sx={{ my: 2 }}
                  name='confirmPassword'
                  type='password'
                  placeholder={confirmPlaceholder}
                  fullWidth
                />
                <Button type='submit' fullWidth sx={{ my: 2 }}>
                  {submitLabel}
                </Button>
                <Button fullWidth color='secondary' component={Link} to='/forgot'>
                  Request new link
                </Button>
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
            <Typography variant='h1' sx={{ mb: 3 }}>{title}</Typography>
            <Box component={Form}>
              <FormikTextInput
                sx={{ my: 2 }}
                name='password'
                type='password'
                placeholder={passwordPlaceholder}
                fullWidth
              />
              <FormikTextInput
                sx={{ my: 2 }}
                name='confirmPassword'
                type='password'
                placeholder={confirmPlaceholder}
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
              <Button fullWidth color='secondary' component={Link} to='/forgot' sx={{ mt: 2 }}>
                Request new link
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  token: Yup.string().required(messages.errors.validation.required),
  password: Yup.string().required(messages.errors.validation.required).min(6, messages.errors.validation.passwordMinLength),
  confirmPassword: Yup.string()
    .required(messages.errors.validation.required)
    .oneOf([Yup.ref('password')], messages.errors.validation.confirmPassword),
});

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      password: '',
      confirmPassword: '',
      token: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      store.dispatch(userThunks.resetPassword(data));
      helpers.setSubmitting(false);
    },
  })
  (ResetPassword)
);
