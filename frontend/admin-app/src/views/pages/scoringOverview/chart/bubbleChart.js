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
    scale: true,
    min: function (value) {
      const spread = Math.abs(value.max - value.min) || Math.abs(value.min || 10) * 0.2;
      const candidate = value.min - spread * 0.1;
      return candidate < 0 ? candidate : 0;
    },
    max: function (value) {
      const spread = Math.abs(value.max - value.min) || Math.abs(value.max || 10) * 0.2;
      return value.max + spread * 0.1;
    },
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
    min: function (value) {
      const spread = Math.abs(value.max - value.min) || Math.abs(value.min || 10) * 0.2;
      const candidate = value.min - spread * 0.1;
      return candidate < 0 ? candidate : 0;
    },
    max: function (value) {
      const spread = Math.abs(value.max - value.min) || Math.abs(value.max || 10) * 0.2;
      return value.max + spread * 0.1;
    },
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
};
