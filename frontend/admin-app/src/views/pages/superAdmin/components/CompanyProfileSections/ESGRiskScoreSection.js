import React, { useState, useEffect, useRef } from 'react';
import { Grid, Box, Typography, IconButton, Collapse, Chip, CircularProgress, Tooltip } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';
import * as echarts from 'echarts';

// Risk score card component
const RiskScoreCard = ({ title, inherent, adjusted, explanation, isTotal = false }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Different thresholds for total score (0-30 scale) vs individual scores (0-10 scale)
  const getRiskColor = (score) => {
    if (score === null || score === undefined) return '#999999'; // Gray - No Data
    if (isTotal) {
      if (score <= 10) return '#4caf50'; // Green - Low Risk (0-10)
      if (score <= 20) return '#2196f3'; // Blue - Medium Risk (11-20)
      return '#f44336'; // Red - High Risk (21-30)
    } else {
      if (score <= 3) return '#4caf50'; // Green - Low Risk
      if (score <= 6) return '#ff9800'; // Orange - Medium Risk
      return '#f44336'; // Red - High Risk
    }
  };

  const getRiskLevel = (score) => {
    if (score === null || score === undefined) return 'N/A';
    if (isTotal) {
      if (score <= 10) return 'Low';
      if (score <= 20) return 'Medium';
      return 'High';
    } else {
      if (score <= 3) return 'Low';
      if (score <= 6) return 'Medium';
      return 'High';
    }
  };

  return (
    <Box sx={{
      p: 2.5,
      backgroundColor: '#f5f5f5',
      borderRadius: 1,
      minHeight: expanded ? '600px' : '200px', // Increased height for explanation content
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography sx={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666666'
          }}>
            {title}
          </Typography>
          <Typography sx={{
            fontSize: '11px',
            color: '#999999',
            mt: 0.5
          }}>
            {isTotal ? '0-30 scale' : '0-10 scale'}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ height: '120px', display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* Inherent Score */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '12px', color: '#999999', mb: 0.5 }}>
            Inherent
          </Typography>
          <Typography sx={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: getRiskColor(inherent),
            mb: 0.5
          }}>
            {inherent !== null && inherent !== undefined ? inherent.toFixed(1) : 'N/A'}
          </Typography>
          <Chip 
            label={getRiskLevel(inherent)} 
            size="small" 
            sx={{ 
              backgroundColor: getRiskColor(inherent),
              color: 'white',
              fontWeight: 600,
              height: 20,
              fontSize: '11px'
            }}
          />
        </Box>

        {/* Arrow */}
        <Box sx={{ color: '#999999', fontSize: '20px' }}>
          →
        </Box>

        {/* Adjusted Score */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '12px', color: '#999999', mb: 0.5 }}>
            Adjusted
          </Typography>
          <Typography sx={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: getRiskColor(adjusted),
            mb: 0.5
          }}>
            {adjusted !== null && adjusted !== undefined ? adjusted.toFixed(1) : 'N/A'}
          </Typography>
          <Chip 
            label={getRiskLevel(adjusted)} 
            size="small" 
            sx={{ 
              backgroundColor: getRiskColor(adjusted),
              color: 'white',
              fontWeight: 600,
              height: 20,
              fontSize: '11px'
            }}
          />
        </Box>
      </Box>

      {/* Improvement indicator - always reserve space for alignment */}
      <Box sx={{ mt: 2, textAlign: 'center', minHeight: '20px' }}>
        {inherent !== null && inherent !== undefined &&
         adjusted !== null && adjusted !== undefined &&
         inherent > adjusted && (
          <Typography sx={{
            fontSize: '14px',
            color: '#4caf50',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5
          }}>
            <span style={{ fontSize: '16px' }}>↓</span>
            {(inherent - adjusted).toFixed(1)} point improvement
          </Typography>
        )}
      </Box>

      {/* Expandable explanation section */}
      {explanation && (
        <>
          <Box 
            onClick={() => setExpanded(!expanded)}
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <Typography sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Explanation
            </Typography>
            <IconButton
              size="small"
              sx={{ p: 0.5 }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={expanded}>
            <Box sx={{
              mt: 1,
              p: 2,
              backgroundColor: '#ffffff',
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              height: '300px', // Fixed height for consistency with scroll
              display: 'flex',
              flexDirection: 'column'
            }}>
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f0f0f0',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#d0d0d0',
                borderRadius: '2px',
                '&:hover': {
                  backgroundColor: '#b0b0b0',
                }
              }
            }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                {explanation}
              </Typography>
            </Box>
          </Box>
        </Collapse>
        </>
      )}
    </Box>
  );
};

