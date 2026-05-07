import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import * as echarts from 'echarts';

const ESGMaterialityChart = ({ esgData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!esgData || !esgData.topics || esgData.topics.length === 0) {
      return;
    }

    // Initialize chart
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Prepare data for the chart
    const chartData = prepareChartData(esgData.topics);

    // Calculate dynamic axis ranges based on actual data
    const axisRanges = calculateAxisRanges(esgData.topics);

    // Chart configuration
    const option = {
      title: [
        {
          text: 'ESG Materiality Matrix Prioritization View',
          left: 'center',
          top: 20,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333'
          }
        },
        {
          text: 'Chart axes are dynamically scaled based on actual score ranges to optimize visualization',
          left: 'center',
          top: 45,
          textStyle: {
            fontSize: 11,
            color: '#666',
            fontStyle: 'italic'
          }
        }
      ],
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const data = params.data;
          return `
            <div style="padding: 8px;">
              <strong>${data.name}</strong><br/>
              <span style="color: ${data.itemStyle.color};">●</span> ${data.category}<br/>
              Stakeholder Importance: ${data.stakeholder_importance}<br/>
              Business Importance: ${data.business_importance}
            </div>
          `;
        }
      },
      legend: {
        data: ['Environmental', 'Social', 'Governance'],
        bottom: 10,
        itemGap: 30,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: 80,
        right: 50,
        top: 100,
        bottom: 80,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'High Importance to Business',
        nameLocation: 'middle',
        nameGap: 30,
        min: axisRanges.business.min,
        max: axisRanges.business.max,
        interval: axisRanges.business.interval,
        axisLine: {
          lineStyle: {
            color: '#666'
          }
        },
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e0e0e0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'High Importance to Stakeholder',
        nameLocation: 'middle',
        nameGap: 50,
        min: axisRanges.stakeholder.min,
        max: axisRanges.stakeholder.max,
        interval: axisRanges.stakeholder.interval,
        axisLine: {
          lineStyle: {
            color: '#666'
          }
        },
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e0e0e0',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Environmental',
          type: 'scatter',
          data: chartData.environmental,
          symbolSize: 22,
          itemStyle: {
            color: '#4caf50'
          },
          label: {
            show: false
          }
        },
        {
          name: 'Social',
          type: 'scatter',
          data: chartData.social,
          symbolSize: 22,
          itemStyle: {
            color: '#2196f3'
          },
          label: {
            show: false
          }
        },
        {
          name: 'Governance',
          type: 'scatter',
          data: chartData.governance,
          symbolSize: 22,
          itemStyle: {
            color: '#ff9800'
          },
          label: {
            show: false
          }
        }
      ]
    };

    // Set chart option
    if (chartInstance.current) {
      chartInstance.current.setOption(option);
    }

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [esgData]);

  const calculateAxisRanges = (topics) => {
    if (!topics || topics.length === 0) {
      return {
        stakeholder: { min: 0, max: 10, interval: 2 },
        business: { min: 0, max: 10, interval: 2 }
      };
    }

    // Extract all stakeholder and business importance values
    const stakeholderValues = topics.map(topic => parseInt(topic.stakeholder_importance) || 0);
    const businessValues = topics.map(topic => parseInt(topic.business_importance) || 0);

    // Calculate min and max for each axis
    const stakeholderMin = Math.min(...stakeholderValues);
    const stakeholderMax = Math.max(...stakeholderValues);
    const businessMin = Math.min(...businessValues);
    const businessMax = Math.max(...businessValues);

    // Create smart ranges that provide good visual separation
    const createAxisRange = (min, max) => {
      const range = max - min;

      // If all values are the same, create a small range around that value
      if (range === 0) {
        const center = min;
        return {
          min: Math.max(0, center - 1),
          max: Math.min(10, center + 1),
          interval: 1
        };
      }

      // If range is small (1-2), add padding to show more context
      if (range <= 2) {
        const padding = 1;
        return {
          min: Math.max(0, min - padding),
          max: Math.min(10, max + padding),
          interval: 1
        };
      }

      // For larger ranges, use the actual range with minimal padding
      const padding = Math.max(1, Math.ceil(range * 0.1)); // 10% padding
      return {
        min: Math.max(0, min - padding),
        max: Math.min(10, max + padding),
        interval: Math.max(1, Math.ceil(range / 4)) // Aim for ~4-5 intervals
      };
    };

    return {
      stakeholder: createAxisRange(stakeholderMin, stakeholderMax),
      business: createAxisRange(businessMin, businessMax)
    };
  };

  const prepareChartData = (topics) => {
    const environmental = [];
    const social = [];
    const governance = [];

    // Track positions to handle overlapping points
    const positionTracker = new Map();

    topics.forEach((topic, index) => {
      const stakeholderImportance = parseInt(topic.stakeholder_importance) || 0;
      const businessImportance = parseInt(topic.business_importance) || 0;

      // Create a position key to detect overlaps
      const positionKey = `${stakeholderImportance}-${businessImportance}`;

      // If position is already taken, add slight offset
      let adjustedStakeholder = stakeholderImportance;
      let adjustedBusiness = businessImportance;

      if (positionTracker.has(positionKey)) {
        const count = positionTracker.get(positionKey);
        // Create deterministic offset pattern in a circle around the original point
        const angle = (count * 2 * Math.PI) / 8; // Distribute up to 8 points in a circle
        const radius = 0.15; // Small radius for offset
        adjustedStakeholder += Math.sin(angle) * radius;
        adjustedBusiness += Math.cos(angle) * radius;
        positionTracker.set(positionKey, count + 1);
      } else {
        positionTracker.set(positionKey, 1);
      }

      // Create short name for label (first 3 words max)
      const shortName = topic.name.split(' ').slice(0, 3).join(' ');

      const dataPoint = {
        name: topic.name,
        shortName: shortName.length > 20 ? shortName.substring(0, 17) + '...' : shortName,
        value: [adjustedBusiness, adjustedStakeholder],
        stakeholder_importance: stakeholderImportance,
        business_importance: businessImportance,
        category: topic.category,
        itemStyle: {
          color: topic.category === 'E' ? '#4caf50' :
                 topic.category === 'S' ? '#2196f3' : '#ff9800'
        }
      };

      if (topic.category === 'E') {
        environmental.push(dataPoint);
      } else if (topic.category === 'S') {
        social.push(dataPoint);
      } else if (topic.category === 'G') {
        governance.push(dataPoint);
      }
    });

    return { environmental, social, governance };
  };

  if (!esgData || !esgData.topics || esgData.topics.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No ESG materiality data available for chart visualization
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Box
        ref={chartRef}
        sx={{
          width: '100%',
          height: '500px',
          minHeight: '500px'
        }}
      />
    </Paper>
  );
};

export default ESGMaterialityChart;
