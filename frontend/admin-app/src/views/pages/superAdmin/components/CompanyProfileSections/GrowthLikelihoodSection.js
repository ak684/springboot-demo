import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BaseSection from './BaseSection';

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 300,
    maxWidth: 480,
    padding: theme.spacing(2),
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: '13px',
    lineHeight: 1.6,
    [theme.breakpoints.down("sm")]: {
      minWidth: 250,
    }
  },
}));

const getScoreBackgroundColor = (score) => {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '#f5f5f5';
  }
  if (score >= 70) return '#c8e6c9';
  if (score >= 55) return '#fff9c4';
  if (score >= 40) return '#ffe4cc';
  if (score >= 25) return '#ffccbc';
  return '#ffcdd2';
};

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.max(0, Math.min(100, num));
};

const factorColorOverrides = {
  'media reach': '#ffcdd2',
  sentiment: '#c8e6c9',
  'funding velocity': '#ffe4cc',
  'company age': '#ffcdd2',
  composite: '#c8e6c9'
};

const ScoreCard = ({ label, score, reason, infoContent, isComposite = false, colorOverride }) => {
  const clampedScore = clampScore(score);
  const hasScore = clampedScore !== null;
  const displayScore = hasScore ? clampedScore.toFixed(0) : 'N/A';
  const backgroundColor = colorOverride || (hasScore ? getScoreBackgroundColor(clampedScore) : '#f5f5f5');
  const hasReason = reason && reason.trim().length > 0;

  const cardContent = (
    <Box sx={{
      position: 'relative',
      backgroundColor: backgroundColor,
      borderRadius: 1,
      p: 2,
      height: '100%',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #000000',
      cursor: 'default',
      transition: 'transform 0.2s',
      '&:hover': hasReason ? {
        transform: 'translateY(-2px)'
      } : {}
    }}>
      {infoContent && (
        <StyledTooltip
          title={<Box sx={{ whiteSpace: 'pre-line' }}>{infoContent}</Box>}
          placement="bottom-start"
          PopperProps={{
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 10]
                }
              }
            ]
          }}
          arrow
        >
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            color: '#424242'
          }}>
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </Box>
        </StyledTooltip>
      )}
      <Typography sx={{
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'capitalize',
        color: '#333333',
        textAlign: 'center',
        mb: 2,
        lineHeight: 1.2
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: isComposite ? '40px' : '36px',
        fontWeight: 700,
        color: '#000000',
        lineHeight: 1
      }}>
        {displayScore}
      </Typography>
    </Box>
  );

  if (hasReason) {
    return (
      <StyledTooltip
        title={reason}
        placement="top"
        arrow
        enterDelay={300}
      >
        {cardContent}
      </StyledTooltip>
    );
  }

  return cardContent;
};

