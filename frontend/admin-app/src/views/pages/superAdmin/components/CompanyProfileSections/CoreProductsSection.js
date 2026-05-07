import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';

const CoreProductsSection = ({ data }) => {
  const coreProducts = data.core_products_services;
  
  if (!coreProducts || !coreProducts.items || coreProducts.items.length === 0) {
    return (
      <BaseSection
        title="Core Products & Services"
        subtitle="No products or services data available"
        icon={<InventoryIcon />}
      >
        <EmptyState 
          message="No core products or services have been extracted for this company."
          icon={<InventoryIcon />}
        />
      </BaseSection>
    );
  }

  return (
    <BaseSection
      title={coreProducts.category_title || 'Core Products & Services'}
      subtitle={`${coreProducts.items.length} products/services extracted`}
      icon={<InventoryIcon />}
    >
      <Grid container spacing={2}>
        {coreProducts.items.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box 
              sx={{ 
                height: '100%',
                backgroundColor: '#ffffff',
                borderRadius: 1,
                p: 2,
                border: '1px solid #f0f0f0'
              }}
            >
              <Typography 
                sx={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  mb: 1,
                  color: '#333333',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={item.title}
              >
                {item.title}
              </Typography>
              <Typography 
                sx={{
                  fontSize: '14px',
                  color: '#666666',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '3em',
                  lineHeight: 1.4
                }}
              >
                {item.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </BaseSection>
  );
};

export default CoreProductsSection;