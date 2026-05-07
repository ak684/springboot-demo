import React, { memo } from "react";
import useChart from "shared-components/hooks/useChart";
import { Box } from "@mui/material";
import { clone } from "shared-components/utils/lo";
import chartConfig from "./chart/aiMetricsColumnConfig";

const getChartData = (data) => {
  const config = clone(chartConfig);

  const labels = data.map((item) => item.ff);
  const chartData = data.map((item) => item.cc);
  config.series[0].data = chartData;
  config.xAxis.data = labels;
  return config;
};

const AiMetricsColumnChart = ({ data }) => {
  useChart("ai-metrics-column-chart", getChartData, data, data);

  const chartContainerStyle = {
    width: "90vw",
    height: "300px",
    position: "relative",
  };

  return <Box id="ai-metrics-column-chart" sx={chartContainerStyle} />;
};

export default memo(AiMetricsColumnChart);
