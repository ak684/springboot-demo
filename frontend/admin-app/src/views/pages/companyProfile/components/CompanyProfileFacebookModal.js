import React, { memo } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Box } from "@mui/material";
import ModalActions from "shared-components/views/components/modal/ModalActions";

const CompanyProfileFacebookModal = ({ open, onClose, confirm }) => {
  return (
    <Modal
      maxWidth='lg'
      open={open}
      onClose={onClose}
      title='Link venture page manual'
      actions={<ModalActions onClose={onClose} submitTitle='Proceed' submitForm={confirm} />}
      sx={{ '.MuiDialogContent-root': { backgroundColor: 'background.fade' } }}
    >
      <Box display='flex' gap={8}>
        <Box
          component='img'
          src='/images/tutorial/social/facebook1.jpg'
          width={500}
          height={480}
          alt='Connect facebook'
        />
        <Box
          component='img'
          src='/images/tutorial/social/facebook2.jpg'
          width={500}
          height={480}
          alt='Connect facebook'
        />
      </Box>
    </Modal>
  );
};

export default memo(CompanyProfileFacebookModal);
