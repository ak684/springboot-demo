import React, { memo, useState } from 'react';
import DashboardChartCard from '../components/DashboardChartCard';
import { clone } from 'shared-components/utils/lo';
import chartConfig from '../chart/lineChart';
import { Box, MenuItem, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getScoringDates,
  getVentureTotalLikelihood,
  getVentureTotalMagnitude,
  getVentureTotalScore
} from "shared-components/utils/scoring";
import TextInput from "shared-components/views/form/TextInput";
import useChart from "shared-components/hooks/useChart";

const getChartData = (magnitudeValues, likelihoodValues, scoreValues) => {
  const config = clone(chartConfig);
  config.series[0].data = magnitudeValues;
  config.series[1].data = likelihoodValues;
  config.series[2].data = scoreValues;

  const firstYear = Math.min(new Date(magnitudeValues.at(-1)?.[0]).getFullYear(), new Date(likelihoodValues.at(-1)?.[0]).getFullYear());
  const lastYear = Math.max(new Date(magnitudeValues.at(-1)?.[0]).getFullYear(), new Date(likelihoodValues.at(-1)?.[0]).getFullYear());
  if (firstYear !== lastYear) {
    config.xAxis.axisLabel.formatter = '{MMM} {d}, {yyyy}';
    config.xAxis.axisLabel.rotate = 45;
  }

  return config;
};

const ScoreOverTimeChart = () => {
  const [period, setPeriod] = useState(0);
  const { ventureId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const scoringDates = getScoringDates(venture, period);
  const scoreValues = scoringDates.map(date => [date, getVentureTotalScore(venture, date)]);
  const magnitudeValues = scoringDates.map(date => [date, getVentureTotalMagnitude(venture, date)]);
  const likelihoodValues = scoringDates.map(date => [date, getVentureTotalLikelihood(venture, date)]);
  useChart(
    'score-over-time-chart',
    getChartData,
    magnitudeValues.length > 0 || likelihoodValues.length > 0,
    magnitudeValues,
    likelihoodValues,
    scoreValues
  );

  const tooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>
        This graphic shows the total of all your scored impact chains, minus the score of your top 2 highest negative
        impact
        chains (if you have developed any). The maximum score is 500.
      </Box>
      <Box>
        Over time you will see this figure increase, primarily as you improve the impact likelihood (e.g. by starting to
        measure your impact) and by adding new impact chains.
      </Box>
    </Box>
  );

  const periodSelector = (
    <TextInput
      select
      onChange={(e) => setPeriod(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      value={period}
      variant='outlined'
      size='small'
    >
      <MenuItem value={0}>All data</MenuItem>
      <MenuItem value={7}>Last 7 days</MenuItem>
      <MenuItem value={30}>Last 30 days</MenuItem>
      <MenuItem value={90}>Last 90 days</MenuItem>
      <MenuItem value={365}>Last 365 days</MenuItem>
    </TextInput>
  );

  return (
    <DashboardChartCard
      empty={scoringDates.length === 0}
      title='Our total Impact Potential Score over time'
      subtitle='(Adding the 5-year Impact Potential Score of all impact areas)'
      tooltip={tooltip}
      type='scoring'
      controls={periodSelector}
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => navigate(`/ventures/${ventureId}/scoring-wizard`)}
    >
      <Box id='score-over-time-chart' height={350} />
    </DashboardChartCard>
  );
};

export default memo(ScoreOverTimeChart);
