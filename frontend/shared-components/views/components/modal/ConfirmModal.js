import React from 'react';
import Modal from './Modal';
import ModalActions from './ModalActions';
import { Typography, useTheme } from '@mui/material';

const ConfirmModal = ({ open, onClose, confirm, title, primary, secondary, children, confirmTitle = 'Delete' }) => {
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={<ModalActions onClose={onClose} submitForm={confirm} submitTitle={confirmTitle} />}
    >
      {primary && <Typography component='div'>{primary}</Typography>}
      {secondary && <Typography variant='caption' sx={{ mt: 0.5 }}>{secondary}</Typography>}
      {children}
    </Modal>
  );
};

export default ConfirmModal;
