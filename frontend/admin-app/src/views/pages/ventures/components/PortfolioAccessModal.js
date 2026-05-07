import React, { memo, useEffect, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Avatar, Box, Button, IconButton, MenuItem, Typography } from "@mui/material";
import api from 'services/api';
import TextInput from "shared-components/views/form/TextInput";
import { useDispatch } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import { ventureThunks } from "store/ducks/venture";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import FieldLabel from "shared-components/views/components/FieldLabel";
import Loader from "shared-components/views/components/Loader";

const PortfolioAccessModal = ({ onClose, venture }) => {
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    api.get(`/portfolios/by-venture/${venture.id}`)
      .then(setPortfolios)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const unlinkPortfolio = (portfolio) => {
    dispatch(ventureThunks.unlinkVentureFromPortfolio({ portfolioId: portfolio.id, ventureId: venture.id }))
      .then(() => {
        setPortfolios(portfolios.filter(p => p.id !== portfolio.id));
      })
  }

  const updatePortfolioAccess = () => {
    // toDO: Implement when we have other types of portfolio access
  }

  return (
    <Modal
      open
      onClose={onClose}
      title='Manage portfolio access'
      actions={<Button color='secondary' onClick={onClose}>Close</Button>}
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
      {!loading && portfolios.length === 0  && (
        <Typography>Your venture is not linked to any portfolios</Typography>
      )}
      {!loading && portfolios.length > 0 && (
        <Box display='flex' flexDirection='column' gap={2}>
          <FieldLabel>Portfolios with access</FieldLabel>
          {portfolios.map(p => (
            <Box key={p.id} display='flex' alignItems='center' gap={2}>
              <Avatar sx={{ width: 40, height: 40 }} src={p.logo}>{p.name.slice(0, 1)}</Avatar>
              <Typography variant='subtitleBold' noWrap sx={{ minWidth: 0, flexGrow: 1 }}>{p.name}</Typography>
              <TextInput select defaultValue={p.aux.access}>
                <MenuItem value={VENTURE_ACCESS.EDIT}>Editing access</MenuItem>
                <MenuItem value={VENTURE_ACCESS.VIEW}>View only</MenuItem>
                <MenuItem value={VENTURE_ACCESS.KEY_DATA}>View key data only</MenuItem>
              </TextInput>
              <IconButton onClick={() => unlinkPortfolio(p)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Modal>
  );
};

export default memo(PortfolioAccessModal);
