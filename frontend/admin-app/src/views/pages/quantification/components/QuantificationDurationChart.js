import React, { memo } from 'react';
import { Box, useTheme } from '@mui/material';
import { clone } from "shared-components/utils/lo";
import chartConfig from "shared-components/chart/stackedBarChart";
import { getContinuedOutcome, getYearOutcome } from "shared-components/utils/quantification";
import useChart from "shared-components/hooks/useChart";
import Card from "@mui/material/Card";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (values, index) => {
  const config = clone(chartConfig);
  config.xAxis.data = values.productsData.map(v => '\'' + String(v.year).slice(-2));
  const indicator = values.indicators[index];
  config.series[0].data = getYearOutcome(values, indicator);
  config.series[1].data = getContinuedOutcome(values, indicator);
  return config;
};

const QuantificationDurationChart = ({ values, index, ...rest }) => {
  const theme = useTheme();
  useChart('duration-chart', getChartData, true, values, index);

  return (
    <CustomErrorBoundary>
      <Card
        sx={{
          p: 2,
          height: 232,
          backgroundColor: 'white',
          border: `1px solid ${theme.palette.border}`,
          overflow: 'visible'
        }}
        {...rest}
      >
        <Box id='duration-chart' height={200} width='100%' />
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationDurationChart);
