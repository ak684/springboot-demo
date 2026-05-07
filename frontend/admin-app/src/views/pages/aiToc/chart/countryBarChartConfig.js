export default {
  textStyle: {
    fontFamily: "Inter, Noto Color Emoji"
  },
  grid: {
    top: 10,
    bottom: 30,
    left: 160,
    right: 80
  },
  xAxis: {
    max: "dataMax",
  },
  yAxis: {
    type: "category",
    inverse: true,
    animationDuration: 0,
    animationDurationUpdate: 200,
    max: 11,
    axisLabel: {
      fontWeight: "bold",
      fontSize: 15,
    },
  },
  series: [
    {
      realtimeSort: true,
      name: "X",
      type: "bar",
      barWidth: 25,
      itemStyle: {
        color: "#2467F6",
        emphasis: {
          color: "#2467F6",
        },
      },
      label: {
        show: true,
        position: "right",
        fontWeight: "bold",
        valueAnimation: true,
      },
    },
  ],
  legend: {
    show: false,
  },
  animationDuration: 0,
  animationDurationUpdate: 3000,
  animationEasing: "linear",
  animationEasingUpdate: "linear",
};
