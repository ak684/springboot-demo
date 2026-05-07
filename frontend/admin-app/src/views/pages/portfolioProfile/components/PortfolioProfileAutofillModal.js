import React, { memo, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import TextInput from "shared-components/views/form/TextInput";
import { getTypography } from 'shared-components/utils/typography';
import api from "services/api";
import FieldLabel from "shared-components/views/components/FieldLabel";
import Loader from "shared-components/views/components/Loader";

const PortfolioProfileAutofillModal = ({ open, onClose, values, setFieldValue }) => {
  const [website, setWebsite] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    api.post('/scrape/portfolio', website, { 'Content-Type': 'text/plain' })
      .then((res) => {
        setFieldValue('website', res.website);

        if (res.name) {
          setFieldValue('name', res.name);
        }

        if (res.description) {
          setFieldValue('description', res.description.slice(0, 255));
        }

        if (res.mission) {
          setFieldValue('mission', res.mission.slice(0, 255));
        }

        if (res.logo) {
          setFieldValue('logo', res.logo);
        }

        if (res.address?.address) {
          setFieldValue('address', res.address.address);
        }

        if (res.address?.city) {
          setFieldValue('city', res.address.city);
        }

        if (res.address?.region) {
          setFieldValue('region', res.address.region);
        }

        if (res.address?.zipCode) {
          setFieldValue('zipCode', res.address.zipCode);
        }

        if (res.address?.country) {
          setFieldValue('zipCode', res.address.country);
        }

        if (res.address?.lat) {
          setFieldValue('lat', res.address.lat);
        }

        if (res.address?.lng) {
          setFieldValue('lng', res.address.lng);
        }

        if (res.social?.linkedin) {
          setFieldValue('linkedin', res.social.linkedin);
        }

        if (res.social?.facebook) {
          setFieldValue('facebook', res.social.facebook);
        }

        if (res.social?.instagram) {
          setFieldValue('instagram', res.social.instagram);
        }

        if (res.social?.twitter) {
          setFieldValue('twitter', res.social.twitter);
        }

        if (res.social?.youtube) {
          setFieldValue('youtube', res.social.youtube);
        }
      })
      .finally(() => {
        setLoading(false);
        onClose();
      })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='AI integration'
      actions={
        <ModalActions
          onClose={onClose}
          submitForm={handleSubmit}
          saveDisabled={!confirm || loading}
          submitTitle='Confirm'
        />
      }
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '500px',
          },
        },
      }}
    >
      <Box display='flex' flexDirection='column' gap={3}>
        <Typography variant='subtitle'>
          Speed up your company profile creation! Enter your official website address, and our AI will fill in the
          details
          swiftly.
        </Typography>
        <Box>
          <FieldLabel>Your website</FieldLabel>
          <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />
        </Box>
        <FormControlLabel
          componentsProps={{ typography: getTypography('subtitle') }}
          control={<Checkbox onChange={() => setConfirm(!confirm)} checked={confirm} />}
          label='I give my consent for processing my website data'
        />
        {loading && <Loader />}
      </Box>
    </Modal>
  );
};

export default memo(PortfolioProfileAutofillModal);
