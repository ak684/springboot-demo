import React, { memo } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Box, Button, Typography } from '@mui/material';
import { copyToClipboard } from "shared-components/utils/helpers";
import { toast } from 'react-toastify';
import LinkIcon from "@mui/icons-material/Link";

const LinkVenturesModal = ({ open, onClose, portfolio }) => {
  const copyLink = () => {
    copyToClipboard(`${window.location.origin}/ventures?invite=${portfolio.invitationCode}`);
    toast.success('Link was copied to your clipboard');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Link ventures'
      actions={
        <Box display='flex' alignItems='flex-end'>
          <Button onClick={onClose} color='secondary'>Close</Button>
        </Box>
      }
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '530px',
          },
        },
      }}
    >
      <Box display='flex' alignItems='center' justifyContent='space-between' gap={4}>
        <Typography variant='body'>You can connect ventures by sharing the invite link with them</Typography>
        <Button onClick={copyLink} startIcon={<LinkIcon />} variant='outlined' sx={{ minWidth: 160 }}>
          Copy link
        </Button>
      </Box>
    </Modal>
  );
};

export default memo(LinkVenturesModal);
