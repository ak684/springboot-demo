import React, { memo } from 'react';
import styled from '@emotion/styled';
import TextField from '@mui/material/TextField';
import { Box, Typography } from '@mui/material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '.MuiInputBase-root': {
    minHeight: theme.spacing(5),
    '&.MuiInputBase-multiline': {
      height: 'unset'
    },
  },
}));

const TextInput = ({ letterCounter, value, helperText, ...rest }) => {
  const maxLength = rest.inputProps?.maxLength;
  const showLetterCounter = letterCounter && maxLength;
  const hasHelperContent = helperText || showLetterCounter;

  const helperTextNode = hasHelperContent ? (
    <Box display='flex' justifyContent='space-between'>
      <Typography variant='caption'>{helperText}</Typography>
      {showLetterCounter && <Typography color='text.secondary'>{value?.length || 0} / {maxLength}</Typography>}
    </Box>
  ) : undefined;

  return (
    <StyledTextField
      variant='standard'
      value={value}
      {...rest}
      helperText={helperTextNode}
      FormHelperTextProps={hasHelperContent ? { component: 'div' } : undefined}
    />
  );
};

export default memo(TextInput);
