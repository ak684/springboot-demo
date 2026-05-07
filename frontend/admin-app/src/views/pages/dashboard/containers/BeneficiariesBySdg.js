import React, { memo } from 'react';
import DashboardChartCard from '../components/DashboardChartCard';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { Box, Typography, useTheme } from '@mui/material';
import DashboardChartLine from '../components/DashboardChartLine';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { getVentureGoals, scoredSdgImpacts } from "shared-components/utils/scoring";
import { VENTURE_ACCESS } from "shared-components/utils/constants";

const BeneficiariesBySdg = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const theme = useTheme();
  const navigate = useNavigate();
  const goals = useSelector(dictionarySelectors.getGoals());
  const chartGoals = getVentureGoals(venture, goals);
  const totalScore = scoredSdgImpacts(venture)
    .map(i => i.scoring.at(-1).score)
    .reduce((acc, val) => acc + val, 0);
  const maxRate = chartGoals.map(g => g.rate).reduce((acc, val) => Math.max(acc, val), 0);

  const chartItems = chartGoals.map(g => {
    const tooltip = (
      <Box display='flex' flexDirection='column' gap={2}>
        <Typography variant='bodyBold'>Impact areas contributing to SDG{g.number}: {g.shortName}</Typography>
        {g.impacts
          .sort((i1, i2) => i2.scoring.at(-1).score - i1.scoring.at(-1).score)
          .map(i => (
            <DashboardChartLine
              className='child-line'
              key={i.id}
              max={100}
              value={i.scoring.at(-1).score * i.goals.find(goal => goal.goal.name === g.name).rate / totalScore}
              valueLabel={((i.scoring.at(-1).score || 0) * i.goals.find(goal => goal.goal.name === g.name).rate / totalScore).toFixed(1) + '%'}
              label={`${i.name} (IP score ${i.scoring.at(-1).score.toFixed(0)})`}
              color={theme.palette.success.main}
              sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
              onClick={() => access === VENTURE_ACCESS.EDIT && navigate(`/ventures/${ventureId}/impacts/${i.id}/scoring?step=0`)}
              zIndex={2}
            />
          ))}
        <Box
          position='absolute'
          top={16}
          left={4}
          bottom={4}
          right={4}
          zIndex={1}
          sx={{ '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
        />
      </Box>
    );

    return (
      <DashboardChartLine
        key={g.name}
        max={maxRate}
        value={g.rate}
        valueLabel={g.rate + '%'}
        label={`SDG${g.number}: ${g.shortName}`}
        color={g.color}
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
        This calculation is superior to simply SDGs stickers, as it accounts for the impact potential across all
        dimensions
        of the Impact Management Norms.
      </Box>
    </Box>
  );

  return (
    <DashboardChartCard
      title='Our projected SDG contribution'
      subtitle='Weighted average across all impact chains'
      empty={scoredSdgImpacts.length === 0}
      tooltip={tooltip}
      type='sdg'
    >
      <Box display='flex' flexDirection='column' gap={2}>
        {chartItems}
      </Box>
    </DashboardChartCard>
  );
};

export default memo(BeneficiariesBySdg);
