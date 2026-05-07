import React, { memo } from 'react';
import { Box, Drawer, styled, Toolbar, Typography } from '@mui/material';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(60),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(60),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const AggregatedIndicatorDrawer = ({ values, stepName, goToStep, ventures }) => {
  const items = [
    {
      name: 'name',
      label: 'Indicator Name',
      secondary: values.name || null,
      onClick: () => goToStep('name'),
      completed: !!values.name
    },
    {
      name: 'category',
      label: 'Impact Area',
      secondary: values.category || null,
      onClick: () => goToStep('category'),
      completed: !!values.category
    },
    {
      name: 'unit',
      label: 'Unit of Measurement',
      secondary: values.unit || null,
      onClick: () => goToStep('unit'),
      completed: !!values.unit
    },
    {
      name: 'sources',
      label: 'Data Sources',
      secondary: values.ventures?.length > 0
        ? `${values.ventures.length} venture(s) selected`
        : null,
      onClick: () => goToStep('sources'),
      completed: values.ventures?.length > 0
    },
    {
      name: 'timePeriod',
      label: 'Time Period',
      secondary: values.timePeriod ? getTimePeriodLabel(values.timePeriod) : null,
      onClick: () => goToStep('timePeriod'),
      completed: !!values.timePeriod
    },
    {
      name: 'calculation',
      label: 'Calculation Method',
      secondary: values.aggregationType ? getAggregationLabel(values.aggregationType) : null,
      onClick: () => goToStep('calculation'),
      completed: !!values.aggregationType
    },
    {
      name: 'formatting',
      label: 'Number Format',
      secondary: (values.decimalPlaces !== undefined || values.numberFormat)
        ? `${values.decimalPlaces ?? 0} decimals, ${values.numberFormat || 'EU'} style`
        : null,
      onClick: () => goToStep('formatting'),
      completed: values.decimalPlaces !== undefined || !!values.numberFormat
    },
    {
      name: 'indicatorType',
      label: 'Indicator Type',
      secondary: values.indicatorType ? getIndicatorTypeLabel(values.indicatorType) : null,
      onClick: () => goToStep('indicatorType'),
      completed: !!values.indicatorType
    },
    {
      name: 'review',
      label: 'Review & Create',
      secondary: null,
      onClick: () => goToStep('review'),
      completed: false
    }
  ];

  return (
    <StyledDrawer variant='permanent' open>
      <Toolbar sx={{ height: HEADER_HEIGHT }} />
      <CustomErrorBoundary>
        <Box p={4}>
          <Typography variant='h5' sx={{ mb: 4 }}>
            Create Aggregated Indicator
          </Typography>
          {items.map((item, index) => (
            <StepperDrawerItem
              key={item.name}
              primary={item.label}
              secondary={item.secondary}
              onClick={item.onClick}
              active={stepName === item.name}
              filled={stepName !== item.name && item.completed}
              completed={item.completed}
              sx={index > 0 ? { mt: 1 } : {}}
            />
          ))}
        </Box>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

const getAggregationLabel = (type) => {
  const labels = {
    'SUM': 'Sum',
    'AVERAGE': 'Average',
    'MIN': 'Minimum',
    'MAX': 'Maximum',
    'COUNT': 'Count'
  };
  return labels[type] || type;
};

const getIndicatorTypeLabel = (type) => {
  const labels = {
    'main': 'Main Indicator',
    'hover': 'Hover Detail'
  };
  return labels[type] || type;
};

const getTimePeriodLabel = (period) => {
  const labels = {
    'current': 'Current Year',
    'lastYear': 'Last Year',
    'last5': 'Last 5 Years',
    'inception': 'Since Inception',
    'forecast5': '5-Year Forecast',
    'monthToDate': 'Month to Date',
    'today': 'Today'
  };
  return labels[period] || period;
};

export default memo(AggregatedIndicatorDrawer);
