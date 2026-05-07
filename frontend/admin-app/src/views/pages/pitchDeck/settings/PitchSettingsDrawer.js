import React, { memo, useEffect, useState } from 'react';
import { Box, Divider, Drawer, styled, Tab, Tabs, Typography } from '@mui/material';
import PitchSettingsDeck from "./PitchSettingsDeck";
import Button from "@mui/material/Button";
import { clone } from "shared-components/utils/lo";
import { useDispatch } from "react-redux";
import { pitchThunks } from "store/ducks/pitch";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTab = styled(Tab)(({ theme }) => ({
  flexBasis: '50%',
  ...getTypography('subtitleBold'),
  textTransform: 'none',
}));

const PitchSettingsDrawer = ({ open, onClose, venture, step }) => {
  const [tab, setTab] = useState('deck');
  const [updatedVenture, setUpdatedVenture] = useState(clone(venture));
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setTab('deck');
      setUpdatedVenture(clone(venture));
    }
  }, [open])

  const handleSubmit = () => {
    dispatch(pitchThunks.updatePitchSettings({ venture: updatedVenture, step }));
    onClose();
  }

  const SlideSettingsComponent = step?.settings;

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 520, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
    >
      <CustomErrorBoundary>
        <Box>
          <Box p={2}>
            <Typography variant='h5'>Deck customization</Typography>
          </Box>
          <Divider />
          {step?.settings && (
            <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
              <StyledTab label='Deck' value='deck' />
              <StyledTab label='Current slide' value='slide' />
            </Tabs>
          )}
          {tab === 'deck' && <PitchSettingsDeck venture={updatedVenture} setUpdatedVenture={setUpdatedVenture} />}
          {tab === 'slide' && SlideSettingsComponent && (
            <SlideSettingsComponent
              venture={updatedVenture}
              setUpdatedVenture={setUpdatedVenture}
              impactId={step.props?.impact?.id}
            />
          )}
        </Box>
        <Box p={2} display='flex' justifyContent='flex-end' gap={1}>
          <Button color='secondary' onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Box>
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(PitchSettingsDrawer);
