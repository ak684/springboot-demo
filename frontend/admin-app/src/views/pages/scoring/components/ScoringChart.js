import React, { memo } from 'react';
import { Box } from '@mui/material';
import chartConfig from '../chart/pieChart';
import { clone } from 'shared-components/utils/lo';
import useChart from "shared-components/hooks/useChart";

const getChartData = (value, max, colors, label, name) => {
  const config = clone(chartConfig);

  config.series[0].data = [{
    value,
    name: 'filled',
    itemStyle: { color: colors[0] }
  }, {
    value: max - value,
    name: 'rest',
    itemStyle: { color: colors[1] }
  }];
  config.series[0].markPoint.data[0].name = label;
  config.series[0].markPoint.data[1].name = name.substring(0, 1).toUpperCase() + name.substring(1);
  return config;
};

const ScoringChart = ({ value, max = 100, name, colors, label }) => {
  useChart(`chart-${name}`, getChartData, true, value, max, colors, label, name)

  return (
    <Box id={`chart-${name}`} width={144} height={144} />
  );
};

export default memo(ScoringChart);
