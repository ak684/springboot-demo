import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import VenturesOverviewChartLine from "../components/VenturesOverviewChartLine";
import { arraySum } from "shared-components/utils/helpers";
import VenturesOverviewCard from "../components/VenturesOverviewCard";
import { getVentureTotalScore } from "shared-components/utils/scoring";

const propAverage = (impacts, prop, canBeNegative) =>
  (arraySum(impacts.map(i => i.scoring.at(-1)[prop + (canBeNegative && !i.positive ? 'Negative' : '')]?.score || 0))
    / impacts.length || 0).toFixed(1);

const indicatorPropAverage = (impacts, prop) => {
  const values = impacts.flatMap(i => i.scoring.at(-1).indicatorScores).map(is => is[prop]?.score || 0);
  return (arraySum(values) / values.length || 0).toFixed(1);
};

const venturesAverage = (ventures, prop, canBeNegative) => {
  const totalScore = arraySum(ventures.map(v => getVentureTotalScore(v)));
  const venturePropValues = ventures
    .map(v => v.impacts
      .filter(i => !i.draft)
      .filter(i => i.scoring.at(-1)?.score)
    )
    .map(impacts => propAverage(impacts, prop, canBeNegative));
  return (arraySum(ventures.map((v, index) => venturePropValues[index] * getVentureTotalScore(v))) / totalScore || 0)
    .toFixed(1);
}

const venturesIndicatorAverage = (ventures, prop) => {
  const totalScore = arraySum(ventures.map(v => getVentureTotalScore(v)));
  const venturePropValues = ventures
    .map(v => v.impacts
      .filter(i => !i.draft)
      .filter(i => i.scoring.at(-1)?.score)
    )
    .map(impacts => indicatorPropAverage(impacts, prop));
  return (arraySum(ventures.map((v, index) => venturePropValues[index] * getVentureTotalScore(v))) / totalScore || 0)
    .toFixed(1);
}

const VenturesOverviewLikelihood = ({ selected }) => {
  const scoredVentures = selected.filter(v => getVentureTotalScore(v) > 0);

  return (
    <VenturesOverviewCard>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box>
          <Typography variant='subtitleBold' align='center'>Likelihood</Typography>
          <Typography variant='caption' align='center' noWrap>
            Average across {scoredVentures.length} ventures
          </Typography>
        </Box>
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'previousEvidence', true)}
          right={5}
          text='Previous evidence'
          progress={venturesAverage(scoredVentures, 'previousEvidence', true) / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'proximity')}
          right={5}
          text='Proximity'
          progress={venturesAverage(scoredVentures, 'proximity') / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={venturesIndicatorAverage(scoredVentures, 'noisiness')}
          right={5}
          text='Indicator noisiness'
          progress={venturesIndicatorAverage(scoredVentures, 'noisiness') / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={venturesIndicatorAverage(scoredVentures, 'validation')}
          right={5}
          text='Own validation'
          progress={venturesIndicatorAverage(scoredVentures, 'validation') / 5 * 100}
        />
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Low</Typography>
          <Typography variant='caption'>High</Typography>
        </Box>
      </Box>
    </VenturesOverviewCard>
  );
};

export default memo(VenturesOverviewLikelihood);
