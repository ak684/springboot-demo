import React, { useEffect, useRef, memo } from "react";
import * as echarts from "echarts";
import { clone } from "shared-components/utils/lo";
import chartConfig from "./chart/countryBarChartConfig";
import { Box } from "@mui/material";

const getFlagEmoji = (countryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

const getCountryName = (countryCode) => {
  try {
    const regionName = new Intl.DisplayNames(["en"], { type: "region" }).of(
      countryCode
    );
    return regionName;
  } catch (error) {
    console.error(`Error formatting country code ${countryCode}:`, error);
    return countryCode;
  }
};

const CountryRaceBarChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;
    const chart = echarts.init(chartRef.current);

    const fetchCountryNames = async () => {
      const labelsWithFlags = await Promise.all(
        data.labels.map((code) => {
          const countryName = getCountryName(code);
          const flagEmoji = getFlagEmoji(code);
          return `${countryName} ${flagEmoji}`;
        })
      );

      const option = clone(chartConfig);
      option.yAxis.data = labelsWithFlags;
      option.series[0].data = new Array(data.datasets[0].data.length).fill(0);

      chart.setOption(option);

      const targetData = data.datasets[0].data;
      const incrementValues = new Array(targetData.length).fill(0);

      const run = () => {
        let allDataReached = true;

        for (let i = 0; i < targetData.length; ++i) {
          if (incrementValues[i] < targetData[i]) {
            const increment = Math.floor(Math.random() * 50) + 90;
            incrementValues[i] += increment;
            if (incrementValues[i] > targetData[i]) {
              incrementValues[i] = targetData[i];
            }
            allDataReached = false;
          }
        }

        option.series[0].data = [...incrementValues];
        chart.setOption(option);

        if (!allDataReached) {
          setTimeout(run, 10);
        }
      };

      run();

      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    };

    fetchCountryNames();
  }, [data]);

  return <Box ref={chartRef} sx={{ width: "100%", height: "600px" }} />;
};

export default memo(CountryRaceBarChart);
