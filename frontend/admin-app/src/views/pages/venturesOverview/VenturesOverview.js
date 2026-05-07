import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import VenturesOverviewBubble from "./containers/VenturesOverviewBubble";
import VenturesOverviewFilter from "./containers/VenturesOverviewFilter";
import VenturesOverviewMagnitude from "./containers/VenturesOverviewMagnitude";
import VenturesOverviewLikelihood from "./containers/VenturesOverviewLikelihood";
import { useParams } from "react-router-dom";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const VenturesOverview = () => {
  const { portfolioId } = useParams();
  const dispatch = useDispatch();
  const ventures = useSelector(portfolioSelectors.getPortfolioVentures()).map(v => v.venture);

  const [selected, setSelected] = useState(ventures);
  const [showDetails, setShowDetails] = useState(true);
  const [dataPopulated, setDataPopulated] = useState(false);

  useEffect(() => {
    dispatch(portfolioThunks.fetchPortfolioVentures(portfolioId));
  }, []);

  useEffect(() => {
    if (ventures.length > 0 && !dataPopulated) {
      setSelected(ventures);
      setDataPopulated(true);
    }
  }, [ventures]);

  return (
    <CustomErrorBoundary>
      <Box>
        <Typography variant='h4' sx={{ mb: 2 }}>Ventures overview</Typography>
        <Grid container spacing={3}>
          <Grid item width={300}>
            <Box display='flex' flexDirection='column' gap={3}>
              <VenturesOverviewMagnitude selected={selected} />
              <VenturesOverviewLikelihood selected={selected} />
            </Box>
          </Grid>
          <Grid item xs>
            <VenturesOverviewBubble ventures={ventures} selected={selected} showDetails={showDetails} />
          </Grid>
          <Grid item width={showDetails ? 470 : 300}>
            <VenturesOverviewFilter
              ventures={ventures}
              selected={selected}
              setSelected={setSelected}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
            />
          </Grid>
        </Grid>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(VenturesOverview);
