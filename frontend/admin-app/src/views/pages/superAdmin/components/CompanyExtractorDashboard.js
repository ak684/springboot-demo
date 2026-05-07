import React from 'react';
import { Typography, Box } from '@mui/material';
import MetricCards from './MetricCards';

const CompanyExtractorDashboard = ({ portfolioTotals, extractionStats, gridData, portfolioName }) => {

  return (
    <Box>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        {portfolioName ? `${portfolioName} - Company Data Dashboard` : 'Company Data Dashboard'}
      </Typography>

      <MetricCards
        portfolioTotals={portfolioTotals}
        extractionStats={extractionStats}
      />
    </Box>
  );
};

export default CompanyExtractorDashboard;