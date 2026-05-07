import React, { memo } from 'react';
import { Box, Button, Link, Typography } from "@mui/material";
import Modal from "shared-components/views/components/modal/Modal";
import { getBranding } from "shared-components/utils/branding";

const AiTocRegisterModal = ({ onClose }) => {
  const branding = getBranding();
  const checkoutUrl = branding.stripeCheckoutUrl;

  return (
    <Modal
      open
      onClose={onClose}
      title='Save generated TOC'
      actions={<Button variant='outlined' onClick={onClose}>Close</Button>}
    >
      <Typography sx={{ mb: 2, fontSize: 18 }} align='center'>
        In order to save your generated Theory of change, create an account first. You will be able to automatically
        import created impact chains from your venture dashboard
      </Typography>
      <Box align='center'>
        <Button component={Link} href={checkoutUrl} rel='noopener noreferrer'>
          Create an account
        </Button>
      </Box>
    </Modal>
  );
};

export default memo(AiTocRegisterModal);
