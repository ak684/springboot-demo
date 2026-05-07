import React, { memo } from 'react';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import IconButton from "@mui/material/IconButton";
import { clone } from "shared-components/utils/lo";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PitchSettingsSortableIndicator = ({ indicator, venture, setUpdatedVenture }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: indicator.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const togglePitchEnabled = () => {
    indicator.pitchEnabled = !indicator.pitchEnabled;
    setUpdatedVenture(clone(venture));
  };

  return (
    <CustomErrorBoundary>
      <Box style={style} sx={{ '&:hover .MuiSvgIcon-root': { visibility: 'visible' } }}>
        <Box display='flex' gap={1}>
          <IconButton ref={setNodeRef} {...attributes} {...listeners} sx={{ visibility: 'hidden' }}>
            <DragIndicatorIcon sx={{ color: 'secondary.main' }} />
          </IconButton>
          <FormControlLabel
            onClick={togglePitchEnabled}
            control={<Checkbox checked={indicator.pitchEnabled} />}
            label={indicator.name}
          />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PitchSettingsSortableIndicator);
