import React, { memo, useEffect, useState } from 'react';
import { Box, Divider, styled, Tooltip, Typography, useTheme } from "@mui/material";
import { GLOBAL_COMMUNITY_INPUT } from "shared-components/utils/constants";
import theme from "shared-components/theme";
import PitchCard from "../components/PitchCard";
import { PITCH_PLACEHOLDERS } from "shared-components/utils/pitch";
import useChart from "shared-components/hooks/useChart";
import { clone, sortBy } from "shared-components/utils/lo";
import barChartConfig from "../chart/barChart";
import {
  getAverageChange,
  getCalcProp,
  getIndicatorNetOutcomeChartData,
  getNetOutcome,
  getTotalOutcome,
  sortByYear,
  yearToDate,
  yearTotal
} from "shared-components/utils/quantification";
import moment from "moment/moment";
import { arraySum } from "shared-components/utils/helpers";
import filters from "shared-components/filters";
import smartRound from "shared-components/filters/smartRound";
import NegativeImpactLabel from "shared-components/views/components/NegativeImpactLabel";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useSearchParams } from "react-router-dom";
import { noteThunks } from "store/ducks/note";
import { useDispatch } from "react-redux";
import EvidenceCard from "../../../common/notes/EvidenceCard";
import LinkCard from "../../../common/notes/LinkCard";
import FileCard from "../../../common/notes/FileCard";

const globalCommunityView = (
  <Box
    mt={2}
    display='flex'
    alignItems='center'
    justifyContent='center'
    flexDirection='column'
    gap={0.5}
    height={96}
    backgroundColor={theme.palette.secondary.subtle}
    borderRadius='8px'
    textAlign='center'
  >
    <Box component='img' src='/images/icons/quantification/global.svg' alt={GLOBAL_COMMUNITY_INPUT} />
    <Typography variant='overline' color='secondary.main'>Global community</Typography>
  </Box>
);

const emptyChartView = (
  <Box
    display='flex'
    alignItems='center'
    justifyContent='center'
    height={96}
    borderRadius='4px'
    backgroundColor='secondary.subtle'
  >
    <Typography variant='bodyBold'>No data</Typography>
  </Box>
);

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    padding: 0,
    background: 'transparent',
  },
}));

const DataItem = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.secondary.subtle,
  borderRadius: '4px',
  textAlign: 'center',
  height: 96,
}));

const getProductsChartData = (impact) => {
  const config = clone(barChartConfig);
  const productsData = sortByYear(impact.productsData);
  config.xAxis.data = productsData.map(v => '\'' + String(v.year).slice(-2));
  config.series[0].data = productsData.map(v => yearTotal(v));
  return config;
}

const getStakeholdersChartData = (impact) => {
  const config = clone(barChartConfig);
  const stakeholdersData = sortByYear(impact.stakeholdersData);
  config.xAxis.data = stakeholdersData.map(v => '\'' + String(v.year).slice(-2));
  config.series[0].data = stakeholdersData.map(v => yearTotal(v));
  return config;
}

const getNetContribution = (impact, indicator) => {
  const totalOutcome = getTotalOutcome(impact, indicator);
  const netOutcome = getNetOutcome(impact, indicator);
  const yearIndex = impact.productsData.findIndex(d => d.year === moment().year());

  if (yearIndex > -1) {
    return filters.smartRound(arraySum(netOutcome.slice(yearIndex, yearIndex + 4)) / arraySum(totalOutcome.slice(yearIndex, yearIndex + 4)) * 100);
  }
};

const getFiveYearNetOutcome = (impact, indicator) => {
  const yearIndex = impact.productsData.findIndex(d => d.year === moment().year());

  if (yearIndex > -1) {
    return smartRound(arraySum(getNetOutcome(impact, indicator).slice(yearIndex, yearIndex + 5)) || 'No data', 0, indicator.unit);
  } else {
    return 'No data';
  }
};

