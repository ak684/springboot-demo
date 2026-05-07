import React, { memo } from 'react';
import { Box, styled, TableCell, TableRow, Typography } from '@mui/material';
import DimensionsSlider from './DimensionsSlider';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StickyLeftCell = styled(TableCell)(() => ({
  position: 'sticky',
  backgroundColor: 'inherit',
  left: -1,
  zIndex: 1,
}));

const DimensionsRow = ({ firstCell, showFirstCell, label, data, showSlider, numeric, field, onlyPositive }) => {
  const questions = useSelector(dictionarySelectors.getScoringQuestions());

  return (
    <CustomErrorBoundary>
      <TableRow sx={{ backgroundColor: 'inherit' }}>
        {showFirstCell && firstCell}
        <StickyLeftCell sx={{ width: 'calc((100vw - 64px) * 0.14 - 2px)' }}>
          <Box display='flex' alignItems='center' gap={1}>
            <Typography variant='captionBold'>
              {label}
            </Typography>
          </Box>
        </StickyLeftCell>
        {data.map(impact => (
          <TableCell key={impact.id}>
            {showSlider && (impact.positive || !onlyPositive) && (
              <DimensionsSlider
                values={impact.positive ? questions[field] : questions[`${field}Negative`]}
                value={
                  impact.positive || numeric ?
                    impact.scoring.at(-1)?.[field] :
                    impact.scoring.at(-1)?.[`${field}Negative`]
                }
                impact={impact}
                field={impact.positive || numeric ? field : `${field}Negative`}
                fieldGroup={field}
                numeric={numeric}
              />
            )}
            {!showSlider && <Typography variant='captionBold'>{impact[field]}</Typography>}
          </TableCell>
        ))}
      </TableRow>
    </CustomErrorBoundary>
  );
};

export default memo(DimensionsRow);
