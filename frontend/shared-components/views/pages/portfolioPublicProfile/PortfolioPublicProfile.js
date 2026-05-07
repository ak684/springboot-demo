import React, { memo, useEffect, useState } from 'react';
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PortfolioPublicProfileTabs from "./containers/PortfolioPublicProfileTabs";
import Button from "@mui/material/Button";
import useModal from "shared-components/hooks/useModal";
import { publicProfileSelectors, publicProfileThunks } from "store/ducks/publicProfile";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from "@mui/icons-material/Settings";
import { portfolioSelectors } from "store/ducks/portfolio";
import PortfolioPublicProfileSettingsDrawer from "./settings/PortfolioPublicProfileSettingsDrawer";
import { appSelectors } from "store/ducks/app";
import { sortedPublicVentures } from "shared-components/utils/venture";
import { clone } from "shared-components/utils/lo";
import Loader from "../../components/Loader";
import PublicProfileShareModal from "../../components/publicProfile/PublicProfileShareModal";

const PortfolioPublicProfile = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, openShareModal, closeShareModal] = useModal();
  const [tab, setTab] = useState('summary');
  const { portfolioId } = useParams();
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const dispatch = useDispatch();
  const publicPortfolio = useSelector(publicProfileSelectors.getPublicPortfolio(portfolioId));
  const ventures = useSelector(publicProfileSelectors.getPortfolioVentures());
  const venturesLoading = useSelector(publicProfileSelectors.portfolioVenturesLoading());
  const allVentures = useSelector(publicProfileSelectors.getPortfolioVenturesAll());
  const publicSort = useSelector(appSelectors.getPublicSort());
  const sortedVentures = sortedPublicVentures(clone(ventures), publicSort);
  const period = useSelector(appSelectors.getPublicPeriod());

  useEffect(() => {
    if (portfolioId) {
      dispatch(publicProfileThunks.fetchPublicPortfolio(portfolioId));
      // toDO: Load all ventures only if user is logged in and has access to editing portfolio
      dispatch(publicProfileThunks.fetchPortfolioVenturesAll(portfolioId));
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolioId) {
      dispatch(publicProfileThunks.fetchPortfolioVentures({ id: portfolioId, period }));
    }
  }, [period, portfolioId]);

  if (!publicPortfolio || venturesLoading) {
    return <Loader />
  }

  return (
    <Box>
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        gap={2}
        px={{ xs: 3, lg: 12 }}
        py={4}
        mx='auto'
        maxWidth={1280}
      >
        <Box display='flex' gap={{ xs: 2, sm: 3 }}>
          {portfolio.logo && (
            <Box
              component='img'
              src={portfolio.logo}
              alt={portfolio.name}
              width={{ xs: 72, sm: 112 }}
              height={{ xs: 72, sm: 112 }}
              sx={{ objectFit: 'cover', borderRadius: '8px' }}
            />
          )}
          <Box display='flex' flexDirection='column' gap={1.5}>
            <Typography variant='h3'>{portfolio.name}</Typography>
            {portfolio.description && <Typography variant='body'>{portfolio.description}</Typography>}
          </Box>
        </Box>
      </Box>
      <PortfolioPublicProfileTabs portfolio={publicPortfolio} tab={tab} setTab={setTab} ventures={sortedVentures} />
      <PortfolioPublicProfileSettingsDrawer
        portfolio={portfolio}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tab={tab}
        setTab={setTab}
        ventures={allVentures}
      />
      <Box position='fixed' top='calc(50% - 40px)' right={32} display='flex' flexDirection='column' gap={2}>
        <Button variant='outlined' sx={{ p: 1, minWidth: 0, minHeight: 0 }} onClick={openShareModal}>
          <OpenInNewIcon />
        </Button>
        <Button variant='outlined' sx={{ p: 1, minWidth: 0, minHeight: 0 }} onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </Button>
      </Box>
      <PublicProfileShareModal open={shareOpen} onClose={closeShareModal} company={portfolio} isPortfolio />
    </Box>
  );
};

export default memo(PortfolioPublicProfile);
