import React, { memo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const tips = [
  "The output that you will see soon is a suggestion of how you could measure your innovation impact",
  "We measure the delta between what would happen without your innovation, and with your innovation, a standard approach in impact management",
  "We would love if you could provide feedback at the end and if you could share this free AI tool via social media with your networks",
  "Do not close this window. Our AI performs some complex tasks. It is normal that you have some wait time",
  "On the next page, hover over the sustainable development goals on the right. You can see that we attribute each impact area down to the level of the 169 SDG targets and 247 indicators.",
  "As the SDG targets and indicators are formulated on a country level, they or usually not appropriate for an organization. Our AI will suggested tailored indicators, how you can measure your ventures sustainability impact.",
];

const AiTocLoading = ({ message }) => {
  const [tipIndex, setTipIndex] = useState(0);

  const next = () => {
    setTipIndex(tipIndex + 1);
  }

  const previous = () => {
    setTipIndex(tipIndex - 1);
  }

  const showTips = message.includes("theory of change");

  return (
    <CustomErrorBoundary>
      <Box
        p={2}
        position='fixed'
        width='100vw'
        height={`calc(100vh - ${HEADER_HEIGHT}px)`}
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Box sx={{ textAlign: 'center' }} display='flex' flexDirection='column' alignItems='center' gap={4}>
          {showTips && (
            <Box
              width={{ xs: 300, sm: 400 }}
              p={3}
              display='flex'
              alignItems='center'
              gap={1}
              backgroundColor='primary.main'
              sx={{ borderRadius: '8px' }}
            >
              <IconButton onClick={previous}><ArrowBackIcon sx={{ color: 'white' }} /></IconButton>
              <Box flexGrow={1}>
                <Typography color='white' variant='subtitle'>{tips[tipIndex % tips.length]}</Typography>
                <Box mt={2} display='flex' justifyContent='center' gap={1}>
                  {[...Array(tips.length)].map((_, i) => {
                    if (i === tipIndex % tips.length) {
                      return <Box key={i} width={20} height={6} backgroundColor='white' sx={{ borderRadius: '20px' }} />
                    } else {
                      return (
                        <Box key={i}
                          width={6}
                          height={6}
                          backgroundColor='primary.light'
                          sx={{ borderRadius: '50%' }} />
                      )
                    }
                  })}
                </Box>
              </Box>
              <IconButton onClick={next}><ArrowForwardIcon sx={{ color: 'white' }} /></IconButton>
            </Box>
          )}
          <Typography sx={{ mb: 2, fontSize: 20, fontWeight: 600, textTransform: 'uppercase' }} color='secondary.main'>
            {message}
          </Typography>
          <Loader />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocLoading);
