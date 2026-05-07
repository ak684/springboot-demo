import React, { memo } from 'react';
import { Box, styled, TableCell, Typography, useTheme } from '@mui/material';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledVerticalBox = styled(Box)(() => ({
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  ...getTypography('captionBold'),
  textAlign: 'center'
}));

const IndicatorContentCell = ({ indicators, edit }) => {
  const theme = useTheme();

  const indicatorItems = indicators.map(i => (
    <Box key={i.id} display='flex' gap={1} alignItems='center' onClick={() => edit(i)} sx={{ cursor: 'pointer' }}>
      <StyledVerticalBox>{i.year}</StyledVerticalBox>
      <Typography variant='caption'>{i.name}</Typography>
    </Box>
  ));

  return (
    <TableCell sx={{ padding: theme.spacing(2, 1) }}>
      <CustomErrorBoundary>
        <Box display='flex' flexDirection='column' gap={2}>
          {indicatorItems}
        </Box>
      </CustomErrorBoundary>
    </TableCell>
  );
};

export default memo(IndicatorContentCell);