// ESG Risk Score Chart Component
const ESGRiskScoreChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize or get existing chart instance
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Calculate dynamic axis range based on actual data
    const allValues = [
      data.esg_risk_environmental_inherent,
      data.esg_risk_social_inherent,
      data.esg_risk_governance_inherent,
      data.esg_risk_environmental_adjusted,
      data.esg_risk_social_adjusted,
      data.esg_risk_governance_adjusted
    ].filter(val => val !== null && val !== undefined);

    const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 10;

    // Add some padding to the range for better visualization
    const padding = (maxValue - minValue) * 0.1 || 0.5;
    const chartMin = Math.max(0, minValue - padding);
    const chartMax = maxValue + padding;

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params) {
          let tooltipText = params[0].axisValue + '<br/>';
          params.forEach(param => {
            const value = param.value !== null ? param.value.toFixed(1) : 'N/A';
            tooltipText += `${param.marker} ${param.seriesName}: ${value}<br/>`;
          });
          return tooltipText;
        }
      },
      legend: {
        data: ['Inherent Risk', 'Adjusted Risk'],
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['Environmental', 'Social', 'Governance']
      },
      yAxis: {
        type: 'value',
        max: chartMax,
        min: chartMin,
        name: `Risk Score (${chartMin.toFixed(1)}-${chartMax.toFixed(1)})`,
        nameLocation: 'middle',
        nameGap: 30,
        splitNumber: 5 // Automatic interval calculation
      },
      series: [
        {
          name: 'Inherent Risk',
          type: 'bar',
          data: [
            data.esg_risk_environmental_inherent ?? null,
            data.esg_risk_social_inherent ?? null,
            data.esg_risk_governance_inherent ?? null
          ],
          itemStyle: {
            color: 'rgba(255, 152, 0, 0.8)'
          }
        },
        {
          name: 'Adjusted Risk',
          type: 'bar',
          data: [
            data.esg_risk_environmental_adjusted ?? null,
            data.esg_risk_social_adjusted ?? null,
            data.esg_risk_governance_adjusted ?? null
          ],
          itemStyle: {
            color: 'rgba(76, 175, 80, 0.8)'
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

const ESGRiskScoreSection = ({ data, companyId, onRerun }) => {
  const [chartExpanded, setChartExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  
  const handleRerun = async () => {
    if (!onRerun) return;
    setIsRerunning(true);
    try {
      await onRerun('esg-risk', companyId);
    } finally {
      setIsRerunning(false);
    }
  };

  // Check if we have ESG risk score data
  const hasRiskScores = data.esg_risk_environmental_inherent != null || 
                       data.esg_risk_social_inherent != null || 
                       data.esg_risk_governance_inherent != null;

  if (!hasRiskScores) {
    return (
      <BaseSection
        title="ESG Risk Scores"
        subtitle="Inherent and adjusted risk assessment"
        icon={<AssessmentIcon />}
        actions={
          onRerun && (
            <Tooltip title="Recalculate ESG risk scores based on current data" enterDelay={0} enterNextDelay={0}>
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
          message="No ESG risk scores have been calculated for this company."
          icon={<AssessmentIcon />}
        />
      </BaseSection>
    );
  }

  return (
    <BaseSection
      title="ESG Risk Scores"
      subtitle={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>Inherent and adjusted risk assessment (Individual: 0-10 scale, Total: 0-30 scale, higher = more risk)</span>
          <IconButton
            size="small"
            onClick={() => setInfoExpanded(!infoExpanded)}
            sx={{ p: 0.5 }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      }
      icon={<AssessmentIcon />}
      actions={
        onRerun && (
          <Tooltip title="Recalculate ESG risk scores based on current data" enterDelay={200} enterNextDelay={200}>
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
      {/* Info explanation section */}
      <Collapse in={infoExpanded}>
        <Box sx={{
          mb: 3,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          border: '1px solid #e0e0e0'
        }}>
          <Typography sx={{ fontWeight: 600, mb: 1, color: '#666666' }}>
            About ESG Risk Scores
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            <strong>Inherent Risk:</strong> The baseline ESG risk exposure based on structural factors such as industry sector, company size, geographic location, and business activities. This represents the risk level before considering any mitigation efforts.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            <strong>Adjusted Risk:</strong> The risk level after accounting for verified ESG performance initiatives. Reductions are applied only when companies demonstrate concrete actions through ESG reports (post-2022), recognized certifications (ISO 14001, SA8000, etc.), or relevant awards.
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            <strong>Why it matters:</strong> ESG risks can significantly impact long-term business sustainability, regulatory compliance, investor confidence, and stakeholder relationships. Understanding both inherent and adjusted risks helps identify where to focus improvement efforts and demonstrates the value of ESG initiatives in reducing risk exposure.
          </Typography>
        </Box>
      </Collapse>
      {/* Score Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <RiskScoreCard
            title="Environmental Risk"
            inherent={data.esg_risk_environmental_inherent}
            adjusted={data.esg_risk_environmental_adjusted}
            explanation={data.esg_risk_environmental_explanation}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <RiskScoreCard
            title="Social Risk"
            inherent={data.esg_risk_social_inherent}
            adjusted={data.esg_risk_social_adjusted}
            explanation={data.esg_risk_social_explanation}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <RiskScoreCard
            title="Governance Risk"
            inherent={data.esg_risk_governance_inherent}
            adjusted={data.esg_risk_governance_adjusted}
            explanation={data.esg_risk_governance_explanation}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <RiskScoreCard
            title="Total Risk Score"
            inherent={data.esg_risk_total_inherent}
            adjusted={data.esg_risk_total_adjusted}
            explanation="The total ESG risk score represents the cumulative risk exposure. Lower scores indicate better ESG performance and lower risk. Scores of 0-10 suggest strong ESG practices with minimal risk exposure. Scores of 11-20 indicate moderate risk requiring attention and improvement. Scores above 20 signal significant ESG risks that could impact long-term sustainability and stakeholder value. The adjusted score reflects risk mitigation through verified ESG initiatives, reports, and certifications."
            isTotal={true}
          />
        </Grid>
      </Grid>

      {/* Chart Section */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Risk Score Comparison
          </Typography>
          <IconButton
            onClick={() => setChartExpanded(!chartExpanded)}
            size="small"
          >
            {chartExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={chartExpanded}>
          <Box sx={{ height: 300, p: 2, backgroundColor: '#fafafa', borderRadius: 1 }}>
            <ESGRiskScoreChart data={data} />
          </Box>
        </Collapse>
      </Box>


    </BaseSection>
  );
};

export default ESGRiskScoreSection;
