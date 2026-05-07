import React, { memo } from 'react';
import { Box, styled, Typography } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'white',
    width: 300,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[10],
  },
}));

const DashboardChartBar = ({ color, value, max, label, valueLabel, tooltip }) => {
  return (
    <CustomErrorBoundary>
      <StyledTooltip title={tooltip}>
        <Box display='flex' flexDirection='column' alignItems='center' gap={1}>
          <Typography variant='captionBold'>{valueLabel}</Typography>
          <Box
            width={40}
            height={160}
            sx={{ backgroundColor: (theme) => theme.palette.background.fade }}
            display='flex'
            alignItems='flex-end'
          >
            <Box width={40} sx={{ backgroundColor: color }} height={`${(value / max) * 100}%`} />
          </Box>
          {label && <Typography variant='caption'>{label}</Typography>}
        </Box>
      </StyledTooltip>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardChartBar);
