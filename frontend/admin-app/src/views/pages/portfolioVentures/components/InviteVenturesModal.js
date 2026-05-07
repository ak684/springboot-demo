import React, { memo } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Box } from '@mui/material';
import ModalActions from "shared-components/views/components/modal/ModalActions";
import FieldLabel from "shared-components/views/components/FieldLabel";
import { Form, FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import { toast } from "react-toastify";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import TextField from "@mui/material/TextField";
import FormikAutocomplete from "shared-components/views/form/FormikAutocomplete";
import { useDispatch } from "react-redux";
import { portfolioThunks } from "store/ducks/portfolio";

const schema = Yup.object().shape({
  emails: Yup.array().of(Yup.string().email())
    .required(messages.errors.validation.required)
    .min(1, "Enter at least one email address")
    .max(20, "You can invite up to 20 emails at a time"),
  message: Yup.string(),
  promo: Yup.string(),
});

const emailSchema = Yup.string().email(messages.errors.validation.email);

const InviteVenturesModal = ({ open, onClose, portfolio }) => {
  const dispatch = useDispatch();

  const onSubmit = (values) => {
    dispatch(portfolioThunks.inviteNewVentures({ portfolioId: portfolio.id, data: values }))
      .then(() => {
        toast.success('Invitations were sent out successfully');
        onClose();
      });
  }

  const formikContext = useFormik({
    initialValues: {
      emails: [],
      message: '',
      promo: '',
    },
    validationSchema: schema,
    onSubmit,
  });

  const handleEmailValidation = async (newValue) => {
    const isValid = await Promise.all(newValue.map(email => emailSchema.isValid(email)));

    if (isValid.every(Boolean)) {
      formikContext.setFieldValue('emails', newValue);
    } else {
      toast.error('This is not a valid email');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Invite ventures'
      actions={<ModalActions onClose={onClose} submitTitle='Invite' submitForm={formikContext.handleSubmit} />}
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '530px',
          },
        },
      }}
    >
      <FormikProvider value={formikContext}>
        <Box component={Form} display='flex' flexDirection='column' gap={3}>
          <Box>
            <FieldLabel>Emails (20 maximum)</FieldLabel>
            <FormikAutocomplete
              sx={{ '.MuiChip-label': { fontFamily: 'Inter, sans-serif', fontSize: 12, textTransform: 'uppercase' } }}
              multiple
              name='emails'
              options={[]}
              renderInput={(params) => <TextField {...params} variant='standard' />}
              onChange={(e, newValue) => handleEmailValidation(newValue)}
              fullWidth
              freeSolo
            />
          </Box>
          <Box>
            <FieldLabel>Message to the recipient (optional)</FieldLabel>
            <FormikTextInput name='message' fullWidth />
          </Box>
          <Box>
            <FieldLabel>Promocode</FieldLabel>
            <FormikTextInput name='promo' fullWidth />
          </Box>
        </Box>
      </FormikProvider>
    </Modal>
  );
};

export default memo(InviteVenturesModal);
