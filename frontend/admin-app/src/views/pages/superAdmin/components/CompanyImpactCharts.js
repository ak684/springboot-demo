import React, { memo, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  useTheme,
  Grid,
  Divider
} from '@mui/material';
import DashboardChartLine from '../../dashboard/components/DashboardChartLine';
import AppTooltip from '../../../common/AppTooltip';
import * as echarts from 'echarts';

const CompanyImpactCharts = ({ gridData }) => {
  const theme = useTheme();

  // Filter companies that have valid impact scores
  const companiesWithImpactScores = gridData.filter(company =>
    company.overall_impact_potential_score &&
    company.overall_impact_potential_score !== 'N/A' &&
    company.overall_impact_potential_score > 0
  );

  // Filter companies that have ESG risk scores
  const companiesWithESGRiskScores = gridData.filter(company =>
    company.esg_risk_total_adjusted !== null &&
    company.esg_risk_total_adjusted !== undefined
  );

  if (companiesWithImpactScores.length === 0 &&
      companiesWithESGRiskScores.length === 0) {
    return null;
  }

  // Sort companies by impact potential score (highest first)
  const topImpactCompanies = companiesWithImpactScores
    .sort((a, b) => parseFloat(b.overall_impact_potential_score) - parseFloat(a.overall_impact_potential_score))
    .slice(0, 10); // Show top 10

  // Sort companies by ESG risk score (lowest first for top performers, highest first for high risk)
  const lowestESGRiskCompanies = companiesWithESGRiskScores
    .sort((a, b) => (a.esg_risk_total_adjusted || 0) - (b.esg_risk_total_adjusted || 0))
    .slice(0, 10); // Show top 10 lowest risk

  const highestESGRiskCompanies = companiesWithESGRiskScores
    .sort((a, b) => (b.esg_risk_total_adjusted || 0) - (a.esg_risk_total_adjusted || 0))
    .slice(0, 10); // Show top 10 highest risk

  const maxImpactScore = topImpactCompanies.length > 0
    ? Math.max(...topImpactCompanies.map(c => parseFloat(c.overall_impact_potential_score)))
    : 0;

  const maxESGRiskScore = highestESGRiskCompanies.length > 0
    ? Math.max(...highestESGRiskCompanies.map(c => c.esg_risk_total_adjusted || 0))
    : 30; // Max possible score

  // Create chart items for impact potential
  const impactChartItems = topImpactCompanies.map(company => {
    const score = parseFloat(company.overall_impact_potential_score);
    const magnitude = company.impact_magnitude_5_year && company.impact_magnitude_5_year !== 'N/A'
      ? parseFloat(company.impact_magnitude_5_year)
      : 'N/A';
    const likelihood = company.impact_likelihood && company.impact_likelihood !== 'N/A'
      ? parseFloat(company.impact_likelihood) * 100
      : 'N/A';

    const tooltip = (
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold'>{company.company_name}</Typography>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Magnitude (5Y):</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>
            {magnitude !== 'N/A' ? Math.round(magnitude).toString() : 'N/A'}
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Likelihood:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>
            {likelihood !== 'N/A' ? `${likelihood.toFixed(1)}%` : 'N/A'}
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Impact Score:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{score.toFixed(1)}</Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Industry:</Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.8em' }}>
            {company.industry_sectors && company.industry_sectors !== 'N/A'
              ? (company.industry_sectors.length > 30
                  ? `${company.industry_sectors.substring(0, 30)}...`
                  : company.industry_sectors)
              : 'N/A'}
          </Typography>
        </Box>
      </Box>
    );

    return (
      <DashboardChartLine
        key={company.id}
        max={maxImpactScore}
        value={score.toFixed(1)}
        valueLabel={`${score.toFixed(1)}`}
        label={company.company_name}
        color={theme.palette.success.main}
        tooltip={tooltip}
        valueWidth={60}
      />
    );
  });

  const impactTooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Companies ranked by their 5-year impact potential score.</Box>
      <Box>Impact potential is calculated by multiplying impact magnitude × impact likelihood.</Box>
      <Box>Higher scores indicate companies with greater potential for positive impact.</Box>
    </Box>
  );

  // Create chart items for lowest ESG risk companies
  const lowestRiskChartItems = lowestESGRiskCompanies.map(company => {
    const adjustedScore = company.esg_risk_total_adjusted || 0;
    const inherentScore = company.esg_risk_total_inherent || 0;
    const reduction = inherentScore - adjustedScore;

    const tooltip = (
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold'>{company.company_name}</Typography>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Inherent Risk:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{inherentScore.toFixed(1)}/30</Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Adjusted Risk:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{adjustedScore.toFixed(1)}/30</Typography>
        </Box>
        {reduction > 0 && (
          <Box display='flex' justifyContent='space-between'>
            <Typography>Risk Reduction:</Typography>
            <Typography sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
              ↓ {reduction.toFixed(1)}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 0.5 }} />
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Environmental:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_environmental_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Social:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_social_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Governance:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_governance_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
      </Box>
    );

    return (
      <DashboardChartLine
        key={company.id}
        max={maxESGRiskScore}
        value={adjustedScore.toFixed(1)}
        valueLabel={`${adjustedScore.toFixed(1)}`}
        label={company.company_name}
        color={theme.palette.success.main}
        tooltip={tooltip}
        valueWidth={60}
      />
    );
  });

  // Create chart items for highest ESG risk companies
  const highestRiskChartItems = highestESGRiskCompanies.map(company => {
    const adjustedScore = company.esg_risk_total_adjusted || 0;
    const inherentScore = company.esg_risk_total_inherent || 0;
    const reduction = inherentScore - adjustedScore;

    const tooltip = (
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold'>{company.company_name}</Typography>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Inherent Risk:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{inherentScore.toFixed(1)}/30</Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography>Adjusted Risk:</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{adjustedScore.toFixed(1)}/30</Typography>
        </Box>
        {reduction > 0 && (
          <Box display='flex' justifyContent='space-between'>
            <Typography>Risk Reduction:</Typography>
            <Typography sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
              ↓ {reduction.toFixed(1)}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 0.5 }} />
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Environmental:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_environmental_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Social:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_social_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption'>Governance:</Typography>
          <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
            {company.esg_risk_governance_adjusted?.toFixed(1) || 'N/A'}/10
          </Typography>
        </Box>
      </Box>
    );

    return (
      <DashboardChartLine
        key={company.id}
        max={maxESGRiskScore}
        value={adjustedScore.toFixed(1)}
        valueLabel={`${adjustedScore.toFixed(1)}`}
        label={company.company_name}
        color={theme.palette.warning.main}
        tooltip={tooltip}
        valueWidth={60}
      />
    );
  });

  const lowestRiskTooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Companies with the lowest ESG risk scores (best performers).</Box>
      <Box>Lower scores indicate better ESG risk management.</Box>
      <Box>Green = Low risk (0-10), Orange = Medium (11-20), Red = High (21-30)</Box>
    </Box>
  );

  const highestRiskTooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Companies with the highest ESG risk scores.</Box>
      <Box>Higher scores indicate greater ESG-related risks.</Box>
      <Box>These companies may benefit most from ESG initiatives.</Box>
    </Box>
  );

  return (
    <Grid container spacing={3}>
          {/* Impact Potential Chart */}
          {topImpactCompanies.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2 }}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='h5'>Top Companies by Impact Potential</Typography>
                  <AppTooltip>{impactTooltip}</AppTooltip>
                </Box>
                <Typography variant='caption'>
                  {`(Showing top ${topImpactCompanies.length} of ${companiesWithImpactScores.length} companies with impact scores)`}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' flexDirection='column' gap={2}>
                  {impactChartItems}
                </Box>
              </Card>
            </Grid>
          )}

          {/* Lowest ESG Risk Chart */}
          {lowestESGRiskCompanies.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2 }}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='h5'>Lowest ESG Risk Companies</Typography>
                  <AppTooltip>{lowestRiskTooltip}</AppTooltip>
                </Box>
                <Typography variant='caption'>
                  {`(Showing top ${lowestESGRiskCompanies.length} of ${companiesWithESGRiskScores.length} companies with ESG risk scores)`}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' flexDirection='column' gap={2}>
                  {lowestRiskChartItems}
                </Box>
              </Card>
            </Grid>
          )}

          {/* Highest ESG Risk Chart */}
          {highestESGRiskCompanies.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2 }}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='h5'>Highest ESG Risk Companies</Typography>
                  <AppTooltip>{highestRiskTooltip}</AppTooltip>
                </Box>
                <Typography variant='caption'>
                  {`(Showing top ${highestESGRiskCompanies.length} of ${companiesWithESGRiskScores.length} companies with ESG risk scores)`}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display='flex' flexDirection='column' gap={2}>
                  {highestRiskChartItems}
                </Box>
              </Card>
            </Grid>
          )}

          {/* New Chart 4: Geographic Impact Distribution */}
          <GeographicDistributionChart gridData={gridData} theme={theme} />

          {/* New Chart 6: Ventures Overview Bubble Chart */}
          <VenturesOverviewBubbleChart gridData={gridData} theme={theme} />
        </Grid>
  );
};

