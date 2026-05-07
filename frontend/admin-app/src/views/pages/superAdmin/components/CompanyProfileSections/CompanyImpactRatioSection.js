import React, { memo, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import { clone } from 'shared-components/utils/lo';
import useChart from 'shared-components/hooks/useChart';
import BaseSection from './BaseSection';
import donutChartConfig from '../../../companyProfile/chart/donutChart';

const buildImpactData = (theoryOfChange = [], impactScoring = []) => {
  const scoringMap = new Map();
  impactScoring.forEach((item, index) => {
    const id = item.id || index + 1;
    scoringMap.set(id, item);
  });

  let positiveMagnitude = 0;
  let negativeMagnitude = 0;

  theoryOfChange.forEach((impact, index) => {
    const id = impact.id || index + 1;
    const scoring = scoringMap.get(id) || {};
    const isPositive = !impact.type?.toLowerCase().includes('negative');

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

    if (isPositive) {
      positiveMagnitude += magnitude;
    } else {
      negativeMagnitude += magnitude;
    }
  });

  return { positiveMagnitude, negativeMagnitude };
};

const getChartData = (positiveMagnitude, negativeMagnitude, theme) => {
  const config = clone(donutChartConfig);
  config.series[0].data = [
    {
      name: 'Positive',
      value: positiveMagnitude,
      itemStyle: { color: theme.palette.success.main }
    },
    {
      name: 'Negative',
      value: negativeMagnitude,
      itemStyle: { color: '#F36D25' }
    }
  ];
  config.series[0].radius = ['55%', '80%'];
  config.tooltip = {
    trigger: 'item',
    formatter: '{b}: {d}%'
  };
  return config;
};

const CompanyImpactRatioSection = ({ data }) => {
  const theme = useTheme();

  const { positiveMagnitude, negativeMagnitude } = useMemo(
    () => buildImpactData(data?.theory_of_change || [], data?.impact_scoring || []),
    [data?.theory_of_change, data?.impact_scoring]
  );

  const total = positiveMagnitude + negativeMagnitude;
  const positivePercent = total > 0 ? Math.round((positiveMagnitude / total) * 100) : 0;
  const hasData = total > 0;

  useChart(
    'impact-ratio-chart',
    () => getChartData(positiveMagnitude, negativeMagnitude, theme),
    hasData,
    positiveMagnitude,
    negativeMagnitude,
    theme
  );

  if (!hasData) {
    return null;
  }

  return (
    <BaseSection
      title="Share of positive vs. negative outcomes"
      subtitle="Based on impact magnitude across all impact chains"
      icon={<DonutLargeIcon />}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <Box
          sx={{ position: 'relative', width: 220, height: 220 }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            id="impact-ratio-chart"
            sx={{ position: 'absolute', width: '100%', height: '100%' }}
          />
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ zIndex: 1 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 36, color: theme.palette.success.main }}>
              {positivePercent}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Positive
            </Typography>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={1} ml={4}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 1,
                backgroundColor: theme.palette.success.main
              }}
            />
            <Typography variant="body2">
              Positive outcomes ({positivePercent}%)
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 1,
                backgroundColor: '#F36D25'
              }}
            />
            <Typography variant="body2">
              Negative outcomes ({100 - positivePercent}%)
            </Typography>
          </Box>
        </Box>
      </Box>
    </BaseSection>
  );
};

export default memo(CompanyImpactRatioSection);
