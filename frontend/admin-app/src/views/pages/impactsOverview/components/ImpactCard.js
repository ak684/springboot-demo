import React, { memo } from 'react';
import { Box, Button, Card, Divider, IconButton, styled, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ImpactPopupMenu from 'views/common/ImpactPopupMenu';
import AppLabel from 'views/common/AppLabel';
import navigation from "shared-components/utils/navigation";
import ImpactCardImage from "./ImpactCardImage";
import PerformanceChart from "./PerformanceChart";
import ChartCardPercentageChart from "./ChartCardPercentageChart";
import ChartCardGaugeChart from "./ChartCardGaugeChart";
import moment from "moment";
import {
  GLOBAL_COMMUNITY_INPUT,
  IMPACT_CARD_VIEW,
  SUBSCRIPTIONS,
  VENTURE_ACCESS
} from "shared-components/utils/constants";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import {
  getIndicatorFiveYearData,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome,
  yearTotal
} from "shared-components/utils/quantification";
import { arraySum } from "shared-components/utils/helpers";
import filters from "shared-components/filters";
import { sortedImpacts } from "shared-components/utils/impact";
import { appSelectors } from "store/ducks/app";
import { isDefined } from "shared-components/utils/lo";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  width: 48,
  height: 48,
  background: theme.palette.secondary.subtle,
  borderRadius: 8,
  color: theme.palette.secondary.main,
}));

const getImpactIndex = (impact, impacts, sort) => sortedImpacts([...impacts], sort).filter(i => i.positive === impact.positive).indexOf(impact) + 1;

const getDataSinceInception = (impact, collection) => {
  const currentYearIndex = impact[collection].findIndex(d => d.year === moment().year());
  return filters.smartRound(arraySum(impact[collection].slice(0, currentYearIndex + 1).map(yearTotal)))
}

const getThisYearData = (impact, collection) =>
  filters.smartRound(yearTotal(impact[collection].find(d => d.year === moment().year())));

const getFiveYearData = (impact, collection) => {
  const currentYearIndex = impact[collection].findIndex(d => d.year === moment().year());
  return filters.smartRound(arraySum(impact[collection].slice(currentYearIndex, currentYearIndex + 5).map(yearTotal)));
}