// Chart 4: Geographic Distribution
const GeographicDistributionChart = memo(({ gridData, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const chartData = useMemo(() => {
    const countryData = {};

    gridData.forEach(company => {
      // Try to extract country from headquarter_address
      let country = 'Unknown';

      if (company.headquarter_address && company.headquarter_address !== 'N/A') {
        // Simple country extraction - look for common country names at the end
        const address = company.headquarter_address;
        const countryPatterns = [
          'United States', 'USA', 'US',
          'United Kingdom', 'UK',
          'Germany', 'France', 'Spain', 'Italy', 'Netherlands',
          'Canada', 'Australia', 'Japan', 'China', 'India',
          'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland',
          'Belgium', 'Austria', 'Ireland', 'Israel', 'Singapore'
        ];

        for (const pattern of countryPatterns) {
          if (address.includes(pattern)) {
            country = pattern;
            // Normalize some country names
            if (pattern === 'USA' || pattern === 'US') country = 'United States';
            if (pattern === 'UK') country = 'United Kingdom';
            break;
          }
        }
      }

      if (!countryData[country]) {
        countryData[country] = {
          count: 0,
          totalImpact: 0,
          validImpact: 0
        };
      }

      countryData[country].count++;

      if (company.overall_impact_potential_score !== 'N/A' &&
          company.overall_impact_potential_score !== null &&
          company.overall_impact_potential_score > 0) {
        countryData[country].totalImpact += parseFloat(company.overall_impact_potential_score);
        countryData[country].validImpact++;
      }
    });

    // Process data for donut chart
    const processedData = Object.entries(countryData)
      .map(([country, data]) => ({
        name: country,
        value: data.count,
        avgImpact: data.validImpact > 0 ? data.totalImpact / data.validImpact : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 countries

    return processedData;
  }, [gridData]);

  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            return `
              <strong>${params.data.name}</strong><br/>
              Companies: ${params.data.value}<br/>
              Percentage: ${params.percent}%<br/>
              Avg Impact Score: ${params.data.avgImpact.toFixed(1)}
            `;
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: chartData.map((item, index) => ({
            ...item,
            itemStyle: {
              color: [
                theme.palette.primary.main,
                theme.palette.success.main,
                theme.palette.info.main,
                theme.palette.warning.main,
                theme.palette.error.light,
                theme.palette.secondary.main,
                theme.palette.primary.light,
                theme.palette.success.light,
                theme.palette.info.light,
                theme.palette.warning.light
              ][index % 10]
            }
          }))
        }]
      };

      chartInstance.current.setOption(option);

      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [chartData, theme]);

  if (chartData.length === 0) return null;

  const tooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Geographic distribution of companies in the portfolio.</Box>
      <Box>Shows concentration by country/region with average impact scores.</Box>
    </Box>
  );

  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ p: 2 }}>
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h5'>HQ Geographic Distribution</Typography>
          <AppTooltip>{tooltip}</AppTooltip>
        </Box>
        <Typography variant='caption'>
          {`Companies across ${chartData.length} countries`}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box ref={chartRef} sx={{ height: 300, width: '100%' }} />
      </Card>
    </Grid>
  );
});

