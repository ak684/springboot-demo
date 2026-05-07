import theme from "../theme";

export default {
  xAxis: {
    data: [],
  },
  yAxis: {
    splitLine: { show: false },
    splitNumber: 2,
  },
  series: [
    {
      name: 'Outcome for the specific year',
      data: [],
      type: 'bar',
      stack: 'x',
      itemStyle: { color: theme.palette.primary.main }
    },
    {
      name: 'Continued outcome for past year(s)',
      data: [],
      type: 'bar',
      stack: 'x',
      itemStyle: { color: theme.palette.secondary.main }
    }
  ],
  grid: {
    x: 0,
    y: 32,
    x2: 0,
    y2: 0,
    containLabel: true,
  },
  tooltip: {
    show: true,
    trigger: 'axis',
  },
  legend: {
    show: true,
    top: 0,
    itemWidth: 8,
    itemHeight: 8,
    textStyle: {
      fontSize: 9,
      lineHeight: 1.2
    }
  }
};
