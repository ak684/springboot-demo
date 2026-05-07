import React, { memo, useEffect, useState } from 'react';
import { Box, Button, Divider, Grid } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ImpactCard from './components/ImpactCard';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import ImpactFilter from '../../common/ImpactFilter';
import { appSelectors } from 'store/ducks/app';
import { filteredImpacts, sortedImpacts } from "shared-components/utils/impact";
import ImpactSort from '../../common/ImpactSort';
import navigation from "shared-components/utils/navigation";
import CardViewSelect from "./components/CardViewSelect";
import { IMPACT_CARD_VIEW, VENTURE_ACCESS } from "shared-components/utils/constants";
import ScoringTypeModal from "./components/ScoringTypeModal";
import useModal from "shared-components/hooks/useModal";
import AiScoringModal from "./components/AiScoringModal";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const ImpactsOverview = () => {
  const [view, setView] = useState(localStorage.getItem('card_view') || IMPACT_CARD_VIEW.DETAILED);
  const [scoringTypeModalOpen, openScoringTypeModal, closeScoringTypeModal] = useModal();
  const [aiScoringModalOpen, openAiScoringModal, closeAiScoringModal] = useModal();
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const impactFilter = useSelector(appSelectors.getImpactFilter());
  const impactSort = useSelector(appSelectors.getImpactSort());
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const location = useLocation();

  const impactCards = sortedImpacts(filteredImpacts(venture.impacts, impactFilter), impactSort).map(i => (
    <Grid item xs={12} sm={6} key={i.id}><ImpactCard impact={i} view={view} /></Grid>
  ));

  useEffect(() => {
    if (location.pathname.endsWith("scoring-wizard")) {
      openScoringTypeModal();
    }
  }, [location.pathname]);

  const openAiScoring = () => {
    closeScoringTypeModal();
    openAiScoringModal();
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <ImpactFilter />
          <Box display='flex' alignItems='center' gap={2}>
            <ImpactSort />
            <CardViewSelect view={view} setView={setView} />
            <Button
              size='small'
              startIcon={<AddIcon />}
              onClick={() => navigation.goToImpactCreation(ventureId)}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              New impact
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          {impactCards}
        </Grid>
        {scoringTypeModalOpen && <ScoringTypeModal onClose={closeScoringTypeModal} openAiScoring={openAiScoring} />}
        {aiScoringModalOpen && <AiScoringModal onClose={closeAiScoringModal} />}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactsOverview);