const getFiveYearTotalOutcome = (impact, indicator) => {
  const yearIndex = impact.productsData.findIndex(d => d.year === moment().year());

  if (yearIndex > -1) {
    return smartRound(arraySum(getTotalOutcome(impact, indicator).slice(yearIndex, yearIndex + 5)) || 'No data', 0, indicator.unit);
  } else {
    return 'No data';
  }
};

const riskProvided = (note, preNote) => {
  const source = note?.same ? preNote : note;
  return source?.links.length > 0 || source?.files.length > 0;
}

const getRiskItem = (note, preNote) => {
  const source = note.same ? preNote : note;
  return sortBy([...source.links, ...source.files], 'risk')[0];
}

const getIndicatorScore = (impact, indicator) => (impact.scoring.at(-1)?.indicatorScores || []).find(i => i.indicator?.id === indicator.id);

const PitchImpactDetailsSlide = ({ impact, preview }) => {
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const theme = useTheme();
  const isGlobal = impact.stakeholders === GLOBAL_COMMUNITY_INPUT;
  const dispatch = useDispatch();

  useChart(`products-chart${preview ? '-preview' : ''}`, getProductsChartData, impact.productsData.length > 0, impact);
  useChart(`stakeholders-chart${preview ? '-preview' : ''}`, getStakeholdersChartData, impact.stakeholdersData.length > 0 && !isGlobal, impact);

  for (let i = 0; i < impact.indicators.length; i++) {
    useChart(`indicator-${i}-outcome${preview ? '-preview' : ''}`, getIndicatorNetOutcomeChartData, impact.productsData.length > 0, impact, impact.indicators[i]);
  }

  const productsData = sortByYear(impact.productsData);
  const stakeholdersData = sortByYear(impact.stakeholdersData);
  const currentYearIndex = productsData.findIndex(i => i.year === moment().year());
  const productsSinceInception = currentYearIndex === -1
    ? 'No data'
    : filters.smartRound((arraySum(productsData.slice(0, currentYearIndex).map(yearTotal)) + yearToDate(productsData[currentYearIndex])) || 'No data');
  const stakeholdersSinceInception = currentYearIndex === -1
    ? 'No data'
    : filters.smartRound((arraySum(stakeholdersData.slice(0, currentYearIndex).map(yearTotal)) + yearToDate(stakeholdersData[currentYearIndex])) || 'No data');
  const productsYtd = currentYearIndex === -1 ? 'No data' : filters.smartRound(yearToDate(productsData[currentYearIndex]) || 'No data');
  const stakeholdersYtd = currentYearIndex === -1 ? 'No data' : filters.smartRound(yearToDate(stakeholdersData[currentYearIndex]) || 'No data');
  const products5yForecast = smartRound(arraySum(
    productsData
      .slice(currentYearIndex, currentYearIndex + 5)
      .map(yearTotal)
  ) || 'No data');
  const stakeholders5yForecast = smartRound(arraySum(
    stakeholdersData
      .slice(currentYearIndex, currentYearIndex + 5)
      .map(yearTotal)
  ) || 'No data');
  const impactGeography = [...impact.geography.map(v => v.title), ...impact.geographyCustom].join(', ')
  const [searchParams, setSearchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');

  useEffect(() => {
    let timeoutId;
    if (highlight) {
      timeoutId = setTimeout(() => {
        searchParams.delete('highlight');
        setSearchParams(searchParams);
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    impact.indicators.forEach(indicator => {
      dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
        .then(res => {
          setPreNotes(val => ({ ...val, [indicator.id]: res.payload }));
        });
      dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
        .then(res => {
          setPostNotes(val => ({ ...val, [indicator.id]: res.payload }));
        });
    })
  }, []);

  return (
    <Box pb={{ xs: 16, lg: 4 }} pt={4} pr={{ xs: 3, lg: 12 }} pl={{ xs: 3, sm: 8 }}>
      <Box display='flex' alignItems='center' gap={2}>
        <Typography variant='h4'>{impact.name}</Typography>
        {!impact.positive && <NegativeImpactLabel solid />}
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box display='flex' flexWrap={{ xs: 'wrap', lg: 'nowrap' }} gap={2}>
        <Box flexBasis={{ xs: '100%', lg: '32%' }} display='flex' flexDirection='column' gap={2}>
          <Typography variant='h5'>Theory of change</Typography>
          <PitchCard sx={{ minHeight: 163 }}>
            <Box display='flex' alignItems='center' gap={1} height='100%'>
              <Box textAlign='center' flexBasis={72} flexGrow={0} flexShrink={0}>
                <Box component='img' alt='What' src='/images/icons/scoring/what.svg' width={25} />
                <Typography variant='captionBold'>What</Typography>
              </Box>
              <Box>
                <Box>
                  <Typography variant='subtitleBold'>Innovation</Typography>
                  <Typography variant='caption' sx={{ mt: 0.5 }}>
                    {impact.innovation || PITCH_PLACEHOLDERS.innovation}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant='subtitleBold'>Change (impact)</Typography>
                  <Typography variant='caption' sx={{ mt: 0.5 }}>
                    {impact.change || PITCH_PLACEHOLDERS.change}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </PitchCard>
          <PitchCard sx={{ minHeight: 163 }}>
            <Box display='flex' alignItems='center' gap={1} height='100%'>
              <Box textAlign='center' flexBasis={72} flexGrow={0} flexShrink={0}>
                <Box component='img' alt='Who' src='/images/icons/scoring/who.svg' width={25} />
                <Typography variant='captionBold'>Who</Typography>
              </Box>
              <Box>
                <Box>
                  <Typography variant='subtitleBold'>Stakeholders</Typography>
                  <Typography variant='caption' sx={{ mt: 0.5 }}>
                    {impact.stakeholders || PITCH_PLACEHOLDERS.stakeholders}
                  </Typography>
                </Box>
                {impactGeography && (
                  <Box mt={1}>
                    <Typography variant='subtitleBold'>Geographic boundary</Typography>
                    <Typography variant='caption' sx={{ mt: 0.5 }}>{impactGeography}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </PitchCard>
        </Box>
        <Box flexBasis={{ xs: '100%', sm: 'calc(50% - 9px)', lg: '32%' }} display='flex' flexDirection='column' gap={2}>
          <Typography variant='h5'>Key figures</Typography>
          <PitchCard>
            <Typography variant='subtitleBold'>
              {impact.outputUnits || PITCH_PLACEHOLDERS.outputUnits}
            </Typography>
            <Box mt={2} display='flex' gap={1}>
              <DataItem>
                <Box>
                  <Typography sx={{ mb: 0.5 }} variant='caption'>Since inception</Typography>
                  <Typography variant='bodyBold'>{productsSinceInception}</Typography>
                </Box>
              </DataItem>
              <DataItem>
                <Box>
                  <Typography sx={{ mb: 0.5 }} variant='caption'>YTD</Typography>
                  <Typography variant='bodyBold'>{productsYtd}</Typography>
                </Box>
              </DataItem>
              <DataItem>
                <Box>
                  <Typography sx={{ mb: 0.5 }} variant='caption'>5Y forecast</Typography>
                  <Typography variant='bodyBold'>{products5yForecast}</Typography>
                </Box>
              </DataItem>
            </Box>
          </PitchCard>
          <PitchCard>
            <Typography variant='subtitleBold'>Stakeholders reached</Typography>
            {isGlobal && globalCommunityView}
            {!isGlobal && (
              <Box mt={2} display='flex' gap={1}>
                <DataItem>
                  <Box>
                    <Typography sx={{ mb: 0.5 }} variant='caption'>Since inception</Typography>
                    <Typography variant='bodyBold'>{stakeholdersSinceInception}</Typography>
                  </Box>
                </DataItem>
                <DataItem>
                  <Box>
                    <Typography sx={{ mb: 0.5 }} variant='caption'>YTD</Typography>
                    <Typography variant='bodyBold'>{stakeholdersYtd}</Typography>
                  </Box>
                </DataItem>
                <DataItem>
                  <Box>
                    <Typography sx={{ mb: 0.5 }} variant='caption'>5Y forecast</Typography>
                    <Typography variant='bodyBold'>{stakeholders5yForecast}</Typography>
                  </Box>
                </DataItem>
              </Box>
            )}
          </PitchCard>
        </Box>
        <Box flexBasis={{ xs: '100%', sm: 'calc(50% - 9px)', lg: '36%' }} display='flex' flexDirection='column' gap={2}>
          <Typography variant='h5'>Yearly values</Typography>
          <PitchCard
            sx={{
              outline: `3px solid ${highlight === 'products' ? theme.palette.primary.main : 'transparent'}`,
              transition: '400ms all'
            }}
          >
            <Typography variant='subtitleBold' sx={{ mb: 2 }}>
              {impact.outputUnits || PITCH_PLACEHOLDERS.outputUnits}
            </Typography>
            {impact.productsData.length === 0 && emptyChartView}
            {impact.productsData.length > 0 && (
              <Box id={`products-chart${preview ? '-preview' : ''}`} height={96} />
            )}
          </PitchCard>
          <PitchCard
            sx={{
              outline: `3px solid ${highlight === 'stakeholders' ? theme.palette.primary.main : 'transparent'}`,
              transition: '400ms all'
            }}
          >
            <Typography variant='subtitleBold' sx={{ mb: 2 }}>Stakeholders reached</Typography>
            {impact.stakeholdersData.length === 0 && emptyChartView}
            {impact.stakeholdersData.length > 0 && !isGlobal && (
              <Box
                id={`stakeholders-chart${preview ? '-preview' : ''}`}
                height={96}
                style={{ display: isGlobal ? 'none' : 'block' }}
              />
            )}
            {impact.stakeholdersData.length > 0 && isGlobal && globalCommunityView}
          </PitchCard>
        </Box>
      </Box>
      <Box mt={2} display='flex' flexDirection='column' gap={2}>
        {impact.indicators.map((indicator, indicatorIndex) => (
          <PitchCard
            key={indicator.id}
            sx={{
              overflow: 'visible',
              outline: `3px solid ${highlight === `indicators-${indicator.id}` ? theme.palette.primary.main : 'transparent'}`,
              transition: '400ms all'
            }}
          >
            <Box display='flex' flexWrap={{ xs: 'wrap', lg: 'nowrap' }} gap={{ xs: 2, lg: 1 }}>
              <Box
                flexBasis={{ xs: '100%', lg: '32%' }}
                flexGrow={{ xs: 1, lg: 0 }}
                flexShrink={0}
                display='flex'
                minWidth={0}
              >
                <Box
                  flexBasis={72}
                  flexGrow={0}
                  flexShrink={0}
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  justifyContent='center'
                  textAlign='center'
                >
                  <Box component='img' alt='How much' src='/images/icons/scoring/how_much.svg' width={25} />
                  <Typography variant='captionBold' sx={{ mt: 0.5 }}>How<br />much</Typography>
                </Box>
                <Box flexGrow={1} display='flex' flexDirection='column' gap={2}>
                  <Typography variant='subtitleBold'>Indicator {indicatorIndex + 1}</Typography>
                  <Box
                    display='flex'
                    alignItems='center'
                    flexGrow={1}
                    p={2}
                    sx={{ border: `1px solid ${theme.palette.border}`, borderRadius: '4px' }}
                  >
                    <Typography variant='caption'>{indicator.name}</Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                flexBasis={{ xs: '100%', lg: '68%' }}
                flexGrow={0}
                flexShrink={0}
                display='flex'
                flexWrap={{ xs: 'wrap', lg: 'nowrap' }}
                gap={{ xs: 2, lg: 1 }}
                minWidth={0}
              >
                <Box
                  flexBasis={{ xs: '100%', lg: '45%' }}
                  flexGrow={0}
                  flexShrink={0}
                  minWidth={0}
                  display='flex'
                  flexDirection='column'
                  gap={2}
                >
                  <Typography variant='subtitleBold'>
                    Average change per&nbsp;
                    {getCalcProp(indicator, impact) === 'stakeholdersData' ? 'stakeholder' : 'product/service/activity'}
                  </Typography>
                  <Box
                    display='flex'
                    flexGrow={1}
                    sx={{ border: `1px solid ${theme.palette.border}`, borderRadius: '4px' }}
                    height={95}
                  >
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      justifyContent='center'
                      flexGrow={1}
                      gap={0.5}
                      p={{ xs: 1, sm: 2 }}
                      sx={{ borderRight: `1px solid ${theme.palette.border}` }}
                      minWidth={0}
                    >
                      <Typography variant='caption'>Previous</Typography>
                      <Typography variant='bodyBold'>{getAverageChange(impact, indicator)[0]}</Typography>
                      {riskProvided(preNotes[indicator.id]) && (
                        <Box display='flex' alignItems='center' gap={1}>
                          <Box component='img' src='/images/icons/scoring/risk.svg' width={23} />
                          <Typography variant='caption'>{getRiskItem(preNotes[indicator.id]).risk}% risk</Typography>
                          <StyledTooltip
                            title={
                              <EvidenceCard
                                item={getRiskItem(preNotes[indicator.id])}
                                score={getIndicatorScore(impact, indicator)}
                              >
                                {
                                  getRiskItem(preNotes[indicator.id]).link ?
                                    <LinkCard link={getRiskItem(preNotes[indicator.id])} /> :
                                    <FileCard
                                      file={getRiskItem(preNotes[indicator.id])}
                                    />
                                }
                              </EvidenceCard>
                            }
                          >
                            <InfoOutlinedIcon sx={{ color: 'secondary.main', width: 20, cursor: 'pointer' }} />
                          </StyledTooltip>
                        </Box>
                      )}
                    </Box>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      justifyContent='center'
                      flexGrow={1}
                      gap={0.5}
                      p={{ xs: 1, sm: 2 }}
                      sx={{ borderRight: `1px solid ${theme.palette.border}` }}
                      minWidth={0}
                    >
                      <Typography variant='caption'>Post</Typography>
                      <Typography variant='bodyBold'>{getAverageChange(impact, indicator)[1]}</Typography>
                      {riskProvided(postNotes[indicator.id], preNotes[indicator.id]) && (
                        <Box display='flex' alignItems='center' gap={1}>
                          <Box component='img' src='/images/icons/scoring/risk.svg' width={23} />
                          <Typography variant='caption'>{getRiskItem(postNotes[indicator.id], preNotes[indicator.id]).risk}%
                            risk</Typography>
                          <StyledTooltip
                            title={
                              <EvidenceCard
                                item={getRiskItem(postNotes[indicator.id], preNotes[indicator.id])}
                                score={getIndicatorScore(impact, indicator)}
                              >
                                {
                                  getRiskItem(postNotes[indicator.id], preNotes[indicator.id]).link ?
                                    <LinkCard link={getRiskItem(postNotes[indicator.id], preNotes[indicator.id])} /> :
                                    <FileCard
                                      file={getRiskItem(postNotes[indicator.id], preNotes[indicator.id])}
                                    />
                                }
                              </EvidenceCard>
                            }
                          >
                            <InfoOutlinedIcon sx={{ color: 'secondary.main', width: 20, cursor: 'pointer' }} />
                          </StyledTooltip>
                        </Box>
                      )}
                    </Box>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      justifyContent='center'
                      flexGrow={1}
                      gap={0.5}
                      p={{ xs: 1, sm: 2 }}
                      minWidth={0}
                    >
                      <Typography variant='caption'>
                        {impact.positive ? 'Improvement' : 'Change'}
                      </Typography>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Typography variant='bodyBold'>{getAverageChange(impact, indicator)[2]}</Typography>
                        {getAverageChange(impact, indicator)[3] > 0 && (
                          <Box px={1} borderRadius='42px' backgroundColor={theme.palette.success.main}>
                            <Typography color='white' variant='captionBold'>
                              {getAverageChange(impact, indicator)[3]}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box flexBasis={{ xs: '100%', lg: '55%' }} flexGrow={0} flexShrink={0} minWidth={0}>
                  <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='subtitleBold'>Outcome forecast</Typography>
                    <Tooltip title={(
                      <Box p={2} display='flex' flexDirection='column' gap={2}>
                        <Typography variant='subtitle'>
                          <b>Outcome forecast</b> = {impact.positive ? 'improvement' : 'change'} per
                          stakeholder/product x the number of stakeholders reached/products sold.
                        </Typography>
                        <Typography variant='subtitle'>
                          <b>Enterprise contribution %</b> = outcome minus the counterfactuals deadweight, displacement,
                          attribution and drop-off.
                        </Typography>
                        <Typography variant='subtitle'>
                          <b>Net impact</b> = outcome, minus counterfactuals deadweight, displacement, attribution and
                          dropoff.
                        </Typography>
                        <Typography variant='subtitle'>
                          <b>Measurement risk</b> is for informational purposes, but not included in the outcome or net
                          impact calculation.
                        </Typography>
                      </Box>
                    )} placement='left'>
                      <InfoOutlinedIcon sx={{ color: 'secondary.main', mr: 1.5 }} />
                    </Tooltip>
                  </Box>
                  <Box
                    mt={2}
                    display='flex'
                    gap={1}
                    minWidth={0}
                    p={{ xs: 1, sm: 0 }}
                    sx={{ border: { xs: `1px solid ${theme.palette.border}`, sm: 'none' }, borderRadius: '4px' }}
                  >
                    {impact.productsData.length === 0 &&
                      <Box flexBasis={getNetContribution(impact, indicator) > 0 ? '40%' : '60%'}>{emptyChartView}</Box>}
                    {impact.productsData.length > 0 && (
                      <Box id={`indicator-${indicatorIndex}-outcome${preview ? '-preview' : ''}`}
                        flexBasis={getNetContribution(impact, indicator) > 0 ? '40%' : '60%'}
                        flexGrow={0}
                        flexShrink={0}
                        height={95}
                        minWidth={0}
                      />
                    )}
                    {getNetContribution(impact, indicator) > 0 && (
                      <Box
                        flexBasis='20%'
                        display='flex'
                        flexDirection='column'
                        alignItems='center'
                        justifyContent='center'
                        gap={0.5}
                        align='center'
                      >
                        <Box component='img' alt='Contribution' src='/images/icons/scoring/contr.svg' width={25} />
                        <Typography sx={{ fontSize: 10 }}>Net contribution</Typography>
                        <Typography variant='captionBold'>{getNetContribution(impact, indicator)}%</Typography>
                      </Box>
                    )}
                    <Box
                      flexBasis={{ xs: '40%', lg: '33%' }}
                      flexGrow={0}
                      flexShrink={1}
                      height={95}
                      minWidth={0}
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      borderRadius='4px'
                      backgroundColor='secondary.subtle'
                    >
                      <Box textAlign='center'>
                        <Typography sx={{ fontSize: 10 }}>Net impact</Typography>
                        <Typography variant='bodyBold' sx={{ mb: 2 }}>
                          {getFiveYearNetOutcome(impact, indicator)}
                        </Typography>
                        <Typography sx={{ fontSize: 10 }} color='secondary.dark'>Outcome</Typography>
                        <Typography variant='bodyBold' color='secondary.dark'>
                          {getFiveYearTotalOutcome(impact, indicator)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </PitchCard>
        ))}
      </Box>
    </Box>
  );
};

export default memo(PitchImpactDetailsSlide);
