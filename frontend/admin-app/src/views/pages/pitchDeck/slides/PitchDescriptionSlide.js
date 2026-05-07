import React, { memo } from 'react';
import { Avatar, Box, styled, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { smallerImage } from "shared-components/utils/helpers";
import { PITCH_COLORS, PITCH_PLACEHOLDERS } from "shared-components/utils/pitch";
import { use100vh } from "react-div-100vh";

const StyledWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  [theme.breakpoints.down('lg')]: {
    paddingBottom: theme.spacing(10),
    flexDirection: 'column',
  },
  [theme.breakpoints.down('sm')]: {
    paddingBottom: theme.spacing(16),
  },
}));

const StyledLeft = styled(Box)(({ theme, venture }) => ({
  flexBasis: '50%',
  padding: theme.spacing(0, 15, 10, 15),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  background: venture.pitchSettings.descriptionImage
    ? `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45.2%, #000 100%), url(${venture.pitchSettings.descriptionImage})`
    : `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(${`/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg`})`,
  backgroundBlendMode: venture.pitchSettings.descriptionImage ? 'none' : 'color, normal, normal',
  backgroundSize: 'cover',
  color: 'white',
  [theme.breakpoints.down('lg')]: {
    flexBasis: 'unset',
    minHeight: '40vh',
    padding: theme.spacing(0, 12, 6),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  }
}));

const StyledRight = styled(Box)(({ theme }) => ({
  flexBasis: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(12, 15, 10, 12),
  gap: theme.spacing(4),
  [theme.breakpoints.down('lg')]: {
    flexBasis: 'unset',
    minHeight: 'unset',
    padding: theme.spacing(6, 12, 0),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    justifyContent: 'flex-start',
    gap: theme.spacing(2),
  }
}));

const PitchDescriptionSlide = ({ venture, clientView }) => {
  const user = venture.pitchSettings.founder || venture.organization.users[0];
  const fullHeight = use100vh();

  return (
    <StyledWrapper sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}>
      <StyledLeft venture={venture} sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}>
        <Typography variant='h1'>Our mission</Typography>
        <Typography sx={{ mt: { xs: 1, sm: 4 } }} variant='body'>{venture.description}</Typography>
      </StyledLeft>
      <StyledRight sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}>
        <Box>
          <Typography variant='h1'>About</Typography>
          <Typography sx={{ mt: { xs: 2, sm: 4 }, fontSize: { xs: 14, sm: 18, lg: 24 } }}>
            {venture.pitchSettings.description || PITCH_PLACEHOLDERS.ventureDescription}
          </Typography>
        </Box>
        <Box display='flex' alignItems='flex-start' gap={2}>
          <Avatar sx={{ width: 44, height: 44 }} src={smallerImage(user.avatar)} />
          <Box>
            <Typography sx={{ fontSize: { xs: 18, sm: 24, lg: 32 }, fontWeight: 700 }}>
              {user.name} {user.lastName}
            </Typography>
            <Typography variant='body' sx={{ mt: 0.5 }}>{user.position}</Typography>
          </Box>
        </Box>
      </StyledRight>
    </StyledWrapper>
  );
};

export default memo(PitchDescriptionSlide);
