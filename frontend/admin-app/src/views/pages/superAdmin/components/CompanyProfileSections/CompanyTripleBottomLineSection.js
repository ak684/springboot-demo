import React, { memo, useMemo, useEffect, useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import { init } from 'echarts';
import { clone } from 'shared-components/utils/lo';
import BaseSection from './BaseSection';
import donutChartConfig from '../../../companyProfile/chart/donutChart';

const SDG_CATEGORIES = {
  1: 'Society',
  2: 'Society',
  3: 'Society',
  4: 'Society',
  5: 'Society',
  6: 'Biosphere',
  7: 'Society',
  8: 'Economy',
  9: 'Economy',
  10: 'Economy',
  11: 'Society',
  12: 'Economy',
  13: 'Biosphere',
  14: 'Biosphere',
  15: 'Biosphere',
  16: 'Society',
  17: 'Society'
};

const CATEGORY_COLORS = {
  Biosphere: '#4caf50',
  Society: '#2196f3',
  Economy: '#F36D25'
};

const buildTripleBottomLineData = (theoryOfChange = [], impactScoring = []) => {
  const scoringMap = new Map();
  impactScoring.forEach((item, index) => {
    const id = item.id || index + 1;
    scoringMap.set(id, item);
  });

  const positiveCategories = { Biosphere: 0, Society: 0, Economy: 0 };
  const negativeCategories = { Biosphere: 0, Society: 0, Economy: 0 };

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

    const targetCategories = isPositive ? positiveCategories : negativeCategories;

    sdgs.forEach(sdg => {
      const sdgNumber = sdg.number;
      const percent = (sdg.percent || 0) / 100;
      const category = SDG_CATEGORIES[sdgNumber];
      if (category) {
        targetCategories[category] += magnitude * percent;
      }
    });
  });

  return { positiveCategories, negativeCategories };
};

const getChartConfig = (categories, theme) => {
  const config = clone(donutChartConfig);
  const total = Object.values(categories).reduce((a, b) => a + b, 0);

  config.series[0].data = [
    {
      name: 'Biosphere',
      value: categories.Biosphere,
      itemStyle: { color: CATEGORY_COLORS.Biosphere }
    },
    {
      name: 'Society',
      value: categories.Society,
      itemStyle: { color: CATEGORY_COLORS.Society }
    },
    {
      name: 'Economy',
      value: categories.Economy,
      itemStyle: { color: CATEGORY_COLORS.Economy }
    }
  ];
  config.series[0].radius = ['50%', '75%'];
  config.tooltip = {
    trigger: 'item',
    formatter: (params) => {
      const percent = total > 0 ? ((params.value / total) * 100).toFixed(0) : 0;
      return `${params.name}: ${percent}%`;
    }
  };
  return config;
};

const TripleBottomLineChart = ({ chartId, categories, title }) => {
  const theme = useTheme();
  const chartRef = useRef(null);

  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  const hasData = total > 0;

  useEffect(() => {
    if (hasData && !chartRef.current) {
      const element = document.getElementById(chartId);
      if (element) {
        chartRef.current = init(element);
      }
    }
    if (chartRef.current && hasData) {
      chartRef.current.setOption(getChartConfig(categories, theme));
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, [chartId, categories, hasData, theme]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPercent = (value) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (!hasData) {
    return (
      <Box flex={1} textAlign="center">
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
    <Box flex={1} display="flex" flexDirection="column" alignItems="center">
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{ position: 'relative', width: 180, height: 180 }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          id={chartId}
          sx={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </Box>
      <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              backgroundColor: CATEGORY_COLORS.Biosphere
            }}
          />
          <Typography variant="caption">
            Biosphere {getPercent(categories.Biosphere)}%
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              backgroundColor: CATEGORY_COLORS.Society
            }}
          />
          <Typography variant="caption">
            Society {getPercent(categories.Society)}%
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              backgroundColor: CATEGORY_COLORS.Economy
            }}
          />
          <Typography variant="caption">
            Economy {getPercent(categories.Economy)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const CompanyTripleBottomLineSection = ({ data }) => {
  const { positiveCategories, negativeCategories } = useMemo(
    () => buildTripleBottomLineData(data?.theory_of_change || [], data?.impact_scoring || []),
    [data?.theory_of_change, data?.impact_scoring]
  );

  const positiveTotal = Object.values(positiveCategories).reduce((a, b) => a + b, 0);
  const negativeTotal = Object.values(negativeCategories).reduce((a, b) => a + b, 0);

  if (positiveTotal === 0 && negativeTotal === 0) {
    return null;
  }

  return (
    <BaseSection
      title="Triple bottom line impact"
      subtitle="SDG contributions grouped by Biosphere, Society, and Economy"
      icon={<PieChartIcon />}
    >
      <Box display="flex" gap={4} justifyContent="center">
        <TripleBottomLineChart
          chartId="tbl-positive-chart"
          categories={positiveCategories}
          title="Positive impact"
        />
        <TripleBottomLineChart
          chartId="tbl-negative-chart"
          categories={negativeCategories}
          title="Negative impact"
        />
      </Box>
    </BaseSection>
  );
};

export default memo(CompanyTripleBottomLineSection);
