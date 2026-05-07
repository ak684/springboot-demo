import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import moment from "moment/moment";
import { arraySum } from "shared-components/utils/helpers";
import { getActualForYear, getForecastForYear } from "shared-components/utils/quantification";

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

const ChartCardPercentageChart = ({ impact }) => {
  const indicatorCompletions = [];
  const year = moment().year();

  impact.indicators.forEach((indicator) => {
    const forecast = getForecastForYear(impact, indicator, year);
    const actual = getActualForYear(impact, indicator, year);

    if (forecast > 0) {
      indicatorCompletions.push(actual / forecast * 100);
    }
  });

  const percentCompletion = Math.round(arraySum(indicatorCompletions) / indicatorCompletions.length) || 0;

  return (
    <StyledPieChart percent={percentCompletion}>
      <Typography align='center' variant='bodyBold'>{percentCompletion}%</Typography>
    </StyledPieChart>
  );
};

export default memo(ChartCardPercentageChart);
