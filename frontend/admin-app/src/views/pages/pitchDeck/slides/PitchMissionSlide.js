import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import PitchContacts from "../components/PitchContacts";
import { PITCH_COLORS, PITCH_PLACEHOLDERS } from "shared-components/utils/pitch";
import { getVentureAddress } from "shared-components/utils/venture";
import { use100vh } from "react-div-100vh";

const StyledWrapper = styled(Box)(({ theme, venture }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  paddingTop: '20vh',
  paddingBottom: theme.spacing(10),
  background: `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(${venture.pitchSettings.missionImage || `/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg`})`,
  backgroundBlendMode: 'color, normal, normal',
  backgroundSize: 'cover',
  color: 'white',
  [theme.breakpoints.down('lg')]: {
    paddingTop: '10vh',
  },
  [theme.breakpoints.down('sm')]: {
    paddingBottom: theme.spacing(16),
  },
}));

const PitchMissionSlide = ({ venture, clientView }) => {
  const fullHeight = use100vh();

  return (
    <StyledWrapper
      venture={venture}
      sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}
    >
      <Box>
        <Typography variant='display' align='center'>Our mission</Typography>
        <Typography
          sx={{ mt: { xs: 3, sm: 6, lg: 8 }, px: { xs: 8, sm: 25 }, fontSize: { xs: 14, sm: 16, lg: 24 } }}
          align='center'
        >
          {venture.description || PITCH_PLACEHOLDERS.description}
        </Typography>
        <Box
          px={{ xs: 3, sm: 12 }}
          mt={{ xs: 3, sm: 6, lg: 8 }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          display='flex'
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent='space-around'
          gap={3}
        >
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={3}
            flexBasis={{ sx: 'unset', sm: 300 }}
            flexGrow={0}
          >
            <Box
              width={{ xs: 62, sm: 124 }}
              height={{ xs: 62, sm: 124 }}
              component='img'
              src='/images/pitch/icons/location.svg'
              alt='Location'
            />
            <Typography variant='h5' align='center'>{getVentureAddress(venture)}</Typography>
          </Box>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={3}
            flexBasis={{ sx: 'unset', sm: 300 }}
            flexGrow={0}
          >
            <Box
              width={{ xs: 62, sm: 124 }}
              height={{ xs: 62, sm: 124 }}
              component='img'
              src='/images/pitch/icons/industry.svg'
              alt='Industry'
            />
            <Typography variant='h5' align='center'>
              {venture.industries.length > 0 && venture.industries.map(i => i.title).join(', ')}
              {venture.industries.length === 0 && 'Industries go here'}
            </Typography>
          </Box>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={3}
            flexBasis={{ sx: 'unset', sm: 300 }}
            flexGrow={0}
          >
            <Box
              width={{ xs: 62, sm: 124 }}
              height={{ xs: 62, sm: 124 }}
              component='img'
              src='/images/pitch/icons/size.svg'
              alt='Size'
            />
            <Typography variant='h5' align='center'>
              {
                venture.legalEntityFormed
                  ? venture.employees > 0 ? `${venture.employees} employees` : 'Number of employees goes here'
                  : '1 employee'
              }
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box px={{ xs: 3, sm: 12 }}>
        <PitchContacts venture={venture} />
      </Box>
    </StyledWrapper>
  );
};

export default memo(PitchMissionSlide);
