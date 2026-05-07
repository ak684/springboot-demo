import React, { memo } from 'react';
import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import { dictionarySelectors } from "store/ducks/dictionary";
import { Autocomplete, TextField } from "@mui/material";
import { escapeRegExp } from "shared-components/utils/helpers";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";

const schema = Yup.object().shape({
  name: Yup.string().required(messages.errors.validation.required),
  lastName: Yup.string(),
  company: Yup.string(),
  position: Yup.string(),
  country: Yup.object().nullable(true),
});

const EditProfileModal = ({ open, onClose }) => {
  const user = useSelector(userSelectors.getCurrentUser());
  const dispatch = useDispatch();
  const geography = useSelector(dictionarySelectors.getGeography());
  const countries = geography
    .filter(g => g.geographicType === 'COUNTRY')
    .sort((c1, c2) => c1.name.localeCompare(c2.name));

  const onSubmit = (data) => {
    dispatch(userThunks.updateProfile(data)).then(() => {
      onClose();
    });
  };

  const formikContext = useFormik({
    initialValues: {
      name: user.name || '',
      lastName: user.lastName || '',
      company: user.company || '',
      position: user.position || '',
      country: user.country || null,
    },
    validationSchema: schema,
    onSubmit,
    enableReinitialize: true,
  });

  const countryOnChange = (e, value) => {
    formikContext.setFieldValue('country', value || null);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Edit profile data'
      actions={<ModalActions onClose={onClose} submitForm={formikContext.handleSubmit} />}
    >
      <FormikProvider value={formikContext}>
        <Box component={Form} display='flex' flexDirection='column' gap={3}>
          <FormikTextInput name='name' placeholder='First name' fullWidth inputProps={{ maxLength: 250 }} />
          <FormikTextInput name='lastName' placeholder='Last name' fullWidth inputProps={{ maxLength: 250 }} />
          <FormikTextInput name='company' placeholder='Organization' fullWidth inputProps={{ maxLength: 250 }} />
          <FormikTextInput name='position' placeholder='Job title' fullWidth inputProps={{ maxLength: 250 }} />
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option?.title || ''}
            value={formikContext.values.country || null}
            onChange={countryOnChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='standard'
                label='Country'
                placeholder='Start typing country name here'
              />
            )}
            onKeyDown={onKeyDown}
            filterOptions={(arr, search) => {
              const escapedInput = escapeRegExp(search.inputValue || '');
              return escapedInput.length >= 1 ?
                arr.filter(i => new RegExp(escapedInput, 'i').test(i.title)).slice(0, 24) :
                [];
            }}
            freeSolo
          />
        </Box>
      </FormikProvider>
    </Modal>
  );
};

export default memo(EditProfileModal);
