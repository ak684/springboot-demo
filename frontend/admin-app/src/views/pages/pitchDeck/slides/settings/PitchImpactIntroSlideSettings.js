import React, { memo } from 'react';
import { Box } from "@mui/material";
import { clone } from "shared-components/utils/lo";
import TextInput from "shared-components/views/form/TextInput";
import PitchImageUpload from "shared-components/views/components/pitchDeck/PitchImageUpload";

const PitchImpactIntroSlideSettings = ({ venture, setUpdatedVenture, impactId }) => {
  const impact = venture.impacts.find(i => i.id === impactId);

  const updateImpactProp = (name, value) => {
    const impactIndex = venture.impacts.findIndex(i => i.id === impact.id);
    venture.impacts[impactIndex][name] = value;
    setUpdatedVenture(clone(venture));
  }

  return (
    <Box p={2}>
      <TextInput
        label='Title'
        placeholder='Title'
        value={impact.name}
        onChange={(e) => updateImpactProp('name', e.target.value)}
        inputProps={{ maxLength: 60 }}
        letterCounter
        fullWidth
      />
      <PitchImageUpload
        mt={2}
        image={impact.image}
        updateImage={(link) => updateImpactProp('image', link)}
        clearImage={() => updateImpactProp('image', null)}
      />
    </Box>
  );
};

export default memo(PitchImpactIntroSlideSettings);
