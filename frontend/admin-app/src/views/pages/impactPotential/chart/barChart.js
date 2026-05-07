import theme from "shared-components/theme";

export default {
  xAxis: {
    type: 'category',
    data: [
      'Contribution',
      'Degree of\nchange',
      'Duration',
      'Previous\nevidence',
      'Problem\nimportance',
      'Proximity',
      'Size of\nstakeholders',
      'Stakeholder\nsituation'
    ],
  },
  yAxis: {
    type: 'value',
    splitLine: { show: false },
    splitNumber: 2,
  },
  series: [
    {
      data: [],
      type: 'bar',
      itemStyle: { color: theme.palette.success.main },
    }
  ],
  grid: {
    x: 0,
    y: 16,
    x2: 0,
    y2: 16,
    containLabel: true,
  },
  tooltip: {
    show: true,
    trigger: 'axis',
  },
};
