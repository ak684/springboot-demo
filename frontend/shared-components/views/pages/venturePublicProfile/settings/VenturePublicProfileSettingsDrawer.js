import React, { memo, useEffect, useState } from 'react';
import { Box, Divider, Drawer, IconButton, styled, Typography } from '@mui/material';
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { publicProfileSelectors, publicProfileThunks } from "store/ducks/publicProfile";
import VenturePublicProfileSettingsImpacts from "./VenturePublicProfileSettingsImpacts";
import VenturePublicProfileSettingsSummary from "./VenturePublicProfileSettingsSummary";
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import VenturePublicProfileSettingsFinancials from "./VenturePublicProfileSettingsFinancials";
import VenturePublicProfileSettingsTeam from "./VenturePublicProfileSettingsTeam";
import CloseIcon from "@mui/icons-material/Close";
import { clone } from "shared-components/utils/lo";

const StyledDrawer = styled(Drawer)(() => ({
  '.MuiBackdrop-root': {
    left: 'calc(100vw - 460px)',
  },
  '.MuiPaper-root': {
    width: 460,
  },
  '.MuiDrawer-root': {
    left: 900,
  }
}));

const tabs = [
  { name: 'summary', label: 'Summary' },
  { name: 'impacts', label: 'Impact details' },
  { name: 'financials', label: 'Impact enablers' },
  { name: 'team', label: 'Team' },
];

const VenturePublicProfileSettingsDrawer = ({ open, onClose, venture, tab, setTab }) => {
  const [updatedVenture, setUpdatedVenture] = useState(clone(venture));
  const dispatch = useDispatch();
  const indicatorViews = useSelector(publicProfileSelectors.getIndicatorViews());

  useEffect(() => {
    if (open) {
      setTab(tab);
      setUpdatedVenture(clone(venture));
    }
  }, [open]);

  useEffect(() => {
    if (indicatorViews.length === 0) {
      dispatch(publicProfileThunks.fetchIndicatorViews());
    }
  }, []);

  const handleSubmit = () => {
    dispatch(publicProfileThunks.updateVenturePublicSettings(updatedVenture));
    onClose();
  }

  const nextTab = () => {
    const tabIndex = tabs.findIndex(t => t.name === tab);
    if (tabIndex < tabs.length - 1) {
      setTab(tabs[tabIndex + 1].name);
    }
  }

  const previousTab = () => {
    const tabIndex = tabs.findIndex(t => t.name === tab);
    if (tabIndex > 0) {
      setTab(tabs[tabIndex - 1].name);
    }
  }

  return (
    <StyledDrawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, left: 'calc(100vw - 460px)' }}
      ModalProps={{ disableScrollLock: true }}
    >
      <Box>
        <Box p={2} display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5'>Public profile customization</Typography>
          <IconButton onClick={onClose}><CloseIcon sx={{ color: 'text.primary' }} /></IconButton>
        </Box>
        <Divider />
        <Box display='flex' alignItems='center' gap={1} p={2}>
          <IconButton onClick={previousTab}><ArrowBackOutlinedIcon sx={{ color: 'text.primary' }} /></IconButton>
          <Typography sx={{ flexGrow: 1 }} variant='bodyBold' align='center'>
            {tabs.find(t => t.name === tab).label}
          </Typography>
          <IconButton onClick={nextTab}><ArrowForwardOutlinedIcon sx={{ color: 'text.primary' }} /></IconButton>
        </Box>
        {tab === "summary" &&
          <VenturePublicProfileSettingsSummary venture={updatedVenture} setUpdatedVenture={setUpdatedVenture} />
        }
        {tab === "impacts" &&
          <VenturePublicProfileSettingsImpacts venture={updatedVenture} setUpdatedVenture={setUpdatedVenture} />
        }
        {tab === "financials" &&
          <VenturePublicProfileSettingsFinancials venture={updatedVenture} setUpdatedVenture={setUpdatedVenture} />
        }
        {tab === "team" &&
          <VenturePublicProfileSettingsTeam company={updatedVenture} setUpdatedVenture={setUpdatedVenture} />
        }
      </Box>
      <Box p={2} display='flex' justifyContent='flex-end' gap={1}>
        <Button color='secondary' onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </Box>
    </StyledDrawer>
  );
};

export default memo(VenturePublicProfileSettingsDrawer);
