import React, { memo } from 'react';
import { Box, MenuItem } from "@mui/material";
import TextInput from "shared-components/views/form/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { pitchSelectors, pitchThunks } from "store/ducks/pitch";
import { distinctBy } from "shared-components/utils/lo";
import Loader from "shared-components/views/components/Loader";
import PitchImageUpload from "shared-components/views/components/pitchDeck/PitchImageUpload";
import GptRegenerateButton from "shared-components/views/components/pitchDeck/GptRegenerateButton";
import GptTooltipLabel from "shared-components/views/components/pitchDeck/GptTooltipLabel";

const PitchDescriptionSlideSettings = ({ venture, setUpdatedVenture }) => {
  const settings = venture.pitchSettings;
  const dispatch = useDispatch();
  const gptTextLoading = useSelector(pitchSelectors.gptTextLoading());

  const updateVentureProperty = (name, value) => {
    setUpdatedVenture({ ...venture, [name]: value });
  }

  const updateSettingsProp = (name, newValue) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, [name]: newValue } });
  }

  const regenerateText = () => {
    dispatch(pitchThunks.regenerateGptText({ venture, name: 'description' }))
      .then(res => {
        updateSettingsProp('description', res.payload);
      });
  }

  const founders = [...venture.organization.users, ...venture.members.map(m => m.member)]
    .filter(distinctBy('id'));

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
      <GptTooltipLabel label='About' />
      <Box display='flex' alignItems='center' gap={2}>
        <TextInput
          placeholder='About'
          value={settings.description || ''}
          onChange={(e) => updateSettingsProp('description', e.target.value)}
          multiline
          fullWidth
        />
        {gptTextLoading ? <Loader p={1} size={24} /> : <GptRegenerateButton onClick={regenerateText} />}
      </Box>
      <TextInput
        select
        fullWidth
        label='Founder'
        value={settings.founder?.id || ''}
        onChange={(e) => updateSettingsProp('founder', founders.find(f => f.id === e.target.value))}
      >
        {founders.map(user => <MenuItem value={user.id} key={user.id}>{user.name} {user.lastName}</MenuItem>)}
      </TextInput>
      <PitchImageUpload
        mt={2}
        image={venture.pitchSettings.descriptionImage}
        updateImage={(link) => updateSettingsProp('descriptionImage', link)}
        clearImage={() => updateSettingsProp('descriptionImage', null)}
      />
    </Box>
  );
};

export default memo(PitchDescriptionSlideSettings);
