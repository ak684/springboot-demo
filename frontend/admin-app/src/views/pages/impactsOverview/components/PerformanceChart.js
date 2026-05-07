import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import { lineClamp } from "shared-components/utils/styles";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  flexBasis: '50%',
  border: `1px solid ${theme.palette.border}`,
}));

const PerformanceChart = ({ title, chart }) => {
  return (
    <CustomErrorBoundary>
      <StyledCard>
        <Typography variant='caption' align='center' style={lineClamp(2)}>{title}</Typography>
        <Box>{chart}</Box>
      </StyledCard>
    </CustomErrorBoundary>
  );
};

export default memo(PerformanceChart);
