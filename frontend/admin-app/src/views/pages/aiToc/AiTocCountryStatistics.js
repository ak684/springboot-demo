import React, { useEffect, useState } from "react";
import CountryRaceBarChart from "./CountryRaceBarChart";
import AiMetricsColumnChart from "./AiMetricsColumnChart";
import api from "services/api";
import { Box, Divider, Typography } from "@mui/material";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AiTocCountryStatistics = () => {
  const [loadingCountryRace, setLoadingCountryRace] = useState(true);
  const [loadingAiMetrics, setLoadingAiMetrics] = useState(true);

  const [datas, setDatas] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [accumulatedDatas, setAccumulatedDatas] = useState([]);
  const [since, setSince] = useState(null);
  const [dailyData, setDailyData] = useState({});

  useEffect(() => {
    api.get("/ai-toc/daily").then((response) => {
      const data = response.data;
      const transformedDatas = Object.entries(data).map(([key, value]) => ({
        ff: key.split(",")[1].trim(),
        cc: value,
      }));

      setDailyData(transformedDatas);
      setLoadingAiMetrics(false);
    });

    api.get("/ai-toc/daily-race").then((response) => {
      const sinces = response.since;
      setSince(sinces);
      const transformedData = response.data.map((step) =>
        Object.entries(step).map(([country, id]) => ({
          country,
          id: Number(id),
        }))
      );
      setDatas(transformedData);
      setLoadingCountryRace(false);
    });
  }, []);

  useEffect(() => {
    if (datas.length === 0) return;

    const accumulatedData = new Map();

    datas.slice(0, currentStep + 1).forEach((stepData) => {
      stepData.forEach(({ id, country }) => {
        if (!accumulatedData.has(country)) {
          accumulatedData.set(country, 0);
        }
        accumulatedData.set(country, accumulatedData.get(country) + id);
      });
    });

    const sortedData = Array.from(accumulatedData.entries())
      .map(([country, id]) => ({ country, id }))
      .sort((a, b) => b.id - a.id);
    setAccumulatedDatas(sortedData);

    if (currentStep === datas.length - 1) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setCurrentStep((prevStep) => prevStep + 1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [datas, currentStep]);

  if (datas.length === 0) {
    return <Loader />;
  }

  const chartData = {
    labels: accumulatedDatas.map((item) => item.country),
    datasets: [
      {
        label: "Country IDs",
        data: accumulatedDatas.map((item) => item.id),
        backgroundColor: "#2467F6",
        borderColor: "#2467F6",
        borderWidth: 1,
      },
    ],
  };

  return (
    <CustomErrorBoundary>
      <Box>
        <Box
          p={2}
          sx={{
            border: 1,
            borderColor: "border",
            borderRadius: "16px",
            height: "500px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#555",
            },
          }}
        >
          <Typography variant="h5" sx={{ textAlign: "left" }}>
            AI metrics generated since {since} by countries
          </Typography>
          <Divider flexItem />
          {loadingCountryRace && <Loader />}
          {!loadingCountryRace && <CountryRaceBarChart data={chartData} />}
        </Box>
        <br />
        <Box
          p={2}
          sx={{ border: 1, borderColor: "border", borderRadius: "16px" }}
        >
          <Typography variant="h5" sx={{ textAlign: "left" }}>
            AI metrics generated since {since}
          </Typography>
          <Divider flexItem />
          {loadingAiMetrics && <Loader />}
          {!loadingAiMetrics && <AiMetricsColumnChart data={dailyData} />}
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default AiTocCountryStatistics;
