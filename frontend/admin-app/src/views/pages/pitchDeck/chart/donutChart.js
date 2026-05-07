export default {
  tooltip: {
    trigger: 'item'
  },
  series: [{
    type: 'pie',
    radius: ['65%', '90%'],
    label: {
      show: false,
    },
    emphasis: {
      label: {
        show: false,
      }
    },
    labelLine: {
      show: false,
    },
    data: []
  }]
};
