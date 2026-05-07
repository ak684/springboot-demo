import React, { memo, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import ImpactPotentialChart from './containers/ImpactPotentialChart';
import ScoreOverTimeChart from './containers/ScoreOverTimeChart';
import BeneficiariesBySdg from './containers/BeneficiariesBySdg';
import BeneficiariesBySdgCategory from './containers/BeneficiariesBySdgCategory';
import DashboardPerformance from "./containers/DashboardPerformance";
import DashboardStatItems from "./containers/DashboardStatItems";
import DashboardOutcomeOverTime from "./containers/DashboardOutcomeOverTime";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import moment from "moment/moment";
import InternetPresenceChart from "./containers/InternetPresenceChart";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import navigation from "shared-components/utils/navigation";
import { reportSelectors, reportThunks } from "store/ducks/report";
import { arraySum } from "shared-components/utils/helpers";
import { dataFilled } from "shared-components/utils/quantification";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const Dashboard = () => {
  const [followerPeriod, setFollowerPeriod] = useState(7);
  const { ventureId } = useParams();
  const dispatch = useDispatch();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const year = moment().year();
  const quantificationFilled = venture.impacts
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .some(i =>
      dataFilled(i.productsData.find(d => d.year === year)) ||
      dataFilled(i.productsDataActual.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersData.find(d => d.year === year)) ||
      dataFilled(i.stakeholdersDataActual.find(d => d.year === year))
    );
  const followers = useSelector(reportSelectors.getFollowers());
  const totalFollowers = arraySum(followers.map(val => val.value));

  useEffect(() => {
    dispatch(reportThunks.fetchFollowersStatistics(followerPeriod));
  }, [followerPeriod]);

  return (
    <CustomErrorBoundary>
      <Box>
        <Grid container spacing={3} mb={3}>
          <DashboardStatItems />
        </Grid>
        {venture.impacts.length === 0 && (
          <Box
            height={312}
            display='flex'
            alignItems='center'
            justifyContent='center'
            backgroundColor='secondary.subtle'
            sx={{ borderRadius: '16px' }}
          >
            <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
              <Box p={2} backgroundColor='white' sx={{ borderRadius: '8px' }}>
                <Box component='img' src='/images/icons/search.svg' alt='Search icon' width={26} height={26} />
              </Box>
              <Typography variant='overline' color='secondary.main'>No impact chains yet</Typography>
              <Button startIcon={<AddIcon />} onClick={() => navigation.goToImpactCreation(ventureId)}>
                Create impact logic
              </Button>
            </Box>
          </Box>
        )}
        {venture.impacts.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Box display='flex' flexDirection='column' gap={3}>
                {quantificationFilled && <DashboardPerformance />}
                <ImpactPotentialChart />
                <BeneficiariesBySdg />
                {totalFollowers > 0 &&
                  <InternetPresenceChart period={followerPeriod} setPeriod={setFollowerPeriod} />
                }
              </Box>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Box display='flex' flexDirection='column' gap={3}>
                {quantificationFilled && <DashboardOutcomeOverTime />}
                <ScoreOverTimeChart />
                <BeneficiariesBySdgCategory />
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(Dashboard);
