import React, { memo } from 'react';
import { Box, Checkbox, Divider, FormControlLabel, Typography } from '@mui/material';
import { appActions, appSelectors } from 'store/ducks/app';
import { useDispatch, useSelector } from 'react-redux';
import { IMPACT_FILTER } from "shared-components/utils/constants";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const ImpactFilter = () => {
  const filter = useSelector(appSelectors.getImpactFilter());
  const dispatch = useDispatch();

  const setShowAll = () => {
    dispatch(appActions.setImpactFilterAll(null));
  };

  const toggleFilter = (val) => {
    dispatch(appActions.toggleImpactFilter(val));
  };

  return (
    <CustomErrorBoundary>
      <Box display='flex' alignItems='center'>
        <Typography sx={{ mr: 2 }}>Show:</Typography>
        <FormControlLabel
          onClick={setShowAll}
          control={<Checkbox checked={filter.length === 4} />}
          label='All'
        />
        <Divider orientation='vertical' flexItem sx={{ mr: 2, my: 1 }} />
        <FormControlLabel
          control={
            <Checkbox
              checked={filter.includes(IMPACT_FILTER.NEGATIVE)}
              onChange={() => toggleFilter(IMPACT_FILTER.NEGATIVE)}
            />
          }
          label='Negative'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filter.includes(IMPACT_FILTER.POSITIVE)}
              onChange={() => toggleFilter(IMPACT_FILTER.POSITIVE)}
            />
          }
          label='Positive'
        />
        <Divider orientation='vertical' flexItem sx={{ mr: 2, my: 1 }} />
        <FormControlLabel
          control={
            <Checkbox checked={filter.includes(IMPACT_FILTER.DRAFT)}
              onChange={() => toggleFilter(IMPACT_FILTER.DRAFT)} />
          }
          label='Draft'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filter.includes(IMPACT_FILTER.NOT_DRAFT)}
              onChange={() => toggleFilter(IMPACT_FILTER.NOT_DRAFT)}
            />
          }
          label='Not draft'
        />
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactFilter);
