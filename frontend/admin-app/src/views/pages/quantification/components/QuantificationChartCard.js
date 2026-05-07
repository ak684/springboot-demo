import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import QuantificationTotalChart from "./QuantificationTotalChart";
import AppTooltip from "../../../common/AppTooltip";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledCard = styled(Card)(({ theme, selected }) => ({
  minWidth: 0,
  position: 'relative',
  padding: theme.spacing(2),
  height: 176,
  border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.border}`,
  flexBasis: '33%',
  backgroundColor: 'white',
  zIndex: 1,
  overflow: 'visible',
}));

const QuantificationChartCard = (
  {
    name,
    title,
    titleActions,
    getChartData,
    selected,
    chartParams,
    alternative,
    tooltip,
    ...rest
  }
) => {
  return (
    <CustomErrorBoundary>
      <StyledCard selected={selected} {...rest}>
        <Box display='flex' alignItems='center' justifyContent='space-between' gap={1} mb={1}>
          <Box display='flex' alignItems='center' gap={1}>
            <Typography variant='subtitleBold'>{title}</Typography>
            {titleActions}
          </Box>
          {tooltip && <AppTooltip>{tooltip}</AppTooltip>}
        </Box>
        {alternative ||
          <QuantificationTotalChart name={`chart-${name}`} chartParams={chartParams} getChartData={getChartData} />
        }
      </StyledCard>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationChartCard);
