import React, { memo, useEffect, useState } from 'react';
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import VenturePublicProfileTabs from "./containers/VenturePublicProfileTabs";
import { reportThunks } from "store/ducks/report";
import Button from "@mui/material/Button";
import useModal from "shared-components/hooks/useModal";
import VenturePublicProfileRequestDeckAccessModal from "./components/VenturePublicProfileRequestDeckAccessModal";
import { publicProfileSelectors, publicProfileThunks } from "store/ducks/publicProfile";
import VenturePublicProfileSettingsDrawer from "./settings/VenturePublicProfileSettingsDrawer";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from "@mui/icons-material/Settings";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import Loader from "../../components/Loader";
import PublicProfileShareModal from "../../components/publicProfile/PublicProfileShareModal";
import { getBranding } from 'shared-components/utils/branding';

const VenturePublicProfile = ({ mapApp }) => {
  const [pitchModalOpen, requestPitchAccess, closePitchModal] = useModal();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, openShareModal, closeShareModal] = useModal();
  const [tab, setTab] = useState('summary');
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const dispatch = useDispatch();
  const indicatorViews = useSelector(publicProfileSelectors.getIndicatorViews());
  const publicVenture = useSelector(publicProfileSelectors.getPublicVenture(ventureId));
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const companyName = getBranding().companyName;

  useEffect(() => {
    dispatch(reportThunks.fetchFollowersStatistics(7));
  }, []);

  useEffect(() => {
    if (indicatorViews.length === 0) {
      dispatch(publicProfileThunks.fetchIndicatorViews());
    }
  }, []);

  useEffect(() => {
    dispatch(publicProfileThunks.fetchPublicVenture(ventureId));
  }, []);

  if (!publicVenture) {
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
          {publicVenture.logo && (
            <Box
              component='img'
              src={publicVenture.logo}
              alt={publicVenture.name}
              width={{ xs: 72, sm: 112 }}
              height={{ xs: 72, sm: 112 }}
              sx={{ objectFit: 'cover', borderRadius: '8px' }}
            />
          )}
          <Box display='flex' flexDirection='column' gap={1.5}>
            <Typography variant='h3'>{publicVenture.name}</Typography>
            {publicVenture.description && <Typography variant='body'>{publicVenture.description}</Typography>}
            <Button color='secondary' onClick={requestPitchAccess} sx={{ alignSelf: 'flex-start' }}>
              Get deck access
            </Button>
          </Box>
        </Box>
        {publicVenture.certification > 0 && (
          <Box
            p={{ xs: 2, lg: 3 }}
            sx={{ borderRadius: '8px', border: 1, borderColor: 'border', textAlign: 'center' }}
            minWidth={150}
          >
            <Box
              component='img'
              width={{ xs: 64, lg: 82 }}
              height={{ xs: 64, lg: 82 }}
              src={`/images/certification/level${publicVenture.certification}.png`}
              alt={`${companyName} certification badge`}
              mb={1.5}
            />
            <Typography variant='subtitleBold'>Impact Venture Level: {publicVenture.certification}</Typography>
          </Box>
        )}
      </Box>
      <VenturePublicProfileTabs venture={publicVenture} tab={tab} setTab={setTab} />
      <VenturePublicProfileRequestDeckAccessModal
        open={pitchModalOpen}
        onClose={closePitchModal}
        venture={publicVenture}
      />
      {!mapApp && (
        <VenturePublicProfileSettingsDrawer
          venture={venture}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          tab={tab}
          setTab={setTab}
        />
      )}
      {!mapApp && (
        <Box position='fixed' top='calc(50% - 40px)' right={32} display='flex' flexDirection='column' gap={2}>
          <Button
            variant='outlined'
            sx={{ p: 1, minWidth: 0, minHeight: 0 }}
            onClick={openShareModal}
            disabled={access !== VENTURE_ACCESS.EDIT}
          >
            <OpenInNewIcon />
          </Button>
          <Button
            variant='outlined'
            sx={{ p: 1, minWidth: 0, minHeight: 0 }}
            onClick={() => setSettingsOpen(true)}
            disabled={access !== VENTURE_ACCESS.EDIT}
          >
            <SettingsIcon />
          </Button>
        </Box>
      )}
      {!mapApp && <PublicProfileShareModal open={shareOpen} onClose={closeShareModal} company={venture} />}
    </Box>
  );
};

export default memo(VenturePublicProfile);
