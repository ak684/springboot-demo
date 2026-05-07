import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import { arraySum } from "shared-components/utils/helpers";
import VenturesOverviewCard from "../components/VenturesOverviewCard";
import VenturesOverviewChartLine from "../components/VenturesOverviewChartLine";
import { getVentureTotalScore } from "shared-components/utils/scoring";

const propAverage = (impacts, prop, canBeNegative) =>
  arraySum(impacts.map(i => i.scoring.at(-1)[prop + (canBeNegative && !i.positive ? 'Negative' : '')]?.score || 0))
  / impacts.length || 0;

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

const arrayPropAverage = (ventures, prop) => {
  const totalScore = arraySum(ventures.map(v => getVentureTotalScore(v)));
  const venturePropValues = ventures
    .map(v => v.impacts.filter(i => !i.draft).filter(i => i.scoring.at(-1)?.score))
    .map(impacts => impacts.reduce((acc, val) => acc + val.scoring.at(-1)[prop], 0) / impacts.length);
  return (arraySum(ventures.map((v, index) => venturePropValues[index] * getVentureTotalScore(v))) / totalScore || 0)
    .toFixed(1);
}

const VenturesOverviewMagnitude = ({ selected }) => {
  const scoredVentures = selected.filter(v => getVentureTotalScore(v) > 0);

  return (
    <VenturesOverviewCard>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box>
          <Typography variant='subtitleBold' align='center'>Magnitude</Typography>
          <Typography variant='caption' align='center' noWrap>
            Average across {scoredVentures.length} ventures
          </Typography>
        </Box>
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'stakeholderSituation', true)}
          right={5}
          text='Stakeholder underservedness'
          progress={venturesAverage(scoredVentures, 'stakeholderSituation', true) / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'problemImportance', true)}
          right={5}
          text='Problem importance'
          progress={venturesAverage(scoredVentures, 'problemImportance', true) / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={arrayPropAverage(scoredVentures, 'degreeOfChange')}
          right={100}
          text='Degree of change'
          progress={arrayPropAverage(scoredVentures, 'degreeOfChange')}
        />
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'sizeOfStakeholders', true)}
          right={10}
          text='Scalability'
          progress={venturesAverage(scoredVentures, 'sizeOfStakeholders', true) / 10 * 100}
        />
        <VenturesOverviewChartLine
          left={venturesAverage(scoredVentures, 'duration', true)}
          right={5}
          text='Duration'
          progress={venturesAverage(scoredVentures, 'duration', true) / 5 * 100}
        />
        <VenturesOverviewChartLine
          left={arrayPropAverage(scoredVentures, 'contribution')}
          right={100}
          text='Enterprise contribution'
          progress={arrayPropAverage(scoredVentures, 'contribution')}
        />
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Low</Typography>
          <Typography variant='caption'>High</Typography>
        </Box>
      </Box>
    </VenturesOverviewCard>
  );
};

export default memo(VenturesOverviewMagnitude);
