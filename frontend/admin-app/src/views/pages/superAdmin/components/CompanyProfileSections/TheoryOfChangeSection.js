import React, { useState } from 'react';
import { Box, Typography, Chip, Tooltip, IconButton, CircularProgress, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';
import CustomErrorBoundary from '../../../../containers/CustomErrorBoundary';

const classificationColors = {
  C: '#43a047',
  B: '#7cb342',
  A: '#aed581',
  UNKNOWN: '#9e9e9e'
};

// Styled components for SDG tooltips (copied from AiTocTable.js)
const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 480,
    padding: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      minWidth: 350,
    }
  },
}));

// SDG tooltip content (copied from AiTocTable.js)
const getSdgTooltip = (sdg, goals) => (
  <CustomErrorBoundary>
    <Box display='flex' gap={2}>
      <Box display='flex' flexDirection='column' gap={1}>
        <Box
          width={112}
          height={112}
          component='img'
          src={`/images/sdg/${sdg.number}.svg`}
          alt={goals[sdg.number - 1]?.shortName || `SDG ${sdg.number}`}
          sx={{ borderRadius: '4px' }}
          flexShrink={0}
        />
        <Typography color='white' sx={{ fontSize: 32, fontWeight: 'bold' }}>
          {sdg.percent}%
        </Typography>
        <Typography color='white' sx={{ fontSize: 10 }}>
          We attribute {sdg.percent}% of this innovation impact to this SDG
        </Typography>
      </Box>
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold' color='white'>
          SDG{sdg.number}. {goals[sdg.number - 1]?.shortName || `Goal ${sdg.number}`}
        </Typography>
        <Box>
          <Typography sx={{ mb: 1 }} variant='subtitleBold' color='white'>Target</Typography>
          <Typography variant='caption' color='white'>{sdg.target || 'No target specified'}</Typography>
        </Box>
        <Box>
          <Typography sx={{ mb: 1 }} variant='subtitleBold' color='white'>Indicator</Typography>
          <Typography variant='caption' color='white'>{sdg.indicator || 'No indicator specified'}</Typography>
        </Box>
      </Box>
    </Box>
  </CustomErrorBoundary>
);

// SDG item component (copied from AiTocTable.js)
const getSdgItem = (sdg, index, goals) => (
  <CustomErrorBoundary key={index}>
    <Box>
      <StyledTooltip placement='top-end' title={getSdgTooltip(sdg, goals)}>
        <Box
          width={40}
          height={40}
          sx={{ borderRadius: '4px' }}
          component='img'
          src={`/images/sdg/${sdg.number}.svg`}
          alt={goals[sdg.number - 1]?.shortName || `SDG ${sdg.number}`}
        />
      </StyledTooltip>
      {sdg.percent && typeof sdg.percent === 'number' && (
        <Typography sx={{ fontSize: 10, fontWeight: 'bold' }}>{sdg.percent}%</Typography>
      )}
    </Box>
  </CustomErrorBoundary>
);

const classificationLabels = {
  A: 'Act to Avoid Harm',
  B: 'Benefit Stakeholders',
  C: 'Contribute to Solutions',
  UNKNOWN: 'Unknown Classification'
};

const AbcTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 650,
    maxWidth: 800,
    padding: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    [theme.breakpoints.down("sm")]: {
      minWidth: 350,
      maxWidth: 450,
    }
  },
}));

