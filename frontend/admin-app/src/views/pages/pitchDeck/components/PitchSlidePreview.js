import React, { memo } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchSlidePreview = ({ children, selected, onClick, step, index }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <Box
        p={0.5}
        display='flex'
        alignItems='center'
        gap={{ xs: 1, sm: 2 }}
        sx={{ cursor: 'pointer', borderRadius: '8px', backgroundColor: selected ? 'secondary.light' : 'transparent' }}
        onClick={onClick}
      >
        <Box
          width={120}
          height={80}
          overflow='hidden'
          sx={{ borderRadius: '4px', border: `1px solid ${theme.palette.border}` }}
          display='flex'
          flexDirection='column'
          justifyContent='flex-start'
        >
          <Box
            width={1200}
            height={600}
            sx={{ transform: 'scale(0.1)', transformOrigin: 'top left', pointerEvents: 'none' }}
          >
            {children}
          </Box>
        </Box>
        <Typography variant='body'>{index + 1}. {step.title}</Typography>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PitchSlidePreview);
