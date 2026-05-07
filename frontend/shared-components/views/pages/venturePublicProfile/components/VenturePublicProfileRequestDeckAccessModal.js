import React, { memo } from 'react';
import Box from "@mui/material/Box";
import { Avatar, Divider, Link, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Form, withFormik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import FormikTextInput from "../../../form/FormikTextInput";
import { publicProfileThunks } from "store/ducks/publicProfile";
import store from "store";
import Modal from "../../../components/modal/Modal";

const schema = Yup.object().shape({
  name: Yup.string().required(() => messages.errors.validation.required),
  lastName: Yup.string().required(() => messages.errors.validation.required),
  organization: Yup.string().required(() => messages.errors.validation.required),
  email: Yup.string().required(() => messages.errors.validation.required).email(() => messages.errors.validation.email),
  message: Yup.string(),
});


const VenturePublicProfileRequestDeckAccessModal = ({ open, onClose, venture }) => {
  const showContacts = venture.linkedin || venture.facebook || venture.instagram || venture.twitter || venture.youtube;
  // const owner = venture.organization.users[0];
  const image = venture.impacts.find(i => i.image)?.image || '/images/background/darts.jpg';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Get impact deck access'
      sx={{ '.MuiPaper-root': { maxWidth: 530 }, '.MuiDialogContent-root': { width: 530 } }}
    >
      <Box component={Form} display='flex' flexDirection='column' gap={3}>
        <Box display='flex' justifyContent='space-between' gap={2}>
          {venture.logo && (
            <Box
              component='img'
              src={venture.logo}
              alt={venture.name}
              width={112}
              sx={{ objectFit: 'cover', borderRadius: '8px' }}
            />
          )}
          {/*<Box display='flex' gap={1}>*/}
          {/*  <Avatar src={owner.avatar} sx={{ width: 24, height: 24 }} alt={owner.name} />*/}
          {/*  <Box>*/}
          {/*    <Typography variant='subtitleBold'>{owner.name} {owner.lastName}</Typography>*/}
          {/*    <Typography sx={{ fontSize: 10 }}>{owner.position}</Typography>*/}
          {/*  </Box>*/}
          {/*</Box>*/}
        </Box>
        <Divider flexItem />
        <Typography variant='body'>
          Hello, we are glad you are interested in our innovations. We have a detailed forecast of our impact potential.
          Please leave us a note to get in touch with us.
        </Typography>
        <Box component='img' src={image} height={180} sx={{ objectFit: 'cover', borderRadius: '8px' }} />
        <Box display='flex' gap={2}>
          <FormikTextInput name='name' fullWidth label='First name' InputLabelProps={{ shrink: true }} />
          <FormikTextInput name='lastName' fullWidth label='Last name' InputLabelProps={{ shrink: true }} />
        </Box>
        <FormikTextInput name='email' fullWidth label='Email' InputLabelProps={{ shrink: true }} />
        <FormikTextInput name='organization' fullWidth label='Organisation' InputLabelProps={{ shrink: true }} />
        <FormikTextInput name='message' fullWidth label='Message' multiline InputLabelProps={{ shrink: true }} />
        <Divider />
        <Box display='flex' flexDirection='column' gap={2} align='center'>
          <Button fullWidth type='submit'>Submit</Button>
          {showContacts && <Typography variant='caption'>Follow our updates:</Typography>}
          {showContacts && (
            <Box display='flex' justifyContent='center' gap={2}>
              {venture.linkedin && (
                <Link href={venture.linkedin} target='_blank'>
                  <LinkedInIcon sx={{ color: '#0077B7' }} />
                </Link>
              )}
              {venture.facebook && (
                <Link href={venture.facebook} target='_blank'>
                  <FacebookIcon sx={{ color: '#3B579D' }} />
                </Link>
              )}
              {venture.instagram && (
                <Link href={venture.instagram} target='_blank'>
                  <InstagramIcon sx={{ color: '#0077B7' }} />
                </Link>
              )}
              {venture.twitter && (
                <Link href={venture.twitter} target='_blank'>
                  <XIcon sx={{ color: 'black' }} />
                </Link>
              )}
              {venture.youtube && (
                <Link href={venture.youtube} target='_blank'>
                  <YouTubeIcon sx={{ color: '#ff0000' }} />
                </Link>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default memo(
  withFormik({
    mapPropsToValues: () => ({
      name: '',
      lastName: '',
      organization: '',
      email: '',
      message: '',
    }),
    validationSchema: schema,
    handleSubmit: (data, helpers) => {
      store.dispatch(publicProfileThunks.requestPitchAccess({ data, venture: helpers.props.venture }));
      helpers.resetForm();
      helpers.props.onClose();
    },
  })
  (VenturePublicProfileRequestDeckAccessModal)
);