const GrowthLikelihoodSection = ({ data }) => {
  if (!data) return null;

  const factors = [
    {
      label: 'Media reach',
      scoreKey: 'growth_media_reach_score',
      reasonKey: 'growth_media_reach_reason',
      defaultReason: 'Measures the breadth of press, social, and other media audiences reached.',
      infoContent: 'Media Reach Index (0-100)\nSub-metrics: Number of countries with media mentions, unique publications, top-tier outlet presence, frequency of mentions.\nScoring:\n0-20: Local or niche coverage\n21-50: Regional visibility\n51-80: International mentions\n81-100: Global, multi-sector coverage'
    },
    {
      label: 'Sentiment',
      scoreKey: 'growth_sentiment_score',
      reasonKey: 'growth_sentiment_reason',
      defaultReason: 'Assesses positive vs. negative tone across coverage and social conversations.',
      infoContent: 'Sentiment Score (0-100)\nSub-metrics: Average sentiment polarity, ratio of positive to negative mentions, sentiment trend over time.\nScoring:\n0-20: Predominantly negative or controversial\n21-50: Mixed or neutral sentiment\n51-80: Generally positive\n81-100: Strongly positive and consistent'
    },
    {
      label: 'Innovation visibility',
      scoreKey: 'growth_innovation_visibility_score',
      reasonKey: 'growth_innovation_visibility_reason',
      defaultReason: "Looks at how visible the company's innovation and product story is in-market.",
      infoContent: 'Innovation Visibility Score (0-100)\nSub-metrics: Mentions of patents, R&D, novel tech, presence in innovation platforms, investor recognition, product uniqueness.\nScoring:\n0-20: Low visibility or unclear innovation\n21-50: Some innovation signals\n51-80: Recognized for innovation\n81-100: Leading-edge or category-defining'
    },
    {
      label: 'Team strength',
      scoreKey: 'growth_team_strength_score',
      reasonKey: 'growth_team_strength_reason',
      defaultReason: 'Evaluates leadership depth, hiring velocity, and organizational capabilities.',
      infoContent: "Team Strength Score (0-100)\nSub-metrics: Founders' experience, skill diversity, domain expertise, team growth and retention, LinkedIn profiles, diversity indicators.\nScoring:\n0-20: Inexperienced or fragmented team\n21-50: Some relevant experience\n51-80: Strong, well-rounded team\n81-100: Elite, high-performing leadership"
    },
    {
      label: 'Funding velocity',
      scoreKey: 'growth_funding_velocity_score',
      reasonKey: 'growth_funding_velocity_reason',
      defaultReason: 'Tracks capital raised momentum and cadence relative to stage and peers.',
      infoContent: 'Funding Velocity Score (0-100)\nSub-metrics: Number and size of rounds, time between rounds, investor quality, valuation growth.\nScoring:\n0-20: Little or stagnant funding\n21-50: Moderate funding activity\n51-80: Strong funding momentum\n81-100: Rapid, high-quality fundraising'
    },
    {
      label: 'Company age',
      scoreKey: 'growth_company_age_score',
      reasonKey: 'growth_company_age_reason',
      defaultReason: 'Captures maturity and time in market relative to expected growth runway.',
      infoContent: 'Company Age Score (0-100)\nLogic: Survival likelihood increases with age.\nScoring:\n0-20: <1 year old (high risk, very early stage)\n21-40: 1-3 years old (gaining traction)\n41-60: 3-5 years old (moderate survival likelihood)\n61-80: 5-7 years old (strong survival likelihood)\n81-100: >7 years old (proven resilience)'
    }
  ];

  const hasAnyScore = factors.some(f => data[f.scoreKey] != null) || data.growth_composite_score != null;

  if (!hasAnyScore) {
    return null;
  }

  return (
    <BaseSection
      title="Growth likelihood"
      subtitle="6-factor 5-year growth potential + composite"
      icon={<TrendingUpIcon />}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {factors.map((factor, index) => (
          <Box key={index} sx={{ flex: '1 1 calc(14.28% - 16px)', minWidth: '120px' }}>
            <ScoreCard
              label={factor.label}
              score={data[factor.scoreKey]}
              reason={data[factor.reasonKey] || factor.defaultReason}
              infoContent={factor.infoContent}
              colorOverride={factorColorOverrides[factor.label.toLowerCase()]}
            />
          </Box>
        ))}
        <Box sx={{ flex: '1 1 calc(14.28% - 16px)', minWidth: '120px' }}>
          <ScoreCard
            label="Total Growth Likelihood"
            score={data.growth_composite_score}
            isComposite={true}
            colorOverride={factorColorOverrides.composite}
            infoContent={
              'Total Growth Likelihood (0-100)\n' +
              'Weighted composite of all 6 growth factors:\n\n' +
              '• Media Reach: 20%\n' +
              '• Sentiment: 15%\n' +
              '• Innovation Visibility: 15%\n' +
              '• Team Strength: 15%\n' +
              '• Funding Velocity: 15%\n' +
              '• Company Age: 20%' +
              (data.growth_summary
                ? '\n\n━━━━━━━━━━━━━━━━━━━━\n\n' + data.growth_summary
                : '')
            }
          />
        </Box>
      </Box>
    </BaseSection>
  );
};

export default GrowthLikelihoodSection;
