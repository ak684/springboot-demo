import React, { memo, useState } from 'react';
import { Alert, Box, FormControlLabel, IconButton, Switch, Typography } from '@mui/material';
import { useDispatch } from "react-redux";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import { publicProfileThunks } from "store/ducks/publicProfile";
import FieldLabel from "../FieldLabel";
import { copyToClipboard } from "../../../utils/helpers";
import Modal from "../modal/Modal";
import ModalActions from "../modal/ModalActions";

const PublicProfileShareModal = ({ open, onClose, company, isPortfolio }) => {
  const [allowShare, setAllowShare] = useState(company.publicSettings.shared);
  const dispatch = useDispatch();

  const handleSubmit = () => {
    if (isPortfolio) {
      dispatch(publicProfileThunks.updatePortfolioPublicVisibility({ portfolio: company, share: allowShare }));
    } else {
      dispatch(publicProfileThunks.updateVenturePublicVisibility({ venture: company, share: allowShare }));
    }

    onClose();
  }

  const copyLink = () => {
    copyToClipboard(`${window.location.origin}/public-profile/${isPortfolio ? 'portfolios' : 'ventures'}/${company.id}`);
    toast.success('Link was copied to your clipboard');
  }

  const shareDisabled = !isPortfolio && !(company.certification >= 1);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Share public profile'
      actions={<ModalActions onClose={onClose} submitForm={handleSubmit} />}
    >
      {shareDisabled && (
        <Alert severity="error" sx={{ mb: 2 }}>Only certified ventures can share their profile</Alert>
      )}
      <FormControlLabel
        control={<Switch checked={allowShare} onChange={() => setAllowShare(!allowShare)} disabled={shareDisabled} />}
        label={`Allow ${isPortfolio ? 'portfolio' : 'venture'} profile to be publicly visible in the database`}
      />
      {allowShare && (
        <Box mt={1}>
          <FieldLabel>Link</FieldLabel>
          <Box display='flex' alignItems='center' justifyContent='space-between'>
            <Typography variant='subtitle'>
              {window.location.origin}/public-profile/{isPortfolio ? 'portfolios' : 'ventures'}/{company.id}
            </Typography>
            <IconButton onClick={copyLink}><ContentCopyIcon /></IconButton>
          </Box>
        </Box>
      )}
    </Modal>
  );
};

export default memo(PublicProfileShareModal);
