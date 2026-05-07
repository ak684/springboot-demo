import React, { memo } from 'react';
import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import { Typography } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";

const ChangePasswordModal = ({ open, onClose }) => {
  const user = useSelector(userSelectors.getCurrentUser());
  const dispatch = useDispatch();

  const onSubmit = (data, helpers) => {
    dispatch(userThunks.changePassword({
      data, callback: () => {
        onClose();
        helpers.resetForm();
      }
    }));
  };

  const formikContext = useFormik({
    initialValues: {
      password: user.hasPassword ? '' : null,
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: schema(user),
    onSubmit,
    enableReinitialize: true,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Change password'
      actions={<ModalActions onClose={onClose} submitForm={formikContext.handleSubmit} />}
    >
      <FormikProvider value={formikContext}>
        <Box component={Form} display='flex' flexDirection='column' gap={3}>
          <Typography variant='body'>
            Protect your account with a unique password at least 6 characters long.
          </Typography>
          {
            user.hasPassword &&
            <FormikTextInput
              name='password'
              type='password'
              placeholder='Current password'
              fullWidth
            />
          }
          {user.hasPassword && <Link component={RouterLink} to='/forgot' variant='subtitle'>Forgot password?</Link>}
          <FormikTextInput
            name='newPassword'
            type='password'
            placeholder='New password (min 6 characters)'
            fullWidth
          />
          <FormikTextInput
            name='confirmPassword'
            type='password'
            placeholder='Re-enter new password'
            fullWidth
          />
        </Box>
      </FormikProvider>
    </Modal>
  );
};

const schema = (user) => Yup.object().shape({
  password: user.hasPassword ? Yup.string().required(messages.errors.validation.required) : Yup.string().nullable(true),
  newPassword: Yup.string()
    .required(messages.errors.validation.required)
    .min(6, messages.errors.validation.passwordMinLength),
  confirmPassword: Yup.string()
    .required(messages.errors.validation.required)
    .oneOf([Yup.ref('newPassword')], messages.errors.validation.confirmPassword),
});

export default memo(ChangePasswordModal);
