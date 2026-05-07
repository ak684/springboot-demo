import React, { Fragment, memo } from 'react';
import { Box, Grid, Typography } from "@mui/material";
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link } from "react-router-dom";
import { lineClamp } from "shared-components/utils/styles";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import { getImpactIndex } from "shared-components/utils/impact";

// toDO: Delete this page when it is no longer needed
const VenturePublicProfileImpactsOld = ({ venture }) => {
  return (
    <Box backgroundColor='white'>
      <Box mx='auto' maxWidth={1280} px={{ xs: 3, lg: 12 }} py={4}>
        <Grid container spacing={3} backgroundColor='white' pt={4} pb={8} mt={0}>
          {venture.impacts.map((impact) => (
            <Fragment key={impact.id}>
              <Grid item xs={12} lg={6}>
                <Box
                  position='relative'
                  sx={{
                    overflow: 'hidden',
                    '&:hover .impact-image': { filter: 'blur(5px)', transform: 'scale(1.15)' }
                  }}
                >
                  <Box
                    className='impact-image'
                    width='100%'
                    height={450}
                    sx={{
                      background: impact.image
                        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45.2%, #000 100%), url(${impact.image})`
                        : `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg)`,
                      backgroundBlendMode: impact.image ? 'none' : 'color, normal, normal',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 400ms',
                    }}
                  />
                  <Box
                    position='absolute'
                    left={0}
                    top={0}
                    right={0}
                    bottom={0}
                    p={6}
                    sx={{ '&:hover .only-hover': { maxHeight: 450 } }}
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
                    {impact.goals.length > 0 && (
                      <Box display='flex' gap={0.5}>
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
                    <Box
                      className='only-hover'
                      maxHeight={0}
                      sx={{ overflow: 'hidden', transition: 'max-height 500ms' }}
                      display='flex'
                      flexDirection='column'
                      gap={2}
                    >
                      {impact.pitchDescription && (
                        <Typography variant='body' color='white' style={lineClamp(impact.goals.length > 0 ? 9 : 11)}>
                          {impact.pitchDescription}
                        </Typography>
                      )}
                      <Typography
                        component={Link}
                        to={`/public-profile/ventures/${venture.id}/impacts/${impact.id}`}
                        sx={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}
                      >
                        Learn more
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Fragment>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default memo(VenturePublicProfileImpactsOld);
