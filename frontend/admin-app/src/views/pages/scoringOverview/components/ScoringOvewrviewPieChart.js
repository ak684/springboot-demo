import React, { memo } from 'react';
import { Box } from '@mui/material';
import chartConfig from '../chart/pieChart';
import { clone } from 'shared-components/utils/lo';
import useChart from "shared-components/hooks/useChart";
import theme from "shared-components/theme";

const getChartData = (value, max, label) => {
  const config = clone(chartConfig);
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? value : 0;
  const filled = Math.min(Math.abs(safeValue), safeMax);
  config.series[0].data = [{
    value: filled,
    name: 'filled',
    itemStyle: { color: theme.palette.primary.main }
  }, {
    value: Math.max(safeMax - filled, 0),
    name: 'rest',
    itemStyle: { color: theme.palette.primary.subtle }
  }];
  config.series[0].markPoint.data[0].name = label;
  return config;
};

const ScoringOverviewPieChart = ({ value, max = 100, name, label }) => {
  useChart(`chart-${name}`, getChartData, true, value, max, label)

  return (
    <Box id={`chart-${name}`} width={104} height={104} />
  );
};

export default memo(ScoringOverviewPieChart);
