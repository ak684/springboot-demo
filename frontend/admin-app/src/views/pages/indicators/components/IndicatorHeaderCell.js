import React, { memo } from 'react';
import { Box, styled, TableCell, Typography } from '@mui/material';
import AppLabel from 'views/common/AppLabel';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledImpactTypeIcon = styled(Box)(({ theme, impact }) => ({
  position: 'relative',
  top: 4,
  flexGrow: 0,
  width: theme.spacing(),
  height: theme.spacing(),
  backgroundColor: impact.positive ? theme.palette.success.main : theme.palette.error.main,
  borderRadius: '50%',
}));

const IndicatorHeaderCell = ({ impact }) => {
  return (
    <TableCell component='th'>
      <CustomErrorBoundary>
        <Box display='flex' gap={1}>
          <StyledImpactTypeIcon impact={impact} />
          <Typography variant='subtitleBold'>{impact.name}</Typography>
        </Box>
        {impact.draft && <AppLabel sx={{ mt: 1 }}>Draft</AppLabel>}
      </CustomErrorBoundary>
    </TableCell>
  );
};

export default memo(IndicatorHeaderCell);
