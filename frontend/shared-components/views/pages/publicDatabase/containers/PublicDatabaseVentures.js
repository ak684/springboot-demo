import React, { memo } from 'react';
import { Box, Card, Divider, Grid, Link, Typography, useTheme } from "@mui/material";
import { lineClamp } from "shared-components/utils/styles";
import { useSelector } from "react-redux";
import { isDefined } from "shared-components/utils/lo";
import { dictionarySelectors } from "store/ducks/dictionary";
import { getVentureGoals } from "shared-components/utils/scoring";
import { Link as RouterLink } from 'react-router-dom';
import PublicDatabaseSearchInfo from "../components/PublicDatabaseSearchInfo";
import smartRound from "shared-components/filters/smartRound";

const getVentureImage = (v) => v.impacts.find(i => isDefined(i.image))?.image || 'https://placehold.co/160x110';

const PublicDatabaseVentures = ({ ventures, totalVentures, setHoveredVenture, cardProps = {}, mapApp, ...rest }) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());

  const ventureCards = ventures.map(v => (
    <Grid key={v.id} item xs={12} {...cardProps}>
      <Card
        sx={{
          p: '17px',
          border: `1px solid ${theme.palette.border}`,
          flexShrink: 0,
          '&:hover': { p: 2, border: `2px solid ${theme.palette.primary.main}`, boxShadow: theme => theme.shadows[6] },
        }}
        onMouseEnter={() => setHoveredVenture && setHoveredVenture(v)}
        onMouseLeave={() => setHoveredVenture && setHoveredVenture(null)}
      >
        <Typography variant='bodyBold'>{v.name}</Typography>
        <Divider sx={{ my: 1 }} />
        <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
          <Box flexBasis={160} flexGrow={0} flexShrink={0}>
            <Box
              width={{ xs: '100%', sm: 160 }}
              height={110}
              src={v.logo || getVentureImage(v)}
              component='img'
              sx={{ objectFit: 'cover', borderRadius: '4px' }}
              alt={v.name}
            />
            <Box mt={1} display='flex' gap={0.5}>
              {v.employees > 0 && (
                <Box flexBasis='50%' p={1} backgroundColor='secondary.subtle'>
                  <Typography sx={{ fontSize: 10 }}>Employees</Typography>
                  <Typography variant='captionBold' sx={{ mt: 0.25 }}>{v.employees}</Typography>
                </Box>
              )}
              <Box flexBasis='50%' p={1} backgroundColor='secondary.subtle'>
                <Typography sx={{ fontSize: 10 }}>Traction</Typography>
                <Typography variant='captionBold' sx={{ mt: 0.25 }}>
                  {v.aux?.traction > 0 ? '+' : ''}{smartRound(v.aux?.traction)}%
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box flexGrow={1}>
            <Typography variant='subtitleBold' sx={{ mb: 1 }}>Short venture activity description goes here</Typography>
            <Typography variant='subtitle' style={lineClamp(5)}>{v.description}</Typography>
          </Box>
          <Box
            display='flex'
            flexDirection='column'
            justifyContent='space-between'
            flexBasis={{ xs: 'unset', sm: 150 }}
            flexGrow={0}
            flexShrink={0}
          >
            <Box display='flex' flexDirection='column' gap={1.5}>
              {getVentureGoals(v, goals).slice(0, 3).map(goal => (
                <Box key={goal.name} display='flex' gap={1} alignItems='center'>
                  <Box component='img' src={goal.image} width={24} height={24} sx={{ borderRadius: '2px' }} />
                  <Box>
                    <Typography sx={{ fontSize: 10 }}>{goal.shortName}</Typography>
                    <Typography variant='captionBold' sx={{ mt: 0.25 }}>{Math.round(goal.rate)}%</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Link
              component={RouterLink}
              to={mapApp ? `/ventures/${v.id}` : `/public-profile/ventures/${v.id}`}
              sx={{ fontSize: 12, cursor: 'pointer', textAlign: { xs: 'center', sm: 'right' } }}
            >
              See details
            </Link>
          </Box>
        </Box>
      </Card>
    </Grid>
  ))

  return (
    <Box {...rest}>
      <PublicDatabaseSearchInfo shownVentures={ventures.length} totalVentures={totalVentures} showSort />
      <Grid container spacing={1}>
        {ventureCards}
      </Grid>
    </Box>
  );
};

export default memo(PublicDatabaseVentures);
