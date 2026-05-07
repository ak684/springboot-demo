import React, { memo } from 'react';
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { Box, Typography } from "@mui/material";

const PublicDatabaseMapTooltipSdgItem = ({ sdg, total }) => {
  const goals = useSelector(dictionarySelectors.getGoals());
  const goal = goals.find(g => g.name === sdg.name);

  return (
    <Box display='flex' alignItems='center' gap={1}>
      <Box
        component='img'
        src={`/images/sdg/${goal.number}.svg`}
        width={24}
        height={24}
        sx={{ borderRadius: '2px' }}
        alt={goal.shortName}
      />
      <Typography sx={{ width: 30 }} variant='captionBold'>{Math.round(sdg.value / total * 100)}%</Typography>
      <Box flexGrow={1}>
        <Box height={8} position='relative' backgroundColor='secondary.subtle'>
          <Box
            height={8}
            position='absolute'
            left={0}
            top={0}
            backgroundColor={goal.color}
            width={`${sdg.value / total * 100}%`}
          />
        </Box>
        <Typography sx={{ fontSize: 10 }}>{goal.shortName}</Typography>
      </Box>
    </Box>
  );
};

export default memo(PublicDatabaseMapTooltipSdgItem);
