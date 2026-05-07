export default {
  xAxis: {
    name: '5-year impact likelihood',
    nameLocation: 'middle',
    nameGap: 30,
    nameTextStyle: {
      fontSize: 14
    },
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    },
    axisLabel: {
      show: true,
      formatter: '{value}%'
    },
    min: 0,
  },
  yAxis: {
    name: '5-year impact magnitude',
    nameLocation: 'center',
    nameGap: 30,
    nameTextStyle: {
      fontSize: 14
    },
    nameRotate: 90,
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    },
    axisLabel: {
      show: true,
    },
    scale: true,
    min: 0,
  },
  series: [
    {
      data: [],
      type: 'scatter',
      symbolSize: 24,
      label: {
        show: true,
        position: 'inside',
        color: 'white',
        fontSize: 8,
        fontWeight: 700,
      },
    },
  ],
  grid: {
    x: 24,
    y: 16,
    x2: 16,
    y2: 24,
    containLabel: true,
  },
  tooltip: {
    show: true,
  }
};
