import React, { memo, useEffect, useState } from 'react';
import { Box, Divider, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import ImpactFilter from '../../common/ImpactFilter';
import { appSelectors } from 'store/ducks/app';
import { filteredImpacts, sortedImpacts } from "shared-components/utils/impact";
import ImpactSort from '../../common/ImpactSort';
import ScoringOverviewMagnitude from "./containers/ScoringOverviewMagnitude";
import ScoringOverviewTotalChart from "./containers/ScoringOverviewTotalChart";
import ScoringOverviewBubble from "./containers/ScoringOverviewBubble";
import ScoringOverviewLikelihood from "./containers/ScoringOverviewLikelihood";
import ScoringOverviewImpactFilter from "./containers/ScoringOverviewImpactFilter";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const ScoringOverview = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const impactFilter = useSelector(appSelectors.getImpactFilter());
  const impactSort = useSelector(appSelectors.getImpactSort());
  const impacts = sortedImpacts(filteredImpacts(venture.impacts, impactFilter), impactSort)
    .filter(i => i.scoring.at(-1)?.score);
  const [selected, setSelected] = useState(impacts);
  const [details, setDetails] = useState(true);

  useEffect(() => {
    setSelected(impacts);
  }, [impactFilter]);

  useEffect(() => {
    setSelected(impacts);
  }, [venture])

  const toggleDetails = () => {
    setSelected(impacts);
    setDetails(val => !val);
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <ImpactFilter />
          <Box display='flex' alignItems='center' gap={2}>
            <ImpactSort />
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3} justifyContent='center'>
          <Grid item width={300}>
            <Box display='flex' flexDirection='column' gap={3}>
              <ScoringOverviewMagnitude selected={selected} />
              <ScoringOverviewLikelihood selected={selected} />
            </Box>
          </Grid>
          <Grid item width={600}>
            <Box display='flex' flexDirection='column' gap={3}>
              <ScoringOverviewBubble impacts={impacts} selected={selected} details={details} />
              <ScoringOverviewTotalChart selected={selected} />
            </Box>
          </Grid>
          <Grid item width={380}>
            <ScoringOverviewImpactFilter
              impacts={impacts}
              selected={selected}
              setSelected={setSelected}
              details={details}
              toggleDetails={toggleDetails}
            />
          </Grid>
        </Grid>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverview);
