import React, { memo } from 'react';
import { IconButton, Tooltip } from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";

const GptRegenerateButton = ({ onClick }) => {
  return (
    <Tooltip title='Suggest new AI text version'>
      <IconButton onClick={onClick}>
        <CachedIcon />
      </IconButton>
    </Tooltip>
  );
};

export default memo(GptRegenerateButton);
