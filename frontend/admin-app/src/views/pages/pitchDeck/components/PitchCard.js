import React, { memo } from 'react';
import { Card, useTheme } from "@mui/material";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchCard = ({ children, sx = {} }) => {
  const theme = useTheme();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: `1px solid ${theme.palette.border}`, borderRadius: '8px', ...sx }}>
        {children}
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(PitchCard);
