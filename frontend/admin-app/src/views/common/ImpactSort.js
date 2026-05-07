import React, { memo } from 'react';
import { Box, MenuItem, Typography } from '@mui/material';
import { appActions, appSelectors } from 'store/ducks/app';
import { useDispatch, useSelector } from 'react-redux';
import { IMPACT_SORT } from "shared-components/utils/constants";
import { useParams } from "react-router-dom";
import TextInput from "shared-components/views/form/TextInput";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const ImpactSort = () => {
  const sort = useSelector(appSelectors.getImpactSort());
  const dispatch = useDispatch();
  const { ventureId } = useParams();

  const setSort = (e) => {
    const newVal = e.target.value;

    if (newVal !== sort) {
      localStorage.setItem(`impactSort_${ventureId}`, newVal);
      dispatch(appActions.setImpactSort(newVal));
    }
  };

  return (
    <CustomErrorBoundary>
      <Box display='flex' alignItems='center'>
        <Typography sx={{ mr: 2 }}>Sort by:</Typography>
        <TextInput
          name='impact-sort'
          select
          onChange={setSort}
          value={sort}
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
        >
          <MenuItem value={IMPACT_SORT.BY_SCORE}>Impact potential score</MenuItem>
          <MenuItem value={IMPACT_SORT.BY_MAGNITUDE}>Impact magnitude</MenuItem>
          <MenuItem value={IMPACT_SORT.BY_LIKELIHOOD}>Impact likelihood</MenuItem>
          <MenuItem value={IMPACT_SORT.CUSTOM}>Custom</MenuItem>
        </TextInput>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactSort);
