import React, { memo, useEffect, useMemo, useState } from 'react';
import { Badge, Box, IconButton, useTheme } from "@mui/material";
import PublicDatabaseTabs from "./containers/PublicDatabaseTabs";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import { scoredSdgImpacts } from "shared-components/utils/scoring";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PublicDatabaseFiltersWrapper from "./containers/PublicDatabaseFiltersWrapper";
import PublicDatabaseGoogleMap from "./containers/PublicDatabaseGoogleMap";
import { appSelectors } from "store/ducks/app";
import { sortedPublicVentures } from "shared-components/utils/venture";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { geographyHasCountryCode } from "shared-components/utils/geography";

const PublicDatabase = ({ mapApp }) => {
  const theme = useTheme();
  const [filters, setFilters] = useState({ sdg: [], profitOrientation: [], sector: [], countries: [] });
  const [mapVentures, setMapVentures] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredVenture, setHoveredVenture] = useState(null);
  const [activeTab, setActiveTab] = useState('organization');
  const ventures = useSelector(ventureSelectors.getPublicVentures());
  const dispatch = useDispatch();
  const publicSort = useSelector(appSelectors.getPublicSort());
  const publicPeriod = useSelector(appSelectors.getPublicPeriod());

  useEffect(() => {
    dispatch(ventureThunks.fetchPublicVentures(publicPeriod));
  }, [publicPeriod]);

  const filteredVentures = useMemo(() => ventures
      .filter(v => filters.sdg.length === 0 || scoredSdgImpacts(v).some(i => i.goals.find(g => filters.sdg.includes(g.goal.name))))
      .filter(v => filters.profitOrientation.length === 0 || filters.profitOrientation.includes(v.profitOrientation))
      .filter(v => filters.countries.length === 0 || filters.countries.some(c => v.impacts.some(i => geographyHasCountryCode(i.geography, c)))),
    [ventures, filters, publicSort]
  );
  const sortedVentures = sortedPublicVentures(filteredVentures, publicSort);

  const numberOfFilters = filters.sdg.length + filters.profitOrientation.length + filters.sector.length;
  const isEarthView = activeTab === 'earth';

  return (
    <Box display={{ xs: 'block', xl: 'flex' }} gap={3} alignItems='flex-start'>
      {!isEarthView && (
        <PublicDatabaseFiltersWrapper
          filters={filters}
          setFilters={setFilters}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          ventures={ventures}
        />
      )}
      <Box flexGrow={1} display={{ xs: 'flex', lg: 'block' }} flexDirection='column' position='relative'>
        {!isEarthView && (
          <Box position='absolute' zIndex={1} display={{ xs: 'block', xl: 'none' }}>
            <Badge badgeContent={numberOfFilters} color="success" overlap="circular">
              <IconButton
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
                onClick={() => setDrawerOpen(!drawerOpen)}
              >
                <FilterAltIcon sx={{ color: 'white' }} />
              </IconButton>
            </Badge>
          </Box>
        )}
        <PublicDatabaseTabs
          ventures={mapVentures}
          allVentures={sortedVentures}
          totalVentures={ventures.length}
          setHoveredVenture={setHoveredVenture}
          mapApp={mapApp}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {!isEarthView && (
          <PublicDatabaseGoogleMap
            ventures={sortedVentures}
            setMapVentures={setMapVentures}
            hoveredVenture={hoveredVenture}
            setFilters={setFilters}
            display={{ xs: 'flex', lg: 'block' }}
            order={1}
            position={{ xs: 'relative', lg: 'fixed' }}
            height={{ xs: 300, sm: 360, lg: 'unset' }}
            top={{ xs: 64, lg: HEADER_HEIGHT + 96 }}
            bottom={{ xs: 'unset', lg: 0 }}
            right={0}
            left={{ xs: 0, lg: 'calc(50% + 24px)', xl: 1012 }}
            mx={{ xs: -4, lg: 0 }}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(PublicDatabase);
