import React, { memo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import ScoringOverviewPieChart from '../../scoringOverview/components/ScoringOvewrviewPieChart';
import {
  getVentureTotalLikelihood,
  getVentureTotalScore
} from 'shared-components/utils/scoring';
import ScoringOverviewCard from '../../scoringOverview/components/ScoringOverviewCard';
import CustomErrorBoundary from '../../../containers/CustomErrorBoundary';

// Calculate magnitude directly: positive impacts add, negative impacts subtract
const calculateMagnitude = (impacts) => {
  if (!impacts || impacts.length === 0) return 0;

  const total = impacts.reduce((sum, impact) => {
    const mag = impact.scoring?.at(-1)?.magnitude || 0;
    // Positive impacts add to magnitude, negative impacts subtract
    return sum + (impact.positive ? mag : -mag);
  }, 0);

  return Math.round(Math.max(-500, Math.min(500, total)));
};

const CompanyScoringOverviewTotalChart = ({ selected, growthScore }) => {
  const magnitude = calculateMagnitude(selected);
  const likelihood = Number(getVentureTotalLikelihood(null, null, selected));
  const score = getVentureTotalScore(null, null, selected);
  const maxValue = Math.min(selected.length * 100, 500);
  const normalizedGrowth = Number.isFinite(Number(growthScore))
    ? Math.max(0, Math.min(100, Math.round(Number(growthScore))))
    : null;
  const growthAdjustedScore = normalizedGrowth !== null && Number.isFinite(score)
    ? Math.round(score * (normalizedGrowth / 100))
    : null;

  return (
    <CustomErrorBoundary>
      <ScoringOverviewCard>
        <Typography variant='subtitleBold' align='center' sx={{ mb: 2 }}>
          Impact Potential across {selected.length} impact area{selected.length === 0 || selected.length > 1 ? 's' : ''}
        </Typography>
        <Grid container spacing={2} alignItems='center' justifyContent='center'>
          <Grid item xs={12} sm='auto' sx={{ minWidth: 140 }}>
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
          <Grid item xs='auto'>
            <Typography align='center' variant='h5' sx={{ mt: 3.5 }}>*</Typography>
          </Grid>
          <Grid item xs={12} sm='auto' sx={{ minWidth: 140 }}>
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
          <Grid item xs='auto'>
            <Typography align='center' variant='h5' sx={{ mt: 3.5 }}>*</Typography>
          </Grid>
          <Grid item xs={12} sm='auto' sx={{ minWidth: 140 }}>
            <Typography variant='caption' align='center' sx={{ mb: 2 }}>
              5-year business growth likelihood
            </Typography>
            <Box display='flex' justifyContent='center'>
              <ScoringOverviewPieChart
                value={normalizedGrowth ?? 0}
                name='growth'
                label={`${normalizedGrowth !== null ? normalizedGrowth : 'N/A'}%`}
              />
            </Box>
          </Grid>
          <Grid item xs='auto'>
            <Typography align='center' variant='h5' sx={{ mt: 3.5 }}>=</Typography>
          </Grid>
          <Grid item xs={12} sm='auto' sx={{ minWidth: 140 }}>
            <Typography variant='caption' align='center' sx={{ mb: 2 }}>
              5-year impact potential (growth-adjusted)
            </Typography>
            <Box display='flex' justifyContent='center'>
              <ScoringOverviewPieChart
                value={growthAdjustedScore ?? 0}
                max={maxValue}
                name='score'
                label={`${growthAdjustedScore ?? 'N/A'}/${maxValue}`}
              />
            </Box>
          </Grid>
        </Grid>
      </ScoringOverviewCard>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyScoringOverviewTotalChart);
