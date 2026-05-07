import * as React from 'react';
import { memo } from 'react';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { Paper, Typography } from '@mui/material';
import { Form, withFormik } from 'formik';
import store from 'store';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Logo from 'shared-components/views/components/Logo';
import AuthLeftPart from './AuthLeftPart';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const Register = () => {
  const user = useSelector(userSelectors.getCurrentUser());

  if (user) {
    return <Navigate to='/portfolios' replace />;
  }

  return (
    <CustomErrorBoundary>
      <Grid container component='main' sx={{ height: '100vh' }}>
        <Grid
          item
          sm={false}
          md={6}
          lg={7}
          sx={{
            backgroundColor: '#203E5C',
          }}
          display={{ xs: 'none', sm: 'none', md: 'block' }}
        >
          <AuthLeftPart />
        </Grid>
        <Grid item sm={12} md={6} lg={5} component={Paper} elevation={6} square>
          <Box mt={{ xs: 6, sm: 12 }} mx={{ xs: 3, sm: 12 }}>
            <Logo mb={4} />
            <Box component={Form} display='flex' flexDirection='column' gap={2}>
              <Typography variant='h1'>Create an account</Typography>
              <FormikTextInput
                name='email'
                placeholder='Email'
                label='Email'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='password'
                type='password'
                placeholder='Password'
                label='Password'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='confirmPassword'
                type='password'
                placeholder='Confirm password'
                label='Confirm password'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='name'
                placeholder='First name'
                label='First name'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='lastName'
                placeholder='Last name'
                label='Last name (optional)'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='company'
                placeholder='Organization'
                label='Organization (optional)'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormikTextInput
                name='position'
                placeholder='Job title'
                label='Job title (optional)'
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <Button type='submit' fullWidth sx={{ my: 2 }}>
                Create account
              </Button>
              <Box my={2}>
                <Typography variant='subtitle'>Already have an account?</Typography>&nbsp;
                <Link component={RouterLink} to='/login' variant='subtitle'>Log in</Link>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  email: Yup.string().required(messages.errors.validation.required).email(messages.errors.validation.email),
  password: Yup.string()
    .required(messages.errors.validation.required)
    .min(6, messages.errors.validation.passwordMinLength),
  confirmPassword: Yup
    .string().required(messages.errors.validation.required)
    .oneOf([Yup.ref('password')], messages.errors.validation.confirmPassword),
  name: Yup.string().required(messages.errors.validation.required),
  lastName: Yup.string(),
  company: Yup.string(),
  position: Yup.string(),
});

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      lastName: '',
      company: '',
      position: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      store.dispatch(userThunks.register(data));
      helpers.setSubmitting(false);
    },
  })
  (Register)
);
