import React, { memo } from 'react';
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/gaugeChart";
import { Box, Typography, useTheme } from "@mui/material";
import useChart from "shared-components/hooks/useChart";
import smartRound from "shared-components/filters/smartRound";
import { getVentureYtdProgress } from "shared-components/utils/quantification";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (impacts) => {
  const config = clone(chartConfig);
  const ventureAverage = getVentureYtdProgress(impacts);

  if (isNaN(ventureAverage)) {
    return config;
  }

  config.series[0].data = [{
    value: ventureAverage,
    name: `${ventureAverage > 0 ? '+' : ''}${smartRound(ventureAverage)}%`,
  }]

  return config;
};

const LegendItem = ({ color, text }) => (
  <Box display='flex' alignItems='center' gap={0.5}>
    <Box width={6} height={6} backgroundColor={color} />
    <Typography sx={{ fontSize: 10 }} noWrap>{text}</Typography>
  </Box>
)

const DashboardPerformanceGaugeChart = ({ impacts }) => {
  const theme = useTheme();
  useChart('dashboard-gauge-chart', getChartData, true, impacts);

  return (
    <CustomErrorBoundary>
      <Box>
        <Box id='dashboard-gauge-chart' height={90} />
        <Box mt={-1} display='flex' alignItems='center' justifyContent='center' gap={1}>
          <LegendItem color={theme.palette.error.light} text='Below proj.' />
          <LegendItem color={theme.palette.primary.subtle} text='Proj.' />
          <LegendItem color={theme.palette.success.light} text='Above proj.' />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardPerformanceGaugeChart);
