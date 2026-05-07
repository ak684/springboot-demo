import React from 'react';
import { Grid, Box, Typography, LinearProgress, Tooltip, IconButton } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BaseSection from './BaseSection';
import { CompactCard, getScoreColor } from '../CompanyProfileHelpers';

const SCORE_DEFINITIONS = {
  sbmo_criteria_a_score:
    'Assesses whether the core business intentionally addresses a systemic sustainability problem with clear SDG alignment (Weight 30%).',
  sbmo_criteria_b_score:
    'Measures the depth, intentionality, measurability, and scalability of the sustainability impact (Weight 30%).',
  sbmo_criteria_c_score:
    'Looks at how tightly the sustainability contribution is woven into the revenue model, creating impact-driven growth (Weight 20%).',
  sbmo_criteria_d_score:
    'Evaluates whether the solution tackles multiple distinct sustainability problems with explicit SDG/target mapping (Weight 20%).',
  sbmo_total_score:
    'Weighted SPOS score: (A×0.3)+(B×0.3)+(C×0.2)+(D×0.2), scaled to 0-100.'
};

const SBMO_LEVELS = [
  { min: 0, max: 24, level: 0, label: 'None', color: '#9e9e9e',
    description: 'No measurable sustainability orientation in the business model.' },
  { min: 25, max: 49, level: 1, label: 'Peripheral', color: '#ff9800',
    description: 'Some sustainability signals present, but not core to the business model.' },
  { min: 50, max: 69, level: 2, label: 'Embedded', color: '#2196f3',
    description: 'Sustainability is integrated into the business model with clear intent and traction.' },
  { min: 70, max: 100, level: 3, label: 'North Star', color: '#4caf50',
    description: 'Sustainability impact is core to the business model and scales directly with success.' }
];

const getSbmoLevel = (score) => {
  const numericScore = Number.isFinite(score) ? score : Number(score) || 0;
  return SBMO_LEVELS.find(l => numericScore >= l.min && numericScore <= l.max) || SBMO_LEVELS[0];
};

const getTierInfo = (score) => {
  const level = getSbmoLevel(score);
  return {
    label: `Level ${level.level} – ${level.label} (${level.min}-${level.max})`,
    description: level.description
  };
};

const ScoreCard = ({ title, score, maxScore = 5, description, definition, isTotal = false }) => {
  const numericScore = Number.isFinite(score) ? score : Number(score) || 0;
  const normalizedScore = Math.max(0, Math.min(numericScore, maxScore));
  let scoreColor;
  
  if (isTotal) {
    scoreColor = getSbmoLevel(numericScore).color;
  } else {
    scoreColor = getScoreColor(normalizedScore, maxScore);
  }
  
  const displayScore = isTotal
    ? Math.round(numericScore)
    : Number.isFinite(numericScore) ? numericScore.toFixed(1) : '0.0';
  
  return (
    <CompactCard sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ 
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#666666'
        }}>
          {title}
        </Typography>
        {definition && (
          <Tooltip title={definition} placement="top" arrow>
            <IconButton size="small" sx={{ color: '#999999' }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
        <Typography sx={{ 
          fontSize: '28px',
          fontWeight: 600,
          color: scoreColor
        }}>
          {displayScore}
        </Typography>
        <Typography sx={{ 
          fontSize: '16px', 
          color: '#999999',
          fontWeight: 500
        }}>
          /{maxScore}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={(normalizedScore / maxScore) * 100}
        sx={{ 
          height: 6,
          borderRadius: 3,
          backgroundColor: '#f0f0f0',
          mb: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: scoreColor
          }
        }}
      />
      
      {description && (
        <Typography sx={{ 
          fontSize: '14px',
          color: '#666666',
          lineHeight: 1.4
        }}>
          {description}
        </Typography>
      )}
    </CompactCard>
  );
};

const criteriaCards = [
  {
    title: 'Criterion A: Problem Addressed',
    scoreField: 'sbmo_criteria_a_score',
    descriptionField: 'sbmo_criteria_a_explanation'
  },
  {
    title: 'Criterion B: Depth of Impact',
    scoreField: 'sbmo_criteria_b_score',
    descriptionField: 'sbmo_criteria_b_explanation'
  },
  {
    title: 'Criterion C: Business Model Leverage',
    scoreField: 'sbmo_criteria_c_score',
    descriptionField: 'sbmo_criteria_c_explanation'
  },
  {
    title: 'Criterion D: Multi-Problem Solutions',
    scoreField: 'sbmo_criteria_d_score',
    descriptionField: 'sbmo_criteria_d_explanation'
  }
];

const SBMOTotalBanner = ({ score }) => {
  const numericScore = Number.isFinite(score) ? score : Number(score) || 0;
  const displayScore = Math.round(Math.max(0, Math.min(numericScore, 100)));
  const color = getSbmoLevel(numericScore).color;
  const tierInfo = getTierInfo(numericScore);
  return (
    <CompactCard sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#666666'
        }}>
          SBMO Weighted Score
        </Typography>
        <Tooltip title={SCORE_DEFINITIONS.sbmo_total_score} placement="top" arrow>
          <IconButton size="small" sx={{ color: '#999999' }}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
        <Typography sx={{
          fontSize: '28px',
          fontWeight: 600,
          color: color
        }}>
          {displayScore}
        </Typography>
        <Typography sx={{
          fontSize: '16px',
          color: '#999999',
          fontWeight: 500
        }}>
          /100
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={(numericScore / 100) * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#f0f0f0',
          mb: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: color
          }
        }}
      />

      <Typography sx={{
        fontSize: '14px',
        color: '#666666',
        fontWeight: 600
      }}>
        {tierInfo.label}
      </Typography>
      <Typography sx={{
        fontSize: '13px',
        color: '#666666'
      }}>
        {tierInfo.description}
      </Typography>
    </CompactCard>
  );
};

const SustainabilityScoresSection = ({ data }) => {
  return (
    <BaseSection
      title="Sustainable Business Model Orientation"
      subtitle="Weighted SBMO scores and explanations"
      icon={<AssessmentIcon />}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <SBMOTotalBanner score={data.sbmo_total_score} />
        </Grid>
        {criteriaCards.map((criterion) => (
          <Grid item xs={12} sm={6} md={2.4} key={criterion.scoreField}>
            <ScoreCard
              title={criterion.title}
              score={data[criterion.scoreField]}
              description={data[criterion.descriptionField]}
              definition={SCORE_DEFINITIONS[criterion.scoreField]}
            />
          </Grid>
        ))}
      </Grid>
    </BaseSection>
  );
};

export default SustainabilityScoresSection;
export { SBMO_LEVELS, getSbmoLevel };
