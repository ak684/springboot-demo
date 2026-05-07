import React, { memo } from 'react';
import { Box, styled, Typography } from '@mui/material';
import Tooltip from "@mui/material/Tooltip";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 400,
    backgroundColor: 'white',
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[10],
  },
}));

const DashboardChartLine = ({ color, value, max, label, valueLabel, tooltip, valueWidth = 44, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <StyledTooltip title={tooltip}>
        <Box display='flex' alignItems='center' {...rest}>
          <Typography sx={{ width: valueWidth, flexShrink: 0, flexGrow: 0 }} variant='captionBold' noWrap>
            {valueLabel}
          </Typography>
          <Box flexGrow={1} minWidth={0}>
            <Box height={8} sx={{ backgroundColor: (theme) => theme.palette.background.fade }}>
              <Box height={8} sx={{ backgroundColor: color }} width={`${(value / max) * 100}%`} />
            </Box>
            {label && <Typography variant='caption' sx={{ mt: 0.5 }}>{label}</Typography>}
          </Box>
        </Box>
      </StyledTooltip>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardChartLine);
