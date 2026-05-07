import React, { memo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/gaugeChart";
import useChart from "shared-components/hooks/useChart";
import moment from "moment";
import smartRound from "shared-components/filters/smartRound";
import { getMonthlyActualForYear, getMonthlyForecastForYear } from "shared-components/utils/quantification";
import { arraySum } from "shared-components/utils/helpers";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (values, index) => {
  const config = clone(chartConfig);
  const indicatorData = values.indicators[index];
  const year = moment().year();
  const monthlyForecast = getMonthlyForecastForYear(values, indicatorData, year);
  const forecast = arraySum(monthlyForecast.slice(0, moment().month() + 1));
  const monthlyActual = getMonthlyActualForYear(values, indicatorData, year)
  const actual = arraySum(monthlyActual.slice(0, moment().month() + 1));

  config.series[0].data = [{
    value: actual / forecast || 0,
    name: smartRound(actual),
  }]

  return config;
};

const LegendItem = ({ color, text }) => (
  <Box display='flex' alignItems='center' gap={0.5}>
    <Box width={6} height={6} backgroundColor={color} />
    <Typography sx={{ fontSize: 10 }}>{text}</Typography>
  </Box>
)

const MonitoringGaugeChart = ({ values, index, getData = getChartData, height = 120, ...rest }) => {
  const theme = useTheme();
  useChart('gauge-chart', getData, true, values, index);

  return (
    <CustomErrorBoundary>
      <Box {...rest}>
        <Box id='gauge-chart' height={height} />
        <Box mt={-2} display='flex' alignItems='center' justifyContent='center' gap={1}>
          <LegendItem color={theme.palette.error.light} text='Below projection' />
          <LegendItem color={theme.palette.primary.subtle} text='Projection' />
          <LegendItem color={theme.palette.success.light} text='Above projection' />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringGaugeChart);
