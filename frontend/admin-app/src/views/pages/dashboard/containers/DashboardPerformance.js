import React, { memo } from 'react';
import DashboardChartCard from "../components/DashboardChartCard";
import moment from "moment";
import { Box, styled, Typography, useTheme } from "@mui/material";
import Card from "@mui/material/Card";
import DashboardPerformancePercentageChart from "../components/DashboardPerformancePercentageChart";
import DashboardPerformanceGaugeChart from "../components/DashboardPerformanceGaugeChart";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { dataFilled } from "shared-components/utils/quantification";
import { lineClamp } from "shared-components/utils/styles";

const StyledChartCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  flexBasis: '50%',
  border: `1px solid ${theme.palette.border}`,
}));

const DashboardPerformance = () => {
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

  return (
    <DashboardChartCard
      title={`Actual performance ${year}`}
      type='actual'
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => navigate(`/ventures/${ventureId}/monitoring-overview`)}
    >
      <Box mt={1} display='flex' gap={1}>
        <StyledChartCard>
          <Box height={30}>
            <Typography variant='caption' align='center' style={lineClamp(2)}>
              Total yearly outcome {year} achieved to date:
            </Typography>
          </Box>
          <DashboardPerformancePercentageChart impacts={impacts} />
        </StyledChartCard>
        <StyledChartCard>
          <Box height={30}>
            <Typography variant='caption' align='center' style={lineClamp(2)}>
              Monthly outcome {year} vs forecast as of {moment().format('MMMM')} {year}
            </Typography>
          </Box>
          <DashboardPerformanceGaugeChart impacts={impacts} />
        </StyledChartCard>
      </Box>
    </DashboardChartCard>
  );
};

export default memo(DashboardPerformance);
