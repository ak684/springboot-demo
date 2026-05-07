import React, { memo } from 'react';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Checkbox, MenuItem, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import IconButton from "@mui/material/IconButton";
import { useSelector } from "react-redux";
import { publicProfileSelectors } from "store/ducks/publicProfile";
import TextInput from "../../../form/TextInput";
import {
  getAverageChange,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome
} from "shared-components/utils/quantification";
import FieldLabel from "../../../components/FieldLabel";

const getValue = (impact, indicator, view) => {
  if (view.name === 'ABSOLUTE_IMPROVEMENT') {
    return getAverageChange(impact, indicator)[2];
  } else if (view.name === 'PERCENTAGE_IMPROVEMENT') {
    let change = getAverageChange(impact, indicator)[3];
    if (change !== 'No data') {
      change += '%';
    }
    return change;
  } else if (view.name === 'NET_IMPACT_INCEPTION') {
    return getIndicatorInceptionData(impact, indicator, getNetOutcome);
  } else if (view.name === 'NET_IMPACT_CURRENT') {
    return getIndicatorThisYearData(impact, indicator, getNetOutcome);
  } else if (view.name === 'YEAR') {
    return indicator.year;
  }

  return null;
}

const VenturePublicProfileSettingsSortableIndicator = ({ impact, indicator, index, venture, setUpdatedVenture }) => {
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

  const togglePublicEnabled = () => {
    indicator.publicEnabled = !indicator.publicEnabled;
    setUpdatedVenture(clone(venture));
  };

  const indicatorViews = useSelector(publicProfileSelectors.getIndicatorViews());

  const changeIndicatorView = (e) => {
    indicator.publicView = indicatorViews.find(v => v.name === e.target.value);
    setUpdatedVenture(clone(venture));
  };

  return (
    <Box style={style} sx={{ '&:hover .MuiSvgIcon-root': { visibility: 'visible' } }}>
      <Box display='flex' gap={1} alignItems='center' mt={1}>
        <IconButton ref={setNodeRef} {...attributes} {...listeners} sx={{ visibility: 'hidden' }}>
          <DragIndicatorIcon sx={{ color: 'secondary.main' }} />
        </IconButton>
        <Checkbox checked={indicator.publicEnabled} onClick={togglePublicEnabled} />
        <Box flexGrow={1}>
          <FieldLabel>Change #{index + 1}. {indicator.name}</FieldLabel>
          <TextInput
            select
            onChange={changeIndicatorView}
            value={indicator.publicView?.name || 'ABSOLUTE_IMPROVEMENT'}
            sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
            fullWidth
          >
            {indicatorViews.map(view => (
              <MenuItem
                key={view.name}
                value={view.name}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}
              >
                <Typography sx={{ fontSize: 21 }}>
                  {getValue(impact, indicator, view)}
                </Typography>
                <FieldLabel sx={{ color: 'secondary.main' }}>{view.description}</FieldLabel>
              </MenuItem>
            ))}
          </TextInput>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(VenturePublicProfileSettingsSortableIndicator);
