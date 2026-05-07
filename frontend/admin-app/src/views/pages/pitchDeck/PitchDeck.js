import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box, styled } from "@mui/material";
import PitchSlides from "./components/PitchSlides";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import queryString from "query-string";
import { getSteps } from "./data/steps";
import { isDefined } from "shared-components/utils/lo";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import PitchNavigation from "./components/PitchNavigation";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import PitchSettingsDrawer from "./settings/PitchSettingsDrawer";
import { pitchSelectors, pitchThunks } from "store/ducks/pitch";
import useModal from "shared-components/hooks/useModal";
import PitchShareModal from "./components/PitchShareModal";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box, { shouldForwardProp: prop => prop !== 'clientView' })(({ clientView }) => ({
  display: 'flex',
  minHeight: clientView ? '100vh' : `calc(100vh - ${HEADER_HEIGHT}px)`,
  height: '100%',
}));

const PitchDeck = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, openShareModal, closeShareModal] = useModal();
  const { ventureId, uuid } = useParams();
  const dispatch = useDispatch();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const pitchId = venture?.pitchSettings.pitchId || uuid;
  const pitchVenture = useSelector(pitchSelectors.getPitchVenture(pitchId));
  const pitchVentureLoading = useSelector(pitchSelectors.pitchVentureLoading(pitchId));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (ventureId) {
      dispatch(pitchThunks.fetchPitchVentureAuth(ventureId));
      dispatch(pitchThunks.fetchIndicatorViews());
    } else if (uuid) {
      dispatch(pitchThunks.fetchPitchVenture(pitchId));
    }
  }, []);

  const step = Number(queryString.parse(location.search).step);
  const stepComponents = useMemo(getSteps(pitchVenture), [pitchVenture]);
  const StepComponent = stepComponents[step]?.component;

  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const nextStep = () => {
    setStep(step + 1);
  };

  const previousStep = () => {
    setStep(step - 1);
  };

  const goToStep = (name) => {
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStep(stepIndex);
  };

  useEffect(() => {
    if (pitchVenture && (isNaN(step) || step < 0 || step >= stepComponents.length || !isDefined(step))) {
      setStep(0);
    }
  }, [pitchVenture, step]);

  if (isNaN(step) || pitchVentureLoading || !pitchVenture) {
    return <Loader />;
  }

  const clientView = !!uuid;
  return (
    <CustomErrorBoundary>
      <StyledWrapper clientView={clientView}>
        <PitchSlides
          step={step}
          steps={stepComponents}
          goToStep={goToStep}
          venture={pitchVenture}
          clientView={clientView}
        />
        <Box flexGrow={1}>
          {StepComponent && (
            <StepComponent
              key={step}
              {...stepComponents[step]?.props}
              venture={pitchVenture}
              clientView={clientView}
              goToStep={goToStep}
            />
          )}
        </Box>
        <PitchNavigation
          step={step}
          previous={previousStep}
          next={nextStep}
          last={step >= stepComponents.length - 1}
          openShare={openShareModal}
          openSettings={() => setSettingsOpen(true)}
          clientView={clientView}
        />
        {!clientView && (
          <PitchSettingsDrawer
            venture={venture}
            step={stepComponents[step]}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {!clientView && (
          <PitchShareModal
            open={shareOpen}
            onClose={closeShareModal}
            venture={venture}
          />
        )}
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(PitchDeck)
