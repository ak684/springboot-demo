import React, { memo, useRef } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { appActions } from "../../store/ducks/app";
import OnboardingTooltip from "./OnboardingTooltip";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(() => ({
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100000,
}));

const AppOnboardingScreen = ({ name, title, subtitle, hole, tooltip }) => {
  const dispatch = useDispatch();
  const holeRef = useRef();

  const onClose = () => {
    dispatch(appActions.closeOnboarding());
    sessionStorage.setItem(name, true);
  }

  const tooltipClosed = () => {
    dispatch(appActions.closeOnboarding());
  }

  return (
    <CustomErrorBoundary>
      <StyledWrapper onClick={onClose}>
        <OnboardingTooltip open position={hole} {...tooltip} onClose={tooltipClosed} />
        <Box
          position='absolute'
          boxShadow='0 0 0 9999px #45A6FFE6'
          borderRadius='8px'
          ref={holeRef}
          {...hole}
          zIndex={1}
        />
        <Box align='center' color='white' maxWidth={550} zIndex={2}>
          {title && <Typography variant='h3' sx={{ mb: 4 }}>{title}</Typography>}
          {subtitle && <Typography variant='body'>{subtitle}</Typography>}
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(AppOnboardingScreen);
