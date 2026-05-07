export default {
  xAxis: {
    type: 'time',
    minInterval: 3600 * 1000 * 24,
    axisLabel: {
      formatter: '{MMM} {d}',
      hideOverlap: true,
    },
  },
  yAxis: [{
    name: 'Value',
    type: 'value',
    splitLine: { show: false },
  }, {
    name: 'Likelihood',
    type: 'value',
    position: 'right',
    axisLabel: {
      formatter: '{value}%',
    },
    axisLine: {
      lineStyle: {
        color: '#E84747',
      }
    },
    min: 0,
    max: 100,
    splitLine: { show: false },
  }],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      name: 'Magnitude',
      color: '#4D9951',
    },
    {
      data: [],
      type: 'line',
      name: 'Likelihood (%)',
      yAxisIndex: 1,
      color: '#E84747',
    },
    {
      data: [],
      type: 'line',
      name: 'Score',
      yAxisIndex: 0,
      color: '#2568F6',
    }
  ],
  grid: {
    x: 16,
    y: 16,
    x2: 16,
    y2: 36,
    containLabel: true,
  },
  legend: {
    data: ['Magnitude', 'Likelihood (%)', 'Score'],
    bottom: 0,
  },
};
