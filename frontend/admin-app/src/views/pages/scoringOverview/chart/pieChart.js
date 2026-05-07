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
          y: '50%',
          label: {
            color: theme.palette.text.primary,
            fontSize: 16,
            fontWeight: 600,
          },
        }],
      },
      emphasis: {
        disabled: true,
      },
    }
  ],
};
