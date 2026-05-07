import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from "@mui/material";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getImpactIndex } from "shared-components/utils/impact";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import Button from "@mui/material/Button";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { AnimationContextProvider } from "../../../context/AnimationContext";
import PublicProfileImpactDetailsDrawer from "./components/PublicProfileImpactDetailsDrawer";
import { getSteps } from "./data/steps";
import { ventureSelectors } from "../../../store/ducks/venture";
import { useDispatch, useSelector } from "react-redux";
import { noteThunks } from "../../../store/ducks/note";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

// toDO: Delete this page when it is no longer needed
const PublicProfileImpactDetails = () => {
  const [stepForward, setStepForward] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const { ventureId, impactId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const impact = venture.impacts.find(i => i.id === +impactId);
  const scrollCooldown = useRef(false);

  const dispatch = useDispatch();

  useEffect(() => {
    venture.impacts.forEach((impact) => {
      impact.indicators.forEach((indicator) => {
        dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
          .then(res => {
            setPreNotes(val => ({ ...val, [indicator.id]: res.payload }));
          });
        dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
          .then(res => {
            setPostNotes(val => ({ ...val, [indicator.id]: res.payload }));
          });
      })
    })
  }, []);

  const step = Number(searchParams.get('step') || 0);
  const stepComponents = useMemo(getSteps(impact), [impact]);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const setStep = (newStep) => {
    const newParams = new URLSearchParams();
    newParams.set('step', newStep);
    setSearchParams(newParams);
  }

  const nextStep = () => {
    if (step < stepComponents.length - 1) {
      setStepForward(true);
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 0) {
      setStepForward(false);
      setStep(step - 1);
    }
  };

  const goToStep = (name) => {
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);
  };

  const handleScroll = (e) => {
    const direction = e.deltaY;

    if ((direction > 0 || direction < 0) && !scrollCooldown.current) {
      scrollCooldown.current = true;

      if (direction > 0) {
        nextStep();
      } else {
        previousStep();
      }

      setTimeout(() => {
        scrollCooldown.current = false;
      }, 1500);
    }
  };

  return (
    <CustomErrorBoundary>
      <Box>
        <Box
          position='relative'
          zIndex={1}
          px={12}
          py={8}
          height={420}
          sx={{
            backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 50.11%, rgba(0, 0, 0, 0.80) 100%), url(${impact.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          display='flex'
          flexDirection='column'
          justifyContent='space-between'
          alignItems='flex-start'
          gap={1}
          color='white'
        >
          <Button component={Link}
            color='secondary'
            to={`/public-profile/ventures/${ventureId}`}
            startIcon={<ArrowBackIcon />}>
            Back
          </Button>
          <Box>
            {impact.positive && (
              <Typography variant='subtitleBold'>
                Innovation {getImpactIndex(impact, venture.impacts)}
              </Typography>
            )}
            {!impact.positive && <NegativeImpactLabel index={getImpactIndex(impact, venture.impacts)} />}
            <Typography variant='h1' sx={{ mt: 1, maxWidth: '60%' }}>{impact.name}</Typography>
          </Box>
        </Box>
        <Box py={4} pl={8} pr={12} display='flex' alignItems='center' gap={8} onWheel={handleScroll}>
          <PublicProfileImpactDetailsDrawer impact={impact} step={step} stepName={stepName} goToStep={goToStep} />
          <Box
            flexGrow={1}
            sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 820px)` }}
            gap={4}
          >
            <AnimationContextProvider value={stepForward}>
              {StepComponent &&
                <StepComponent
                  key={step}
                  venture={venture}
                  impact={impact}
                  preNotes={preNotes}
                  postNotes={postNotes}
                  {...stepComponents[step]?.props}
                />
              }
            </AnimationContextProvider>
          </Box>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PublicProfileImpactDetails);
