import React from 'react';
import { clone, distinct } from "shared-components/utils/lo";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import Card from "@mui/material/Card";
import DashboardChartLine from "../../dashboard/components/DashboardChartLine";
import PortfolioDashboardChartBar from "./PortfolioDashboardChartBar";
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PortfolioDashboardSdgCategoriesChart = ({ ventures }) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());

  let categories = [
    { name: 'Biosphere', rate: 0, color: theme.palette.success.main },
    { name: 'Society', rate: 0, color: theme.palette.error.main },
    { name: 'Economy', rate: 0, color: '#F36D25' },
  ];

  const scoredSdgImpacts = ventures
    .flatMap(v => v.impacts)
    .filter(i => !i.draft)
    .filter(i => i.positive)
    .filter(i => i.goals.length > 0)
    .filter(i => i.scoring.at(-1)?.score);

  const totalScore = scoredSdgImpacts
    .map(i => i.scoring.at(-1).score)
    .reduce((acc, val) => acc + val, 0);

  let filledGoals = clone(
    scoredSdgImpacts
      .flatMap(i => i.goals)
      .map(g => g.goal.name)
      .filter(distinct)
      .map(g => goals.find(goal => goal.name === g))
  );

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
      <PortfolioDashboardChartBar
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

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2 }}>
        <Typography variant='subtitleBold' sx={{ mb: 2 }}>Beneficiaries by SDG</Typography>
        <Box display='flex' justifyContent='space-around'>
          {chartItems}
        </Box>
        <Button variant='outlined' fullWidth size='small' sx={{ mt: 2 }} startIcon={<ShareOutlinedIcon />}>
          Share
        </Button>
      </Card>
    </CustomErrorBoundary>
  );
};

export default PortfolioDashboardSdgCategoriesChart;
