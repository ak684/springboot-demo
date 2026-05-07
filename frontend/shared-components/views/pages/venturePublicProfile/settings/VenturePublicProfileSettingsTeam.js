import React, { memo } from 'react';
import { Box, Link, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FieldLabel from "../../../components/FieldLabel";

const VenturePublicProfileSettingsTeam = ({ company, isPortfolio }) => {
  return (
    <Box p={3}>
      <FieldLabel sx={{ mb: 1 }}>Team</FieldLabel>
      <Link
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        target='_blank'
        href={`/${isPortfolio ? 'portfolios' : 'ventures'}/${company.id}/profile-wizard?goto=team`}
      >
        <EditIcon sx={{ width: 20, height: 20, color: 'primary.main' }} />
        <Typography>Edit in company profile</Typography>
      </Link>
    </Box>
  );
};

export default memo(VenturePublicProfileSettingsTeam);
