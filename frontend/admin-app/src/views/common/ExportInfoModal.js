import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Modal from "shared-components/views/components/modal/Modal";

const ExportInfoModal = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Export Theory of Change'
      actions={(
        <Box>
          <Button onClick={onClose}>Got it</Button>
        </Box>
      )}
    >
      <Box display='flex' flexDirection='column' gap={2}>
        <Box display='flex' gap={2}>
          <VisibilityOffIcon />
          <Typography>Filter impacts by type using "Show" tool</Typography>
        </Box>
        <Box display='flex' gap={2}>
          <SortOutlinedIcon />
          <Typography>Sort impacts using "Sort by" tool or rearrange them manually</Typography>
        </Box>
        <Box display='flex' gap={2}>
          <SettingsIcon />
          <Typography>Choose the columns you need using "Cog" icon</Typography>
        </Box>
        <Box display='flex' gap={2}>
          <OpenInNewIcon />
          <Typography>
            Once ready, hit "Export" button to get a slide with your impacts for your presentation!
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExportInfoModal;
