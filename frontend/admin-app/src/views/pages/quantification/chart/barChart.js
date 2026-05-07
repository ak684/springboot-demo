import theme from "shared-components/theme";

export default {
  xAxis: {
    type: 'category',
    data: [],
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
      itemStyle: { color: theme.palette.primary.main },
    }
  ],
  grid: {
    x: 0,
    y: 16,
    x2: 0,
    y2: 0,
    containLabel: true,
  },
  tooltip: {
    show: true,
    trigger: 'axis',
  },
};
