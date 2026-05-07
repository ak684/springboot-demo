import React, { memo, useMemo } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { styled } from '@mui/material/styles';
import BaseSection from './BaseSection';

const SDG_INFO = {
  1: { name: 'No Poverty', shortName: 'No Poverty', color: '#E5243B' },
  2: { name: 'Zero Hunger', shortName: 'Zero Hunger', color: '#DDA63A' },
  3: { name: 'Good Health', shortName: 'Good Health', color: '#4C9F38' },
  4: { name: 'Quality Education', shortName: 'Education', color: '#C5192D' },
  5: { name: 'Gender Equality', shortName: 'Gender Equality', color: '#FF3A21' },
  6: { name: 'Clean Water', shortName: 'Clean Water', color: '#26BDE2' },
  7: { name: 'Clean Energy', shortName: 'Clean Energy', color: '#FCC30B' },
  8: { name: 'Decent Work', shortName: 'Decent Work', color: '#A21942' },
  9: { name: 'Industry & Innovation', shortName: 'Innovation', color: '#FD6925' },
  10: { name: 'Reduced Inequalities', shortName: 'Inequalities', color: '#DD1367' },
  11: { name: 'Sustainable Cities', shortName: 'Sust. Cities', color: '#FD9D24' },
  12: { name: 'Responsible Consumption', shortName: 'Resp. Consumption', color: '#BF8B2E' },
  13: { name: 'Climate Action', shortName: 'Climate Action', color: '#3F7E44' },
  14: { name: 'Life below Water', shortName: 'Life below Water', color: '#0A97D9' },
  15: { name: 'Life on Land', shortName: 'Life on Land', color: '#56C02B' },
  16: { name: 'Peace & Justice', shortName: 'Peace & Justice', color: '#00689D' },
  17: { name: 'Partnerships', shortName: 'Partnerships', color: '#19486A' }
};

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 300,
    backgroundColor: 'white',
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[10],
    padding: theme.spacing(2)
  }
}));

const buildSdgContributions = (theoryOfChange = [], impactScoring = []) => {
  const scoringMap = new Map();
  impactScoring.forEach((item, index) => {
    const id = item.id || index + 1;
    scoringMap.set(id, item);
  });

  const positiveBySDG = {};
  const negativeBySDG = {};
  const positiveImpactsBySDG = {};
  const negativeImpactsBySDG = {};

  for (let i = 1; i <= 17; i++) {
    positiveBySDG[i] = 0;
    negativeBySDG[i] = 0;
    positiveImpactsBySDG[i] = [];
    negativeImpactsBySDG[i] = [];
  }

  theoryOfChange.forEach((impact, index) => {
    const id = impact.id || index + 1;
    const scoring = scoringMap.get(id) || {};
    const isPositive = !impact.type?.toLowerCase().includes('negative');
    const sdgs = impact.sdgs || [];

    const degreeOfChange = Number(scoring.degreeOfChange) || 0;
    const scalability = Number(scoring.scalability) || 0;
    const duration = Number(scoring.duration) || 0;
    const contribution = Number(scoring.contribution) || 0;
    const stakeholderSituation = Number(scoring.stakeholderSituation) || 0;

    const problemImportanceInputs = [
      Number(scoring.urgency),
      Number(scoring.irreversibility),
      Number(scoring.fairness),
      Number(scoring.interconnectedness),
      Number(scoring.problemImportance),
    ].filter(Number.isFinite);

    const problemImportance = problemImportanceInputs.length > 0
      ? problemImportanceInputs.reduce((a, b) => a + b, 0) / problemImportanceInputs.length
      : 0;

    const importance = (problemImportance * 2 / 3 + stakeholderSituation * 1 / 3) * 20;
    const howMuchSolved = ((1 + degreeOfChange * 9 / 100) * 6 / 7 + duration * 2 / 7) / 10;
    const contributionFactor = (1 + contribution * 9 / 100) / 10;
    const magnitude = Math.max(0, importance * howMuchSolved * (scalability / 10) * contributionFactor);

    const targetBySDG = isPositive ? positiveBySDG : negativeBySDG;
    const targetImpactsBySDG = isPositive ? positiveImpactsBySDG : negativeImpactsBySDG;

    sdgs.forEach(sdg => {
      const sdgNumber = sdg.number;
      const percent = (sdg.percent || 0) / 100;
      if (sdgNumber >= 1 && sdgNumber <= 17) {
        const sdgContribution = magnitude * percent;
        targetBySDG[sdgNumber] += sdgContribution;
        targetImpactsBySDG[sdgNumber].push({
          title: impact.title,
          contribution: sdgContribution,
          percent: sdg.percent
        });
      }
    });
  });

  const positiveSdgs = Object.entries(positiveBySDG)
    .filter(([, value]) => value > 0)
    .map(([sdgNum, value]) => ({
      number: parseInt(sdgNum),
      value: Math.round(value * 10) / 10,
      impacts: positiveImpactsBySDG[sdgNum]
    }))
    .sort((a, b) => b.value - a.value);

  const negativeSdgs = Object.entries(negativeBySDG)
    .filter(([, value]) => value > 0)
    .map(([sdgNum, value]) => ({
      number: parseInt(sdgNum),
      value: Math.round(value * 10) / 10,
      impacts: negativeImpactsBySDG[sdgNum]
    }))
    .sort((a, b) => b.value - a.value);

  return { positiveSdgs, negativeSdgs };
};

