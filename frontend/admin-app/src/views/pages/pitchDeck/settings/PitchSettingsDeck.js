import React, { memo } from 'react';
import { Box, Divider, Typography } from "@mui/material";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import PitchSettingsSortableImpact from "./PitchSettingsSortableImpact";
import { clone } from "shared-components/utils/lo";
import PitchColorTone from "../components/PitchColorTone";
import PitchThemeCard from "../components/PitchThemeCard";
import { PITCH_COLORS } from "shared-components/utils/pitch";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchSettingsDeck = ({ venture, setUpdatedVenture }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedImpacts = venture.impacts
    .filter(i => !i.draft)
    .sort((i1, i2) => i1.pitchOrder - i2.pitchOrder);

  const impactItems = sortedImpacts.map((impact) => (
    <PitchSettingsSortableImpact
      key={impact.id}
      impact={impact}
      sensors={sensors}
      venture={venture}
      setUpdatedVenture={setUpdatedVenture}
    />
  ));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const from = venture.impacts.find(i => i.id === active.id);
      const to = venture.impacts.find(i => i.id === over.id);

      if (from && to) {
        const movedTo = to.pitchOrder || 0;
        venture.impacts.forEach(i => {
          if (i.id !== from.id && i.pitchOrder >= Math.min(from.pitchOrder, to.pitchOrder) && i.pitchOrder <= Math.max(from.pitchOrder, to.pitchOrder)) {
            i.pitchOrder += Math.sign(from.pitchOrder - to.pitchOrder);
          }
        });

        from.pitchOrder = movedTo;
      }

      setUpdatedVenture(clone(venture))
    }
  };

  const setColor = (color) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, color } });
  }

  const setTheme = (newTheme) => {
    setUpdatedVenture({ ...venture, pitchSettings: { ...venture.pitchSettings, theme: newTheme } });
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box p={2}>
          <Typography variant='bodyBold'>Deck themes:</Typography>
        </Box>
        <Box>
          <Typography variant='body' sx={{ px: 2, mb: 1 }}>Color tone:</Typography>
          <Box display='flex' gap={1} px={2}>
            {PITCH_COLORS.map((color, index) => (
              <PitchColorTone
                key={color}
                color={color}
                selected={venture.pitchSettings.color}
                isDefault={index === 0}
                setColor={setColor}
              />
            ))}
          </Box>
          <Box display='flex' gap={1} p={2}>
            <PitchThemeCard
              color={venture.pitchSettings.color || PITCH_COLORS[0]}
              value='theme1'
              selected={venture.pitchSettings.theme}
              isDefault
              setTheme={setTheme}
              index={1}
            />
            <PitchThemeCard
              color={venture.pitchSettings.color || PITCH_COLORS[0]}
              value='theme2'
              selected={venture.pitchSettings.theme}
              setTheme={setTheme}
              index={2}
            />
            <PitchThemeCard
              color={venture.pitchSettings.color || PITCH_COLORS[0]}
              value='theme3'
              selected={venture.pitchSettings.theme}
              setTheme={setTheme}
              index={3}
            />
          </Box>
        </Box>
        <Divider />
        <Box p={2}>
          <Typography variant='bodyBold'>Use following impact areas:</Typography>
        </Box>
        <Divider />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedImpacts} strategy={verticalListSortingStrategy}>
            {impactItems}
          </SortableContext>
        </DndContext>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PitchSettingsDeck);
