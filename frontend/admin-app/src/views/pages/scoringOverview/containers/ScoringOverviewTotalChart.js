import React, { memo } from 'react';
import { Box, Grid, Typography } from "@mui/material";
import ScoringOverviewPieChart from "../components/ScoringOvewrviewPieChart";
import {
  getVentureTotalLikelihood,
  getVentureTotalMagnitude,
  getVentureTotalScore
} from "shared-components/utils/scoring";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import ScoringOverviewCard from "../components/ScoringOverviewCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ScoringOverviewTotalChart = ({ selected }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const magnitude = getVentureTotalMagnitude(venture, null, selected);
  const likelihood = getVentureTotalLikelihood(venture, null, selected);
  const score = getVentureTotalScore(venture, null, selected);
  const maxValue = Math.min(selected.length * 100, 500);

  return (
    <CustomErrorBoundary>
      <ScoringOverviewCard>
        <Typography variant='subtitleBold' align='center' sx={{ mb: 2 }}>
          Impact Potential across {selected.length} impact area{selected.length === 0 || selected.length > 1 ? 's' : ''}
        </Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid item width='30%'>
            <Typography variant='caption' align='center' sx={{ mb: 2 }}>
              5-year impact magnitude
            </Typography>
            <Box display='flex' justifyContent='center'>
              <ScoringOverviewPieChart
                value={Number.isFinite(magnitude) ? magnitude : 0}
                max={maxValue}
                name='magnitude'
                label={`${Number.isFinite(magnitude) ? magnitude : 'N/A'}/${maxValue}`}
              />
            </Box>
          </Grid>
          <Grid item xs>
            <Typography align='center' variant='h5' sx={{ mt: 3.5 }}>*</Typography>
          </Grid>
          <Grid item width='30%'>
            <Typography variant='caption' align='center' sx={{ mb: 2 }}>
              5-year impact likelihood
            </Typography>
            <Box display='flex' justifyContent='center'>
              <ScoringOverviewPieChart
                value={Number.isFinite(likelihood) ? likelihood : 0}
                name='likelihood'
                label={`${Number.isFinite(likelihood) ? likelihood : 'N/A'}%`}
              />
            </Box>
          </Grid>
          <Grid item xs>
            <Typography align='center' variant='h5' sx={{ mt: 3.5 }}>=</Typography>
          </Grid>
          <Grid item width='30%'>
            <Typography variant='caption' align='center' sx={{ mb: 2 }}>
              5-year impact potential
            </Typography>
            <Box display='flex' justifyContent='center'>
              <ScoringOverviewPieChart
                value={Number.isFinite(score) ? score : 0}
                max={maxValue}
                name='score'
                label={`${Number.isFinite(score) ? score : 'N/A'}/${maxValue}`}
              />
            </Box>
          </Grid>
        </Grid>
      </ScoringOverviewCard>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverviewTotalChart);
