import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { isDefined } from "shared-components/utils/lo";
import moment from "moment";
import { yearTotal } from "shared-components/utils/quantification";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledPieChart = styled(Box)(({ theme, percent }) => ({
  position: 'relative',
  display: 'grid',
  placeContent: 'center',
  width: theme.spacing(14),
  height: theme.spacing(14),
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

const MonitoringAchievementChart = ({ values, prop, index }) => {
  const yearIndex = isDefined(index) ? index : values[prop].findIndex(v => +v.year === moment().year());
  const forecast = values[prop][yearIndex];
  const actual = values[prop + 'Actual'][yearIndex];

  const achievement = Math.round(yearTotal(actual) / yearTotal(forecast) * 100) || 0;

  return (
    <CustomErrorBoundary>
      <StyledPieChart percent={achievement}>
        <Typography align='center' variant='bodyBold'>{isFinite(achievement) ? achievement : 100}%</Typography>
        <Typography align='center' variant='caption' sx={{ fontSize: 10 }}>
          Achievement
        </Typography>
      </StyledPieChart>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringAchievementChart);
