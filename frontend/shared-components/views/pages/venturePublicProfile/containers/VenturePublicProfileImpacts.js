import React, { Fragment, memo, useEffect, useState } from 'react';
import { Box, Grid, Typography } from "@mui/material";
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import VenturePublicProfileIndicatorCard from "../components/VenturePublicProfileIndicatorCard";
import { noteThunks } from "store/ducks/note";
import { useDispatch } from "react-redux";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getImpactIndex } from "shared-components/utils/impact";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import { PITCH_COLORS } from "shared-components/utils/pitch";

const VenturePublicProfileImpacts = ({ venture }) => {
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    venture.impacts.forEach((impact) => {
      impact.indicators.forEach((indicator) => {
        dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
          .then(res => {
            setPreNotes(val => ({ ...val, [indicator.id]: res.payload }));
          });
        dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
          .then(res => {
            setPostNotes(val => ({ ...val, [indicator.id]: res.payload }));
          });
      })
    })
  }, []);

  return (
    <Box backgroundColor='white'>
      <Box mx='auto' maxWidth={1280} px={{ xs: 3, lg: 12 }} py={4}>
        <Grid container spacing={7} backgroundColor='white' pt={4} pb={8} mt={0}>
          {venture.impacts.map((impact, index) => (
            <Fragment key={impact.id}>
              <Grid item xs={9} order={index % 2 + index}>
                <Box position='relative' sx={{ '&:hover .impact-image': { filter: 'blur(5px)' } }}>
                  <Box
                    className='impact-image'
                    width='100%'
                    height={394}
                    sx={{
                      background: impact.image
                        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45.2%, #000 100%), url(${impact.image})`
                        : `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg)`,
                      backgroundBlendMode: impact.image ? 'none' : 'color, normal, normal',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <Box
                    position='absolute'
                    left={0}
                    top={0}
                    right={0}
                    bottom={0}
                    p={6}
                    sx={{ '&:hover .only-hover': { display: 'flex' } }}
                    display='flex'
                    flexDirection='column'
                    justifyContent='flex-end'
                    gap={2}
                  >
                    <Box
                      position='absolute'
                      top={8}
                      right={8}
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      width={30}
                      height={30}
                      backgroundColor='rgba(0,0,0,0.2)'
                      sx={{ borderRadius: '4px' }}
                    >
                      <VisibilityIcon sx={{ color: 'white', width: 20, height: 20 }} />
                    </Box>
                    <Box>
                      <Box mb={1} display='flex' alignItems='center' gap={2}>
                        <Typography variant='subtitleBold' color='white'>
                          {impact.positive ? 'Innovation' : 'Negative impact'} {getImpactIndex(impact, venture.impacts)}
                        </Typography>
                        {!impact.positive && <NegativeImpactLabel />}
                      </Box>
                      <Typography variant='h5' color='white'>{impact.name}</Typography>
                    </Box>
                    {impact.pitchDescription && (
                      <Typography variant='body' className='only-hover' sx={{ display: 'none' }} color='white'>
                        {impact.pitchDescription}
                      </Typography>
                    )}
                    {impact.goals.length > 0 && (
                      <Box className='only-hover' sx={{ display: 'none' }} display='flex' gap={0.5}>
                        {impact.goals.map(g => (
                          <Box
                            key={g.id}
                            width={32}
                            height={32}
                            component='img'
                            src={g.goal.image}
                            alt={g.goal.shortName}
                            sx={{ borderRadius: '3px' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={3} order={index} display='flex' flexDirection='column' gap={3} justifyContent='center'>
                {impact.indicators.length > 0 && (
                  <Box sx={{ '.swiper-pagination': { bottom: -6 } }}>
                    <Swiper
                      slidesPerView={1}
                      modules={[Pagination, Autoplay]}
                      pagination={{ clickable: true }}
                      autoplay={{
                        delay: 6000,
                        disableOnInteraction: false,
                      }}
                      onSwiper={(swiper) => {
                        swiper.el.onmouseover = () => swiper.autoplay.stop();
                        swiper.el.onmouseout = () => swiper.autoplay.start();
                      }}
                      style={{ paddingBottom: 24 }}
                    >
                      {impact.indicators.map(indicator => (
                        <SwiperSlide key={indicator.id}>
                          <VenturePublicProfileIndicatorCard
                            impact={impact}
                            indicator={indicator}
                            preNote={preNotes[indicator.id]}
                            postNote={postNotes[indicator.id]}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </Box>
                )}
              </Grid>
            </Fragment>
          ))}
        </Grid>
      </Box>
    </Box>
  )
    ;
};

export default memo(VenturePublicProfileImpacts);
