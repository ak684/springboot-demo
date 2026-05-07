import React, { memo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";

const NegativeImpactLabel = ({ index, solid }) => {
  const theme = useTheme();

  return (
    <Box
      py={0.5}
      px={1}
      sx={{
        borderRadius: '4px',
        border: `1px solid ${theme.palette.error.main}`,
      }}
      backgroundColor={solid ? 'error.main' : 'error.subtle'}
    >
      <Typography
        sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
        color={solid ? 'light.main' : 'error.main'}
      >
        Negative {index}
      </Typography>
    </Box>
  );
};

export default memo(NegativeImpactLabel);