const ImpactCard = ({ impact, view }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const latestScore = impact.scoring.at(-1);
  const scorePresent = latestScore?.magnitude || latestScore?.likelihood || latestScore?.score;
  const location = useLocation();
  const currentYear = moment().year();
  const theme = useTheme();
  const impactSort = useSelector(appSelectors.getImpactSort());
  const navigate = useNavigate();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  const sdgItems = impact.goals.map(g =>
    <Box key={g.goal.name} display='flex' gap={1} flexBasis='33%'>
      <Box
        component='img'
        src={g.goal.image}
        alt={g.goal.shortName}
        width={48}
        height={48}
        sx={{ borderRadius: '4px' }}
      />
      <Box>
        <Typography sx={{ fontSize: 10 }}>{g.goal.shortName}</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{g.rate}%</Typography>
      </Box>
    </Box>
  );
  const noSdgItems = (
    <StyledIconButton onClick={() => access === VENTURE_ACCESS.EDIT && navigation.goToScoring(ventureId, impact.id)}>
      <AddIcon />
    </StyledIconButton>
  );

  const goToQuantification = (step, stepName) => {
    if (access === VENTURE_ACCESS.EDIT) {
      navigate(`/ventures/${ventureId}/impacts/${impact.id}/quantification?${isDefined(step) ? `step=${step}` : ''}${isDefined(stepName) ? `goto=${stepName}` : ''}`);
    }
  }

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
          <Typography variant='h5'>
            {impact.positive ? 'Innovation' : 'Negative impact'} {getImpactIndex(impact, venture.impacts, impactSort)}: {impact.name}
          </Typography>
          <ImpactPopupMenu impact={impact} />
        </Box>
        {(view === IMPACT_CARD_VIEW.DETAILED || location.pathname.endsWith('impacts')) && (
          <>
            <Box display='flex' alignItems='center' gap={1}>
              {!scorePresent && <Typography color='text.secondary'>Not yet scored</Typography>}
              {latestScore?.score && (
                <>
                  <Typography color='text.secondary'>Score:</Typography>
                  <Typography variant='bodyBold' color='text.secondary'>{latestScore?.score.toFixed(0)}</Typography>
                  <Divider orientation='vertical' flexItem />
                </>
              )}
              {latestScore?.magnitude && (
                <>
                  <Typography color='text.secondary'>Magnitude:</Typography>
                  <Typography color='text.secondary' variant='bodyBold'>
                    {latestScore?.magnitude.toFixed(0)}
                  </Typography>
                  {latestScore?.likelihood && <Divider orientation='vertical' flexItem />}
                </>
              )}
              {latestScore?.likelihood && (
                <>
                  <Typography color='text.secondary'>Likelihood:</Typography>
                  <Typography color='text.secondary' variant='bodyBold'>
                    {latestScore?.likelihood.toFixed(0)}%
                  </Typography>
                </>
              )}
              {impact.draft && <AppLabel>Draft</AppLabel>}
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}
        <ImpactCardImage impact={impact} mb={2} />
        {(view === IMPACT_CARD_VIEW.DETAILED || location.pathname.endsWith('impacts')) && (
          <>
            <Box display='flex' gap={0.5}>
              {impact.goals.length > 0 ? sdgItems : noSdgItems}
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}
        {(view === IMPACT_CARD_VIEW.DETAILED || location.pathname.endsWith('quantification-overview')) && (
          <>
            <Typography variant='subtitleBold' sx={{ mb: 1 }}>Output</Typography>
            <Card sx={{ p: 2, display: 'flex', gap: 1, border: `1px solid ${theme.palette.border}` }}>
              <Box display='flex' flexDirection='column' gap={1} flexBasis='50%' justifyContent='space-between'>
                <Box display='flex' flexDirection='column' gap={1}>
                  <Typography variant='captionBold' color='secondary.dark'>Products/Services/Activities</Typography>
                  <Typography variant='caption'>{impact.outputUnits}</Typography>
                </Box>
                <Box
                  p={1}
                  backgroundColor='secondary.subtle'
                  sx={{
                    borderRadius: '4px',
                    '&:hover': { transform: 'scale(1.1)', outline: `2px solid ${theme.palette.primary.main}` },
                    transition: '400ms all',
                    cursor: 'pointer'
                  }}
                  onClick={() => access === VENTURE_ACCESS.EDIT && goToQuantification(0)}
                >
                  <Box>
                    <Typography variant='captionBold'
                      component='span'
                      color='secondary.dark'>Inception:</Typography>&nbsp;
                    <Typography variant='captionBold'
                      component='span'
                      noWrap
                      title={getDataSinceInception(impact, 'productsData')}>
                      {getDataSinceInception(impact, 'productsData')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='captionBold'
                      component='span'
                      color='secondary.dark'>{currentYear}:</Typography>&nbsp;
                    <Typography variant='captionBold'
                      component='span'
                      noWrap
                      title={getThisYearData(impact, 'productsData')}>
                      {getThisYearData(impact, 'productsData')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='captionBold' component='span' color='secondary.dark'>5Y:</Typography>&nbsp;
                    <Typography variant='captionBold'
                      component='span'
                      noWrap
                      title={getFiveYearData(impact, 'productsData')}>
                      {getFiveYearData(impact, 'productsData')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box display='flex' flexDirection='column' gap={1} flexBasis='50%' justifyContent='space-between'>
                <Box display='flex' flexDirection='column' gap={1}>
                  <Typography variant='captionBold' color='secondary.dark'>Stakeholders</Typography>
                  <Typography variant='caption'>{impact.stakeholders}</Typography>
                </Box>
                {impact.stakeholders === GLOBAL_COMMUNITY_INPUT && (
                  <Box
                    height={88}
                    display='flex'
                    flexDirection='column'
                    alignItems='center'
                    justifyContent='center'
                    backgroundColor='secondary.subtle'
                    sx={{ borderRadius: '4px', }}
                    gap={1}
                  >
                    <Box
                      width={24}
                      component='img'
                      src='/images/icons/quantification/global.svg'
                      alt={GLOBAL_COMMUNITY_INPUT}
                    />
                    <Typography variant='overline' color='secondary.main'>Global community</Typography>
                  </Box>
                )}
                {impact.stakeholders !== GLOBAL_COMMUNITY_INPUT && (
                  <Box
                    p={1}
                    backgroundColor='secondary.subtle'
                    sx={{
                      borderRadius: '4px',
                      '&:hover': { transform: 'scale(1.1)', outline: `2px solid ${theme.palette.primary.main}` },
                      transition: '400ms all',
                      cursor: 'pointer'
                    }}
                    onClick={() => access === VENTURE_ACCESS.EDIT && goToQuantification(1)}
                  >
                    <Box>
                      <Typography variant='captionBold'
                        component='span'
                        color='secondary.dark'>Inception:</Typography>&nbsp;
                      <Typography variant='captionBold'
                        component='span'
                        noWrap
                        title={getDataSinceInception(impact, 'stakeholdersData')}>
                        {getDataSinceInception(impact, 'stakeholdersData')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='captionBold'
                        component='span'
                        color='secondary.dark'>{currentYear}:</Typography>&nbsp;
                      <Typography variant='captionBold'
                        component='span'
                        noWrap
                        title={getThisYearData(impact, 'stakeholdersData')}>
                        {getThisYearData(impact, 'stakeholdersData')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='captionBold' component='span' color='secondary.dark'>5Y:</Typography>&nbsp;
                      <Typography variant='captionBold'
                        component='span'
                        noWrap
                        title={getFiveYearData(impact, 'stakeholdersData')}>
                        {getFiveYearData(impact, 'stakeholdersData')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>
            <Typography variant='subtitleBold' sx={{ mt: 3, mb: 1 }}>Net impact</Typography>
            <Card sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, border: `1px solid ${theme.palette.border}` }}>
              {impact.indicators.map((indicator, index) => (
                <Box
                  key={indicator.id}
                  display='flex'
                  flexDirection='column'
                  justifyContent='space-between'
                  gap={1}
                  flexBasis='calc(33% - 5px)'
                  flexGrow={0}
                  flexShrink={0}
                  minWidth={0}
                >
                  <Typography variant='caption'>{indicator.name}</Typography>
                  <Box
                    p={1}
                    display='flex'
                    flexDirection='column'
                    gap={1}
                    backgroundColor='secondary.subtle'
                    sx={{
                      borderRadius: '4px',
                      '&:hover': { transform: 'scale(1.1)', outline: `2px solid ${theme.palette.primary.main}` },
                      transition: '400ms all',
                      cursor: 'pointer'
                    }}
                    onClick={() => access === VENTURE_ACCESS.EDIT && goToQuantification(undefined, `indicators[${index}].prepost`)}
                  >
                    <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                      <Typography variant='captionBold' color='secondary.dark'>Inception:</Typography>
                      <Typography
                        variant='captionBold'
                        noWrap
                        title={getIndicatorInceptionData(impact, indicator, getNetOutcome)}
                      >
                        {getIndicatorInceptionData(impact, indicator, getNetOutcome)}
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                      <Typography variant='captionBold' color='secondary.dark'>{currentYear}:</Typography>
                      <Typography variant='captionBold'
                        noWrap
                        title={getIndicatorThisYearData(impact, indicator, getNetOutcome)}>
                        {getIndicatorThisYearData(impact, indicator, getNetOutcome)}
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
                      <Typography variant='captionBold' color='secondary.dark'>5Y:</Typography>
                      <Typography variant='captionBold'
                        noWrap
                        title={getIndicatorFiveYearData(impact, indicator, getNetOutcome)}>
                        {getIndicatorFiveYearData(impact, indicator, getNetOutcome)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Card>
          </>
        )}
        {(view === IMPACT_CARD_VIEW.DETAILED || location.pathname.endsWith('monitoring-overview')) && (
          <Box mt={3}>
            <Typography variant='subtitleBold'>Actual performance:</Typography>
            <Box mt={1} display='flex' gap={1}>
              <PerformanceChart
                title={`Total yearly outcome ${moment().year()} achieved to date:`}
                chart={<ChartCardPercentageChart impact={impact} />}
              />
              <PerformanceChart
                title={`Monthly outcome ${moment().year()} vs forecast as of ${moment().format('MMMM')} ${moment().year()}`}
                chart={<ChartCardGaugeChart impact={impact} />}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}
        <Box display='flex' gap={1} my={1}>
          <Button
            color='secondary'
            sx={{ flexGrow: 1, flexBasis: '30%' }}
            component={Link}
            to={`/ventures/${ventureId}/impacts/${impact.id}?step=0`}
            disabled={access !== VENTURE_ACCESS.EDIT}
          >
            Edit
          </Button>
          <Button
            color={location.pathname.endsWith('scoring-wizard') ? 'primary' : 'secondary'}
            sx={{ flexGrow: 1, flexBasis: '30%' }}
            onClick={() => navigation.goToScoring(ventureId, impact.id)}
            disabled={access !== VENTURE_ACCESS.EDIT}
          >
            Score
          </Button>
          <Button
            color={location.pathname.endsWith('quantification-overview') ? 'primary' : 'secondary'}
            sx={{ flexGrow: 1, flexBasis: '30%' }}
            onClick={() => navigation.goToQuantification(ventureId, impact.id)}
            disabled={access !== VENTURE_ACCESS.EDIT || venture.subscriptionType !== SUBSCRIPTIONS.PRO}
          >
            Quantify
          </Button>
          <Button
            color={location.pathname.endsWith('monitoring-overview') ? 'primary' : 'secondary'}
            sx={{ flexGrow: 1, flexBasis: '30%' }}
            onClick={() => navigation.goToMonitoring(ventureId, impact.id)}
            disabled={access !== VENTURE_ACCESS.EDIT || venture.subscriptionType !== SUBSCRIPTIONS.PRO}
          >
            Monitor
          </Button>
        </Box>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactCard);
