import React from 'react';
import { Grid, Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails, Divider, Link } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';
import ESGMaterialityChart from '../../ESGMaterialityChart';

const ESGMaterialitySection = ({ data }) => {
  const esgData = data.esg_materiality_analysis;
  
  if (!esgData || !esgData.topics || esgData.topics.length === 0) {
    return (
      <BaseSection
        title="ESG Materiality Analysis"
        subtitle="No ESG materiality data available"
        icon={<VerifiedIcon />}
      >
        <EmptyState 
          message="No ESG materiality analysis has been performed for this company."
          icon={<VerifiedIcon />}
        />
      </BaseSection>
    );
  }

  return (
    <BaseSection
      title="ESG Materiality Analysis"
      subtitle={`${esgData.topics.length} ESG topics analyzed`}
      icon={<VerifiedIcon />}
    >
      <Grid container spacing={2}>
        {esgData.topics.map((topic, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Accordion sx={{ 
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              '&:before': {
                display: 'none'
              }
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Chip
                    label={topic.category}
                    size="small"
                    color={topic.category === 'E' ? 'success' : topic.category === 'S' ? 'info' : 'warning'}
                    sx={{
                      mr: 2,
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        color: 'white'
                      }
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {topic.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`S: ${topic.stakeholder_importance}`} size="small" variant="outlined" />
                    <Chip label={`B: ${topic.business_importance}`} size="small" variant="outlined" />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Stakeholder Impact Section */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                  Stakeholder Impact
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Description:</strong> {topic.stakeholder_description}
                </Typography>
                {topic.stakeholder_research_1 && topic.stakeholder_research_1.title && (
                  <Typography variant="body2" paragraph>
                    <strong>Stakeholder Research 1:</strong>{' '}
                    <Link href={topic.stakeholder_research_1.link} target="_blank" rel="noopener">
                      {topic.stakeholder_research_1.title}
                    </Link>
                  </Typography>
                )}
                {topic.stakeholder_research_2 && topic.stakeholder_research_2.title && (
                  <Typography variant="body2" paragraph>
                    <strong>Stakeholder Research 2:</strong>{' '}
                    <Link href={topic.stakeholder_research_2.link} target="_blank" rel="noopener">
                      {topic.stakeholder_research_2.title}
                    </Link>
                  </Typography>
                )}

                {/* Business Impact Section */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                  Business Impact
                </Typography>
                {topic.business_description && (
                  <Typography variant="body2" paragraph>
                    <strong>Description:</strong> {topic.business_description}
                  </Typography>
                )}
                {topic.business_research_1 && topic.business_research_1.title && (
                  <Typography variant="body2" paragraph>
                    <strong>Business Research 1:</strong>{' '}
                    <Link href={topic.business_research_1.link} target="_blank" rel="noopener">
                      {topic.business_research_1.title}
                    </Link>
                  </Typography>
                )}
                {topic.business_research_2 && topic.business_research_2.title && (
                  <Typography variant="body2" paragraph>
                    <strong>Business Research 2:</strong>{' '}
                    <Link href={topic.business_research_2.link} target="_blank" rel="noopener">
                      {topic.business_research_2.title}
                    </Link>
                  </Typography>
                )}

                {/* Standardized Topic Mapping */}
                {topic.standardized_topic && (
                  <>
                    <Divider sx={{ mt: 2, mb: 2 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      <strong>Standardized ESG Topic:</strong> {topic.standardized_topic}
                    </Typography>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* ESG Materiality Chart */}
      <Box mt={3}>
        <ESGMaterialityChart esgData={esgData} />
      </Box>
    </BaseSection>
  );
};

export default ESGMaterialitySection;