import React, { memo, useRef, useState } from 'react';
import { Box, IconButton, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectPortfolioVenturesMenu from "../../../components/SelectPortfolioVenturesMenu";

const PortfolioPublicProfileSettingsVentures = ({ ventures, setUpdatedVentures }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const shownVentures = ventures.filter(v => !v.publicHidden).length;
  const boxRef = useRef();

  const openMenu = () => {
    setAnchorEl(boxRef.current);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const toggleShowAllVentures = () => {
    if (shownVentures > 0) {
      setUpdatedVentures(ventures.map(v => ({ ...v, publicHidden: true })));
    } else {
      setUpdatedVentures(ventures.map(v => ({ ...v, publicHidden: false })));
    }
  }

  const toggleShowVenture = (access) => {
    const index = ventures.findIndex(a => a.id === access.id);
    const ventureToUpdate = ventures[index];

    const updatedVentures = [
      ...ventures.slice(0, index),
      { ...ventureToUpdate, publicHidden: !ventureToUpdate.publicHidden },
      ...ventures.slice(index + 1),
    ]
    setUpdatedVentures(updatedVentures);
  }

  return (
    <Box p={3}>
      <Box
        p={2}
        backgroundColor='secondary.subtle'
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        ref={boxRef}
      >
        <Typography variant='body'><b>Display:</b> {shownVentures}/{ventures.length}</Typography>
        <IconButton onClick={openMenu}>
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <SelectPortfolioVenturesMenu
        anchorEl={anchorEl}
        ventures={ventures}
        close={closeMenu}
        toggle={toggleShowVenture}
        toggleAll={toggleShowAllVentures}
        ventureGetter={a => a.venture}
        ventureHidden={a => a.publicHidden}
      />
    </Box>
  );
};

export default memo(PortfolioPublicProfileSettingsVentures);
