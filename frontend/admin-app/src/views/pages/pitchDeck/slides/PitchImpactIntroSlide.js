import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { PITCH_COLORS } from "shared-components/utils/pitch";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import { use100vh } from "react-div-100vh";
import { alpha } from "@mui/material/styles";
import { clone } from "shared-components/utils/lo";
import chartConfig from "../chart/donutChart";
import useChart from "shared-components/hooks/useChart";
import { getTypography } from "shared-components/utils/typography";

const StyledWrapper = styled(Box)(({ theme, impact, venture }) => ({
  paddingTop: '12vh',
  paddingLeft: theme.spacing(10),
  paddingRight: theme.spacing(10),
  backgroundImage: `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(${impact.image || `/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg`})`,
  backgroundBlendMode: 'color, normal, normal',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  color: 'white',
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0, 2, 16),
  },

}));

const StyledPercentLabel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 16,
  right: 12,
  padding: theme.spacing(0.5, 1),
  borderRadius: '4px',
  color: 'white',
  backgroundColor: alpha(theme.palette.text.primary, 0.8),
  ...getTypography('caption'),
  [theme.breakpoints.down('lg')]: {
    bottom: 12,
    right: 6,
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  }
}));

const getChartData = (impact) => {
  const config = clone(chartConfig);

  config.series[0].data = impact.goals.map(g => ({
    name: g.goal.shortName,
    value: g.rate,
    itemStyle: {
      color: g.goal.color,
    },
  }));

  return config;
}

const PitchImpactIntroSlide = ({ venture, impact, index, clientView }) => {
  const fullHeight = use100vh();
  useChart(`impact-${impact.id}-sdg-chart`, getChartData, impact.goals.length > 0, impact);

  return (
    <StyledWrapper
      impact={impact}
      venture={venture}
      sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}
    >
      <Box>
        <Box display='flex' alignItems='center' justifyContent='center' gap={2}>
          <Typography align='center' sx={{ fontSize: { xs: 12, sm: 16, lg: 32 }, fontWeight: 700 }}>
            Impact area {index + 1}
          </Typography>
          {!impact.positive && <NegativeImpactLabel solid />}
        </Box>
        <Typography align='center' sx={{ mt: 4 }} variant='display'>{impact.name}</Typography>
        <Box mt={{ xs: 3, sm: 8, lg: 12 }} display='flex' gap={{ xs: 0.5, sm: 2 }} justifyContent='center'>
          {impact.goals.map(g => (
            <Box position='relative' key={g.id}>
              <Box
                component='img'
                src={g.goal.image}
                width={{ xs: 50, sm: 110, lg: 148 }}
                height={{ xs: 50, sm: 110, lg: 148 }}
                sx={{ borderRadius: '4px' }}
              />
              {g.rate > 0 && <StyledPercentLabel>{g.rate}%</StyledPercentLabel>}
            </Box>
          ))}
        </Box>
        <Box mt={{ xs: 3, sm: 6 }} align='center'>
          <Box
            width={{ xs: 98, sm: 164, lg: 215 }}
            height={{ xs: 98, sm: 164, lg: 215 }}
            id={`impact-${impact.id}-sdg-chart`}
          />
        </Box>
      </Box>
    </StyledWrapper>
  );
};

export default memo(PitchImpactIntroSlide);
