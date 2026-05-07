import React, { memo } from 'react';
import DashboardChartCard from "../components/DashboardChartCard";
import moment from "moment";
import { Box, styled, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/areaChart";
import { MONTHS } from "shared-components/utils/constants";
import useChart from "shared-components/hooks/useChart";
import smartRound from "shared-components/filters/smartRound";
import { arrayCumulative } from "shared-components/utils/helpers";
import { dataFilled, getForecastForYear, getMonthlyActualForYear } from "shared-components/utils/quantification";

const StyledChartCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  border: `1px solid ${theme.palette.border}`,
}));

const getChartData = (impacts) => {
  const config = clone(chartConfig);
  let totalScore = 0;
  const year = moment().year();
  const impactCompletions = [];

  impacts.forEach(impact => {
    const indicatorCompletions = [];
    const impactScore = impact.scoring.at(-1).score;

    impact.indicators.forEach((indicator) => {
      const totalForecast = getForecastForYear(impact, indicator, year);

      if (totalForecast > 0) {
        const monthlyActual = getMonthlyActualForYear(impact, indicator, year);
        indicatorCompletions.push(MONTHS.map((_, index) => monthlyActual[index] / totalForecast * 100 || 0));
      }
    });

    if (indicatorCompletions.length > 0) {
      impactCompletions.push(
        indicatorCompletions[0].map((_, index) =>
          indicatorCompletions.reduce((acc, curr) => acc + curr[index], 0) / indicatorCompletions.length * impactScore
        )
      );
      totalScore += impactScore;
    }
  });

  const completionValues = (impactCompletions[0] || []).map((_, index) =>
    smartRound(impactCompletions.reduce((acc, curr) => acc + curr[index], 0) / totalScore)
  );
  const chartData = arrayCumulative(completionValues);
  config.series[0].data = chartData.slice(0, moment().month() + 1);

  return config;
};

const DashboardOutcomeOverTime = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const theme = useTheme();
  const navigate = useNavigate();
  const year = moment().year();
  const impacts = venture.impacts
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .filter(i =>
      dataFilled(i.productsData.find(d => d.year === year)) ||
      dataFilled(i.productsDataActual.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersData.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersDataActual.find(d => d.year === year))
    );

  useChart('outcome-area-chart', getChartData, true, impacts);

  return (
    <DashboardChartCard
      title={`Total outcome over time ${year}`}
      type='actual'
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => navigate(`/ventures/${ventureId}/monitoring-overview`)}
    >
      <StyledChartCard>
        <Box id='outcome-area-chart' height={146} width='100%' />
      </StyledChartCard>
    </DashboardChartCard>
  );
};

export default memo(DashboardOutcomeOverTime);
