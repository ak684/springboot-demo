import React, { memo } from 'react';
import { Box, Card, Typography, useTheme } from "@mui/material";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import 'swiper/css';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { getImpactIndex } from "shared-components/utils/impact";

const bgColors = ['#041428', '#122742', '#263D5A', '#405F85', '#5B7EAA', '#89AFDF'];

const PitchSdgImpactSlide = ({ venture, goToStep }) => {
  const theme = useTheme();

  const impactCards = venture.impacts
    .map((impact, index) => (
      <Card
        key={impact.id}
        sx={{
          width: 230,
          '&:hover': {
            transform: { xs: 'none', lg: 'scale(1.1)' },
            outline: `3px solid ${theme.palette.primary.main}`
          },
          transition: '400ms all',
          cursor: 'pointer',
        }}
        onClick={() => goToStep(`impacts[${impact.id}].intro`)}
      >
        <Box
          p={2}
          display='flex'
          flexDirection='column'
          justifyContent='flex-end'
          width='100%'
          height={350}
          sx={{
            background: impact.image
              ? `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45.2%, #000 100%), url(${impact.image})`
              : bgColors[index % bgColors.length],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box display='flex' alignItems='center' gap={2}>
            {impact.positive &&
              <Typography variant='caption'
                color='secondary.dark'>Innovation {getImpactIndex(impact, venture.impacts)}</Typography>
            }
            {!impact.positive && <NegativeImpactLabel index={getImpactIndex(impact, venture.impacts)} />}
          </Box>
          <Typography variant='bodyBold' sx={{ mt: 1 }} color='white'>{impact.name}</Typography>
        </Box>
        {impact.goals.length > 0 && (
          <Box p={2} display='flex' gap={1}>
            {impact.goals.map(g => (
              <Box
                key={g.id}
                component='img'
                src={g.goal.image}
                alt={g.shortName}
                title={g.shortName}
                sx={{ borderRadius: '4px' }}
                width={50}
                height={50}
              />
            ))}
          </Box>
        )}
      </Card>
    ))

  return (
    <Box pb={{ xs: 16, sm: 4 }}>
      <Typography variant='display' align='center' sx={{ mt: { xs: 6, lg: 12 }, mb: { xs: 0, sm: 1, lg: 6 } }}>
        Our key impact areas:
      </Typography>
      <Box display={{ xs: 'none', lg: 'flex' }} px={10} flexWrap='wrap' justifyContent='center' gap={2}>
        {impactCards}
      </Box>
      <Box
        display={{ xs: 'flex', lg: 'none' }}
        width='100vw'
        px={{ xs: 3, sm: 9 }}
        sx={{ '.swiper-slide': { display: 'flex', justifyContent: 'center' } }}
      >
        <Swiper
          spaceBetween={theme.spacing(2)}
          modules={[Pagination]}
          pagination={{ clickable: false }}
          breakpoints={{
            [theme.breakpoints.values.xs]: {
              slidesPerView: 1,
            },
            [theme.breakpoints.values.sm]: {
              slidesPerView: 2,
            },
            [theme.breakpoints.values.md]: {
              slidesPerView: 3,
            }
          }}
          style={{ paddingBottom: theme.spacing(6), paddingTop: theme.spacing(3.5) }}
        >
          {impactCards.map((card, index) => (<SwiperSlide key={index}>{card}</SwiperSlide>))}
        </Swiper>
      </Box>
    </Box>
  );
};

export default memo(PitchSdgImpactSlide);
