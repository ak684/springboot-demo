import * as echarts from "echarts";

export default {
  xAxis: {
    type: "category",
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "line",
      smooth: true,
      lineStyle: {
        color: "#2467F6",
        width: 3,
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#93BCFC" },
          { offset: 1, color: "#C0E1FF" },
        ]),
        emphasis: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#93BCFC" },
            { offset: 1, color: "#C0E1FF" },
          ]),
        },
      },
      emphasis: {
        lineStyle: {
          color: "#2467F6",
          width: 3,
        },
      },
    },
  ],
};
