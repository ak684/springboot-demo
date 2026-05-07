import React, { memo, useRef, useState } from 'react';
import { Box, Typography } from "@mui/material";
import PublicDatabasePortfolio from "../../publicDatabase/containers/PublicDatabasePortfolio";
import PublicDatabaseGoogleMap from "../../publicDatabase/containers/PublicDatabaseGoogleMap";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SelectPortfolioVenturesMenu from "../../../components/SelectPortfolioVenturesMenu";

const PortfolioPublicProfileImpact = ({ ventures }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [filteredVentures, setFilteredVentures] = useState(ventures);
  const [mapVentures, setMapVentures] = useState([]);
  const shownVentures = mapVentures.filter(v => filteredVentures.includes(v));
  const menuRef = useRef();

  const openMenu = () => {
    setMenuAnchorEl(menuRef.current);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const toggleShowAllVentures = () => {
    if (filteredVentures.length > 0) {
      setFilteredVentures([]);
    } else {
      setFilteredVentures(ventures);
    }
  }

  const toggleShowVenture = (venture) => {
    if (filteredVentures.includes(venture)) {
      setFilteredVentures(filteredVentures.filter(v => v !== venture));
    } else {
      setFilteredVentures([...filteredVentures, venture]);
    }
  }

  return (
    <Box px={{ xs: 3, lg: 12 }} pt={4} pb={{ xs: 3, lg: 8 }} mt={0} mx='auto' maxWidth={1280}>
      <PublicDatabaseGoogleMap
        mb={2}
        ventures={filteredVentures}
        setMapVentures={setMapVentures}
        position='relative'
        height={380}
        sx={{ borderRadius: '16px', overflow: 'hidden' }}
      />
      <Box display='flex' alignItems='center' justifyContent='space-between' mt={4} mb={2}>
        <Typography variant='h5'>Portfolio level impact</Typography>
        <Box
          ref={menuRef}
          width={300}
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          onClick={openMenu}
          borderBottom={1}
          borderColor='border'
          sx={{ cursor: 'pointer' }}
        >
          <Typography>
            Show {filteredVentures.length === ventures.length ? 'all' : filteredVentures.length} ventures
          </Typography>
          <ExpandMoreIcon />
        </Box>
      </Box>
      <SelectPortfolioVenturesMenu
        anchorEl={menuAnchorEl}
        ventures={ventures}
        close={closeMenu}
        toggle={toggleShowVenture}
        toggleAll={toggleShowAllVentures}
        ventureGetter={v => v}
        ventureHidden={v => !filteredVentures.includes(v)}
      />
      <PublicDatabasePortfolio ventures={shownVentures} totalVentures={ventures.length} />
    </Box>
  );
};

export default memo(PortfolioPublicProfileImpact);
