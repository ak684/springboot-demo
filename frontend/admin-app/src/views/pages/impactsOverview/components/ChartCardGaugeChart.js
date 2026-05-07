import React, { memo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import moment from "moment";
import { arraySum } from "shared-components/utils/helpers";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/gaugeChart";
import useChart from "shared-components/hooks/useChart";
import { getMonthlyActualForYear, getMonthlyForecastForYear } from "shared-components/utils/quantification";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (impact) => {
  const config = clone(chartConfig);
  const year = moment().year();
  const indicatorCompletions = [];

  impact.indicators.forEach((indicator, index) => {
    const monthlyForecast = getMonthlyForecastForYear(impact, indicator, year);
    const forecast = arraySum(monthlyForecast.slice(0, moment().month() + 1));
    const monthlyActual = getMonthlyActualForYear(impact, indicator, year)
    const actual = arraySum(monthlyActual.slice(0, moment().month() + 1));

    if (forecast > 0) {
      indicatorCompletions.push(actual / forecast * 100 - 100);
    }
  });

  const average = Math.round(arraySum(indicatorCompletions) / indicatorCompletions.length);

  if (isNaN(average)) {
    return config;
  }

  config.series[0].data = [{
    value: average,
    name: `${average > 0 ? '+' : ''}${average}%`,
  }]

  return config;
};

const LegendItem = ({ color, text }) => (
  <Box display='flex' alignItems='center' gap={0.5}>
    <Box width={6} height={6} backgroundColor={color} />
    <Typography sx={{ fontSize: 10 }}>{text}</Typography>
  </Box>
)

const ChartCardGaugeChart = ({ impact, ...rest }) => {
  const theme = useTheme();
  useChart(`gauge-chart-${impact.id}`, getChartData, true, impact);

  return (
    <CustomErrorBoundary>
      <Box {...rest}>
        <Box id={`gauge-chart-${impact.id}`} height={90} />
        <Box mt={-1} display='flex' alignItems='center' justifyContent='center' gap={1}>
          <LegendItem color={theme.palette.error.light} text='Below proj.' />
          <LegendItem color={theme.palette.primary.subtle} text='Proj.' />
          <LegendItem color={theme.palette.success.light} text='Above proj.' />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ChartCardGaugeChart);
