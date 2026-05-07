import React, { memo } from 'react';
import { Box, Link, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FieldLabel from "../../../components/FieldLabel";

const VenturePublicProfileSettingsFinancials = ({ venture }) => {
  return (
    <Box p={3}>
      <FieldLabel sx={{ mb: 1 }}>Impact enablers</FieldLabel>
      <Link
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        target='_blank'
        href={`/ventures/${venture.id}/profile-wizard?goto=acceleration`}
      >
        <EditIcon sx={{ width: 20, height: 20, color: 'primary.main' }} />
        <Typography>Edit in company profile</Typography>
      </Link>
    </Box>
  );
};

export default memo(VenturePublicProfileSettingsFinancials);
