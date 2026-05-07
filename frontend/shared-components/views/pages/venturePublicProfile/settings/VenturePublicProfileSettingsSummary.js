import React, { memo, useState } from 'react';
import { Box, IconButton, Link } from "@mui/material";
import { pitchThunks } from "store/ducks/pitch";
import { useDispatch } from "react-redux";
import TextInput from "../../../form/TextInput";
import { getVentureAddress } from "shared-components/utils/venture";
import EditIcon from "@mui/icons-material/Edit";
import GptRegenerateButton from "../../../components/pitchDeck/GptRegenerateButton";
import PitchImageUpload from "../../../components/pitchDeck/PitchImageUpload";
import GptTooltipLabel from "../../../components/pitchDeck/GptTooltipLabel";
import FieldLabel from "../../../components/FieldLabel";
import Loader from "../../../components/Loader";

const VenturePublicProfileSettingsSummary = ({ venture, setUpdatedVenture }) => {
  const [loadedProp, setLoadedProp] = useState(null);
  const dispatch = useDispatch();

  const updateVentureProp = (name, newValue) => {
    setUpdatedVenture({ ...venture, [name]: newValue });
  }

  const updateSettingsProp = (name, newValue) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, [name]: newValue } });
  }

  const regenerateText = (name, setter) => {
    setLoadedProp(name);
    dispatch(pitchThunks.regenerateGptText({ venture, name }))
      .then(res => {
        setter(name, res.payload);
      })
      .finally(() => {
        setLoadedProp(null);
      });
  }

  return (
    <Box p={3}>
      <GptTooltipLabel label='About' />
      <Box display='flex' alignItems='center' gap={2}>
        <TextInput
          placeholder='About'
          value={venture.pitchSettings.description || ''}
          onChange={(e) => updateSettingsProp('description', e.target.value)}
          multiline
          fullWidth
        />
        {
          loadedProp === 'description'
            ? <Loader p={1} size={24} />
            : <GptRegenerateButton onClick={() => regenerateText('description', updateSettingsProp)} />
        }
      </Box>
      <PitchImageUpload
        my={3}
        image={venture.pitchSettings.descriptionImage}
        updateImage={(link) => updateSettingsProp('descriptionImage', link)}
        clearImage={() => updateSettingsProp('descriptionImage', null)}
      />
      <Box mt={2}>
        <FieldLabel>Our mission</FieldLabel>
        <TextInput
          placeholder='Our mission'
          value={venture.description || ''}
          onChange={(e) => updateVentureProp('description', e.target.value)}
          multiline
          fullWidth
        />
      </Box>
      <Box mt={3} display='flex' alignItems='flex-end' gap={2}>
        <TextInput
          label='Our headquarters'
          placeholder='Our headquarters'
          value={getVentureAddress(venture) || ''}
          disabled
          fullWidth
        />
        <IconButton component={Link} target='_blank' href={`/ventures/${venture.id}/profile-wizard?goto=address`}>
          <EditIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default memo(VenturePublicProfileSettingsSummary);