const AbcBadge = ({ abc }) => {
  const letter = (abc?.classification || '').toUpperCase();
  if (!letter) return null;

  const color = classificationColors[letter] || classificationColors.UNKNOWN;
  const classificationLabel = classificationLabels[letter] || classificationLabels.UNKNOWN;

  const tooltipContent = (
    <Box display='flex' flexDirection='column' gap={1.5}>
      <Box>
        <Typography variant='h6' color='white' sx={{ fontWeight: 700, mb: 0.5 }}>
          Classification {letter}
        </Typography>
        <Typography variant='body2' color='white' sx={{ opacity: 0.9, fontStyle: 'italic' }}>
          {classificationLabel}
        </Typography>
      </Box>

      {abc?.threshold && (
        <>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Box>
            <Typography variant='body2' color='white' sx={{ fontWeight: 600, mb: 0.5 }}>
              Sustainability Threshold
            </Typography>
            <Typography variant='body2' color='white' sx={{ opacity: 0.85, lineHeight: 1.5 }}>
              {abc.threshold}
            </Typography>
          </Box>
        </>
      )}

      {(abc?.before_intervention || abc?.after_intervention) && (
        <>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Box display='flex' flexDirection='column' gap={1}>
            {abc?.before_intervention && (
              <Box>
                <Typography variant='body2' color='white' sx={{ fontWeight: 600, mb: 0.3 }}>
                  Before Intervention
                </Typography>
                <Typography variant='body2' color='white' sx={{ opacity: 0.85, lineHeight: 1.5 }}>
                  {abc.before_intervention}
                </Typography>
              </Box>
            )}
            {abc?.after_intervention && (
              <Box>
                <Typography variant='body2' color='white' sx={{ fontWeight: 600, mb: 0.3 }}>
                  After Intervention
                </Typography>
                <Typography variant='body2' color='white' sx={{ opacity: 0.85, lineHeight: 1.5 }}>
                  {abc.after_intervention}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}

      {abc?.reason && (
        <>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Box>
            <Typography variant='body2' color='white' sx={{ fontWeight: 600, mb: 0.5 }}>
              Reasoning
            </Typography>
            <Typography variant='body2' color='white' sx={{ opacity: 0.85, lineHeight: 1.5 }}>
              {abc.reason}
            </Typography>
          </Box>
        </>
      )}

      {abc?.intent_check && (
        <>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Box>
            <Typography variant='body2' color='white' sx={{ fontWeight: 600, mb: 0.5 }}>
              Intent Analysis
            </Typography>
            <Typography variant='body2' color='white' sx={{ opacity: 0.85, lineHeight: 1.5 }}>
              {abc.intent_check}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <AbcTooltip
      title={tooltipContent}
      placement='top-start'
      enterDelay={200}
      enterNextDelay={200}
      PopperProps={{
        modifiers: [
          {
            name: 'flip',
            enabled: true,
            options: {
              fallbackPlacements: ['bottom-start', 'bottom', 'top'],
            },
          },
        ],
      }}
    >
      <Box
        sx={{
          minWidth: 36,
          height: 28,
          px: 1.5,
          borderRadius: '8px',
          backgroundColor: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 13,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }}
      >
        {letter}
      </Box>
    </AbcTooltip>
  );
};

const TheoryOfChangeSection = ({ data, companyId, onRerun }) => {
  const theoryOfChange = data.theory_of_change;
  const goals = useSelector(dictionarySelectors.getGoals());
  const [isRerunning, setIsRerunning] = useState(false);

  const getImpactMetricsTooltip = () => {
    const impactMagnitude = data.impact_magnitude_5_year;
    const impactLikelihood = data.impact_likelihood;
    const businessGrowth = data.growth_composite_score;
    const impactPotential = data.overall_impact_potential_score;

    return (
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant="body2" color="white" sx={{ fontWeight: 600 }}>
          Company Impact Metrics
        </Typography>
        <Box display='flex' flexDirection='column' gap={0.5}>
          <Typography variant="body2" color="white">
            5 Year Impact Magnitude: {impactMagnitude != null ? `${impactMagnitude}` : 'N/A'}
          </Typography>
          <Typography variant="body2" color="white">
            5 Year Impact Likelihood: {impactLikelihood != null ? `${(impactLikelihood * 100).toFixed(1)}%` : 'N/A'}
          </Typography>
          <Typography variant="body2" color="white">
            5 Year Business Growth Likelihood: {businessGrowth != null ? `${businessGrowth}` : 'N/A'}
          </Typography>
          <Typography variant="body2" color="white">
            5 Year Impact Potential: {impactPotential != null ? `${impactPotential}` : 'N/A'}
          </Typography>
        </Box>
      </Box>
    );
  };

  const handleRerun = async () => {
    if (!onRerun) return;
    setIsRerunning(true);
    try {
      await onRerun('theory-of-change', companyId);
    } finally {
      setIsRerunning(false);
    }
  };

  if (!theoryOfChange || theoryOfChange.length === 0) {
    return (
      <BaseSection
        title="Theory of Change"
        subtitle="No theory of change data available"
        icon={<TrendingUpIcon />}
        actions={
          onRerun && (
            <Tooltip title="Generate Theory of Change" enterDelay={0} enterNextDelay={0}>
              <IconButton
                onClick={handleRerun}
                disabled={isRerunning}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                  opacity: 0.7
                }}
              >
                {isRerunning ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )
        }
      >
        <EmptyState
          message="No theory of change analysis has been performed for this company."
          icon={<TrendingUpIcon />}
        />
      </BaseSection>
    );
  }

  return (
    <BaseSection
      title="Theory of Change"
      subtitle={`${theoryOfChange.length} impact areas identified`}
      icon={<TrendingUpIcon />}
      actions={
        onRerun && (
          <Tooltip title="Regenerate Theory of Change" enterDelay={0} enterNextDelay={0}>
            <IconButton
              onClick={handleRerun}
              disabled={isRerunning}
              size="small"
              sx={{
                ml: 1,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                opacity: 0.7
              }}
            >
              {isRerunning ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )
      }
    >
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '16%' }}>
                Impact Area
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '11%' }}>
                Status Quo
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '11%' }}>
                Innovation
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '10%' }}>
                Stakeholders
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '10%' }}>
                Change
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '10%' }}>
                Products/Services
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '20%' }}>
                Indicators
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', width: '12%' }}>
                SDGs
              </th>
            </tr>
          </thead>
          <tbody>
            {theoryOfChange.map((impact, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <AbcBadge abc={impact.abc_classification} />
                    <Box
                      sx={{
                        width: 4,
                        height: 20,
                        backgroundColor: impact.type && impact.type.toLowerCase().includes('positive') ? 'success.main' : 'error.main',
                        borderRadius: 1,
                        flexShrink: 0,
                        mt: 0.5
                      }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {impact.title || 'N/A'}
                      </Typography>
                      <Tooltip
                        title={getImpactMetricsTooltip()}
                        placement="top"
                        enterDelay={200}
                        enterNextDelay={200}
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(0, 0, 0, 0.9)',
                              maxWidth: 300,
                              p: 1.5
                            }
                          }
                        }}
                      >
                        <Chip
                          label={impact.type || 'Unknown'}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderWidth: '2px',
                            borderColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'rgba(0, 0, 0, 0.87)',
                            backgroundColor: impact.type && impact.type.toLowerCase().includes('positive') ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)'
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {impact.statusQuo || 'N/A'}
                  </Typography>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {impact.innovation || 'N/A'}
                  </Typography>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {impact.stakeholders || 'N/A'}
                  </Typography>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {impact.change || 'N/A'}
                  </Typography>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {impact.outputUnits || 'N/A'}
                  </Typography>
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  {impact.indicators && impact.indicators.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {impact.indicators.slice(0, 3).map((indicator, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {typeof indicator === 'object' ? indicator.name : indicator}
                        </Typography>
                      ))}
                      {impact.indicators.length > 3 && (
                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          +{impact.indicators.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </td>
                <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                  {impact.sdgs && impact.sdgs.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {impact.sdgs.map((sdg, index) => {
                        if (
                          typeof sdg === 'object'
                          && sdg.number
                          && typeof sdg.number === 'number'
                          && sdg.number >= 1
                          && sdg.number <= 17
                        ) {
                          return getSdgItem(sdg, index, goals);
                        } else {
                          return null;
                        }
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </BaseSection>
  );
};

export default TheoryOfChangeSection;
