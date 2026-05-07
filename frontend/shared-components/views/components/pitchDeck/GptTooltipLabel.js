import React, { memo } from 'react';
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const GptTooltipLabel = ({ label, ...rest }) => {
  return (
    <Box display='flex' alignItems='center' gap={2} {...rest}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 'bold',
          color: 'secondary.dark',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </Typography>
      <Tooltip
        title={(
          <Box>
            <Box>
              You can request AI to generate a new text by clicking on the refresh icon below, or you can edit
              the text manually
            </Box>
            <Box mt={2}>
              Manual edits remain saved, unless you click the refresh icon below. This will overwrite any manual
              text edits.
            </Box>
          </Box>
        )}>
        <IconButton>
          <InfoOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default memo(GptTooltipLabel);
