import React, { useState } from 'react';
import Header from '../common/Header';
import { Box, Fab, styled } from '@mui/material';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import ChatIcon from '@mui/icons-material/Chat';
import FeedbackDrawer from '../common/FeedbackDrawer';
import { useLocation } from "react-router-dom";
import AppOnboardingScreen from "../common/AppOnboardingScreen";
import { useSelector } from "react-redux";
import { appSelectors } from "../../store/ducks/app";
import PortfolioSidebar from "../common/PortfolioSidebar";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledActionButton = styled(Fab)(() => ({
  position: 'fixed',
  bottom: 32,
  right: 32,
}));

const Layout = ({ showSidebar, disablePadding, children }) => {
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
  const location = useLocation();
  const onboarding = useSelector(appSelectors.getOnboarding());

  return (
    <CustomErrorBoundary>
      <Box>
        <Header />
        <Box sx={{ height: HEADER_HEIGHT }} />
        {showSidebar && <PortfolioSidebar />}
        <Box
          ml={showSidebar ? 39 : 0}
          pt={disablePadding ? 0 : 4}
          pl={disablePadding || showSidebar ? 0 : 4}
          pr={disablePadding ? 0 : 4}
          pb={disablePadding ? 0 : 4}
        >
          {children}
        </Box>
        {!location.pathname.includes('pitch-deck') && !location.pathname.includes('profile') && (
          <StyledActionButton
            sx={{ width: 48, height: 48 }}
            color='primary'
            aria-label='feedback'
            onClick={() => setFeedbackDrawerOpen(true)}
          >
            <ChatIcon />
          </StyledActionButton>
        )}
        <FeedbackDrawer open={feedbackDrawerOpen} close={() => setFeedbackDrawerOpen(false)} />
        {Object.keys(onboarding).length > 0 && <AppOnboardingScreen {...onboarding} />}
      </Box>
    </CustomErrorBoundary>
  );
};

export default Layout;
