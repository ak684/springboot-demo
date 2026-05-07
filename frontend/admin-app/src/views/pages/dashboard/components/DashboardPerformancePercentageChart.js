import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import moment from "moment";
import { arraySum } from "shared-components/utils/helpers";
import smartRound from "shared-components/filters/smartRound";
import { getForecastForYear, getMonthlyActualForYear } from "shared-components/utils/quantification";

const StyledPieChart = styled(Box)(({ theme, percent }) => ({
  position: 'relative',
  display: 'inline-grid',
  placeContent: 'center',
  width: theme.spacing(12.5),
  height: theme.spacing(12.5),
  marginLeft: 'auto',
  marginRight: 'auto',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${theme.palette.primary.main} calc(${percent} * 1%), ${theme.palette.primary.subtle} 0)`,
    mask: `radial-gradient(farthest-side, #0000 calc(99% - 10px), #000 calc(100% - 10px))`,
  }
}));

const DashboardPerformancePercentageChart = ({ impacts }) => {
  const totalScore = arraySum(impacts.map(i => Math.abs(i.scoring.at(-1).score)));
  const impactCompletions = [];
  const year = moment().year();

  impacts.forEach(impact => {
    const indicatorCompletions = [];
    impact.indicators.forEach((indicator) => {
      const forecast = getForecastForYear(impact, indicator, year);
      const monthlyActual = getMonthlyActualForYear(impact, indicator, year);
      const actual = arraySum(monthlyActual.slice(0, moment().month() + 1));

      if (forecast > 0) {
        indicatorCompletions.push(actual / forecast * 100);
      }
    });

    const percentCompletion = Math.round(arraySum(indicatorCompletions) / indicatorCompletions.length) || 0;
    impactCompletions.push(percentCompletion);
  });

  const completion = smartRound(arraySum(impactCompletions.map((c, index) => c * impacts[index].scoring.at(-1).score)) / totalScore);

  return (
    <StyledPieChart percent={completion}>
      <Typography align='center' variant='bodyBold'>{completion}%</Typography>
    </StyledPieChart>
  );
};

export default memo(DashboardPerformancePercentageChart);
