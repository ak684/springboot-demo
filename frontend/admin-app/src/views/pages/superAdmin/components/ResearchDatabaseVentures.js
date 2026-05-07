import React, { memo } from 'react';
import { Box, Grid } from '@mui/material';
import PublicDatabaseSearchInfo from 'shared-components/views/pages/publicDatabase/components/PublicDatabaseSearchInfo';
import ResearchDatabaseVentureCard from 'shared-components/views/pages/publicDatabase/components/ResearchDatabaseVentureCard';

const ResearchDatabaseVentures = ({
  ventures, totalVentures, setHoveredVenture,
  cardProps = {}, ...rest
}) => {
  const ventureCards = ventures.map(v => (
    <Grid key={v.id} item xs={12} {...cardProps}>
      <ResearchDatabaseVentureCard
        venture={v}
        onMouseEnter={() => setHoveredVenture && setHoveredVenture(v)}
        onMouseLeave={() => setHoveredVenture && setHoveredVenture(null)}
      />
    </Grid>
  ));

  return (
    <Box {...rest}>
      <PublicDatabaseSearchInfo shownVentures={ventures.length} totalVentures={totalVentures} showSort />
      <Grid container spacing={1}>
        {ventureCards}
      </Grid>
    </Box>
  );
};

export default memo(ResearchDatabaseVentures);
