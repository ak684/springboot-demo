import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import PublicProfileTeamCard from "./PublicProfileTeamCard";

const PublicProfileTeam = ({ company }) => {
  const ceo = company.team.filter(m => m.type === 'CEO');
  const cLevel = company.team.filter(m => m.type === 'C_LEVEL');
  const regular = company.team.filter(m => m.type === 'REGULAR');

  return (
    <Box backgroundColor='white'>
      <Box
        mx='auto'
        maxWidth={1280}
        px={{ xs: 3, lg: 12 }}
        py={8}
        display='flex'
        flexDirection='column'
        gap={{ xs: 3, sm: 4 }}
      >
        {ceo.length > 0 && (
          <Box>
            <Typography align='center' variant='h5'>Company head</Typography>
            <Box mt={2} display='flex' justifyContent='center' gap={4} flexWrap='wrap'>
              {ceo.map(m => <PublicProfileTeamCard key={m.id} member={m} />)}
            </Box>
          </Box>
        )}
        {cLevel.length > 0 && (
          <Box>
            <Typography align='center' variant='h5'>C-level</Typography>
            <Box mt={2} display='flex' justifyContent='center' gap={4} flexWrap='wrap'>
              {cLevel.map(m => <PublicProfileTeamCard key={m.id} member={m} />)}
            </Box>
          </Box>
        )}
        {regular.length > 0 && (
          <Box>
            <Typography align='center' variant='h5'>Company employees</Typography>
            <Box mt={2} display='flex' justifyContent='center' gap={4} flexWrap='wrap'>
              {regular.map(m => <PublicProfileTeamCard key={m.id} member={m} />)}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default memo(PublicProfileTeam);