// Chart 6: Ventures Overview Bubble Chart (similar to portfolio ventures overview)
const VenturesOverviewBubbleChart = memo(({ gridData, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Color palette matching the original ventures overview
  const colors = [
    '#EB1C2D', '#279B48', '#EF402B', '#00AED9', '#D3A029', '#9747FF',
    '#ADC178', '#EF476F', '#52796F', '#073B4C', '#118AB2', '#06D6A0'
  ];

  const chartData = useMemo(() => {
    const validData = gridData.filter(company =>
      company.impact_magnitude_5_year !== 'N/A' &&
      company.impact_magnitude_5_year !== null &&
      company.impact_magnitude_5_year > 0 &&
      company.impact_likelihood !== 'N/A' &&
      company.impact_likelihood !== null &&
      company.impact_likelihood > 0 &&
      company.overall_impact_potential_score !== 'N/A' &&
      company.overall_impact_potential_score !== null &&
      company.overall_impact_potential_score > 0
    );

    const data = validData.map((company, index) => {
      const impactScore = parseFloat(company.overall_impact_potential_score);
      // Create abbreviated company name for label (first word + first letter of second word)
      const nameWords = company.company_name.split(' ');
      const shortLabel = nameWords.length > 1 
        ? `${nameWords[0]} ${nameWords[1]?.charAt(0) || ''}`.substring(0, 12)
        : company.company_name.substring(0, 12);

      return {
        value: [
          parseFloat(company.impact_likelihood) * 100, // X: likelihood as percentage
          parseFloat(company.impact_magnitude_5_year),  // Y: magnitude
          shortLabel // Abbreviated company name
        ],
        name: company.company_name,
        symbolSize: Math.max(impactScore * 2, 25), // Bubble size
        itemStyle: {
          color: colors[index % colors.length],
          opacity: impactScore > 0 ? 0.8 : 0.3 // Higher opacity for companies with impact scores
        }
      };
    });

    return data;
  }, [gridData]);

  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        title: {
          text: 'Impact by companies',
          left: 'center',
          top: 5,
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        grid: {
          left: '10%',
          right: '5%',
          bottom: '15%',
          top: '20%'
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const company = gridData.find(c => c.company_name === params.data.name);
            const cluster = company?.technology_cluster || 'General – Non-Cluster';
            const industry = company?.industry_sectors || 'N/A';
            
            return `
              <div style="max-width: 300px;">
                <strong style="font-size: 14px;">${params.data.name}</strong><br/>
                <div style="margin: 8px 0; padding: 4px 0; border-top: 1px solid #eee;">
                  <strong>Impact Likelihood:</strong> ${params.data.value[0].toFixed(1)}%<br/>
                  <strong>Impact Magnitude:</strong> ${params.data.value[1].toFixed(2)}<br/>
                  <strong>Impact Potential Score:</strong> ${company?.overall_impact_potential_score || 'N/A'}
                </div>
                <div style="padding-top: 4px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <strong>Tech Cluster:</strong> ${cluster.length > 40 ? cluster.substring(0, 40) + '...' : cluster}<br/>
                  <strong>Industry:</strong> ${industry.length > 40 ? industry.substring(0, 40) + '...' : industry}
                </div>
              </div>
            `;
          }
        },
        xAxis: {
          type: 'value',
          name: 'Impact Likelihood (%)',
          nameLocation: 'middle',
          nameGap: 30,
          min: 0,
          max: 100
        },
        yAxis: {
          type: 'value',
          name: 'Impact Magnitude (5-year)',
          nameLocation: 'middle',
          nameGap: 40,
          min: 0
        },
        series: [{
          type: 'scatter',
          data: chartData,
          label: {
            show: false, // Hide labels by default since we have good tooltips
            formatter: (param) => param.data.value[2],
            fontSize: 10,
            position: 'inside',
            color: '#fff',
            fontWeight: 'bold'
          },
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 2,
              opacity: 1
            },
            label: {
              show: true // Show label on hover
            }
          }
        }]
      };

      chartInstance.current.setOption(option);

      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [chartData, gridData, theme]);

  if (chartData.length === 0) return null;

  const tooltip = (
    <Box display='flex' flexDirection='column' gap={1} p={1}>
      <Box>Companies plotted by impact likelihood (x-axis) vs magnitude (y-axis).</Box>
      <Box>Bubble size represents overall impact potential score.</Box>
      <Box>Each company has a unique color. Hover over bubbles to see company names and details.</Box>
      <Box>Similar to the ventures overview but for extracted company data.</Box>
    </Box>
  );

  return (
    <Grid item xs={12} lg={8}>
      <Card sx={{ p: 2 }}>
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='h5'>Companies Impact Overview</Typography>
          <AppTooltip>{tooltip}</AppTooltip>
        </Box>
        <Typography variant='caption'>
          {`${chartData.length} companies with complete impact data`}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box ref={chartRef} sx={{ height: 450, width: '100%' }} />
      </Card>
    </Grid>
  );
});

export default memo(CompanyImpactCharts);
