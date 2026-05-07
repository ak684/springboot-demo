import React, { memo } from 'react';
import { Box, styled, TableCell, Typography } from '@mui/material';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledImpactTypeIcon = styled(Box)(({ theme, impact }) => ({
  position: 'relative',
  top: 4,
  flexGrow: 0,
  flexShrink: 0,
  width: theme.spacing(),
  height: theme.spacing(),
  backgroundColor: impact.positive ? theme.palette.success.main : theme.palette.error.main,
  borderRadius: '50%',
}));

const StyledStickyCell = styled(TableCell)(() => ({
  position: 'sticky',
  backgroundColor: 'white',
  top: -1,
  zIndex: 2,
}));

const DimensionsHeaderCells = ({ data }) => {
  return data.map(impact => (
    <CustomErrorBoundary>
      <StyledStickyCell component='th' key={impact.id}>
        <Box sx={{ textAlign: 'center' }}>
          <Box display='flex' gap={0.5} justifyContent='center'>
            <StyledImpactTypeIcon impact={impact} />
            <Typography variant='captionBold'>{impact.name}</Typography>
          </Box>
          {(impact.scoring.at(-1)?.likelihood || impact.scoring.at(-1)?.magnitude) && (
            <Box mt={2} display='flex' justifyContent='space-between' alignItems='center'>
              {impact.scoring.at(-1)?.magnitude && (
                <Box>
                  <Typography variant='caption' sx={{ mb: 0.25 }}>Magnitude:</Typography>
                  <Typography variant='captionBold'>
                    {impact.scoring.at(-1).magnitude.toFixed(0)}
                  </Typography>
                </Box>
              )}
              {impact.scoring.at(-1)?.magnitude && impact.scoring.at(-1)?.likelihood &&
                <Typography variant='captionBold'>x</Typography>
              }
              {impact.scoring.at(-1)?.likelihood && (
                <Box>
                  <Typography variant='caption' sx={{ mb: 0.25 }}>Likelihood:</Typography>
                  <Typography variant='captionBold'>
                    {impact.scoring.at(-1).likelihood.toFixed(0)}%
                  </Typography>
                </Box>
              )}
              {
                impact.scoring.at(-1)?.magnitude &&
                impact.scoring.at(-1)?.likelihood &&
                <Typography variant='captionBold'>x</Typography>
              }
              {impact.scoring.at(-1)?.score && (
                <Box>
                  <Typography variant='caption' sx={{ mb: 0.25 }}>Impact pt.:</Typography>
                  <Typography variant='captionBold'>
                    {impact.scoring.at(-1).score.toFixed(0)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </StyledStickyCell>
    </CustomErrorBoundary>
  ));
};

export default memo(DimensionsHeaderCells);
