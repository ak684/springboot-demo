import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { getVentureTotalScore } from "shared-components/utils/scoring";
import { alpha } from "@mui/material/styles";
import { arraySum } from "shared-components/utils/helpers";
import { getTypography } from "shared-components/utils/typography";

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
    paddingBottom: theme.spacing(16),
  },
}));

const PitchSdgSlide = ({ venture }) => {
  const impacts = venture.impacts.length;
  const indicators = venture.impacts.flatMap(i => i.indicators).length;
  const totalAbsoluteScore = arraySum(
    venture.impacts
      .filter(i => i.goals.length > 0)
      .filter(i => i.scoring.at(-1)?.score)
      .map(i => Math.abs(i.scoring.at(-1)?.score))
  );
  const goals = venture.impacts
    .flatMap(i => i.goals)
    .reduce((acc, g) => {
      acc[g.goal.name] = { ...g, rate: 0 };
      return acc;
    }, {});
  if (totalAbsoluteScore > 0) {
    venture.impacts.filter(i => i.scoring.at(-1)?.score).forEach(impact => {
      impact.goals.forEach(g => {
        goals[g.goal.name].rate += g.rate * (Math.abs(impact.scoring.at(-1)?.score) || 0) / totalAbsoluteScore;
      })
    });
  }

  const sdgItems = Object.values(goals).map(g => (
    <Box position='relative' key={g.id}>
      <Box
        component='img'
        src={g.goal.image}
        alt={g.name}
        width={{ xs: 48, sm: 110, lg: 148 }}
        height={{ xs: 48, sm: 110, lg: 148 }}
        sx={{ borderRadius: '10px' }}
      />
      {g.rate > 0 && <StyledPercentLabel>{Math.round(g.rate)}%</StyledPercentLabel>}
    </Box>
  ));

  return (
    <Box pb={{ xs: 10, lg: 0 }}>
      <Typography variant='display' align='center' sx={{ mt: { xs: 6, lg: 12 } }}>
        We contribute to:
      </Typography>
      <Box
        mt={{ xs: 2, sm: 6, lg: 12 }}
        px={{ xs: 3, sm: 6, lg: 12 }}
        display='flex'
        alignItems='center'
        justifyContent='center'
        flexWrap='wrap'
        gap={{ xs: 0.5, sm: 1, lg: 2 }}
      >
        {sdgItems}
      </Box>
      <Box
        mt={{ xs: 2, sm: 6, lg: 12 }}
        display='flex'
        flexDirection={{ xs: 'column', lg: 'row' }}
        alignItems='center'
        justifyContent='center'
        textAlign='center'
        gap={2}
      >
        <Box display='flex' alignItems='center' flexDirection='column' gap={4} flexBasis={{ xs: 'unset', lg: 400 }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            width={{ xs: 62, lg: 124 }}
            height={{ xs: 62, lg: 124 }}
            backgroundColor='white'
            sx={{ borderRadius: '16px' }}
          >
            <Box component='img' src='/images/icons/star.svg' alt='Impact potential score' />
          </Box>
          <Box>
            <Typography variant='h5' sx={{ mb: 0.5 }}>Impact potential score</Typography>
            <Typography sx={{ fontSize: { xs: 24, lg: 42 }, fontWeight: 700 }}>
              {getVentureTotalScore(venture)} / 500
            </Typography>
          </Box>
        </Box>
        <Box display='flex' alignItems='center' flexDirection='column' gap={4} flexBasis={{ xs: 'unset', lg: 400 }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            width={{ xs: 62, lg: 124 }}
            height={{ xs: 62, lg: 124 }}
            backgroundColor='white'
            sx={{ borderRadius: '16px' }}
          >
            <Box component='img' src='/images/icons/bulb.svg' alt='Indicators measured' />
          </Box>
          <Box>
            <Typography variant='h5' sx={{ mb: 0.5 }}>Indicators measured</Typography>
            <Typography sx={{ fontSize: { xs: 24, lg: 42 }, fontWeight: 700 }}>{indicators}</Typography>
          </Box>
        </Box>
        <Box display='flex' alignItems='center' flexDirection='column' gap={4} flexBasis={{ xs: 'unset', lg: 400 }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            width={{ xs: 62, lg: 124 }}
            height={{ xs: 62, lg: 124 }}
            backgroundColor='white'
            sx={{ borderRadius: '16px' }}
          >
            <Box component='img' src='/images/icons/star.svg' alt='Impact areas' />
          </Box>
          <Box>
            <Typography variant='h5' sx={{ mb: 0.5 }}>Impact areas</Typography>
            <Typography sx={{ fontSize: { xs: 24, lg: 42 }, fontWeight: 700 }}>{impacts}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(PitchSdgSlide);