const SdgBarItem = ({ sdg, maxValue, isNegative }) => {
  const theme = useTheme();
  const sdgInfo = SDG_INFO[sdg.number];
  const barColor = isNegative ? theme.palette.error.main : '#2196f3';
  const displayValue = isNegative ? -sdg.value : sdg.value;

  const tooltipContent = (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        SDG {sdg.number}: {sdgInfo.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Contributing impact areas:
      </Typography>
      {sdg.impacts.map((impact, idx) => (
        <Box key={idx} display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" sx={{ maxWidth: 200 }} noWrap>
            {impact.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {impact.percent}%
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <StyledTooltip title={tooltipContent} placement="top">
      <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer' }}>
        <Box
          component="img"
          src={`/images/sdg/${sdg.number}.svg`}
          alt={`SDG ${sdg.number}`}
          sx={{ width: 32, height: 32, borderRadius: 0.5, flexShrink: 0 }}
        />
        <Box flex={1} minWidth={0}>
          <Typography variant="caption" noWrap sx={{ display: 'block', mb: 0.5 }}>
            SDG {sdg.number}: {sdgInfo.shortName}
          </Typography>
          <Box
            height={8}
            sx={{ backgroundColor: theme.palette.grey[200], borderRadius: 1 }}
          >
            <Box
              height={8}
              sx={{
                backgroundColor: barColor,
                borderRadius: 1,
                width: `${(sdg.value / maxValue) * 100}%`,
                minWidth: 4
              }}
            />
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            minWidth: 40,
            textAlign: 'right',
            color: isNegative ? theme.palette.error.main : 'text.primary'
          }}
        >
          {displayValue.toFixed(0)}
        </Typography>
      </Box>
    </StyledTooltip>
  );
};

const SdgBarChart = ({ sdgs, title, isNegative }) => {
  const maxValue = sdgs.length > 0 ? Math.max(...sdgs.map(s => s.value)) : 0;

  if (sdgs.length === 0) {
    return (
      <Box flex={1}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Box display="flex" flexDirection="column" gap={1.5}>
        {sdgs.slice(0, 8).map(sdg => (
          <SdgBarItem
            key={sdg.number}
            sdg={sdg}
            maxValue={maxValue}
            isNegative={isNegative}
          />
        ))}
        {sdgs.length > 8 && (
          <Typography variant="caption" color="text.secondary">
            +{sdgs.length - 8} more SDGs
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const CompanySdgContributionSection = ({ data }) => {
  const { positiveSdgs, negativeSdgs } = useMemo(
    () => buildSdgContributions(data?.theory_of_change || [], data?.impact_scoring || []),
    [data?.theory_of_change, data?.impact_scoring]
  );

  if (positiveSdgs.length === 0 && negativeSdgs.length === 0) {
    return null;
  }

  return (
    <BaseSection
      title="SDG contribution breakdown"
      subtitle="Impact magnitude attributed to each Sustainable Development Goal"
      icon={<BarChartIcon />}
    >
      <Box display="flex" gap={6}>
        <SdgBarChart
          sdgs={positiveSdgs}
          title="Contribution to SDGs"
          isNegative={false}
        />
        <SdgBarChart
          sdgs={negativeSdgs}
          title="Potentially negative consequences"
          isNegative={true}
        />
      </Box>
    </BaseSection>
  );
};

export default memo(CompanySdgContributionSection);
