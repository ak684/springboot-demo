import React, { memo, useState } from 'react';
import {
  Box,
  Divider,
  Grid,
  IconButton,
  Link,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { getVentureTotalScore } from "shared-components/utils/scoring";
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { distinctBy, sortBy } from "shared-components/utils/lo";
import Button from "@mui/material/Button";
import { PITCH_COLORS } from "shared-components/utils/pitch";
import { GoogleMap, LoadScriptNext } from "@react-google-maps/api";
import { mapOptions } from "shared-components/utils/maps";
import Card from "@mui/material/Card";
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { getVentureAddress } from "shared-components/utils/venture";
import { useSelector } from "react-redux";
import { reportSelectors } from "store/ducks/report";
import { arraySum } from "shared-components/utils/helpers";
import CloseIcon from "@mui/icons-material/Close";
import PublicProfileStatItem from "./PublicProfileStatItem";
import GoogleMapMarker from "../GoogleMapMarker";

const PublicProfileSummary = ({ company, setTab, isPortfolio, ventures }) => {
  const [mapCenter] = useState({ lat: company.lat, lng: company.lng });
  const [showHeadquarterCard, setShowHeadquarterCard] = useState(true);
  const followers = useSelector(reportSelectors.getFollowers());
  const totalFollowers = arraySum(followers.map(val => val.value));
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  const impacts = isPortfolio ? ventures.flatMap(v => v.impacts) : company.impacts
  const indicators = arraySum(impacts.map(i => i.indicators.length));

  const stats = [{
    icon: '/images/icons/checks.svg',
    label: 'Impact areas',
    value: impacts.length,
  }, {
    icon: '/images/icons/bulb.svg',
    label: 'Indicators measured',
    value: indicators,
  }];

  if (isPortfolio) {
    stats.unshift({
      icon: '/images/icons/ventures.svg',
      label: 'Certified ventures',
      value: ventures.length,
    })
  } else {
    stats.unshift({
      icon: '/images/icons/star.svg',
      label: 'Impact potential score',
      value: `${getVentureTotalScore(company)} / 500`,
    })
  }

  const goals = sortBy(impacts
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score)
    .flatMap(i => i.goals)
    .map(g => g.goal)
    .filter(distinctBy('name')), 'number');

  const mapStyles = {
    height: isMobileView ? "350px" : "400px",
    width: "100%"
  };

  const googleStreetView = `https://maps.googleapis.com/maps/api/streetview?size=520x260&location=${company.lat},${company.lng}&key=${process.env.REACT_APP_GOOGLE_MAP_API_KEY}`;
  let missionImage;

  if (isPortfolio) {
    missionImage = company.publicSettings?.missionImage
      ? `url(${company.publicSettings?.missionImage})`
      : `linear-gradient(0deg, ${PITCH_COLORS[0]} 0%, ${PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/theme1.jpeg)`
  } else {
    missionImage = company.pitchSettings?.descriptionImage
      ? `url(${company.pitchSettings?.descriptionImage})`
      : `linear-gradient(0deg, ${company.pitchSettings?.color || PITCH_COLORS[0]} 0%, ${company.pitchSettings?.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/${company.pitchSettings?.theme || 'theme1'}.jpeg)`
  }

  return (
    <Box backgroundColor='white'>
      <Box px={{ xs: 3, lg: 12 }} pt={4} pb={{ xs: 3, lg: 8 }} mt={0} mx='auto' maxWidth={1280}>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6} lg={8} display='flex' flexDirection='column' gap={3}>
            <Typography variant='h5'>About</Typography>
            {company.pitchSettings?.description &&
              <Typography variant='body'>{company.pitchSettings?.description}</Typography>
            }
            <Box display='flex' flexDirection='column' gap={1.5}>
              {!isPortfolio && <Divider flexItem />}
              {!isPortfolio && (
                <Box display='flex' justifyContent='space-between'>
                  <Typography variant='subtitle'>Industry sector</Typography>
                  <Typography variant='subtitleBold'>{company.industries.map(i => i.title).join(', ')}</Typography>
                </Box>
              )}
              <Divider flexItem />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='subtitle'>Size</Typography>
                <Typography variant='subtitleBold'>{company.employees || 0} employees</Typography>
              </Box>
              <Divider flexItem />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='subtitle'>Social media</Typography>
                <Typography variant='subtitleBold'>{totalFollowers} followers</Typography>
              </Box>
              <Divider flexItem />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='subtitle'>Location</Typography>
                <Typography variant='subtitleBold'>{company.city ? company.city + ', ' : ''}{company.country?.title}</Typography>
              </Box>
              <Divider flexItem />
            </Box>
            <Box display='flex' flexWrap='wrap' gap={{ xs: 3, lg: 4 }}>
              {company.linkedin && (
                <Link
                  href={company.linkedin}
                  target='_blank'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <LinkedInIcon sx={{ color: '#0077B7' }} />
                  <Typography variant='body' color='text.primary'>LinkedIn</Typography>
                </Link>
              )}
              {company.facebook && (
                <Link
                  href={company.facebook}
                  target='_blank'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <FacebookIcon sx={{ color: '#3B579D' }} />
                  <Typography variant='body' color='text.primary'>Facebook</Typography>
                </Link>
              )}
              {company.instagram && (
                <Link
                  href={company.instagram}
                  target='_blank'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <InstagramIcon sx={{ color: '#0077B7' }} />
                  <Typography variant='body' color='text.primary'>Instagram</Typography>
                </Link>
              )}
              {company.twitter && (
                <Link
                  href={company.twitter}
                  target='_blank'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <XIcon sx={{ color: 'black' }} />
                  <Typography variant='body' color='text.primary'>Twitter (X)</Typography>
                </Link>
              )}
              {company.youtube && (
                <Link
                  href={company.youtube}
                  target='_blank'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <YouTubeIcon sx={{ color: '#ff0000' }} />
                  <Typography variant='body' color='text.primary'>YouTube</Typography>
                </Link>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} lg={4} display='flex' flexDirection='column' gap={3}>
            <Typography variant='h5'>Highlights</Typography>
            <Box display='flex' flexDirection='column' gap={1}>
              {stats.map(stat =>
                <PublicProfileStatItem key={stat.label} onClick={() => setTab('impacts')} {...stat} />)
              }
            </Box>
            {goals.length > 0 && !isPortfolio && (
              <Box>
                <Typography variant='subtitleBold'>We contribute to:</Typography>
                <Box mt={2} display='flex' alignItems='center' gap={0.25}>
                  {goals.slice(0, 5).map(g => (
                    <Box key={g.name} component='img' src={g.image} alt={g.shortName} width={48} height={48} />
                  ))}
                  {goals.length > 5 && (
                    <Tooltip arrow title={(
                      <Box display='flex' flexWrap='wrap' gap={1}>
                        {goals.slice(5).map(g => (
                          <Box key={g.name} component='img' src={g.image} alt={g.shortName} width={48} height={48} />
                        ))}
                      </Box>
                    )}>
                      <Typography variant='overline' color='primary.main' sx={{ ml: 1 }}>
                        + {goals.length - 5} more
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      <Box backgroundColor='background.default'>
        <Box mx='auto' px={{ xs: 0, lg: 12 }} maxWidth={1280}>
          <Grid container minHeight={420}>
            <Grid item xs={12} sm={6} minHeight={{ xs: 270, sm: 420 }}>
              <Box
                width='100%'
                height='100%'
                sx={{
                  background: missionImage,
                  backgroundBlendMode: company.pitchSettings?.descriptionImage || company.publicSettings?.missionImage ? 'none' : 'color, normal, normal',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              display='flex'
              justifyContent='center'
              py={{ xs: 3, sm: 5, lg: 8 }}
              pl={{ xs: 3, sm: 5, lg: 8 }}
              pr={{ xs: 3, sm: 5, lg: 12 }}
              backgroundColor='background.fade'
            >
              <Box flexGrow={1}>
                <Typography variant='h5'>Our mission</Typography>
                <Typography sx={{ mt: 3 }} variant='body'>{company.description}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
      {company.lat && company.lng && (
        <Box backgroundColor='background.default'>
          <Box px={{ xs: 0, lg: 12 }} py={{ xs: 3, lg: 8 }} mx='auto' maxWidth={1280}>
            <Typography variant='h5' sx={{ mb: 3, ml: { xs: 3, lg: 0 } }}>Our headquarters</Typography>
            <Box position='relative'>
              <LoadScriptNext googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}>
                <GoogleMap mapContainerStyle={mapStyles} zoom={15} center={mapCenter} options={mapOptions}>
                  <GoogleMapMarker position={{ lat: company.lat, lng: company.lng }} />
                </GoogleMap>
              </LoadScriptNext>
              {showHeadquarterCard && (
                <Card
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: 16,
                    maxWidth: { xs: 250, sm: 300 },
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    zIndex: 1,
                    border: 1,
                    borderColor: 'border'
                  }}
                >
                  <Box display='flex' justifyContent='space-between' alignItems='center' gap={1}>
                    <Typography variant='bodyBold'>Our headquarters</Typography>
                    <IconButton onClick={() => setShowHeadquarterCard(false)} sx={{ p: 0.5 }}>
                      <CloseIcon sx={{ color: 'text.primary' }} />
                    </IconButton>
                  </Box>
                  <Box
                    component='img'
                    src={company.streetImage || googleStreetView}
                    width='100%'
                    height={130}
                    sx={{ objectFit: 'cover' }}
                    alt='Headquarters location'
                  />
                  <Box display='flex' gap={1}>
                    <LocationOnOutlinedIcon />
                    <Typography variant='subtitle'>{getVentureAddress(company)}</Typography>
                  </Box>
                  {company.phone && (
                    <>
                      <Divider />
                      <Box display='flex' alignItems='center' gap={1}>
                        <PhoneOutlinedIcon />
                        <Typography variant='subtitle'>{company.phone}</Typography>
                      </Box>
                    </>
                  )}
                  {company.website && (
                    <>
                      <Divider />
                      <Box display='flex' alignItems='center' gap={1}>
                        <LanguageOutlinedIcon />
                        <Typography variant='subtitle'
                          component={Link}
                          href={company.website}
                          target='_blank'
                          color='text.primary'>
                          {company.website}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Card>
              )}
            </Box>
          </Box>
        </Box>
      )}
      {!isPortfolio && (
        <Box display='flex' alignItems='center' justifyContent='center' pb={8} backgroundColor='background.default'>
          <Button onClick={() => setTab('impacts')}>See impact details</Button>
        </Box>
      )}
    </Box>
  );
};

export default memo(PublicProfileSummary);
