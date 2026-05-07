import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Card, Typography, CircularProgress, Skeleton, Tooltip } from '@mui/material';
import { init } from 'echarts';
import { v1 } from 'services/api';

const SBMO_LEVELS = [
  { level: 0, label: 'None', color: '#B0BECF' },
  { level: 1, label: 'Peripheral', color: '#E8A838' },
  { level: 2, label: 'Embedded', color: '#5B8DEF' },
  { level: 3, label: 'North Star', color: '#4D9951' }
];

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const getCacheKey = (portfolioId, tags) => {
  const tagSuffix = tags && tags.length > 0 ? `.tags_${[...tags].sort().join('_')}` : '';
  return portfolioId
    ? `sbmoDistribution.${portfolioId}${tagSuffix}`
    : `sbmoDistribution.all${tagSuffix}`;
};

const getCachedDistribution = (portfolioId, tags) => {
  try {
    const cached = localStorage.getItem(getCacheKey(portfolioId, tags));
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(portfolioId, tags));
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedDistribution = (portfolioId, tags, data) => {
  try {
    localStorage.setItem(getCacheKey(portfolioId, tags), JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage full or unavailable - ignore
  }
};

const buildChartOption = (levels) => {
  const hasData = levels && levels.some(l => l.count > 0);
  if (!hasData) {
    return {
      series: [{
        type: 'pie',
        radius: ['58%', '82%'],
        data: [{ value: 1, name: 'No data', itemStyle: { color: '#e0e0e0' } }],
        label: { show: false },
        emphasis: { scale: false }
      }]
    };
  }

  const data = levels.map((l, i) => ({
    value: l.count,
    name: l.label,
    itemStyle: { color: SBMO_LEVELS[i]?.color || '#999' }
  })).filter(d => d.value > 0);

  const totalScored = levels.reduce((sum, l) => sum + l.count, 0);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const pct = totalScored > 0
          ? ((params.value / totalScored) * 100).toFixed(1)
          : 0;
        return `<b>${params.name}</b><br/>${params.value} companies (${pct}%)`;
      }
    },
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'center',
        formatter: () => `${totalScored}\nCompanies`,
        fontSize: 15,
        fontWeight: 600,
        color: '#333',
        lineHeight: 20
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 700
        }
      },
      labelLine: { show: false },
      data
    }]
  };
};

const LegendItem = ({ color, label, count, percentage }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
    <Box sx={{
      width: 10, height: 10, borderRadius: '50%',
      backgroundColor: color, flexShrink: 0
    }} />
    <Typography variant="body2" sx={{ color: '#555', flex: 1 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#333', fontWeight: 600, minWidth: 28, textAlign: 'right' }}>
      {percentage}%
    </Typography>
  </Box>
);

const SbmoDistributionChart = ({ portfolioId, selectedTags }) => {
  const initialCache = getCachedDistribution(portfolioId, selectedTags);
  const [distribution, setDistribution] = useState(initialCache);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const fetchDistribution = useCallback(async () => {
    try {
      const params = {};
      if (portfolioId) {
        params.portfolioId = portfolioId;
      }
      if (selectedTags && selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      const response = await v1.get('/companies/sbmo-distribution', { params });
      setDistribution(response.data);
      setCachedDistribution(portfolioId, selectedTags, response.data);
    } catch (error) {
      console.error('[SbmoDistribution] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, selectedTags]);

  useEffect(() => {
    const cached = getCachedDistribution(portfolioId, selectedTags);
    if (cached) {
      setDistribution(cached);
      setIsLoading(false);
    } else if (!distribution) {
      setIsLoading(true);
    }
    fetchDistribution();
  }, [fetchDistribution, portfolioId, selectedTags]);

  useEffect(() => {
    if (!distribution || !chartRef.current) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }
    chartInstanceRef.current = init(chartRef.current);
    const option = buildChartOption(distribution.levels);
    chartInstanceRef.current.setOption(option, true);

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [distribution]);

  const renderLegend = () => {
    if (!distribution?.levels) return null;
    const totalScored = distribution.levels.reduce((sum, l) => sum + l.count, 0);
    return (
      <Box sx={{ mt: 1 }}>
        {distribution.levels.map((l, i) => (
          <LegendItem
            key={l.level}
            color={SBMO_LEVELS[i]?.color}
            label={l.label}
            count={l.count}
            percentage={totalScored > 0 ? Math.round((l.count / totalScored) * 100) : 0}
          />
        ))}
      </Box>
    );
  };

  const renderClusterBreakdown = () => {
    if (!distribution?.byCluster || Object.keys(distribution.byCluster).length === 0) {
      return null;
    }

    const clusters = Object.entries(distribution.byCluster)
      .filter(([, data]) => data.scored > 0)
      .sort((a, b) => b[1].scored - a[1].scored);

    if (clusters.length === 0) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {clusters.map(([clusterName, data]) => {
          const total = data.scored;
          return (
            <Box key={clusterName}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#444', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {clusterName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', flexShrink: 0 }}>
                  {total}
                </Typography>
              </Box>
              <Tooltip
                title={
                  data.levels.filter(l => l.count > 0).map(l =>
                    `${l.label}: ${l.count} (${l.percentage}%)`
                  ).join(' · ')
                }
                placement="top"
                arrow
              >
                <Box sx={{ display: 'flex', height: 16, borderRadius: 1, overflow: 'hidden', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
                  {data.levels.filter(l => l.count > 0).map((l) => (
                    <Box
                      key={l.level}
                      sx={{
                        width: `${(l.count / total) * 100}%`,
                        backgroundColor: SBMO_LEVELS[l.level]?.color || '#999',
                        transition: 'width 0.3s ease',
                        minWidth: l.count > 0 ? 3 : 0
                      }}
                    />
                  ))}
                </Box>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    );
  };

  if (isLoading && !distribution) {
    return (
      <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={40} />
        </Box>
      </Card>
    );
  }

  const hasClusters = distribution?.byCluster && Object.keys(distribution.byCluster).length > 0
    && Object.values(distribution.byCluster).some(d => d.scored > 0);

  return (
    <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Typography variant="h5" fontWeight="600" gutterBottom>
        Sustainable Business Model Orientation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Portfolio composition by SBMO level
      </Typography>

      <Box sx={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {/* Left: Donut chart + legend */}
        <Box sx={{ width: hasClusters ? '28%' : '100%', flexShrink: 0 }}>
          <Box ref={chartRef} sx={{ width: '100%', height: 180 }} />
          {renderLegend()}
        </Box>

        {/* Right: Cluster breakdown bars */}
        {hasClusters && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                By Technology Cluster
              </Typography>
              <Typography variant="caption" color="text.secondary">
                scored
              </Typography>
            </Box>
            {renderClusterBreakdown()}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default SbmoDistributionChart;
