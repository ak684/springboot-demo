import React, { memo } from 'react';
import { Box, Button, Card, Typography, useTheme } from "@mui/material";
import moment from "moment/moment";
import { dataFilled, getVentureYtdProgress } from "shared-components/utils/quantification";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/gaugeChart";
import smartRound from "shared-components/filters/smartRound";
import useChart from "shared-components/hooks/useChart";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

// toDO: Move to a separate function?
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
    <Typography variant='caption' noWrap>{text}</Typography>
  </Box>
)

const PortfolioDashboardPerformanceChart = ({ ventures }) => {
  const year = moment().year();
  const impacts = ventures
    .flatMap(v => v.impacts)
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .filter(i =>
      dataFilled(i.productsData.find(d => d.year === year)) ||
      dataFilled(i.productsDataActual.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersData.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersDataActual.find(d => d.year === year))
    );

  const theme = useTheme();
  useChart('dashboard-gauge-chart', getChartData, true, impacts);

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2 }}>
        <Typography variant='subtitleBold' sx={{ mb: 2 }}>Impact goals vs. performance</Typography>
        <Box id='dashboard-gauge-chart' height={136} />
        <Box mt={-1} display='flex' alignItems='center' justifyContent='center' gap={1}>
          <LegendItem color={theme.palette.error.light} text='Below proj.' />
          <LegendItem color={theme.palette.primary.subtle} text='Proj.' />
          <LegendItem color={theme.palette.success.light} text='Above proj.' />
        </Box>
        <Button variant='outlined' fullWidth size='small' sx={{ mt: 2 }} startIcon={<ShareOutlinedIcon />}>
          Share
        </Button>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioDashboardPerformanceChart);
