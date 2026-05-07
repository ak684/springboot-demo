import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import AppTooltip from "../../../common/AppTooltip";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledCard = styled(Card)(({ theme }) => ({
  minWidth: 0,
  position: 'relative',
  padding: theme.spacing(2),
  height: 176,
  border: `1px solid ${theme.palette.border}`,
  flexBasis: '33%',
  backgroundColor: 'white',
  zIndex: 1,
  overflow: 'visible',
}));

const MonitoringChartCard = (
  {
    name,
    title,
    titleActions,
    chart,
    alternative,
    tooltip,
    ...rest
  }
) => {
  return (
    <CustomErrorBoundary>
      <StyledCard {...rest}>
        <Box display='flex' alignItems='center' justifyContent='space-between' gap={1} mb={1}>
          <Box display='flex' alignItems='center' gap={1} minHeight={24} minWidth={0}>
            <Typography variant='subtitleBold' noWrap>{title}</Typography>
            {titleActions}
          </Box>
          {tooltip && <AppTooltip>{tooltip}</AppTooltip>}
        </Box>
        {alternative || chart}
      </StyledCard>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringChartCard);
