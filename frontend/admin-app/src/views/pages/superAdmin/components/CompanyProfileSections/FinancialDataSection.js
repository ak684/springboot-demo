import React from 'react';
import { Grid, Box, Typography, IconButton, Tooltip } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EditIcon from '@mui/icons-material/Edit';
import BaseSection from './BaseSection';
import { CompactCard } from '../CompanyProfileHelpers';

const FinancialFieldCard = ({ label, value, currency, type, onEdit, fieldName }) => {
  const isEmpty = !value || value === 'N/A';
  
  return (
    <CompactCard sx={{ 
      height: '100%',
      position: 'relative',
      '&:hover .edit-button': {
        opacity: onEdit ? 1 : 0
      }
    }}>
      <Typography sx={{ 
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#666666',
        mb: 1
      }}>
        {label}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ 
              fontSize: '16px',
              color: isEmpty ? '#999999' : '#333333',
              fontWeight: 500,
              fontStyle: isEmpty ? 'italic' : 'normal'
            }}>
              {isEmpty ? 'Not specified' : `${value} ${currency || ''}`}
            </Typography>
            {type && !isEmpty && (
              <Tooltip title={type === 'actual' ? 'Actual data' : 'Estimated data'}>
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: type === 'actual' ? '#4caf50' : '#ff9800',
                  flexShrink: 0
                }} />
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {onEdit && (
          <Tooltip title={`Edit ${label}`}>
            <IconButton 
              size="small" 
              onClick={() => onEdit(fieldName, value)}
              className="edit-button"
              sx={{ 
                opacity: 0,
                transition: 'opacity 0.2s',
                minWidth: 'auto',
                padding: '4px'
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </CompactCard>
  );
};

const FinancialDataSection = ({ data, onEdit }) => {
  return (
    <BaseSection
      title="Financial Data"
      subtitle="Annual sales and funding information"
      icon={<MonetizationOnIcon />}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <FinancialFieldCard
            label="Annual Sales 2022"
            value={data.annual_sales_2022}
            currency={data.currency_2022}
            type={data.annual_sales_2022_type}
            onEdit={onEdit}
            fieldName="annual_sales_2022"
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FinancialFieldCard
            label="Annual Sales 2023"
            value={data.annual_sales_2023}
            currency={data.currency_2023}
            type={data.annual_sales_2023_type}
            onEdit={onEdit}
            fieldName="annual_sales_2023"
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FinancialFieldCard
            label="Annual Sales 2024"
            value={data.annual_sales_2024}
            currency={data.currency_2024}
            type={data.annual_sales_2024_type}
            onEdit={onEdit}
            fieldName="annual_sales_2024"
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FinancialFieldCard
            label="Total Funding"
            value={data.total_funding_amount}
            currency={data.funding_currency}
            type={data.total_funding_amount_type}
            onEdit={onEdit}
            fieldName="total_funding_amount"
          />
        </Grid>
      </Grid>
    </BaseSection>
  );
};

export default FinancialDataSection;