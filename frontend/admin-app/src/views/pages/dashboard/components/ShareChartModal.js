import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import Modal from "shared-components/views/components/modal/Modal";
import { copyToClipboard } from "shared-components/utils/helpers";
import { getChartTexts } from '../data';

const ShareChartModal = ({ open, onClose, type, proceed }) => {
  const chartTexts = getChartTexts();
  const copyAndProceed = () => {
    copyToClipboard(`${chartTexts[type]?.text}\n\n${chartTexts[type]?.hashTag}`);
    proceed();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Share chart'
      actions={(
        <Box display='flex' gap={2}>
          <Button color='secondary' onClick={proceed}>Skip</Button>
          <Button onClick={copyAndProceed}>Copy and proceed</Button>
        </Box>
      )}
    >
      <Box display='flex' flexDirection='column' gap={2}>
        <Typography variant='body'>
          Here is the text you could post along with the chart. Feel free to edit it before sharing. If you proceed, the
          following text will be copied to clipboard:
        </Typography>
        <Typography variant='body'>
          {chartTexts[type]?.text}
        </Typography>
        <Typography variant='body'>
          {chartTexts[type]?.hashTag}
        </Typography>
      </Box>
    </Modal>
  );
};

export default memo(ShareChartModal);
