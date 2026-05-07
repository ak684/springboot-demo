import React, { memo } from 'react';
import Card from "@mui/material/Card";
import { Box, Typography, useTheme } from "@mui/material";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/barChart";
import useChart from "shared-components/hooks/useChart";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { getVentureGoals, getVentureTotalScore, scoredSdgImpacts } from "shared-components/utils/scoring";
import filters from "shared-components/filters";

const getChartData = (ventures, goals) => {
  const config = clone(chartConfig);
  let chartData = goals.map(g => 0);
  let totalScore = 0;

  ventures.forEach(v => {
    const ventureGoals = getVentureGoals(v, goals);
    if (ventureGoals.length > 0) {
      const impacts = scoredSdgImpacts(v);
      const ventureScore = getVentureTotalScore(v, null, impacts);
      totalScore += ventureScore;
      ventureGoals.forEach(g => {
        chartData[g.number - 1] += g.rate * ventureScore;
      })
    }
  });

  config.xAxis.axisLabel.formatter = (value, index) => '{' + index + '| }';
  config.xAxis.axisLabel.rich = goals.reduce((acc, goal) => {
    if (chartData[goal.number - 1] > 0) {
      acc.push({ height: 24, align: 'center', backgroundColor: { image: `/images/sdg/${goal.number}.svg` } });
    }
    return acc;
  }, []);
  const shownGoals = goals.filter((g, index) => chartData[index] > 0);
  config.series[0].itemStyle.color = (params) => {
    const colorList = shownGoals.map(g => g.color);
    return colorList[params.dataIndex];
  }
  config.tooltip.formatter = (params) => {
    return `
      <div style="display: flex; gap: 4px; align-items: center">
        <span>${shownGoals[params.dataIndex].shortName}</span><br>
        <strong>${filters.number(params.value)}%</strong>
      </div>
    `;
  };
  chartData = chartData.map(data => data / totalScore).filter(data => data > 0);
  config.series[0].data = chartData;

  return config;
}

const PublicDatabaseSdgChart = ({ ventures, sx = {} }) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());

  useChart('portfolio-sdg-chart', getChartData, true, ventures, goals);

  return (
    <Card sx={{ p: 2, border: `1px solid ${theme.palette.border}`, ...sx }}>
      <Typography sx={{ mb: 2 }} variant='h5'>Impact Potential by SDGs</Typography>
      <Box height={280} id='portfolio-sdg-chart' />
    </Card>
  );
};

export default memo(PublicDatabaseSdgChart);
