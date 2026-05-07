import React, { memo } from 'react';
import { Box, MenuItem, Typography } from '@mui/material';
import TextInput from "shared-components/views/form/TextInput";
import { IMPACT_CARD_VIEW } from "shared-components/utils/constants";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CardViewSelect = ({ view, setView }) => {
  const updateView = (e) => {
    const newVal = e.target.value;

    if (newVal !== view) {
      setView(newVal);
      localStorage.setItem('card_view', newVal);
    }
  };

  return (
    <CustomErrorBoundary>
      <Box display='flex' alignItems='center'>
        <Typography sx={{ mr: 2 }}>View:</Typography>
        <TextInput
          name='card-view'
          select
          onChange={updateView}
          value={view}
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
        >
          <MenuItem value={IMPACT_CARD_VIEW.DETAILED}>Detailed</MenuItem>
          <MenuItem value={IMPACT_CARD_VIEW.COMPACT}>Compact</MenuItem>
        </TextInput>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CardViewSelect);
