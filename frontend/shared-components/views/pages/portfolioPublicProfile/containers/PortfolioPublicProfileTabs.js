import React, { memo } from 'react';
import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import PortfolioPublicProfileVentures from "./PortfolioPublicProfileVentures";
import PortfolioPublicProfileImpact from "./PortfolioPublicProfileImpact";
import PublicProfileSummary from "../../../components/publicProfile/PublicProfileSummary";
import PublicProfileTeam from "../../../components/publicProfile/PublicProfileTeam";

const PortfolioPublicProfileTabs = ({ portfolio, tab, setTab, ventures }) => {
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
          label='Certified impact ventures'
          value='ventures'
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
          label='Portfolio level impact'
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
          label='Team'
          value='team'
        />
      </Tabs>
      {tab === 'summary' && <PublicProfileSummary company={portfolio} setTab={setTab} isPortfolio ventures={ventures} />}
      {tab === 'ventures' && <PortfolioPublicProfileVentures ventures={ventures} />}
      {tab === 'impacts' && <PortfolioPublicProfileImpact ventures={ventures} />}
      {tab === 'team' && <PublicProfileTeam company={portfolio} isPortfolio />}
    </Box>
  );
};

export default memo(PortfolioPublicProfileTabs);
