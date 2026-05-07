import React, { memo } from 'react';
import { Box } from "@mui/material";
import { clone, isDefined } from "shared-components/utils/lo";
import moment from "moment";
import chartConfig from "../chart/barChart";
import useChart from "shared-components/hooks/useChart";
import { MONTHS } from "shared-components/utils/constants";
import theme from "shared-components/theme";

const getChartData = (forecast, actual) => {
  const config = clone(chartConfig);

  config.xAxis.data = MONTHS.map(m => m.substring(0, 1).toUpperCase() + m.slice(1));
  config.series[0].data = MONTHS.map(m => {
    const value = (actual[m] || 0) - (forecast[m] || 0);
    return {
      value,
      itemStyle: {
        color: value >= 0 ? theme.palette.success.main : theme.palette.error.main
      }
    }
  });

  return config;
};

const MonitoringPerformanceChart = ({ values, prop, index }) => {
  const yearIndex = isDefined(index) ? index : values[prop].findIndex(v => +v.year === moment().year());
  const forecast = values[prop][yearIndex];
  const actual = values[prop + 'Actual'][yearIndex];

  useChart(
    'performance-chart',
    getChartData,
    true,
    forecast,
    actual
  );

  return (
    <Box id='performance-chart' height={120} />
  );
};

export default memo(MonitoringPerformanceChart);
