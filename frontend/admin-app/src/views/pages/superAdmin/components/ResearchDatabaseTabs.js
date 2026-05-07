import React, { memo } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import ResearchDatabaseVentures from './ResearchDatabaseVentures';
import PublicDatabasePortfolio from 'shared-components/views/pages/publicDatabase/containers/PublicDatabasePortfolio';
import PublicDatabaseEarthView from 'shared-components/views/pages/publicDatabase/containers/PublicDatabaseEarthView';
import { getTypography } from 'shared-components/utils/typography';

const tabSx = {
  flexGrow: 1,
  maxWidth: 'unset',
  textTransform: 'none',
  ...getTypography('bodyBold'),
  '&.Mui-selected': { color: 'text.primary' },
};

const ResearchDatabaseTabs = ({
  ventures, allVentures, totalVentures, setHoveredVenture, tab, onTabChange, ...rest
}) => {
  const isEarthView = tab === 'earth';

  return (
    <Box flexGrow={1} order={2} mt={{ xs: isEarthView ? 0 : -39, sm: isEarthView ? 0 : -46, lg: 0 }} {...rest}>
      <Tabs value={tab} onChange={(e, newTab) => onTabChange(newTab)}>
        <Tab
          sx={{ ml: { xs: 8, xl: 0 }, ...tabSx }}
          label='Impact ventures'
          value='organization'
        />
        <Tab
          sx={tabSx}
          label='Portfolio level impact'
          value='portfolio'
        />
        <Tab
          sx={tabSx}
          icon={<PublicIcon sx={{ fontSize: 18 }} />}
          iconPosition='start'
          label='Earth view'
          value='earth'
        />
      </Tabs>
      {!isEarthView && (
        <Box mt={2} pr={{ xs: 0, lg: 'calc(50% - 24px)', xl: 'calc(100vw - 1050px)' }}>
          <Box backgroundColor='background' display={{ xs: 'block', lg: 'none' }} height={{ xs: 320, sm: 380 }} />
          {tab === 'organization' && (
            <ResearchDatabaseVentures
              ventures={ventures}
              totalVentures={totalVentures}
              setHoveredVenture={setHoveredVenture}
              sx={{ maxHeight: { xs: 'unset', lg: 'calc(100vh - 212px)' }, overflowY: 'auto' }}
              pr={{ xs: 0, lg: 2 }}
              maxWidth={{ xs: 'unset', lg: 'calc(50vw - 120px)', xl: 700 }}
            />
          )}
          {tab === 'portfolio' && (
            <PublicDatabasePortfolio
              ventures={ventures}
              totalVentures={totalVentures}
              sx={{ maxHeight: { xs: 'unset', lg: 'calc(100vh - 212px)' }, overflowY: 'auto' }}
              pr={{ xs: 0, lg: 2 }}
              maxWidth={{ xs: 'unset', lg: 'calc(50vw - 120px)', xl: 700 }}
            />
          )}
        </Box>
      )}
      {isEarthView && (
        <Box mt={2}>
          <PublicDatabaseEarthView
            ventures={allVentures || ventures}
            totalVentures={totalVentures}
            cardVariant='research'
          />
        </Box>
      )}
    </Box>
  );
};

export default memo(ResearchDatabaseTabs);
