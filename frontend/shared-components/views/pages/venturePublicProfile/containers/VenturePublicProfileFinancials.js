import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Card, Divider, Grid, Link, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { GoogleMap, InfoWindow, LoadScriptNext } from "@react-google-maps/api";
import moment from "moment";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { clone, distinctBy } from "shared-components/utils/lo";
import { arrayCumulative, arraySum } from "shared-components/utils/helpers";
import { calculateCenter, mapOptions } from "shared-components/utils/maps";
import { lineClamp } from "shared-components/utils/styles";
import FieldLabel from "../../../components/FieldLabel";
import filters from "shared-components/filters";
import TimelineChart from "../../../components/timeline/TimelineChart";
import GoogleMapMarker from "../../../components/GoogleMapMarker";

const VenturePublicProfileFinancials = ({ venture }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const fundingRounds = clone(venture.funding).sort((r1, r2) => moment(r1.date) - moment(r2.date));
  const totalFunding = arraySum(fundingRounds.map(r => r.amount || 0));
  const cumulativeFunding = arrayCumulative(fundingRounds.map(r => r.amount || 0));
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletView = useMediaQuery(theme.breakpoints.down('lg'));
  const mapRef = useRef(null);

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const awardMarkers = venture.awards
    .filter(a => a.lat && a.lng)
    .map(a => ({ id: a.id, lat: a.lat, lng: a.lng, label: a.name }))
  const accelerationMarkers = venture.acceleration
    .filter(a => a.lat && a.lng)
    .map(a => ({ id: a.id, lat: a.lat, lng: a.lng, label: a.name }))
  const investorMarkers = venture.funding.flatMap(f => f.investors)
    .filter(i => i.lat && i.lng)
    .filter(distinctBy('name'))
    .map(i => ({ lat: i.lat, lng: i.lng, label: i.name }));

  const allMarkers = [...investorMarkers, ...accelerationMarkers, ...awardMarkers];
  useEffect(() => {
    const newCenter = calculateCenter(allMarkers);
    setMapCenter(newCenter);
    setTimeout(() => {
      if (mapRef.current && allMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        allMarkers.forEach(marker => {
          bounds.extend(new window.google.maps.LatLng(marker.lat, marker.lng));
        });
        mapRef.current.fitBounds(bounds);
      }
    }, 100);
  }, []);

  return (
    <Box backgroundColor='white'>
      <Box mx='auto' maxWidth={1280} px={{ xs: 3, lg: 12 }} py={4}>
        <Grid container spacing={5}>
          <Grid item xs={12} lg={6} display='flex' flexDirection='column' gap={{ xs: 5, lg: 4 }}>
            {venture.acceleration.length > 0 && (
              <Box>
                <Typography variant='h5' sx={{ mb: 3 }}>Accelerations</Typography>
                <Card
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'border',
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <Box display='flex' gap={2}>
                    <FieldLabel sx={{ flexBasis: '30%' }}>Name</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '25%' }}>Start</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '25%' }}>Finish</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '20%' }} align='right'>Location</FieldLabel>
                  </Box>
                  <Divider />
                  {venture.acceleration.map((a) => (
                    <Box key={a.id} display='flex' gap={2}>
                      <Box
                        sx={{ flexBasis: '30%', flexGrow: 0 }}
                        display='flex'
                        alignItems='flex-start'
                        justifyContent='space-between'
                        gap={0.5}
                      >
                        <Tooltip title={a.name}>
                          <Typography variant='subtitleBold' style={lineClamp(3)}>
                            {a.name}
                          </Typography>
                        </Tooltip>
                        {a.website && (
                          <Link
                            component={Link}
                            href={a.website}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <OpenInNewIcon sx={{ width: 18, height: 18, color: 'text.primary', cursor: 'pointer' }} />
                          </Link>
                        )}
                      </Box>
                      <Typography variant='subtitle' sx={{ flexBasis: '25%', flexGrow: 0 }}>
                        {filters.date(a.start)}
                      </Typography>
                      <Typography variant='subtitle' sx={{ flexBasis: '25%', flexGrow: 0 }}>
                        {filters.date(a.finish)}
                      </Typography>
                      <Typography variant='subtitle' sx={{ flexBasis: '20%', flexGrow: 0 }} align='right'>
                        {a.city ? a.city + ', ' : ''}{a.country?.title}
                      </Typography>
                    </Box>
                  ))}
                </Card>
                <Box display={{ xs: 'flex', sm: 'none' }} flexDirection='column' gap={2}>
                  {venture.acceleration.map((a) => (
                    <Card
                      key={a.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'border',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Name</FieldLabel>
                        <Typography variant='subtitleBold' noWrap>{a.name}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Start</FieldLabel>
                        <Typography variant='subtitle' noWrap>{filters.date(a.start)}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Finish</FieldLabel>
                        <Typography variant='subtitle' noWrap>{filters.date(a.finish)}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Location</FieldLabel>
                        <Typography variant='subtitle' noWrap>
                          {a.city ? a.city + ', ' : ''}{a.country?.title}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
            {venture.awards.length > 0 && (
              <Box>
                <Typography variant='h5' sx={{ mb: 3 }}>Prizes & Awards</Typography>
                <Card sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'border',
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Box display='flex' gap={1}>
                    <FieldLabel sx={{ flexBasis: '40%' }}>Name</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '20%' }}>Provided by</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '20%' }}>Location</FieldLabel>
                    <FieldLabel sx={{ flexBasis: '20%' }} align='right'>Amount</FieldLabel>
                  </Box>
                  <Divider />
                  {venture.awards.map((a) => (
                    <Box key={a.id} display='flex' gap={1}>
                      <Box flexBasis='40%' flexGrow={0} minWidth={0}>
                        <Tooltip title={a.name}>
                          <Typography variant='subtitleBold' style={lineClamp(3)}>{a.name}</Typography>
                        </Tooltip>
                        <Typography variant='caption' sx={{ mt: 0.25 }}>{filters.date(a.date)}</Typography>
                      </Box>
                      <Typography
                        variant='subtitle'
                        sx={{ flexBasis: '20%', flexGrow: 0 }}
                        style={lineClamp(3)}
                        title={a.company}
                      >
                        {a.company}
                      </Typography>
                      <Typography variant='subtitle' sx={{ flexBasis: '20%', flexGrow: 0 }} style={lineClamp(3)}>
                        {a.city ? a.city + ', ' : ''}{a.country?.title}
                      </Typography>
                      <Typography variant='subtitle' sx={{ flexBasis: '20%', flexGrow: 0 }} align='right'>
                        {filters.number(a.amount)} {venture.currency.isoCode}
                      </Typography>
                    </Box>
                  ))}
                </Card>
                <Box display={{ xs: 'flex', sm: 'none' }} flexDirection='column' gap={2}>
                  {venture.awards.map((a) => (
                    <Card
                      key={a.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'border',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Name</FieldLabel>
                        <Typography variant='subtitleBold' noWrap>{a.name}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Date</FieldLabel>
                        <Typography variant='subtitle' noWrap>{filters.date(a.date)}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Provided by</FieldLabel>
                        <Typography variant='subtitle' noWrap>{a.company}</Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Location</FieldLabel>
                        <Typography variant='subtitle' noWrap>
                          {a.city ? a.city + ', ' : ''}{a.country?.title}
                        </Typography>
                      </Box>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                        <FieldLabel>Amount</FieldLabel>
                        <Typography variant='subtitle' noWrap>
                          {filters.number(a.amount)} {venture.currency.isoCode}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} lg={6} display='flex' flexDirection='column' gap={3}>
            <Typography variant='h5'>Funding</Typography>
            <Box display='flex' flexDirection='column' gap={1}>
              {fundingRounds.map((round, index) => (
                <Card
                  key={round.id}
                  sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <Box>
                    <Typography variant='subtitleBold'>{round.type.label}</Typography>
                    <Typography variant='caption' sx={{ mt: 0.5 }}>
                      {moment(round.date).format('MMM, YYYY')}
                    </Typography>
                  </Box>
                  {round.investors.length > 0 && (
                    <Fragment>
                      <Box display={{ xs: 'none', sm: 'flex' }} gap={2}>
                        <FieldLabel sx={{ width: '40%', flexGrow: 0 }}>Investor</FieldLabel>
                        <FieldLabel sx={{ width: '30%', flexGrow: 0 }}>Location</FieldLabel>
                        <FieldLabel sx={{ flexGrow: 1 }} align='right'>Amount raised</FieldLabel>
                      </Box>
                      <Divider flexItem />
                      {round.investors.map((investor, i) => (
                        <Box
                          key={i}
                          display='flex'
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          gap={2}
                        >
                          <Box display='flex' gap={1} width={{ xs: 'unset', sm: '40%' }} flexGrow={0}>
                            <Avatar sx={{ width: 32, height: 32 }} src={investor.avatar} />
                            <Box>
                              <Typography variant='subtitleBold'>{investor.name}</Typography>
                              <Typography variant='caption' sx={{ mt: 0.25 }}>{investor.company}</Typography>
                            </Box>
                          </Box>
                          {(investor.city || investor.country) && (
                            <Typography sx={{ width: { xs: 'unset', sm: '30%' }, flexGrow: 0 }} variant='subtitle'>
                              {investor.city ? investor.city + ', ' : ''}{investor.country?.title}
                            </Typography>
                          )}
                          {investor.amount > 0 && (
                            <Typography variant='subtitle' align='right' sx={{ flexGrow: 1 }}>
                              {filters.number(investor.amount)} {venture.currency.isoCode}
                            </Typography>
                          )}
                          <Divider sx={{ display: { xs: 'block', sm: 'none' } }} flexItem />
                        </Box>
                      ))}
                    </Fragment>
                  )}
                  <Divider sx={{ display: { xs: 'none', sm: 'block' } }} flexItem />
                  <Box
                    display='flex'
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent={{ xs: 'flex-start', sm: 'space-between' }}
                    gap={1}
                  >
                    <Typography variant='subtitleBold'>Total</Typography>
                    <Typography variant='subtitle'>
                      {filters.number(round.amount)} {venture.currency.isoCode}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
        <Box mt={5}>
          <Typography variant='h5' sx={{ mb: 3 }}>Timeline</Typography>
          <TimelineChart venture={venture} />
        </Box>
        <Box mt={5}>
          <Typography variant='h5' sx={{ mb: 3 }}>Funding rounds</Typography>
          <Card sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fundingRounds.map((round, index) => (
              <Box key={round.id}>
                <Box display='flex' height={20} position='relative' backgroundColor='secondary.subtle'>
                  <Box width={`${(cumulativeFunding[index] - round.amount) / totalFunding * 100}%`} />
                  <Box width={`${round.amount / totalFunding * 100}%`}
                    height={20}
                    backgroundColor='secondary.main' />
                </Box>
                <Box display='flex' justifyContent='space-between'>
                  <Typography sx={{ mt: 0.5 }} variant='caption'>{round.type.label}</Typography>
                  <Typography sx={{ mt: 0.5 }} variant='caption'>
                    {filters.number(round.amount)} {venture.currency.isoCode}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Box>
              <Box height={20} position='relative' backgroundColor='primary.main' />
              <Box display='flex' justifyContent='space-between'>
                <Typography sx={{ mt: 0.5 }} variant='captionBold'>Total funding</Typography>
                <Typography sx={{ mt: 0.5 }} variant='captionBold'>
                  {filters.number(totalFunding)} {venture.currency.isoCode}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
        <Box mt={5}>
          <Box
            mb={3}
            display='flex'
            flexDirection={{ xs: 'column', lg: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            gap={2}
          >
            <Typography variant='h5'>Impact enabler map</Typography>
            <Box display='flex' gap={{ xs: 3, sm: 4 }}>
              <Box display='flex' alignItems='center' gap={1}>
                <Box width={12}
                  height={12}
                  sx={{ borderRadius: '50%' }}
                  backgroundColor='primary.main'
                  flexShrink={0}
                />
                <Typography variant='subtitle'>Investors & Donors</Typography>
              </Box>
              <Box display='flex' alignItems='center' gap={1}>
                <Box width={12}
                  height={12}
                  sx={{ borderRadius: '50%' }}
                  backgroundColor='success.main'
                  flexShrink={0}
                />
                <Typography variant='subtitle'>Incubation & Acceleration</Typography>
              </Box>
              <Box display='flex' alignItems='center' gap={1}>
                <Box width={12}
                  height={12}
                  sx={{ borderRadius: '50%' }}
                  backgroundColor='warning.main'
                  flexShrink={0}
                />
                <Typography variant='subtitle'>Awards & Prizes</Typography>
              </Box>
            </Box>
          </Box>
          <LoadScriptNext googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}>
            <GoogleMap
              mapContainerStyle={{
                height: isMobileView ? 260 : 400,
                width: isTabletView ? 'calc(100% + 48px)' : '100%',
                borderRadius: isTabletView ? 0 : '16px',
                marginLeft: isTabletView ? -24 : 0,
              }}
              zoom={2}
              center={mapCenter}
              options={mapOptions}
              onLoad={onMapLoad}
            >
              {investorMarkers.map((marker, index) => (
                <GoogleMapMarker
                  key={index}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  onMouseOver={() => setSelectedMarker(marker)}
                  onMouseOut={() => setSelectedMarker(null)}
                />
              ))}
              {awardMarkers.map(marker => (
                <GoogleMapMarker
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  fill={theme.palette.warning.main}
                  onMouseOver={() => setSelectedMarker(marker)}
                  onMouseOut={() => setSelectedMarker(null)}
                />
              ))}
              {accelerationMarkers.map(marker => (
                <GoogleMapMarker
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  fill={theme.palette.success.main}
                  onMouseOver={() => setSelectedMarker(marker)}
                  onMouseOut={() => setSelectedMarker(null)}
                />
              ))}
              {selectedMarker && (
                <InfoWindow
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                  options={{ pixelOffset: new window.google.maps.Size(0, -34) }}
                >
                  <div>{selectedMarker.label}</div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScriptNext>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(VenturePublicProfileFinancials);
