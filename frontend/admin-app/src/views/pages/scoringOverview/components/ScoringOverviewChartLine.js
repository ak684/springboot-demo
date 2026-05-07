import React, { memo } from 'react';
import { Box, styled, Tooltip, Typography, useTheme } from "@mui/material";
import { alpha } from '@mui/material/styles';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTextWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  zIndex: 1,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  padding: theme.spacing(),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(),
}))

const ScoringOverviewChartLine = ({ left, right, text, progress, tooltipQuestion, tooltipAnswers }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <Tooltip
        title={(
          <Box>
            {tooltipQuestion && <Typography variant='body'>{tooltipQuestion}</Typography>}
            {tooltipAnswers && (
              <Box mt={2}>
                {tooltipAnswers.map((a, index) => (
                  <Typography key={a.name} variant='subtitle'>({index + 1}) {a.description}</Typography>)
                )}
              </Box>
            )}
          </Box>
        )}
      >
        <Box position='relative' height={32} backgroundColor={theme.palette.background.fade}>
          <Box backgroundColor={alpha(theme.palette.primary.main, 0.5)} width={progress + '%'} height='100%' />
          <StyledTextWrapper>
            <Typography variant='captionBold'>{left}</Typography>
            <Typography variant='caption' noWrap title={text}>{text}</Typography>
            <Typography variant='captionBold'>{right}</Typography>
          </StyledTextWrapper>
        </Box>
      </Tooltip>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverviewChartLine);
