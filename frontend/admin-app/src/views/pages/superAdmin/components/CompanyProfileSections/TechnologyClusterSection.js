import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import BaseSection from './BaseSection';
import { InfoRow } from '../CompanyProfileHelpers';

const TechnologyClusterSection = ({ data, onEdit }) => {
  return (
    <BaseSection
      title="Technology Cluster"
      icon={<HubIcon />}
    >
      <Grid container spacing={3}>
        {/* Left side - Stats */}
        <Grid item xs={12} md={6}>
          <Box>
            <InfoRow
              label="Technology Cluster"
              value={data.technology_cluster}
              onEdit={onEdit}
              fieldName="technology_cluster"
            />
            
            <InfoRow
              label="Confidence Score"
              value={data.cluster_confidence_score ? `${data.cluster_confidence_score}%` : 'N/A'}
              onEdit={onEdit}
              fieldName="cluster_confidence_score"
            />
            
            <InfoRow
              label="Total Patents"
              value={data.total_patents !== null && data.total_patents !== undefined && data.total_patents >= 0 ? String(data.total_patents) : 'N/A'}
            />
          </Box>
        </Grid>
        
        {/* Right side - Reasoning */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography sx={{ 
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#666666',
              mb: 2
            }}>
              Cluster Reasoning
            </Typography>
            <Typography sx={{ 
              fontSize: '16px',
              color: '#333333',
              lineHeight: 1.6
            }}>
              {data.cluster_reasoning || 'No reasoning provided'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </BaseSection>
  );
};

export default TechnologyClusterSection;