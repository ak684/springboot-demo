import React, { memo } from 'react';
import { Box, Link, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import AppTooltip from "../../../common/AppTooltip";

const CompanyProfileCurrencyTooltip = () => {
  const { ventureId } = useParams();

  return (
    <AppTooltip>
      <Box textAlign='center'>
        <Typography variant='subtitle'>
          For easier summarization across all sources, input the amount in the venture currency.
        </Typography>
        <Typography variant='subtitle'>
          Head to settings to change the venture currency as necessary.
        </Typography>
        <Link color='primary.light' component={RouterLink} to={`/ventures/${ventureId}/profile-wizard?goto=currency`}>
          Edit currency
        </Link>
      </Box>
    </AppTooltip>
  );
};

export default memo(CompanyProfileCurrencyTooltip);
