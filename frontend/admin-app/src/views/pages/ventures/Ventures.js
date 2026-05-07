import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { Box, Button, Grid, MenuItem, Typography } from '@mui/material';
import VentureCard from './components/VentureCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { userSelectors } from "store/ducks/user";
import PortfolioInvitationModal from "./components/PortfolioInvitationModal";
import SearchInput from "../../common/SearchInput";
import TextInput from "shared-components/views/form/TextInput";
import { VENTURE_SORT } from "shared-components/utils/constants";
import { getVentureTotalScore } from "shared-components/utils/scoring";
import { getVentureYtdProgress } from "shared-components/utils/quantification";
import useModal from "shared-components/hooks/useModal";
import api from "services/api";
import NeedSubscriptionModal from "./components/NeedSubscriptionModal";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const Ventures = () => {
  const [subscriptionModalOpen, needSubscription, closeSubscriptionModal, creatingNewVenture] = useModal();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ventures = useSelector(ventureSelectors.getDetailedVentures());
  const isLoading = useSelector(ventureSelectors.detailedVenturesLoading());
  const user = useSelector(userSelectors.getCurrentUser());
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(VENTURE_SORT.BY_SCORE);

  const sortedFilteredVentures = ventures
    .filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()))
    .sort((v1, v2) => {
      if (v1.active !== v2.active) {
        return v2.active - v1.active;
      } else if (user.draftVentures.includes(v1.id) !== user.draftVentures.includes(v2.id)) {
        return user.draftVentures.includes(v1.id) - user.draftVentures.includes(v2.id)
      } else if (sort === VENTURE_SORT.BY_SCORE) {
        return getVentureTotalScore(v2) - getVentureTotalScore(v1);
      } else if (sort === VENTURE_SORT.BY_LAST_EDIT) {
        return new Date(v2.lastModifiedAt) - new Date(v1.lastModifiedAt);
      } else {
        return (getVentureYtdProgress(v2.impacts) || -100) - (getVentureYtdProgress(v1.impacts) || -100);
      }
    });

  useEffect(() => {
    dispatch(ventureThunks.fetchVenturesWithDetails());
  }, []);

  const goToVenture = (venture) => {
    localStorage.setItem('currentVenture', venture.id);
    navigate(`/ventures/${venture.id}`);
  };

  const closePortfolioModal = () => {
    setSearchParams(new URLSearchParams());
  }

  const activateVenture = (venture) => {
    api.get('/ventures/subscriptionSlots')
      .then(slotsPresent => {
        if (slotsPresent) {
          dispatch(ventureThunks.activateVenture(venture.id));
        } else {
          needSubscription(false);
        }
      });
  }

  const ventureCards = sortedFilteredVentures.map(v => (
    <Grid item xs={12} sm={4} key={v.id}>
      <VentureCard
        venture={v}
        onClick={() => goToVenture(v)}
        totalVentures={ventures.length}
        invitation={v.members.some(a => a.member.id === user.id && a.status === 'INVITED')}
        activate={activateVenture}
      />
    </Grid>
  ));

  const checkSubscriptionSlots = () => {
    api.get('/ventures/subscriptionSlots')
      .then(slotsPresent => {
        if (slotsPresent) {
          navigate('/ventures/profile-wizard?step=0');
        } else {
          needSubscription(true);
        }
      });
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='h4'>My ventures</Typography>
          <Box display='flex' alignItems='center' gap={2}>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
            <Typography variant='body'>Sort by:</Typography>
            <TextInput
              select
              onChange={(e) => setSort(e.target.value)}
              value={sort}
              InputProps={{ disableUnderline: true }}
              sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
            >
              <MenuItem value={VENTURE_SORT.BY_SCORE}>IP Score</MenuItem>
              <MenuItem value={VENTURE_SORT.BY_LAST_EDIT}>Last edited</MenuItem>
              <MenuItem value={VENTURE_SORT.BY_PROGRESS}>Progress YTD</MenuItem>
            </TextInput>
            <Button onClick={checkSubscriptionSlots} startIcon={<AddIcon />} size='small'>
              New venture
            </Button>
          </Box>
        </Box>
        <Grid mt={3} container spacing={3}>
          {ventureCards}
        </Grid>
        {inviteCode &&
          <PortfolioInvitationModal open onClose={closePortfolioModal} code={inviteCode} ventures={ventures} />
        }
        {subscriptionModalOpen &&
          <NeedSubscriptionModal onClose={closeSubscriptionModal} creatingNewVenture={creatingNewVenture} />
        }
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(Ventures);
