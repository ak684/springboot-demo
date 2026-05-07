import React, { memo, useEffect } from 'react';
import VenturesOverviewCard from "../components/VenturesOverviewCard";
import { Box, Typography } from "@mui/material";
import useChart from "shared-components/hooks/useChart";
import chartConfig from '../chart/bubbleChart';
import { clone, containsBy } from "shared-components/utils/lo";
import colors from '../data/colors';
import {
  getVentureTotalLikelihood,
  getVentureTotalMagnitude,
  getVentureTotalScore
} from "shared-components/utils/scoring";

const getChartData = (ventures, selected) => {
  const config = clone(chartConfig);

  if (ventures.length > 0) {
    config.series[0].data = ventures.map((v, index) => ({
      value: [getVentureTotalLikelihood(v), getVentureTotalMagnitude(v), `V${index + 1}`],
      itemStyle: {
        color: colors[index % colors.length],
        opacity: getVentureTotalScore(v) > 0 && containsBy(selected, v, 'id') ? 1 : 0
      },
      symbolSize: Math.max(getVentureTotalScore(v), 25),
      name: v.name,
    }))
    config.series[0].label.fontSize = 12;
  }

  config.series[0].label.formatter = (param) => param.data.value[2];
  return config;
}

const VenturesOverviewBubble = ({ ventures, selected, showDetails }) => {
  useChart('ventures-overview-bubble', getChartData, true, ventures, selected);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [showDetails]);

  return (
    <VenturesOverviewCard>
      <Typography variant='subtitleBold' align='center' sx={{ mb: 2 }}>
        Impact by ventures
      </Typography>
      <Box id='ventures-overview-bubble' height={631} />
    </VenturesOverviewCard>
  );
};

export default memo(VenturesOverviewBubble);
