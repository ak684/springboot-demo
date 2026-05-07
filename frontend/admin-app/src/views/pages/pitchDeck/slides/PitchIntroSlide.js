import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import PitchContacts from "../components/PitchContacts";
import { PITCH_COLORS } from "shared-components/utils/pitch";
import { use100vh } from "react-div-100vh";

const StyledWrapper = styled(Box)(({ theme, venture }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  paddingTop: '20vh',
  paddingBottom: theme.spacing(10),
  background: `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(${venture.pitchSettings.introImage || `/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg`})`,
  backgroundBlendMode: 'color, normal, normal',
  backgroundSize: 'cover',
  color: 'white',
  [theme.breakpoints.down('sm')]: {
    paddingBottom: theme.spacing(16),
  },
}))

const PitchIntroSlide = ({ venture, clientView }) => {
  const fullHeight = use100vh();

  return (
    <StyledWrapper
      venture={venture}
      sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}
    >
      <Box>
        <Typography variant='display' align='center'>{venture.name}</Typography>
        <Typography sx={{ mt: 8, px: { xs: 8, sm: 25 }, fontSize: { xs: 14, sm: 16, md: 24 } }} align='center'>
          {venture.pitchSettings.introSubtitle}
        </Typography>
      </Box>
      <Box
        px={{ xs: 3, sm: 12 }}
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
        justifyContent='space-between'
        gap={2}
      >
        <Box display='flex' alignSelf={{ xs: 'center', sm: 'unset' }}>
          {venture.certification >= 1 && venture.pitchSettings.showCertification &&
            <Box
              width={{ xs: 80, sm: 116 }}
              height={{ xs: 80, sm: 116 }}
              component='img'
              alt='Certification'
              src={`/images/certification/level${venture.certification}.png`}
            />
          }
        </Box>
        <PitchContacts venture={venture} />
      </Box>
    </StyledWrapper>
  );
};

export default memo(PitchIntroSlide);
