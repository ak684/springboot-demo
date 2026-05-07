import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import ScoringOverviewCard from '../../../scoringOverview/components/ScoringOverviewCard';
import ScoringOverviewChartLine from '../../../scoringOverview/components/ScoringOverviewChartLine';

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(num)));
};

const growthFactors = [
  { key: 'growth_media_reach_score', label: 'Media reach' },
  { key: 'growth_sentiment_score', label: 'Sentiment' },
  { key: 'growth_innovation_visibility_score', label: 'Innovation visibility' },
  { key: 'growth_team_strength_score', label: 'Team strength' },
  { key: 'growth_funding_velocity_score', label: 'Funding velocity' },
  { key: 'growth_company_age_score', label: 'Company age' },
];

const CompanyGrowthLikelihoodSummary = ({ data }) => {
  const hasAnyScore = growthFactors.some(f => clampScore(data?.[f.key]) !== null);
  if (!hasAnyScore) {
    return null;
  }

  return (
    <ScoringOverviewCard>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box>
          <Typography variant='subtitleBold' align='center'>Growth Likelihood</Typography>
          <Typography variant='caption' align='center' noWrap>
            Of the organization
          </Typography>
        </Box>
        {growthFactors.map(factor => {
          const score = clampScore(data?.[factor.key]);
          const leftLabel = score !== null ? score.toString() : 'N/A';
          const progress = score !== null ? score : 0;
          return (
            <ScoringOverviewChartLine
              key={factor.key}
              left={leftLabel}
              right={100}
              text={factor.label}
              progress={progress}
            />
          );
        })}
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Low</Typography>
          <Typography variant='caption'>High</Typography>
        </Box>
      </Box>
    </ScoringOverviewCard>
  );
};

export default memo(CompanyGrowthLikelihoodSummary);
