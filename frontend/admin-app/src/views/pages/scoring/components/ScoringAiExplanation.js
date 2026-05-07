import React, { memo } from 'react';
import { IconButton, Tooltip } from "@mui/material";

const ScoringAiExplanation = ({ children }) => {
  return (
    <Tooltip title={children} placement='top'>
      <IconButton
        sx={{
          width: 32,
          height: 32,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': { backgroundColor: 'primary.main' },
          fontSize: 16,
          fontWeight: 'bold'
        }}
      >
        AI?
      </IconButton>
    </Tooltip>
  );
};

export default memo(ScoringAiExplanation);
