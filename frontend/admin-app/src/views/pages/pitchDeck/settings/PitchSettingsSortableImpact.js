import React, { memo } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Checkbox, Divider, FormControlLabel, useTheme } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import IconButton from "@mui/material/IconButton";
import PitchSettingsSortableIndicator from "./PitchSettingsSortableIndicator";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { clone } from "shared-components/utils/lo";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchSettingsSortableImpact = ({ impact, sensors, venture, setUpdatedVenture }) => {
  const theme = useTheme();
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

  const sortedIndicators = impact.indicators.sort((i1, i2) => i1.pitchOrder - i2.pitchOrder);
  const indicatorItems = sortedIndicators.map(i => (
    <PitchSettingsSortableIndicator indicator={i} key={i.id} venture={venture} setUpdatedVenture={setUpdatedVenture} />
  ));

  const handleIndicatorDragEnd = (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const from = impact.indicators.find(i => i.id === active.id);
      const to = impact.indicators.find(i => i.id === over.id);

      if (from && to) {
        const movedTo = to.pitchOrder || 0;
        impact.indicators.forEach(i => {
          if (i.id !== from.id && i.pitchOrder >= Math.min(from.pitchOrder, to.pitchOrder) && i.pitchOrder <= Math.max(from.pitchOrder, to.pitchOrder)) {
            i.pitchOrder += Math.sign(from.pitchOrder - to.pitchOrder);
          }
        });

        from.pitchOrder = movedTo;
      }

      setUpdatedVenture(clone(venture))
    }
  };

  const togglePitchEnabled = () => {
    impact.pitchEnabled = !impact.pitchEnabled;
    setUpdatedVenture(clone(venture));
  };

  return (
    <CustomErrorBoundary>
      <Box py={1} style={style} sx={{ '&:hover .MuiSvgIcon-root.impact-drag': { visibility: 'visible' } }}>
        <Box display='flex' gap={1}>
          <IconButton ref={setNodeRef} {...attributes} {...listeners} sx={{ visibility: 'hidden' }}>
            <DragIndicatorIcon className='impact-drag' sx={{ color: 'secondary.main' }} />
          </IconButton>
          <FormControlLabel
            componentsProps={{ typography: getTypography('bodyBold') }}
            onClick={togglePitchEnabled}
            control={<Checkbox checked={impact.pitchEnabled} />}
            label={impact.name}
          />
        </Box>
        <Box pl={4}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleIndicatorDragEnd}>
            <SortableContext items={sortedIndicators} strategy={verticalListSortingStrategy}>
              {indicatorItems}
            </SortableContext>
          </DndContext>
        </Box>
      </Box>
      <Divider />
    </CustomErrorBoundary>
  );
};

export default memo(PitchSettingsSortableImpact);
