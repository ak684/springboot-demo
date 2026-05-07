import React, { memo } from 'react';
import ScoringOverviewCard from "../components/ScoringOverviewCard";
import { Box, Typography } from "@mui/material";
import useChart from "shared-components/hooks/useChart";
import chartConfig from '../chart/bubbleChart';
import { clone } from "shared-components/utils/lo";
import impactColors from '../data/colors';
import { getVentureTotalLikelihood, getVentureTotalMagnitude } from "shared-components/utils/scoring";
import theme from "shared-components/theme";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (impacts, selected, details) => {
  const config = clone(chartConfig);

  if (details) {
    config.series[0].data = impacts.map((impact, index) => ({
      value: [impact.scoring.at(-1).likelihood, impact.scoring.at(-1).magnitude, `IA${index + 1}`],
      itemStyle: { color: impactColors[index % impactColors.length], opacity: selected.includes(impact) ? 1 : 0 },
    }));
  } else {
    const magnitude = getVentureTotalMagnitude(null, null, impacts);
    const likelihood = getVentureTotalLikelihood(null, null, impacts);
    config.series[0].data = [{
      value: [likelihood, magnitude, 'ALL'],
      itemStyle: { color: theme.palette.primary.main },
    }];
    config.series[0].symbolSize = 52;
    config.series[0].label.fontSize = 12;
    config.xAxis.min = function (value) {
      const padding = value.max === value.min ? value.min * 0.2 : (value.max - value.min) * 0.1;
      return value.min - padding;
    };
    config.xAxis.max = function (value) {
      const padding = value.max === value.min ? value.min * 0.2 : (value.max - value.min) * 0.1;
      return value.max + padding;
    };
    config.yAxis.min = function (value) {
      const padding = value.max === value.min ? value.min * 0.2 : (value.max - value.min) * 0.1;
      return value.min - padding;
    };
    config.yAxis.max = function (value) {
      const padding = value.max === value.min ? value.min * 0.2 : (value.max - value.min) * 0.1;
      return value.max + padding;
    };
  }
  config.series[0].label.formatter = (param) => param.data.value[2];

  return config;
};

const ScoringOverviewBubble = ({ impacts, selected, details }) => {
  useChart('scoring-overview-bubble', getChartData, true, impacts, selected, details);

  return (
    <CustomErrorBoundary>
      <ScoringOverviewCard sx={{ maxWidth: 590 }}>
        <Typography variant='subtitleBold' align='center' sx={{ mb: 2 }}>
          Impact by Impact Areas
        </Typography>
        <Box id='scoring-overview-bubble' height={542} />
      </ScoringOverviewCard>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverviewBubble);
