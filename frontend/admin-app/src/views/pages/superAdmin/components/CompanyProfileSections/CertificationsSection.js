import React from 'react';
import { Grid, Box, Typography, Link } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BaseSection from './BaseSection';
import { EditableField } from '../CompanyProfileHelpers';

const CertificationsSection = ({ data, onEdit }) => {
  return (
    <BaseSection
      title="Certifications & Awards"
      subtitle="Company recognitions and certifications"
      icon={<EmojiEventsIcon />}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EditableField
            label="Certification Name"
            value={data.certification_name}
            fieldName="certification_name"
            onEdit={onEdit}
          />
          
          {data.certification_link && data.certification_link !== 'N/A' && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: 0.5
                }}
              >
                Certification Link
              </Typography>
              <Box mt={0.5}>
                <Link 
                  href={data.certification_link} 
                  target="_blank" 
                  rel="noopener"
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  View Certification
                </Link>
              </Box>
            </Box>
          )}
          
          <Box mt={3}>
            <EditableField
              label="ESG Impact Report"
              value={data.esg_impact_report ? 'Yes' : 'No'}
              fieldName="esg_impact_report"
              onEdit={onEdit}
            />
          </Box>
          
          <Box mt={3}>
            <EditableField
              label="ESG Report Year"
              value={data.esg_report_year}
              fieldName="esg_report_year"
              onEdit={onEdit}
            />
          </Box>
          
          {data.esg_report_link && data.esg_report_link !== 'N/A' && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: 0.5
                }}
              >
                ESG Report Link
              </Typography>
              <Box mt={0.5}>
                <Link 
                  href={data.esg_report_link} 
                  target="_blank" 
                  rel="noopener"
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  View ESG Report
                </Link>
              </Box>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <EditableField
            label="Award 1"
            value={data.prize_award_name_1}
            fieldName="prize_award_name_1"
            onEdit={onEdit}
          />
          
          {data.prize_award_link_1 && data.prize_award_link_1 !== 'N/A' && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: 0.5
                }}
              >
                Award 1 Link
              </Typography>
              <Box mt={0.5}>
                <Link 
                  href={data.prize_award_link_1} 
                  target="_blank" 
                  rel="noopener"
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  View Award
                </Link>
              </Box>
            </Box>
          )}
          
          <Box mt={3}>
            <EditableField
              label="Award 2"
              value={data.prize_award_name_2}
              fieldName="prize_award_name_2"
              onEdit={onEdit}
            />
          </Box>
          
          {data.prize_award_link_2 && data.prize_award_link_2 !== 'N/A' && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: 0.5
                }}
              >
                Award 2 Link
              </Typography>
              <Box mt={0.5}>
                <Link 
                  href={data.prize_award_link_2} 
                  target="_blank" 
                  rel="noopener"
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  View Award
                </Link>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </BaseSection>
  );
};

export default CertificationsSection;