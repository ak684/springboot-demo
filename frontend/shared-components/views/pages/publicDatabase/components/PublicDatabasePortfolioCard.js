import React, { memo } from 'react';
import Card from "@mui/material/Card";
import { Box, Typography, useTheme } from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import filters from "shared-components/filters";
import { isDefined } from "shared-components/utils/lo";

const PublicDatabasePortfolioCard = ({ label, value, change, currency }) => {
  const theme = useTheme();

  return (
    <Card sx={{ p: 2, border: `1px solid ${theme.palette.border}` }}>
      <Typography variant='caption'>{label}</Typography>
      <Box mt={0.5} display='flex' gap={1} justifyContent='space-between' alignItems='center'>
        <Typography variant='bodyBold'>{filters.number(value)} {currency}</Typography>
        <Box display='flex' gap={0.5} alignItems='center'>
          {isDefined(change) && (
            <>
              {change > 0 && <ArrowUpwardIcon sx={{ color: 'success.main' }} />}
              {change < 0 && <ArrowDownwardIcon sx={{ color: 'error.main' }} />}
            </>
          )}
          {isDefined(change) && (
            <Typography variant='bodyBold' sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}>
              {change >= 0 ? '+' : '-'}{change}%
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default memo(PublicDatabasePortfolioCard);
