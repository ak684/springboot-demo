import React, { memo } from 'react';
import { Box, Drawer } from "@mui/material";
import PublicDatabaseFilters from "./PublicDatabaseFilters";
import { HEADER_HEIGHT } from "shared-components/utils/constants";

const PublicDatabaseFiltersWrapper = ({ filters, setFilters, drawerOpen, setDrawerOpen, ventures }) => {
  return (
    <Box>
      <Drawer
        sx={{ display: { xs: 'block', xl: 'none' }, zIndex: (theme) => theme.zIndex.drawer + 2 }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <PublicDatabaseFilters filters={filters} setFilters={setFilters} ventures={ventures} />
      </Drawer>
      <Box
        display={{ xs: 'none', xl: 'block' }}
        maxHeight={`calc(100vh - ${HEADER_HEIGHT}px - 68px)`}
        sx={{ overflow: 'hidden' }}
      >
        <PublicDatabaseFilters filters={filters} setFilters={setFilters} ventures={ventures} />
      </Box>
    </Box>
  );
};
export default memo(PublicDatabaseFiltersWrapper);
