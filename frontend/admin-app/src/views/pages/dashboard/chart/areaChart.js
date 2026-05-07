import theme from "shared-components/theme";

export default {
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%'
    },
    splitNumber: 3,
  },
  series: [
    {
      data: [],
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: {
        width: 3,
        color: theme.palette.primary.main,
      },
      areaStyle: {
        color: theme.palette.primary.main,
        opacity: 0.1,
      }
    }
  ],
  grid: {
    x: 40,
    y: 8,
    x2: 16,
    y2: 24,
  },
  tooltip: {
    trigger: 'axis',
    formatter: '<b>{b}</b>: {c}%'
  },
};
