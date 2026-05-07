import React, { memo } from 'react';
import { Box, Checkbox, FormControlLabel, IconButton, Link, Typography } from "@mui/material";
import TextInput from "shared-components/views/form/TextInput";
import { getVentureAddress } from "shared-components/utils/venture";
import EditIcon from '@mui/icons-material/Edit';
import PitchSettingsDefaultImage from "../../components/PitchSettingsDefaultImage";
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

const PitchMissionSlideSettings = ({ venture, setUpdatedVenture }) => {
  const settings = venture.pitchSettings;

  const updateVentureProperty = (name, value) => {
    setUpdatedVenture({ ...venture, [name]: value });
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
        label='Mission'
        placeholder='Mission'
        value={venture.description || ''}
        onChange={(e) => updateVentureProperty('description', e.target.value)}
        inputProps={{ maxLength: 250 }}
        letterCounter
        fullWidth
      />
      <Box display='flex' alignItems='flex-end' gap={2}>
        <TextInput
          label='Location'
          placeholder='Location'
          value={getVentureAddress(venture) || ''}
          disabled
          fullWidth
        />
        <IconButton component={Link} target='_blank' href={`/ventures/${venture.id}/profile-wizard?goto=address`}>
          <EditIcon />
        </IconButton>
      </Box>
      <Box display='flex' alignItems='flex-end' gap={2}>
        <TextInput
          sx={{ mt: 2 }}
          label='Industry sector'
          placeholder='Industry sector'
          value={venture.industries.map(i => i.title).join(', ')}
          disabled
          fullWidth
        />
        <IconButton component={Link} target='_blank' href={`/ventures/${venture.id}/profile-wizard?goto=industries`}>
          <EditIcon />
        </IconButton>
      </Box>
      {venture.legalEntityFormed && (
        <TextInput
          sx={{ my: 2 }}
          type='number'
          label='Number of employees'
          placeholder='Number of employees'
          value={venture.employees || ''}
          onChange={(e) => updateVentureProperty('employees', e.target.value)}
          fullWidth
        />
      )}
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
      <PitchSettingsDefaultImage mt={1} name='missionImage' updateSettings={updateSettingsProp} />
      <Box display='flex' alignItems='center' mt={2}>
        <Box flexGrow={1} height='1px' backgroundColor='border' />
        <Typography sx={{ px: 2 }} variant='captionBold'>OR</Typography>
        <Box flexGrow={1} height='1px' backgroundColor='border' />
      </Box>
      <PitchImageUpload
        mt={2}
        showLabel={false}
        image={settings.missionImage}
        updateImage={(link) => updateSettingsProp('missionImage', link)}
        clearImage={() => updateSettingsProp('missionImage', null)}
      />
    </Box>
  );
};

export default memo(PitchMissionSlideSettings);
