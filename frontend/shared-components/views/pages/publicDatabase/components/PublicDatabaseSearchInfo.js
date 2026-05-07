import React, { memo, useState } from 'react';
import { Box, MenuItem, Typography } from "@mui/material";
import TextInput from "../../../form/TextInput";
import { PUBLIC_SORT } from "shared-components/utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { appActions, appSelectors } from "store/ducks/app";

const PublicDatabaseSearchInfo = ({ shownVentures, totalVentures, showSort, showPeriod, ...rest }) => {
  const dispatch = useDispatch();
  const sort = useSelector(appSelectors.getPublicSort());
  const period = useSelector(appSelectors.getPublicPeriod());

  const setSort = (e) => {
    dispatch(appActions.setPublicSort(e.target.value));
  }

  const setPeriod = (e) => {
    dispatch(appActions.setPublicPeriod(+e.target.value));
  }

  return (
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      position='sticky'
      top={0}
      backgroundColor='background.default'
      {...rest}
    >
      {showSort && (
        <Box display='flex' alignItems='center'>
          <Typography sx={{ mr: 2 }}>Sort by:</Typography>
          <TextInput
            name='public-sort'
            select
            onChange={setSort}
            value={sort}
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
          >
            <MenuItem value={PUBLIC_SORT.BY_EMPLOYEES}>Number of employees</MenuItem>
            <MenuItem value={PUBLIC_SORT.BY_FOLLOWERS}>Social media followers</MenuItem>
            <MenuItem value={PUBLIC_SORT.BY_CERTIFICATION}>Certification level</MenuItem>
            <MenuItem value={PUBLIC_SORT.BY_AGE_ASC}>Age (older first)</MenuItem>
            <MenuItem value={PUBLIC_SORT.BY_AGE_DESC}>Age (younger first)</MenuItem>
          </TextInput>
        </Box>
      )}
      {showPeriod && (
        <Box display='flex' alignItems='center'>
          <Typography sx={{ mr: 2 }}>Show traction for:</Typography>
          <TextInput
            name='public-sort'
            select
            onChange={setPeriod}
            value={period}
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiSelect-select': { pb: 0.5 } }}
          >
            <MenuItem value={7}>7 days</MenuItem>
            <MenuItem value={30}>30 days</MenuItem>
            <MenuItem value={90}>90 days</MenuItem>
            <MenuItem value={365}>365 days</MenuItem>
          </TextInput>
        </Box>
      )}
      <Typography sx={{ display: 'flex', gap: 0.5 }}>
        <b>{shownVentures}</b>
        <Typography component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>venture{shownVentures === 1 ? '' : 's'}</Typography>
        <Typography component='span'>out of {totalVentures}</Typography>
      </Typography>
    </Box>
  );
};

export default memo(PublicDatabaseSearchInfo);
