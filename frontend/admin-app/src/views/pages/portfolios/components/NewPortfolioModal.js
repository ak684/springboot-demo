import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import useModal from 'shared-components/hooks/useModal';
import ImageUploadModal from 'views/pages/profile/components/ImageUploadModal';
import { portfolioThunks } from 'store/ducks/portfolio';

const LogoPlaceholder = ({ onClick }) => (
  <Box
    onClick={onClick}
    width={96}
    height={96}
    display='flex'
    flexDirection='column'
    alignItems='center'
    justifyContent='center'
    gap={0.5}
    backgroundColor='secondary.subtle'
    sx={{ borderRadius: '4px', cursor: 'pointer' }}
  >
    <AddIcon sx={{ color: 'secondary.main' }} fontSize='small' />
    <Typography variant='caption' color='secondary.main'>Add logo</Typography>
  </Box>
);

const NewPortfolioModal = ({ open, onClose, onCreated }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logoModalOpen, openLogoModal, closeLogoModal] = useModal(false);

  const reset = () => {
    setName('');
    setDescription('');
    setLogo('');
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const trimmedName = name.trim();
    if (!trimmedName || submitting) return;

    setSubmitting(true);
    const payload = { name: trimmedName };
    const trimmedDescription = description.trim();
    if (trimmedDescription) {
      payload.description = trimmedDescription;
    }
    if (logo) {
      payload.logo = logo;
    }

    dispatch(portfolioThunks.createMinimalPortfolio(payload))
      .unwrap()
      .then((portfolio) => {
        reset();
        onClose();
        onCreated?.(portfolio);
      })
      .catch(() => {
        setSubmitting(false);
        toast.error('Failed to create portfolio. Please try again.');
      });
  };

  return (
    <Dialog open={open} onClose={close} maxWidth='xs' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>New portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            fullWidth
            label='Portfolio name'
            placeholder='e.g. Spring 2026 cohort'
            variant='outlined'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            sx={{ mt: 1 }}
            inputProps={{ 'data-testid': 'new-portfolio-name-input' }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            label='Description'
            placeholder='Optional'
            variant='outlined'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            sx={{ mt: 2 }}
            inputProps={{ 'data-testid': 'new-portfolio-description-input' }}
          />
          <Box mt={2}>
            <Typography variant='body2' color='text.secondary' mb={1}>
              Logo (optional)
            </Typography>
            <Box display='flex' alignItems='center' gap={2}>
              {logo ? (
                <Box
                  component='img'
                  src={logo}
                  alt='Logo'
                  width={96}
                  height={96}
                  sx={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              ) : (
                <LogoPlaceholder onClick={submitting ? undefined : openLogoModal} />
              )}
              {logo && (
                <Box display='flex' flexDirection='column' gap={1}>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<EditIcon />}
                    onClick={openLogoModal}
                    disabled={submitting}
                  >
                    Replace
                  </Button>
                  <IconButton
                    size='small'
                    onClick={() => setLogo('')}
                    disabled={submitting}
                    aria-label='Remove logo'
                  >
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
      {logoModalOpen && (
        <ImageUploadModal
          onClose={closeLogoModal}
          handleSave={setLogo}
          title='Upload portfolio logo'
          disableShape
        />
      )}
    </Dialog>
  );
};

export default NewPortfolioModal;
