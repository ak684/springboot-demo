import React, { memo } from 'react';
import { Box, Button, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MonitoringGaugeChart from "./components/MonitoringGaugeChart";
import moment from "moment";
import { clone } from "shared-components/utils/lo";
import chartConfig from "./chart/gaugeChart";
import smartRound from "shared-components/filters/smartRound";
import { arraySum } from "shared-components/utils/helpers";
import { getMonthlyActualForYear, getMonthlyForecastForYear } from "shared-components/utils/quantification";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const getIndicatorCompletion = (impact, indicator) => {
  const year = moment().year();
  const monthlyForecast = getMonthlyForecastForYear(impact, indicator, year);
  const forecast = arraySum(monthlyForecast.slice(0, moment().month() + 1));
  const monthlyActual = getMonthlyActualForYear(impact, indicator, year)
  const actual = arraySum(monthlyActual.slice(0, moment().month() + 1));

  return actual / forecast * 100 || 0;
};

const getChartData = (impact) => {
  const config = clone(chartConfig);
  const completions = impact.indicators.map(i => getIndicatorCompletion(impact, i)).filter(c => c > 0);
  const average = arraySum(completions) / completions.length / 100;

  config.series[0].data = [{
    value: average || 0,
    name: (smartRound(average * 100) || 0) + '%',
  }];
  config.series[0].axisLine.lineStyle.width = 20;

  return config;
};

const MonitoringFinish = ({ impact }) => {
  const { ventureId } = useParams();

  return (
    <CustomErrorBoundary>
      <Box
        mt={8}
        width={900}
        display='flex'
        flexDirection='column'
        alignItems='center'
        sx={{ marginLeft: 'auto', marginRight: 'auto' }}
        gap={6}
      >
        <Typography variant='h1' align='center'>
          Average actual performance across output and outcome vs. forecast as of&nbsp;
          {moment().format('MMMM')} {moment().year()}
        </Typography>
        <MonitoringGaugeChart values={impact} getData={getChartData} height={200} width={400} />
        <Typography color='text.secondary' sx={{ fontSize: 24, lineHeight: '32px' }} align='center'>
          Great you are monitoring progress! Keep the effort of reporting data and refining your current and 5-year
          forecast going!
        </Typography>
        <Button component={Link} to={`/ventures/${ventureId}/monitoring-overview`} endIcon={<ChevronRightIcon />}>
          Next
        </Button>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringFinish);
