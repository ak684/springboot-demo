import React, { memo, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { Box, FormControlLabel, IconButton, Switch, Typography } from '@mui/material';
import { useDispatch } from "react-redux";
import { pitchThunks } from "store/ducks/pitch";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { copyToClipboard } from "shared-components/utils/helpers";
import { toast } from 'react-toastify';
import FieldLabel from "shared-components/views/components/FieldLabel";

const PitchShareModal = ({ open, onClose, venture }) => {
  const [allowShare, setAllowShare] = useState(venture.pitchSettings.shared);
  const [allowDownload, setAllowDownload] = useState(venture.pitchSettings.allowDownloadFiles);
  const dispatch = useDispatch();

  const handleSubmit = () => {
    dispatch(pitchThunks.updatePitchVisibility({ venture, share: allowShare, allowDownloadFiles: allowDownload }));
    onClose();
  }

  const copyLink = () => {
    copyToClipboard(`${window.location.origin}/pitch/${venture.pitchSettings.pitchId}`);
    toast.success('Link was copied to your clipboard');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Share pitch deck'
      actions={<ModalActions onClose={onClose} submitForm={handleSubmit} />}
    >
      <FormControlLabel
        control={<Switch checked={allowShare} onChange={() => setAllowShare(!allowShare)} />}
        label='Allow sharing pitch deck by link'
      />
      {allowShare && (
        <Box mt={1}>
          <FieldLabel>Link</FieldLabel>
          <Box display='flex' alignItems='center' justifyContent='space-between'>
            <Typography variant='subtitle'>{window.location.origin}/pitch/{venture.pitchSettings.pitchId}</Typography>
            <IconButton onClick={copyLink}><ContentCopyIcon /></IconButton>
          </Box>
          <FormControlLabel
            control={<Switch checked={allowDownload} onChange={() => setAllowDownload(!allowDownload)} />}
            label='Allow evidence files to be downloaded from the pitch deck'
          />
        </Box>
      )}
    </Modal>
  );
};

export default memo(PitchShareModal);
