import React, { memo } from 'react';
import { Alert, AlertTitle, Box, styled } from '@mui/material';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderColor: theme.palette.border,
  boxShadow: theme.shadows[1],
  borderRadius: 8,
}));

const InfoAlert = ({ title, children, sx = {}, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <StyledAlert
        variant='outlined'
        severity='info'
        sx={{ '.MuiAlert-icon': { color: 'text.primary' }, ...sx }}
        {...rest}
      >
        <AlertTitle sx={{ fontWeight: 700, ...getTypography('body') }} color='text.primary'>{title}</AlertTitle>
        <Box display='flex' flexDirection='column' gap={1} sx={{ ...getTypography('subtitle') }} color='text.secondary'>
          {children}
        </Box>
      </StyledAlert>
    </CustomErrorBoundary>
  );
};

export default memo(InfoAlert);
