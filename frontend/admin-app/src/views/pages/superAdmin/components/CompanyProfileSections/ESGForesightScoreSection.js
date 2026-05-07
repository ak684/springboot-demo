import React, { useState } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  IconButton, 
  Collapse, 
  Chip, 
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';
import { getESGRiskLevel, getESGRiskColor, formatESGScore } from 'shared-components/utils/helpers';

const ESGForesightScoreSection = ({ data }) => {
  const [explanationsExpanded, setExplanationsExpanded] = useState(false);

  if (!data) return null;

  // Check if company doesn't meet thresholds
  // Use the explicit qualified flag for cleaner logic
  const isThresholdNotMet = data.esg_foresight_qualified === false;

  // Extract current ESG scores (inherent and adjusted)
  const environmentalInherent = data.esg_risk_environmental_inherent;
  const environmentalAdjusted = data.esg_risk_environmental_adjusted;
  const socialInherent = data.esg_risk_social_inherent;
  const socialAdjusted = data.esg_risk_social_adjusted;
  const governanceInherent = data.esg_risk_governance_inherent;
  const governanceAdjusted = data.esg_risk_governance_adjusted;
  const totalInherent = data.esg_risk_total_inherent;
  const totalAdjusted = data.esg_risk_total_adjusted;

  // Extract foresight scores
  const environmentalForesight = data.esg_risk_environmental_foresight;
  const socialForesight = data.esg_risk_social_foresight;
  const governanceForesight = data.esg_risk_governance_foresight;
  const totalForesight = data.esg_risk_total_foresight;

  // Get foresight data details
  const envData = data.esg_risk_environmental_foresight_data || {};
  const socialData = data.esg_risk_social_foresight_data || {};
  const govData = data.esg_risk_governance_foresight_data || {};
  
  // Mitigation recommendations are now categorized by ESG dimension
  const mitigationRecommendations = data.esg_risk_foresight_mitigation_recommendations || {};
  
  // Debug logging to see what data we're receiving
  console.log('ESG Foresight - Mitigation Recommendations:', mitigationRecommendations);
  console.log('ESG Foresight - Full data object:', data);
  
  const riskOutlook = data.esg_risk_foresight_risk_outlook;
  const risingRiskExplanation = data.esg_risk_foresight_rising_risk_explanation;

  if (isThresholdNotMet) {
    return (
      <BaseSection
        title="ESG Foresight Scores (8-Year Projection)"
        subtitle="Projected structural ESG risks when scaled to enterprise size"
        icon={<TrendingUpIcon />}
        isEmpty={false}
      >
        <Box sx={{
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          border: '1px solid #e0e0e0'
        }}>
          <InfoOutlinedIcon sx={{ fontSize: 48, color: '#757575', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#424242', fontWeight: 500 }}>
            ESG Foresight Analysis Not Applicable
          </Typography>
          <Typography variant="body1" sx={{ color: '#616161', mt: 2, maxWidth: 600, mx: 'auto' }}>
            Our analysis indicates this company's current scale and growth trajectory suggest it is unlikely to reach
            large enterprise thresholds (1,000+ employees or €100M+ revenue) within an 8-year projection period,
            where foresight ESG risks become materially significant.
          </Typography>
        </Box>
      </BaseSection>
    );
  }

  // Calculate changes vs adjusted scores
  const calculateChange = (foresight, adjusted) => {
    if (foresight === null || foresight === undefined || adjusted === null || adjusted === undefined) {
      return null;
    }
    return foresight - adjusted;
  };

  const formatChange = (change) => {
    if (change === null) return 'N/A';
    const formatted = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
    return formatted;
  };

  const getChangeColor = (change) => {
    if (change === null) return '#999999';
    if (change > 0) return '#f44336'; // Red for increase (worse)
    if (change < 0) return '#4caf50'; // Green for decrease (better)
    return '#999999'; // Gray for no change
  };

  const tableData = [
    {
      dimension: 'Environmental',
      inherent: environmentalInherent,
      adjusted: environmentalAdjusted,
      foresight: environmentalForesight,
      change: calculateChange(environmentalForesight, environmentalAdjusted),
      data: envData
    },
    {
      dimension: 'Social',
      inherent: socialInherent,
      adjusted: socialAdjusted,
      foresight: socialForesight,
      change: calculateChange(socialForesight, socialAdjusted),
      data: socialData
    },
    {
      dimension: 'Governance',
      inherent: governanceInherent,
      adjusted: governanceAdjusted,
      foresight: governanceForesight,
      change: calculateChange(governanceForesight, governanceAdjusted),
      data: govData
    }
  ];

  const totalChange = calculateChange(totalForesight, totalAdjusted);

  return (
    <BaseSection
      title="ESG Foresight Scores (8-Year Projection)"
      subtitle="Projected structural ESG risks when scaled to 1000+ employees or €100M+ revenue"
      icon={<TrendingUpIcon />}
      tooltip="Assesses inherent ESG risks that emerge at scale, without considering current mitigation efforts"
    >
      {/* ESG Score Comparison Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>ESG Dimension</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Inherent Score
                <Typography variant="caption" display="block" sx={{ fontWeight: 400, color: '#666' }}>
                  Current
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Adjusted Score
                <Typography variant="caption" display="block" sx={{ fontWeight: 400, color: '#666' }}>
                  Current with mitigation
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Foresight Score
                <Typography variant="caption" display="block" sx={{ fontWeight: 400, color: '#666' }}>
                  8-year projection
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Risk Change vs Adjusted
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.dimension}>
                <TableCell>{row.dimension}</TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 500 }}>
                    {formatESGScore(row.inherent)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 500 }}>
                    {formatESGScore(row.adjusted)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 500, color: getESGRiskColor(row.foresight, false) }}>
                    {formatESGScore(row.foresight)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 500, color: getChangeColor(row.change) }}>
                    {formatChange(row.change)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: getESGRiskColor(row.foresight, false) 
                  }}>
                    {getESGRiskLevel(row.foresight, false)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
              <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 600 }}>
                  {formatESGScore(totalInherent)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 600 }}>
                  {formatESGScore(totalAdjusted)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 600, color: getESGRiskColor(totalForesight, true) }}>
                  {formatESGScore(totalForesight)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 600, color: getChangeColor(totalChange) }}>
                  {formatChange(totalChange)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ 
                  fontWeight: 600,
                  color: getESGRiskColor(totalForesight, true)
                }}>
                  {getESGRiskLevel(totalForesight, true)}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Structural Risk Explanations */}
      <Box sx={{ mb: 3 }}>
        <Box
          onClick={() => setExplanationsExpanded(!explanationsExpanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            p: 1.5,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: '#eeeeee'
            }
          }}
        >
          <Typography sx={{ fontWeight: 600, color: '#333' }}>
            Structural Risk Explanations (Foresight Score)
          </Typography>
          <IconButton size="small">
            {explanationsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={explanationsExpanded}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#fafafa', borderRadius: 1 }}>
            {/* Risk Outlook */}
            {riskOutlook && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                  Risk Outlook: {riskOutlook}
                </Typography>
                {risingRiskExplanation && (
                  <Typography sx={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
                    {risingRiskExplanation}
                  </Typography>
                )}
              </Box>
            )}

            {riskOutlook && <Divider sx={{ my: 2 }} />}

            {/* Environmental Explanation */}
            {envData.explanation && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                  Environmental - {formatESGScore(environmentalForesight)}/10.0
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#666', mb: 1.5, lineHeight: 1.6 }}>
                  {envData.explanation}
                </Typography>
                {envData.drivers && envData.drivers !== 'None' && (
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      Drivers:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {envData.drivers.split(';').map((driver, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#666', mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {driver.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                {envData.hsri && envData.hsri !== 'None' && (
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      HSRIs:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {envData.hsri.split(';').map((hsri, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#d32f2f', fontWeight: 500, mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {hsri.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Social Explanation */}
            {socialData.explanation && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                  Social - {formatESGScore(socialForesight)}/10.0
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#666', mb: 1.5, lineHeight: 1.6 }}>
                  {socialData.explanation}
                </Typography>
                {socialData.drivers && socialData.drivers !== 'None' && (
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      Drivers:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {socialData.drivers.split(';').map((driver, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#666', mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {driver.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                {socialData.hsri && socialData.hsri !== 'None' && (
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      HSRIs:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {socialData.hsri.split(';').map((hsri, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#d32f2f', fontWeight: 500, mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {hsri.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Governance Explanation */}
            {govData.explanation && (
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                  Governance - {formatESGScore(governanceForesight)}/10.0
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#666', mb: 1.5, lineHeight: 1.6 }}>
                  {govData.explanation}
                </Typography>
                {govData.drivers && govData.drivers !== 'None' && (
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      Drivers:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {govData.drivers.split(';').map((driver, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#666', mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {driver.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                {govData.hsri && govData.hsri !== 'None' && (
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#666', mb: 0.5 }}>
                      HSRIs:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {govData.hsri.split(';').map((hsri, index, array) => (
                        <Typography key={index} sx={{ fontSize: '13px', color: '#d32f2f', fontWeight: 500, mb: index === array.length - 1 ? 0 : 0.5 }}>
                          • {hsri.trim()}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Mitigation Recommendations */}
      {mitigationRecommendations && (
        mitigationRecommendations.environmental || 
        mitigationRecommendations.social || 
        mitigationRecommendations.governance
      ) && (
        <Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#333', mb: 2 }}>
            Recommendations to Mitigate Foresight Risks
          </Typography>
          
          <TableContainer component={Paper} sx={{ backgroundColor: '#fafafa' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600, width: '25%' }}>Dimension</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mitigation Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Environmental Mitigations */}
                {mitigationRecommendations.environmental && mitigationRecommendations.environmental.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>Environmental</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {mitigationRecommendations.environmental.map((action, index) => (
                          <Typography key={index} sx={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>
                            • {action}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Social Mitigations */}
                {mitigationRecommendations.social && mitigationRecommendations.social.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>Social</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {mitigationRecommendations.social.map((action, index) => (
                          <Typography key={index} sx={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>
                            • {action}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Governance Mitigations */}
                {mitigationRecommendations.governance && mitigationRecommendations.governance.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>Governance</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {mitigationRecommendations.governance.map((action, index) => (
                          <Typography key={index} sx={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>
                            • {action}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </BaseSection>
  );
};

export default ESGForesightScoreSection;