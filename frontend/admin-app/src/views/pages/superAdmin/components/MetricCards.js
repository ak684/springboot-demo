import React from 'react';
import { Grid, Card, Box, Typography, LinearProgress, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import VerifiedIcon from '@mui/icons-material/Verified';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Co2Icon from '@mui/icons-material/Co2';
import useContinuousCounters from './useContinuousCounters';

const formatSalesValue = (value, currency) => {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }

  const absValue = Math.abs(value);
  const currencySuffix = currency ? ` ${currency}` : '';

  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B${currencySuffix}`.trim();
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M${currencySuffix}`.trim();
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K${currencySuffix}`.trim();
  }
  return `${Math.round(value)}${currencySuffix}`.trim();
};

const formatFullSalesDigits = (value) => {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(value);
};

const MetricCard = ({ title, value, trend, icon, progress, isLoading }) => {
  if (isLoading) {
    return (
      <Card sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={40} width="80%" sx={{ my: 1 }} />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{
      p: 3,
      height: '100%',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 'none',
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: 1,
        transform: 'translateY(-2px)'
      }
    }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{
              my: 1,
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" color="success.main">
              <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" fontWeight="bold">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: 'primary.subtle',
          color: 'primary.main'
        }}>
          {icon}
        </Box>
      </Box>
      {progress !== undefined && (
        <Box mt={2}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3
              }
            }}
          />
        </Box>
      )}
    </Card>
  );
};

const MetricCards = ({
  portfolioTotals,
  extractionStats,
  isLoading = false,
  showGeographicIndicator = false,
  continuousMode = false
}) => {
  const animatedValues = useContinuousCounters({
    totals: portfolioTotals,
    enabled: continuousMode
  });

  const getAnimatedValue = (key) => {
    if (!animatedValues) {
      return null;
    }
    const value = animatedValues[key];
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
  };

  const pickFlowValue = (key, fallback = 0) => {
    if (!continuousMode) {
      return fallback;
    }
    const animatedValue = getAnimatedValue(key);
    return animatedValue != null ? Math.round(animatedValue) : fallback;
  };

  const totalCompaniesValue = portfolioTotals?.totalCompanies || 0;
  const totalEmployeesValue = portfolioTotals?.totalEmployees || 0;
  const totalPatentsValue = portfolioTotals?.totalPatents || 0;
  const totalDailyTrafficValue = pickFlowValue('totalDailyTraffic', portfolioTotals?.totalDailyTraffic || 0);
  const companiesWithReportsValue = portfolioTotals?.companiesWithReports || 0;
  const totalCarbonEmissionsValue = pickFlowValue(
    'totalCarbonEmissions',
    portfolioTotals?.totalCarbonEmissions || 0
  );
  const totalSocialFollowersValue = portfolioTotals?.totalSocialMediaFollowers || 0;

  const salesCurrency = portfolioTotals?.totalSalesCurrency;
  const animatedSales = getAnimatedValue('totalSales');

  let totalSalesValue;
  if (continuousMode && animatedSales != null) {
    totalSalesValue = formatFullSalesDigits(animatedSales);
  } else {
    totalSalesValue = portfolioTotals?.totalSales || 'N/A';
  }

  const totalSalesTitle = continuousMode && salesCurrency
    ? `Total Sales (${salesCurrency})`
    : 'Total Sales';

  return (
    <Box>
      {/* Always reserve space for the indicator to prevent layout shift */}
      <Box sx={{ minHeight: '16px', mb: 1 }}>
        {showGeographicIndicator && (
          <Typography variant="caption" color="primary" sx={{ lineHeight: 1 }}>
               Metrics filtered by map view
          </Typography>
        )}
      </Box>

      {/* First Row - Core Business Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Companies"
            value={totalCompaniesValue}
            icon={<BusinessIcon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title={totalSalesTitle}
            value={totalSalesValue}
            icon={<TrendingUpIcon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Employees"
            value={totalEmployeesValue}
            icon={<GroupIcon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Patents"
            value={totalPatentsValue}
            icon={<EmojiObjectsIcon />}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Second Row - Impact & Engagement Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Daily Traffic"
            value={totalDailyTrafficValue}
            icon={<AnalyticsIcon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Companies With ESG/Impact Reports"
            value={companiesWithReportsValue}
            icon={<VerifiedIcon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Carbon Emissions (tCO₂)"
            value={totalCarbonEmissionsValue}
            icon={<Co2Icon />}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Social Media Followers"
            value={totalSocialFollowersValue}
            icon={<ThumbUpIcon />}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetricCards;
