import React, { memo, useState } from 'react';
import { Box, MenuItem } from "@mui/material";
import TextInput from "shared-components/views/form/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { pitchSelectors, pitchThunks } from "store/ducks/pitch";
import { clone } from "shared-components/utils/lo";
import Loader from "shared-components/views/components/Loader";
import GptRegenerateButton from "shared-components/views/components/pitchDeck/GptRegenerateButton";
import PitchImageUpload from "shared-components/views/components/pitchDeck/PitchImageUpload";
import GptTooltipLabel from "shared-components/views/components/pitchDeck/GptTooltipLabel";

const PitchDescriptionSlideSettings = ({ venture, setUpdatedVenture, impactId }) => {
  const dispatch = useDispatch();
  const [loadedProp, setLoadedProp] = useState(null);
  const indicatorViews = useSelector(pitchSelectors.getIndicatorViews());

  const impact = venture.impacts.find(i => i.id === impactId);

  const updateImpactProp = (name, value) => {
    const impactIndex = venture.impacts.findIndex(i => i.id === impact.id);
    venture.impacts[impactIndex][name] = value;
    setUpdatedVenture(clone(venture));
  }

  const updateIndicatorPitchView = (indicatorIndex, newValue) => {
    const newView = indicatorViews.find(v => v.name === newValue);
    const impactIndex = venture.impacts.findIndex(i => i.id === impact.id);
    venture.impacts[impactIndex].indicators[indicatorIndex].pitchView = newView;
    setUpdatedVenture(clone(venture));
  }

  const regenerateText = (name) => {
    setLoadedProp(name);
    dispatch(pitchThunks.regenerateGptText({ venture, name, impact }))
      .then(res => {
        updateImpactProp(name, res.payload);
      })
      .finally(() => {
        setLoadedProp(null);
      });
  }

  return (
    <Box p={2}>
      <GptTooltipLabel label='Description' />
      <Box display='flex' alignItems='center' gap={2}>
        <TextInput
          placeholder='Description'
          value={impact.pitchDescription || ''}
          onChange={(e) => updateImpactProp('pitchDescription', e.target.value)}
          multiline
          fullWidth
        />
        {
          loadedProp === 'pitchDescription'
            ? <Loader p={1} size={24} />
            : <GptRegenerateButton onClick={() => regenerateText('pitchDescription')} />
        }
      </Box>
      <GptTooltipLabel mt={2} label='Inspirational message' />
      <Box display='flex' alignItems='center' gap={2}>
        <TextInput
          placeholder='Inspirational message'
          value={impact.pitchInspiration || ''}
          onChange={(e) => updateImpactProp('pitchInspiration', e.target.value)}
          multiline
          fullWidth
        />
        {
          loadedProp === 'pitchInspiration'
            ? <Loader p={1} size={24} />
            : <GptRegenerateButton onClick={() => regenerateText('pitchInspiration')} />
        }
      </Box>
      <PitchImageUpload
        mt={2}
        image={impact.image}
        updateImage={(link) => updateImpactProp('image', link)}
        clearImage={() => updateImpactProp('image', null)}
      />
      <Box mt={2}>
        {impact.indicators.slice(0, 3).map((indicator, index) => (
          <TextInput
            key={indicator.id}
            select
            fullWidth
            label={`Indicator ${index + 1} view`}
            value={indicator.pitchView.name}
            onChange={(e) => updateIndicatorPitchView(index, e.target.value)}
          >
            {indicatorViews.map(view =>
              <MenuItem value={view.name} key={view.name}>
                {view[impact.positive ? 'description' : 'descriptionNegative']}
              </MenuItem>
            )}
          </TextInput>
        ))}
      </Box>
    </Box>
  );
};

export default memo(PitchDescriptionSlideSettings);
