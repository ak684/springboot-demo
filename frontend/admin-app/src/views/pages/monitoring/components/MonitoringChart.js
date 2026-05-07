import React, { memo } from 'react';
import useChart from "shared-components/hooks/useChart";
import { Box } from "@mui/material";

const MonitoringChart = ({ name, chartParams, getChartData }) => {
  useChart(name, getChartData, true, ...chartParams);

  return (
    <Box id={name} height={110} width='100%' />
  );
};

export default memo(MonitoringChart);
