import React, { memo, useEffect } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { PITCH_COLORS } from "shared-components/utils/pitch";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import api from "services/api";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ venture }) => ({
  height: `calc(100vh - ${HEADER_HEIGHT}px)`,
  background: `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(${venture.pitchSettings.introImage || `/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg`})`,
  backgroundBlendMode: 'color, normal, normal',
  backgroundSize: 'cover',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const PitchDeckGenerate = () => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const navigate = useNavigate();

  useEffect(() => {
    api.post(`/pitch/ventures/${ventureId}`)
      .finally(() => {
        navigate(`/ventures/${ventureId}/pitch-deck`);
      });
  }, []);

  return (
    <CustomErrorBoundary>
      <StyledWrapper venture={venture}
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Box textAlign='center'>
          <Loader color='light' />
          <Typography variant='h1' sx={{ mt: 8 }}>Generating Pitch Deck</Typography>
          <Typography variant='body' sx={{ mt: 2 }}>This may take a while...</Typography>
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(PitchDeckGenerate);
