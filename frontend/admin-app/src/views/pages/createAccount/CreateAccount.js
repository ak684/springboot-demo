import React, { memo, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import { useParams } from 'react-router-dom';
import { userSelectors, userThunks } from 'store/ducks/user';
import { useDispatch, useSelector } from 'react-redux';
import Loader from "shared-components/views/components/Loader";
import Page404 from "shared-components/views/pages/error/Page404";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  email: Yup.string().required(messages.errors.validation.required),
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

const CreateAccount = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(userSelectors.getUserIntro());
  const loading = useSelector(userSelectors.userIntroLoading());

  useEffect(() => {
    if (token) {
      dispatch(userThunks.fetchUserIntroDetails(token));
    }
  }, [token]);

  const onSubmit = (data) => {
    dispatch(userThunks.createProfile({ token, data }));
  };

  if (loading) {
    return <Loader />;
  } else if (!user) {
    return <Page404 withHeader />;
  }

  return (
    <CustomErrorBoundary>
      <Box display='flex' justifyContent='center'>
        <Box maxWidth={508} mt={10} flexGrow={1} p={2}>
          <Formik
            initialValues={{
              email: user.email,
              password: '',
              confirmPassword: '',
              name: user.name || '',
              lastName: user.lastName || '',
              company: '',
              position: ''
            }}
            validationSchema={schema}
            onSubmit={onSubmit}
          >
            <Box component={Form} display='flex' flexDirection='column' gap={2}>
              <Typography variant='h1' align='center'>Create your account</Typography>
              <FormikTextInput name='email' label='Email' disabled fullWidth />
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
              <Button type='submit' sx={{ mt: 2 }}>Create account</Button>
            </Box>
          </Formik>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CreateAccount);
