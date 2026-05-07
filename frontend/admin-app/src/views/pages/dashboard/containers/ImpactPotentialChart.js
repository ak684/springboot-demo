import React, { memo } from 'react';
import DashboardChartCard from '../components/DashboardChartCard';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardChartLine from '../components/DashboardChartLine';
import { Box, Typography, useTheme } from '@mui/material';

const ImpactPotentialChart = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const theme = useTheme();
  const navigate = useNavigate();
  const scoredImpacts = venture.impacts
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .sort((i1, i2) => {
      if (i1.positive !== i2.positive) {
        return i2.positive - i1.positive;
      } else {
        return i2.scoring.at(-1).score - i1.scoring.at(-1).score;
      }
    });

  const maxScore = scoredImpacts
    .map(i => i.scoring.at(-1).score)
    .reduce((acc, val) => Math.max(acc, val), 0);

  const chartItems = scoredImpacts.map(i => {
    const tooltip = (
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold'>{i.name}</Typography>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Magnitude:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{i.scoring.at(-1).magnitude.toFixed(1)}</Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Likelihood (%):</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{i.scoring.at(-1).likelihood.toFixed(1)}</Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Score:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{i.scoring.at(-1).score.toFixed(1)}</Typography>
        </Box>
      </Box>
    );

    return (
      <DashboardChartLine
        key={i.id}
        max={maxScore}
        value={i.scoring.at(-1).score.toFixed(0)}
        valueLabel={`${i.scoring.at(-1).score.toFixed(0) * (i.positive ? 1 : -1)}/${(i.positive ? 1 : -1) * 100}`}
        label={i.name}
        color={i.positive ? theme.palette.success.main : theme.palette.error.main}
        tooltip={tooltip}
        valueWidth={56}
      />
    );
  });

  const tooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Here you see the 5-year impact potential score for each impact area.</Box>
      <Box>This impact potential score is calculated by multiplying the impact magnitude x impact likelihood.</Box>
      <Box>
        These impact areas are the ones, where you make the highest impact compared to if your organization did not
        exist.
      </Box>
    </Box>
  );

  return (
    <DashboardChartCard
      title={(
        <Box
          component={Link}
          sx={{ textDecoration: 'none', fontSize: 'inherit', color: theme.palette.text.primary }}
          to={`/ventures/${ventureId}/scoring-wizard`}
        >
          Our most important impact areas
        </Box>
      )}
      subtitle='(5-year Impact Potential Score per impact area)'
      empty={scoredImpacts.length === 0}
      tooltip={tooltip}
      type='impacts'
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => navigate(`/ventures/${ventureId}/table`)}
    >
      <Box display='flex' flexDirection='column' gap={2}>
        {chartItems}
      </Box>
    </DashboardChartCard>
  );
};

export default memo(ImpactPotentialChart);
