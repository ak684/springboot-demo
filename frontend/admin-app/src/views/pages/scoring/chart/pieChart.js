import theme from "shared-components/theme";

export default {
  tooltip: {
    show: false
  },
  series: [
    {
      type: 'pie',
      radius: ['80%', '100%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
      },
      labelLine: {
        show: false
      },
      data: [],
      markPoint: {
        tooltip: { show: false },
        label: {
          show: true,
          formatter: '{b}',
        },
        data: [{
          symbol: 'circle',
          itemStyle: { color: 'transparent' },
          x: '50%',
          y: '43%',
          label: {
            color: theme.palette.text.primary,
            fontSize: 18,
            fontWeight: 600,
          },
        }, {
          symbol: 'circle',
          itemStyle: { color: 'transparent' },
          x: '50%',
          y: '60%',
          label: {
            color: theme.palette.text.secondary,
            fontSize: 14,
          },
        }],
      },
      emphasis: {
        disabled: true,
      },
    }
  ],
};
