import React, { memo } from 'react';
import { Box } from "@mui/material";
import PublicDatabaseVentures from "../../publicDatabase/containers/PublicDatabaseVentures";
import PublicDatabaseGoogleMap from "../../publicDatabase/containers/PublicDatabaseGoogleMap";

const PortfolioPublicProfileVentures = ({ ventures }) => {
  return (
    <Box px={{ xs: 3, lg: 12 }} pt={4} pb={{ xs: 3, lg: 8 }} mt={0} mx='auto' maxWidth={1280}>
      <PublicDatabaseGoogleMap
        mb={2}
        ventures={ventures}
        position='relative'
        height={380}
        sx={{ borderRadius: '16px', overflow: 'hidden' }}
      />
      <PublicDatabaseVentures ventures={ventures} totalVentures={ventures.length} cardProps={{ xs: 12, sm: 6 }} />
    </Box>
  );
};

export default memo(PortfolioPublicProfileVentures);
