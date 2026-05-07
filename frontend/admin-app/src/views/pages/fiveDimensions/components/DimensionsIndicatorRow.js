import React, { memo } from 'react';
import { Box, styled, TableCell, TableRow, Typography } from '@mui/material';
import DimensionsSlider from './DimensionsSlider';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledVerticalText = styled(Typography)(({ theme }) => ({
  flexShrink: 0,
  flexGrow: 0,
  padding: theme.spacing(1, 0),
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  fontSize: 10,
  fontWeight: 700,
}));

const StickyLeftCell = styled(TableCell)(() => ({
  position: 'sticky',
  backgroundColor: 'inherit',
  left: -1,
  zIndex: 1,
}));

const getIndicatorScoreValue = (impact, indicator) =>
  impact.scoring.at(-1)?.indicatorScores.find(is => is.indicator?.id === indicator.id);


const DimensionsIndicatorRow = ({ firstCell, showFirstCell, data }) => {
  const questions = useSelector(dictionarySelectors.getScoringQuestions());

  return (
    <CustomErrorBoundary>
      <TableRow sx={{ backgroundColor: 'inherit' }}>
        {showFirstCell && firstCell}
        <StickyLeftCell sx={{ width: 'calc((100vw - 64px) * 0.14 - 2px)' }}>
          <Typography variant='captionBold'>Indicators</Typography>
        </StickyLeftCell>
        {data.map(impact => (
          <TableCell key={impact.id} sx={{ verticalAlign: 'top' }}>
            <Box display='flex' flexDirection='column' gap={2}>
              {impact.indicators.map((indicator, index) => (
                <Box key={indicator.id}>
                  <Typography variant='captionBold'>Indicator {index + 1}</Typography>
                  <Box display='flex' mt={1}>
                    <Typography variant='caption' sx={{ flexGrow: 1 }}>{indicator.name}</Typography>
                    <StyledVerticalText>{indicator.year}</StyledVerticalText>
                  </Box>
                  {impact.positive && (
                    <Box>
                      <Typography variant='captionBold' sx={{ mb: 2 }}>Noisiness</Typography>
                      <DimensionsSlider
                        values={questions.noisiness}
                        value={getIndicatorScoreValue(impact, indicator)?.noisiness}
                        impact={impact}
                        indicator={indicator}
                        field='noisiness'
                        fieldGroup='noisiness'
                      />
                    </Box>
                  )}
                  {impact.positive && (
                    <Box mt={2}>
                      <Typography variant='captionBold' sx={{ mb: 2 }}>Validation</Typography>
                      <DimensionsSlider
                        values={questions.validation}
                        value={getIndicatorScoreValue(impact, indicator)?.validation}
                        impact={impact}
                        indicator={indicator}
                        field='validation'
                        fieldGroup='validation'
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </CustomErrorBoundary>
  );
};

export default memo(DimensionsIndicatorRow);
