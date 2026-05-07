import React, { memo, useEffect } from 'react';
import { Box, Card, Grid, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import PortfolioDashboardSdgCategoriesChart from "./components/PortfolioDashboardSdgCategoriesChart";
import PortfolioDashboardPerformanceChart from "./components/PortfolioDashboardPerformanceChart";
import Loader from "shared-components/views/components/Loader";
import PublicDatabaseGoogleMap from "shared-components/views/pages/publicDatabase/containers/PublicDatabaseGoogleMap";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const PortfolioDashboard = () => {
  const { portfolioId } = useParams();
  const dispatch = useDispatch();
  const ventures = useSelector(portfolioSelectors.getPortfolioVentures())
    .filter(v => !v.hidden)
    .map(v => v.venture);
  const isLoading = useSelector(portfolioSelectors.portfolioVenturesLoading());

  useEffect(() => {
    dispatch(portfolioThunks.fetchPortfolioVentures(portfolioId));
  }, []);

  if (isLoading) {
    return <Loader />
  }

  return (
    <CustomErrorBoundary>
      <Box p={4}>
        <Typography variant='h3'>Dashboard</Typography>
        <Grid mt={3} container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant='subtitleBold'>Number of ventures</Typography>
              <Box
                mt={2}
                height={195}
                backgroundColor='background.default'
                display='flex'
                alignItems='center'
                justifyContent='center'
              >
                <Typography sx={{ fontSize: 56, fontWeight: 'bold' }}>{ventures.length}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <PortfolioDashboardSdgCategoriesChart ventures={ventures} />
          </Grid>
          <Grid item xs={12} sm={12} lg={8} xl={6}>
            <PublicDatabaseGoogleMap
              position='relative'
              ventures={ventures}
              height={260}
              sx={{ borderRadius: '16px', overflow: 'hidden' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <PortfolioDashboardPerformanceChart ventures={ventures} />
          </Grid>
        </Grid>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioDashboard);
