import React, { memo, useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Checkbox, Collapse, Divider, FormControlLabel } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import IconButton from "@mui/material/IconButton";
import { closestCenter, DndContext } from "@dnd-kit/core";
import VenturePublicProfileSettingsSortableIndicator from "./VenturePublicProfileSettingsSortableIndicator";
import { useDispatch, useSelector } from "react-redux";
import { pitchSelectors, pitchThunks } from "store/ducks/pitch";
import TextInput from "../../../form/TextInput";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Loader from "../../../components/Loader";
import PitchImageUpload from "../../../components/pitchDeck/PitchImageUpload";
import GptTooltipLabel from "../../../components/pitchDeck/GptTooltipLabel";
import GptRegenerateButton from "../../../components/pitchDeck/GptRegenerateButton";
import { clone } from "shared-components/utils/lo";
import { getTypography } from "shared-components/utils/typography";

const VenturePublicProfileSettingsSortableImpact = ({ impact, sensors, venture, setUpdatedVenture }) => {
  const [collapsed, setCollapsed] = useState(true);
  const gptTextLoading = useSelector(pitchSelectors.gptTextLoading());
  const dispatch = useDispatch();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: impact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortedIndicators = impact.indicators.sort((i1, i2) => i1.publicOrder - i2.publicOrder);
  const indicatorItems = sortedIndicators.map((i, index) => (
    <VenturePublicProfileSettingsSortableIndicator
      impact={impact}
      indicator={i}
      index={index}
      key={i.id}
      venture={venture}
      setUpdatedVenture={setUpdatedVenture} />
  ));

  const handleIndicatorDragEnd = (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const from = impact.indicators.find(i => i.id === active.id);
      const to = impact.indicators.find(i => i.id === over.id);

      if (from && to) {
        const movedTo = to.publicOrder || 0;
        impact.indicators.forEach(i => {
          if (i.id !== from.id && i.publicOrder >= Math.min(from.publicOrder, to.publicOrder) && i.publicOrder <= Math.max(from.publicOrder, to.publicOrder)) {
            i.publicOrder += Math.sign(from.publicOrder - to.publicOrder);
          }
        });

        from.publicOrder = movedTo;
      }

      setUpdatedVenture(clone(venture));
    }
  };

  const togglePublicEnabled = () => {
    impact.publicEnabled = !impact.publicEnabled;
    setUpdatedVenture(clone(venture));
  };

  const updateImpactProp = (name, value) => {
    const impactIndex = venture.impacts.findIndex(i => i.id === impact.id);
    venture.impacts[impactIndex][name] = value;
    setUpdatedVenture(clone(venture));
  }

  const regenerateDescription = () => {
    dispatch(pitchThunks.regenerateGptText({ venture, name: 'pitchDescription', impact }))
      .then(res => {
        updateImpactProp('pitchDescription', res.payload);
      });
  }

  return (
    <>
      <Box py={1} style={style} sx={{ '&:hover .MuiSvgIcon-root.impact-drag': { visibility: 'visible' } }}>
        <Box display='flex' gap={1} alignItems='flex-start'>
          <IconButton ref={setNodeRef} {...attributes} {...listeners} sx={{ visibility: 'hidden' }}>
            <DragIndicatorIcon className='impact-drag' sx={{ color: 'secondary.main' }} />
          </IconButton>
          <FormControlLabel
            sx={{ flexGrow: 1 }}
            componentsProps={{ typography: getTypography('bodyBold') }}
            onClick={togglePublicEnabled}
            control={<Checkbox checked={impact.publicEnabled} />}
            label={impact.name}
          />
          <IconButton onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        <Collapse in={!collapsed}>
          <Box pl={6} pr={3}>
            <PitchImageUpload
              my={2}
              image={impact.image}
              updateImage={(link) => updateImpactProp('image', link)}
              clearImage={() => updateImpactProp('image', null)}
              label='Cover image'
            />
            <GptTooltipLabel label='Description' />
            <Box mb={2} display='flex' alignItems='center' gap={2}>
              <TextInput
                placeholder='Description'
                value={impact.pitchDescription || ''}
                onChange={(e) => updateImpactProp('pitchDescription', e.target.value)}
                multiline
                fullWidth
              />
              {
                gptTextLoading
                  ? <Loader p={1} size={24} />
                  : <GptRegenerateButton onClick={() => regenerateDescription()} />
              }
            </Box>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleIndicatorDragEnd}>
              <SortableContext items={sortedIndicators} strategy={verticalListSortingStrategy}>
                {indicatorItems}
              </SortableContext>
            </DndContext>
          </Box>
        </Collapse>
      </Box>
      <Divider />
    </>
  );
};

export default memo(VenturePublicProfileSettingsSortableImpact);
