import React, { memo, useEffect, useState } from 'react';
import { Box, Divider, Drawer, IconButton, styled, Typography } from '@mui/material';
import Button from "@mui/material/Button";
import { clone } from "shared-components/utils/lo";
import { useDispatch } from "react-redux";
import { publicProfileThunks } from "store/ducks/publicProfile";
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CloseIcon from "@mui/icons-material/Close";
import VenturePublicProfileSettingsTeam from "../../venturePublicProfile/settings/VenturePublicProfileSettingsTeam";
import PortfolioPublicProfileSettingsVentures from "./PortfolioPublicProfileSettingsVentures";
import PortfolioPublicProfileSettingsSummary from "./PortfolioPublicProfileSettingsSummary";
import { portfolioThunks } from "store/ducks/portfolio";

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
  { name: 'ventures', label: 'Certified impact ventures' },
  { name: 'impacts', label: 'Portfolio level impact' },
  { name: 'team', label: 'Team' },
];

const PortfolioPublicProfileSettingsDrawer = ({ open, onClose, portfolio, tab, setTab, ventures }) => {
  const [updatedPortfolio, setUpdatedPortfolio] = useState(clone(portfolio));
  const [updatedVentures, setUpdatedVentures] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setTab(tab);
      setUpdatedPortfolio(clone(portfolio));
    }
  }, [open]);

  useEffect(() => {
    setUpdatedVentures(ventures);
  }, [ventures]);

  const handleSubmit = () => {
    dispatch(publicProfileThunks.updatePortfolioPublicSettings(updatedPortfolio));
    dispatch(portfolioThunks.batchUpdatePublicVisibility({ portfolioId: portfolio.id, ventures: updatedVentures }));

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
          <PortfolioPublicProfileSettingsSummary portfolio={updatedPortfolio}
            setUpdatedPortfolio={setUpdatedPortfolio} />
        }
        {["ventures", "impacts"].includes(tab) &&
          <PortfolioPublicProfileSettingsVentures
            portfolio={updatedPortfolio}
            setUpdatedPortfolio={setUpdatedPortfolio}
            ventures={updatedVentures}
            setUpdatedVentures={setUpdatedVentures}
          />
        }
        {tab === "team" &&
          <VenturePublicProfileSettingsTeam
            company={updatedPortfolio}
            setUpdatedVenture={setUpdatedPortfolio}
            isPortfolio
          />
        }
      </Box>
      <Box p={2} display='flex' justifyContent='flex-end' gap={1}>
        <Button color='secondary' onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </Box>
    </StyledDrawer>
  );
};

export default memo(PortfolioPublicProfileSettingsDrawer);
