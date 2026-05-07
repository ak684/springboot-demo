import React, { memo } from 'react';
import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import VenturePublicProfileFinancials from "./VenturePublicProfileFinancials";
import VenturePublicProfileImpacts from "./VenturePublicProfileImpacts";
import PublicProfileSummary from "../../../components/publicProfile/PublicProfileSummary";
import PublicProfileTeam from "../../../components/publicProfile/PublicProfileTeam";

const VenturePublicProfileTabs = ({ venture, tab, setTab }) => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <Tabs
        sx={{ px: { xs: 0, lg: 12 }, mx: 'auto', maxWidth: 1280 }}
        value={tab}
        onChange={(e, newTab) => setTab(newTab)}
        variant={isMobileView ? 'scrollable' : 'standard'}
        scrollButtons={isMobileView ? 'auto' : false}
        allowScrollButtonsMobile={isMobileView}
      >
        <Tab
          sx={{
            px: 6,
            textTransform: 'none',
            ...getTypography('bodyBold'),
            '&.Mui-selected': {
              color: 'text.primary',
            }
          }}
          label='Summary'
          value='summary'
        />
        <Tab
          sx={{
            px: 6,
            textTransform: 'none',
            ...getTypography('bodyBold'),
            '&.Mui-selected': {
              color: 'text.primary',
            }
          }}
          label='Impact details'
          value='impacts'
        />
        <Tab
          sx={{
            px: 6,
            textTransform: 'none',
            ...getTypography('bodyBold'),
            '&.Mui-selected': {
              color: 'text.primary',
            }
          }}
          label='Impact Enablers'
          value='financials'
        />
        <Tab
          sx={{
            px: 6,
            textTransform: 'none',
            ...getTypography('bodyBold'),
            '&.Mui-selected': {
              color: 'text.primary',
            }
          }}
          label='Team'
          value='team'
        />
      </Tabs>
      {tab === 'summary' && <PublicProfileSummary company={venture} setTab={setTab} />}
      {tab === 'impacts' && <VenturePublicProfileImpacts venture={venture} />}
      {tab === 'financials' && <VenturePublicProfileFinancials venture={venture} />}
      {tab === 'team' && <PublicProfileTeam company={venture} />}
    </Box>
  );
};

export default memo(VenturePublicProfileTabs);
