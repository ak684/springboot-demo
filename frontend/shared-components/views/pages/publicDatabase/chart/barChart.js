export default {
  xAxis: {
    type: 'category',
    axisLabel: {}
  },
  yAxis: {
    type: 'value',
    min: 0,
    axisLabel: {
      formatter: '{value}%',
    },
  },
  series: [{
    data: [],
    type: 'bar',
    itemStyle: {},
  }],
  grid: {
    x: 0,
    y: 16,
    x2: 0,
    y2: 0,
    containLabel: true,
  },
  tooltip: {
    show: true,
  },
}
