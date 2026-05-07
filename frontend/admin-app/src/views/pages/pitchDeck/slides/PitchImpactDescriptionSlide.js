import React, { memo } from 'react';
import { Box, Divider, styled, Typography } from "@mui/material";
import { GLOBAL_COMMUNITY_INPUT, HEADER_HEIGHT } from "shared-components/utils/constants";
import theme from "shared-components/theme";
import PitchCard from "../components/PitchCard";
import { PITCH_COLORS, PITCH_PLACEHOLDERS } from "shared-components/utils/pitch";
import { getAverageChange, getNetOutcome, sortByYear, yearTotal } from "shared-components/utils/quantification";
import moment from "moment/moment";
import { arraySum } from "shared-components/utils/helpers";
import filters from "shared-components/filters";
import { useSearchParams } from "react-router-dom";
import { use100vh } from "react-div-100vh";
import { getTypography } from "shared-components/utils/typography";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";

const StyledLeft = styled(Box)(({ theme }) => ({
  flexBasis: '55%',
  flexGrow: 0,
  flexShrink: 1,
  minWidth: 0,
  padding: theme.spacing(10, 12, 12),
  [theme.breakpoints.down('lg')]: {
    order: 1,
    padding: theme.spacing(5, 12, 0),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const StyledRight = styled(Box)(({ theme, impact, venture }) => ({
  flexBasis: '45%',
  flexShrink: 3,
  paddingLeft: theme.spacing(10),
  paddingRight: theme.spacing(10),
  paddingBottom: theme.spacing(10),
  display: 'flex',
  alignItems: 'flex-end',
  backgroundImage: impact.image
    ? `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45.2%, #000 100%), url(${impact.image})`
    : `linear-gradient(0deg, ${venture.pitchSettings.color || PITCH_COLORS[0]} 0%, ${venture.pitchSettings.color || PITCH_COLORS[0]} 100%), linear-gradient(0deg, rgba(38, 61, 90, 0.70) 0%, rgba(38, 61, 90, 0.70) 100%), url(/images/pitch/${venture.pitchSettings.theme || 'theme1'}.jpeg)`,
  backgroundBlendMode: impact.image ? 'none' : 'color, normal, normal',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  color: 'white',
  [theme.breakpoints.down('lg')]: {
    order: 0,
    flexBasis: 'unset',
    minHeight: '40vh',
    padding: theme.spacing(0, 12, 6),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const StyledValueItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  minWidth: 100,
  height: 100,
  ...getTypography('bodyBold'),
  borderRadius: '4px',
  backgroundColor: theme.palette.secondary.subtle,
  [theme.breakpoints.down("sm")]: {
    height: 60,
  },
}));

const globalCommunityView = (
  <Box
    display='flex'
    alignItems='center'
    justifyContent='center'
    flexDirection='column'
    gap={0.5}
    minWidth={100}
    height={{ xs: 60, sm: 100 }}
    backgroundColor={theme.palette.secondary.subtle}
    borderRadius='8px'
    textAlign='center'
  >
    <Box component='img' src='/images/icons/quantification/global.svg' alt={GLOBAL_COMMUNITY_INPUT} />
    <Typography variant='overline' color='secondary.main'>Global community</Typography>
  </Box>
)

const getIndicatorForecast = (impact, indicator) => {
  const productsData = sortByYear(impact.productsData);
  const currentYearIndex = productsData.findIndex(i => i.year === moment().year());
  const netOutcome = getNetOutcome(impact, indicator);
  return filters.smartRound(arraySum(netOutcome.slice(currentYearIndex, currentYearIndex + 5)) || 'No data', 0, indicator.unit);
}

const PitchImpactDescriptionSlide = ({ impact, index, clientView, venture }) => {
  const isGlobal = impact.stakeholders === GLOBAL_COMMUNITY_INPUT;
  const productsData = sortByYear(impact.productsData);
  const stakeholdersData = sortByYear(impact.stakeholdersData);
  const currentYearIndex = productsData.findIndex(i => i.year === moment().year());
  const productsForecast = arraySum(productsData.slice(currentYearIndex, currentYearIndex + 5).map(yearTotal));
  const stakeholdersForecast = arraySum(stakeholdersData.slice(currentYearIndex, currentYearIndex + 5).map(yearTotal));
  const [searchParams, setSearchParams] = useSearchParams();
  const fullHeight = use100vh();

  const goToNextSlideAndHighlight = (name) => {
    const newParams = new URLSearchParams();
    newParams.set('step', (+searchParams.get('step') + 1).toString());
    newParams.set('highlight', name);
    setSearchParams(newParams);
  };

  return (
    <Box
      display='flex'
      flexDirection={{ xs: 'column', lg: 'row' }}
      sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}
      backgroundColor='white'
      pb={{ xs: 13, sm: 10, lg: 0 }}
    >
      <StyledLeft>
        <Box display='flex' alignItems='center' gap={2}>
          <Typography variant='bodyBold' color='secondary.dark'>Impact area {index + 1}</Typography>
          {!impact.positive && <NegativeImpactLabel solid />}
        </Box>
        <Typography sx={{ mt: { xs: 2, sm: 3, lg: 4 } }} variant='h1'>{impact.name}</Typography>
        <Typography sx={{ mt: { xs: 2, sm: 3, lg: 4 }, fontSize: { xs: 14, sm: 16, lg: 18 } }}>
          {impact.pitchDescription || PITCH_PLACEHOLDERS.impactDescription}
        </Typography>
        <Typography variant='bodyBold' sx={{ my: { xs: 2, lg: 3 } }}>5 year projection</Typography>
        <PitchCard>
          <Typography variant='bodyBold' sx={{ mb: 1 }}>Output</Typography>
          <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={3}>
            <Box
              flexBasis='50%'
              flexGrow={0}
              minWidth={0}
              display='flex'
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
              sx={{
                borderRadius: '4px',
                '&:hover': {
                  transform: { xs: 'none', sm: 'scale(1.09)' },
                  outline: `2px solid ${theme.palette.primary.main}`
                },
                transition: '400ms all',
                cursor: 'pointer'
              }}
              onClick={() => goToNextSlideAndHighlight('products')}
            >
              <StyledValueItem sx={{ fontSize: { xs: 14, sm: 16, lg: 24 } }}>
                {filters.smartRound(productsForecast || 'No data')}
              </StyledValueItem>
              <Box minWidth={0} order={{ xs: -1, sm: 1 }}>
                <Typography variant='bodyBold' color='secondary.dark' noWrap title='Products/Services/Activities'>
                  Products/Services/Activities
                </Typography>
                <Typography variant='subtitle' sx={{ mt: 0.5 }}>
                  {impact.outputUnits || PITCH_PLACEHOLDERS.outputUnits}
                </Typography>
              </Box>
            </Box>
            <Box
              flexBasis='50%'
              flexGrow={0}
              minWidth={0}
              display='flex'
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
              sx={{
                borderRadius: '4px',
                '&:hover': {
                  transform: { xs: 'none', sm: 'scale(1.09)' },
                  outline: `2px solid ${theme.palette.primary.main}`
                },
                transition: '400ms all',
                cursor: 'pointer'
              }}
              onClick={() => goToNextSlideAndHighlight('stakeholders')}
            >
              {isGlobal && globalCommunityView}
              {!isGlobal && (
                <StyledValueItem sx={{ fontSize: { xs: 14, sm: 16, lg: 24 } }}>
                  {filters.smartRound(stakeholdersForecast || 'No data')}
                </StyledValueItem>
              )}
              <Box minWidth={0} order={{ xs: -1, sm: 1 }}>
                <Typography variant='bodyBold' color='secondary.dark'>Stakeholders</Typography>
                <Typography variant='subtitle' sx={{ mt: 0.5 }}>
                  {impact.stakeholders || PITCH_PLACEHOLDERS.stakeholders}
                </Typography>
              </Box>
            </Box>
          </Box>
          {impact.indicators.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant='bodyBold' sx={{ mb: 1 }}>Net impact</Typography>
              <Box mt={1} display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 1, sm: 2 }}>
                {impact.indicators.slice(0, 3).map(indicator => (
                  <Box
                    key={indicator.id}
                    flexBasis={`${100 / impact.indicators.slice(0, 3).length}%`}
                    display='flex'
                    flexDirection='column'
                    justifyContent='space-between'
                    sx={{
                      borderRadius: '4px',
                      '&:hover': {
                        transform: { xs: 'none', sm: 'scale(1.09)' },
                        outline: `2px solid ${theme.palette.primary.main}`
                      },
                      transition: '400ms all',
                      cursor: 'pointer'
                    }}
                    onClick={() => goToNextSlideAndHighlight(`indicators-${indicator.id}`)}
                  >
                    <Typography variant='caption' sx={{ mt: 0.5 }}>{indicator.name}</Typography>
                    <StyledValueItem mt={1} flexBasis={60}>
                      <Typography sx={{ fontSize: 10 }}>
                        {indicator.pitchView[impact.positive ? 'description' : 'descriptionNegative']}
                      </Typography>
                      {indicator.pitchView.name === 'NET_IMPACT' && getIndicatorForecast(impact, indicator)}
                      {indicator.pitchView.name === 'RELATIVE_CHANGE' &&
                        (getAverageChange(impact, indicator)[3] > 0 ? getAverageChange(impact, indicator)[3] + '%' : 'No data')
                      }
                      {indicator.pitchView.name === 'ABSOLUTE_CHANGE' && getAverageChange(impact, indicator)[2]}
                      {indicator.pitchView.name === 'YEAR_START' && indicator.year}
                    </StyledValueItem>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </PitchCard>
      </StyledLeft>
      <StyledRight
        impact={impact}
        venture={venture}
        sx={{ minHeight: `calc(${fullHeight}px - ${clientView ? 0 : HEADER_HEIGHT}px)` }}
      >
        <Typography variant='h3'>
          {impact.pitchInspiration || PITCH_PLACEHOLDERS.impactInspiration}
        </Typography>
      </StyledRight>
    </Box>
  );
};

export default memo(PitchImpactDescriptionSlide);
