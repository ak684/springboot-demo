import React, { useEffect, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { Avatar, Box, FormControlLabel, MenuItem, Radio, RadioGroup, Typography } from "@mui/material";
import api from 'services/api';
import TextInput from "shared-components/views/form/TextInput";
import { toast } from "react-toastify";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import FieldLabel from "shared-components/views/components/FieldLabel";
import Loader from "shared-components/views/components/Loader";

const PortfolioInvitationModal = ({ open, onClose, code, ventures }) => {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(false);
  const [venture, setVenture] = useState(ventures[0]);
  const [access, setAccess] = useState(VENTURE_ACCESS.EDIT);

  useEffect(() => {
    api.get(`/portfolios/by-code/${code}`)
      .then(setPortfolio)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const acceptInvitation = () => {
    api.post(`/ventures/${venture.id}/link/${code}`, access)
      .then(() => {
        toast.success(`You venture has successfully been linked to "${portfolio.name}"`);
        onClose();
      })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Portfolio invitation'
      actions={
        <ModalActions onClose={onClose}
          submitForm={acceptInvitation}
          submitTitle='Link to portfolio'
          saveDisabled={!portfolio}
        />
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
      {loading && <Loader />}
      {!loading && !portfolio && (
        <Typography>Cannot find portfolio with this invitation code</Typography>
      )}
      {!loading && portfolio && ventures.length === 0 && (
        <Typography>You don't have any ventures to link. Create your venture first</Typography>
      )}
      {!loading && portfolio && ventures.length > 0 && (
        <Box display='flex' flexDirection='column' gap={3}>
          <Typography variant='subtitle' align='center'>You’ve been invited to link your account with:</Typography>
          <Box
            display='flex'
            alignItems='center'
            gap={1}
            p={2}
            border={1}
            borderColor='border'
            sx={{ borderRadius: '4px' }}
          >
            <Avatar sx={{ width: 40, height: 40 }} src={portfolio.logo}>{portfolio.name}</Avatar>
            <Typography variant='bodyBold'>{portfolio.name}</Typography>
          </Box>
          <Box>
            <FieldLabel>Select your venture</FieldLabel>
            <TextInput select fullWidth value={venture} onChange={(e) => setVenture(e.target.value)}>
              {ventures.map(v => <MenuItem key={v.id} value={v}>{v.name}</MenuItem>)}
            </TextInput>
          </Box>
          <Box>
            <Typography variant='subtitleBold' sx={{ mb: 2 }}>Access permissions:</Typography>
            <RadioGroup defaultValue="edit" value={access} onChange={(e) => setAccess(e.target.value)}>
              <Box display='flex' justifyContent='space-between'>
                <FormControlLabel value={VENTURE_ACCESS.EDIT} label='Editing access' control={<Radio size='small' />} />
                <FormControlLabel value={VENTURE_ACCESS.VIEW} label='View only' control={<Radio size='small' />} />
                <FormControlLabel
                  value={VENTURE_ACCESS.KEY_DATA}
                  label='View key data only'
                  control={<Radio size='small' />}
                />
              </Box>
            </RadioGroup>
          </Box>
        </Box>
      )}
    </Modal>
  );
};

export default PortfolioInvitationModal;
