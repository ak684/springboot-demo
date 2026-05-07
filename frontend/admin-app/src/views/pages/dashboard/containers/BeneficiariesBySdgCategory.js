import React, { memo } from 'react';
import DashboardChartCard from '../components/DashboardChartCard';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { Box, Typography, useTheme } from '@mui/material';
import DashboardChartBar from '../components/DashboardChartBar';
import DashboardChartLine from "../components/DashboardChartLine";
import { clone, distinct } from "shared-components/utils/lo";

const BeneficiariesBySdgCategory = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const goals = useSelector(dictionarySelectors.getGoals());
  const theme = useTheme();
  const navigate = useNavigate();

  let categories = [
    { name: 'Biosphere', rate: 0, color: theme.palette.success.main },
    { name: 'Society', rate: 0, color: theme.palette.error.main },
    { name: 'Economy', rate: 0, color: '#F36D25' },
  ];

  const scoredSdgImpacts = venture.impacts
    .filter(i => !i.draft)
    .filter(i => i.positive)
    .filter(i => i.goals.length > 0)
    .filter(i => i.scoring.at(-1)?.score);

  const totalScore = scoredSdgImpacts
    .map(i => i.scoring.at(-1).score)
    .reduce((acc, val) => acc + val, 0);

  let filledGoals = clone(scoredSdgImpacts
    .flatMap(i => i.goals)
    .map(g => g.goal.name)
    .filter(distinct)
    .map(g => goals.find(goal => goal.name === g)))

  scoredSdgImpacts.forEach(i => {
    i.goals.forEach(g => {
      const goalCategory = goals.find(goal => goal.name === g.goal.name).category;
      const chartCategory = categories.find(c => c.name === goalCategory);
      chartCategory.rate = chartCategory.rate + (i.scoring.at(-1).score / totalScore) * g.rate;

      const chartGoal = filledGoals.find(goal => goal.name === g.goal.name);
      const currentRate = chartGoal.rate || 0;
      chartGoal.rate = currentRate + (i.scoring.at(-1).score / totalScore) * g.rate;
    });
  });

  categories = categories
    .map(c => ({ ...c, rate: c.rate.toFixed(0) }))
    .sort((c1, c2) => c2.rate - c1.rate);

  const chartItems = categories.map((c) => {
    const tooltipGoals = filledGoals.filter(g => g.category === c.name);
    const maxRate = tooltipGoals.map(g => g.rate).reduce((acc, val) => Math.max(acc, val), 0);

    const tooltip = (
      <Box display='flex' flexDirection='column' gap={2}>
        <Typography variant='bodyBold'>{c.name}</Typography>
        {tooltipGoals.sort((g1, g2) => g2.rate - g1.rate).map(g => (
          <DashboardChartLine
            key={g.name}
            max={maxRate}
            value={g.rate}
            valueLabel={(g.rate || 0).toFixed(1) + '%'}
            label={`SDG${g.number}: ${g.shortName}`}
            color={g.color}
          />
        ))}
      </Box>
    );

    return (
      <DashboardChartBar
        key={c.name}
        max={100}
        value={c.rate}
        valueLabel={c.rate + '%'}
        label={c.name}
        color={c.color}
        tooltip={tooltip}
      />
    )
  });

  const tooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>
        We use the weighted average of your scores from each impact chain, multiplied with the % attributed to 1-3 SDGs
        per impact chain.
      </Box>
      <Box>
        We then attribute each SDG to either economy, society or biosphere, following the scientifically well-grounded
        method of the Stockholm Resilience Center.
      </Box>
    </Box>
  );

  return (
    <DashboardChartCard
      title='Our triple bottom line impact potential'
      subtitle='(5-year projection)'
      empty={scoredSdgImpacts.length === 0}
      tooltip={tooltip}
      type='categories'
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => navigate(`/ventures/${ventureId}/scoring-wizard`)}
    >
      <Box display='flex' justifyContent='space-around'>
        {chartItems}
      </Box>
    </DashboardChartCard>
  );
};

export default memo(BeneficiariesBySdgCategory);
