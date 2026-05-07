import React, { memo } from 'react';
import { Box } from '@mui/material';

const ScoringActiveQuestionIndicator = ({ filled, transparent, ...rest }) => {
  return (
    <Box
      {...rest}
      height={5}
      sx={{
        borderRadius: 8,
        backgroundColor: theme => transparent ?
          'transparent' :
          filled ? theme.palette.primary.main : theme.palette.primary.subtle,
      }}
    />
  );
};

export default memo(ScoringActiveQuestionIndicator);
