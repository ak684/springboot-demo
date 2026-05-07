import theme from "shared-components/theme";

export default {
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '75%'],
      radius: '150%',
      min: -100,
      max: 100,
      axisLine: {
        lineStyle: {
          width: 14,
          color: [
            [0.45, theme.palette.error.light],
            [0.55, theme.palette.primary.subtle],
            [1, theme.palette.success.light]
          ]
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
      },
      splitLine: {
        show: false,
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '12%',
        width: 10,
        offsetCenter: [0, '-65%'],
        itemStyle: {
          color: theme.palette.text.primary
        }
      },
      title: {
        offsetCenter: [0, '-10%'],
        fontSize: 24
      },
      detail: {
        show: false,
      },
      data: [],
    }
  ],
}
