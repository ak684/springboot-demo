import React, { memo } from 'react';
import { Avatar, Box, Chip, IconButton, MenuItem, Typography } from "@mui/material";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import TextInput from "shared-components/views/form/TextInput";
import DeleteIcon from "@mui/icons-material/Delete";
import { ACCESS_OWNER } from "utils/team";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const MemberAccessRow = ({ company, access, changeAccess, revokeAccess, accessMode }) => {
  const isCompanyMode = accessMode === 'company';
  return (
    <CustomErrorBoundary>
      <Box display='flex' alignItems='center' gap={2}>
        <Avatar sx={{ width: 40, height: 40 }} src={company.logo}>{company.name.slice(0, 1)}</Avatar>
        <Typography variant='subtitleBold' noWrap sx={{ minWidth: 0, flexGrow: 1 }}>{company.name}</Typography>
        {access.access === ACCESS_OWNER && (
          <Typography>Owner</Typography>
        )}
        {access.access !== ACCESS_OWNER && isCompanyMode && (
          <Chip label='Public profile only' size='small' variant='outlined' />
        )}
        {access.access !== ACCESS_OWNER && !isCompanyMode && (
          <TextInput select value={access.access} onChange={(e) => changeAccess(company, e.target.value)}>
            <MenuItem value={VENTURE_ACCESS.EDIT}>Editing access</MenuItem>
            <MenuItem value={VENTURE_ACCESS.VIEW}>View only</MenuItem>
          </TextInput>
        )}
        {access.access !== 'OWNER' && (
          <IconButton onClick={() => revokeAccess(company)}>
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(MemberAccessRow);
