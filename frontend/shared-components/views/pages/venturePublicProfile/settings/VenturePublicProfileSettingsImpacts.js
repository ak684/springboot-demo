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
import VenturePublicProfileSettingsSortableImpact from "./VenturePublicProfileSettingsSortableImpact";
import { clone } from "shared-components/utils/lo";

const VenturePublicProfileSettingsImpacts = ({ venture, setUpdatedVenture }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedImpacts = venture.impacts
    .filter(i => !i.draft)
    .sort((i1, i2) => i1.publicOrder - i2.publicOrder);

  const impactItems = sortedImpacts.map((impact) => (
    <VenturePublicProfileSettingsSortableImpact
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
        const movedTo = to.publicOrder || 0;
        venture.impacts.forEach(i => {
          if (i.id !== from.id && i.publicOrder >= Math.min(from.publicOrder, to.publicOrder) && i.publicOrder <= Math.max(from.publicOrder, to.publicOrder)) {
            i.publicOrder += Math.sign(from.publicOrder - to.publicOrder);
          }
        });

        from.publicOrder = movedTo;
      }

      setUpdatedVenture(clone(venture))
    }
  };

  return (
    <Box>
      <Box p={2}>
        <Typography variant='bodyBold'>Impact chains:</Typography>
      </Box>
      <Divider />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedImpacts} strategy={verticalListSortingStrategy}>
          {impactItems}
        </SortableContext>
      </DndContext>
    </Box>
  );
};

export default memo(VenturePublicProfileSettingsImpacts);
