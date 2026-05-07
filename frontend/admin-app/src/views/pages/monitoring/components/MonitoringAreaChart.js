import React, { memo } from 'react';
import { Box } from "@mui/material";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/areaChart";
import useChart from "shared-components/hooks/useChart";
import moment from "moment";
import { arrayCumulative } from "shared-components/utils/helpers";
import { getForecastForYear, getMonthlyActualForYear } from "shared-components/utils/quantification";

const getChartData = (values, index) => {
  const config = clone(chartConfig);

  const indicatorData = values.indicators[index];
  const year = moment().year();
  const forecast = getForecastForYear(values, indicatorData, year);
  const monthlyActual = getMonthlyActualForYear(values, indicatorData, year);
  const actual = monthlyActual.slice(0, moment().month() + 1)
  const chartValues = actual.map(val => Math.floor(val / forecast * 100) || 0);
  config.series[0].data = arrayCumulative(chartValues);

  return config;
};

const MonitoringAreaChart = ({ values, index }) => {
  useChart('area-chart', getChartData, true, values, index);

  return (
    <Box id='area-chart' height={140} />
  );
};

export default memo(MonitoringAreaChart);
