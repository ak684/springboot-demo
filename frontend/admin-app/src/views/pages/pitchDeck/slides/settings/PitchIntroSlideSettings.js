import React, { memo } from 'react';
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import PitchSettingsDefaultImage from "../../components/PitchSettingsDefaultImage";
import TextInput from "shared-components/views/form/TextInput";
import PitchImageUpload from "shared-components/views/components/pitchDeck/PitchImageUpload";

const BooleanSettingsChange = ({ settings, updateBoolSetting, name, label }) => (
  <Box>
    <FormControlLabel
      control={
        <Checkbox
          checked={settings[name]}
          onChange={(e) => updateBoolSetting(e.target.checked, name)}
        />
      }
      label={label}
    />
  </Box>
);

const PitchIntroSlideSettings = ({ venture, setUpdatedVenture }) => {
  const settings = venture.pitchSettings;

  const updateVentureName = (e) => {
    setUpdatedVenture({ ...venture, name: e.target.value });
  }

  const updateSettingsProp = (name, newValue) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, [name]: newValue } });
  }

  const updateBoolSetting = (value, name) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, [name]: value } });
  }

  return (
    <Box p={2}>
      <TextInput
        label='Name'
        placeholder='Name'
        value={venture.name}
        onChange={updateVentureName}
        inputProps={{ maxLength: 250 }}
        letterCounter
        fullWidth
      />
      <TextInput
        label='Title'
        placeholder='Title'
        value={settings.introSubtitle || ''}
        onChange={(e) => updateSettingsProp('introSubtitle', e.target.value)}
        inputProps={{ maxLength: 250 }}
        letterCounter
        fullWidth
      />
      {venture.website && (
        <BooleanSettingsChange
          name='showWebsite'
          label='Show website address'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.instagram && (
        <BooleanSettingsChange
          name='showInstagram'
          label='Show Instagram'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.twitter && (
        <BooleanSettingsChange
          name='showTwitter'
          label='Show Twitter'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.linkedin && (
        <BooleanSettingsChange
          name='showLinkedin'
          label='Show LinkedIn'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.youtube && (
        <BooleanSettingsChange
          name='showYoutube'
          label='Show YouTube'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.facebook && (
        <BooleanSettingsChange
          name='showFacebook'
          label='Show Facebook'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      {venture.certification >= 1 && (
        <BooleanSettingsChange
          name='showCertification'
          label='Show certification badge'
          settings={settings}
          updateBoolSetting={updateBoolSetting}
        />
      )}
      <PitchSettingsDefaultImage mt={1} name='introImage' updateSettings={updateSettingsProp} />
      <Box display='flex' alignItems='center' mt={2}>
        <Box flexGrow={1} height='1px' backgroundColor='border' />
        <Typography sx={{ px: 2 }} variant='captionBold'>OR</Typography>
        <Box flexGrow={1} height='1px' backgroundColor='border' />
      </Box>
      <PitchImageUpload
        showLabel={false}
        mt={2}
        image={venture.pitchSettings.introImage}
        updateImage={(link) => updateSettingsProp('introImage', link)}
        clearImage={() => updateSettingsProp('introImage', null)}
      />
    </Box>
  );
};

export default memo(PitchIntroSlideSettings);
