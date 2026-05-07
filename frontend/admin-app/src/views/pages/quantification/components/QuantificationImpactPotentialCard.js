import React, { memo } from 'react';
import { Box, Card, Divider, Grid, Typography, useTheme } from "@mui/material";
import AppTooltip from "../../../common/AppTooltip";
import filters from "shared-components/filters";
import {
  getIndicatorFiveYearData,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome,
  getTotalOutcome
} from "shared-components/utils/quantification";
import moment from "moment";
import { isDefined } from "shared-components/utils/lo";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const QuantificationImpactPotentialCard = ({ impact, indicator }) => {
  const theme = useTheme();
  const post = indicator.postInitial;
  const pre = indicator.preInitial;
  const absoluteChange = Math.abs(post - pre);
  const relativeChange = absoluteChange / pre * 100;
  const showImprovement = pre > 0 || post > 0;
  const type = indicator.quantificationType;

  return (
    <CustomErrorBoundary>
      <Card
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          border: `1px solid ${theme.palette.border}`
        }}
      >
        <Box display='flex' gap={1} alignItems='center' sx={{ cursor: 'pointer' }}>
          <Typography variant='bodyBold'>Impact potential</Typography>
          <AppTooltip>
            <Box display='flex' flexDirection='column' gap={2}>
              <Box>Outcome is calculated with the formula:</Box>
              {type === 'PER_PRODUCT' && (
                <Box>Output (number of stakeholders reached) x change per stakeholder per year.</Box>
              )}
              {type === 'PER_STAKEHOLDER' && (
                <Box>
                  Output (number of product/ service/ activities) x change per product/service/activities per year.
                </Box>
              )}
              <Box>Net impact is calculated with the formula:</Box>
              <Box>Output – counterfactuals (deadweight, displacement, attribution, drop-off).</Box>
              <Box>
                A rule in impact measurement is "do not overclaim". It is better to be conservative and report
                net impact.
              </Box>
            </Box>
          </AppTooltip>
        </Box>
        <Divider />
        <Typography variant='subtitleBold'>
          Change per {type === 'PER_STAKEHOLDER' ? 'stakeholder' : 'product/service/activity'}
        </Typography>
        <Box display='flex' justifyContent='space-between' gap={1}>
          <Typography variant='subtitle'>Absolute:</Typography>
          {showImprovement && <Typography variant='subtitleBold'>{filters.smartRound(absoluteChange)}</Typography>}
        </Box>
        {isDefined(relativeChange) && isFinite(relativeChange) && (
          <Box display='flex' justifyContent='space-between' gap={1}>
            <Typography variant='subtitle'>Relative:</Typography>
            {showImprovement && <Typography variant='subtitleBold'>{filters.smartRound(relativeChange)}%</Typography>}
          </Box>
        )}
        <Divider />
        <Grid container spacing={1}>
          <Grid item xs={6} xl={4}>
            <Typography variant='subtitleBold' sx={{ flexGrow: 1 }}>Total change</Typography>
          </Grid>
          <Grid item xs={6} xl={4} sx={{ textAlign: { xs: 'right', xl: 'center' } }}>
            <Typography variant='subtitleBold'>Net impact</Typography>
          </Grid>
          <Grid item xs={12} xl={4}><Typography variant='subtitle' align='right'>Outcome</Typography></Grid>
        </Grid>
        <Grid container spacing={1}>
          <Grid item xs={6} xl={4}>
            <Typography variant='subtitle'>Since inception:</Typography>
          </Grid>
          <Grid item xs={6} xl={4} sx={{ textAlign: { xs: 'right', xl: 'center' } }}>
            <Typography variant='subtitleBold'>
              {getIndicatorInceptionData(impact, indicator, getNetOutcome)}
            </Typography>
          </Grid>
          <Grid item xs={12} xl={4} align='right'>
            <Typography variant='subtitle'>
              {getIndicatorInceptionData(impact, indicator, getTotalOutcome)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={1}>
          <Grid item xs={6} xl={4}>
            <Typography variant='subtitle'>{moment().year()}:</Typography>
          </Grid>
          <Grid item xs={6} xl={4} sx={{ textAlign: { xs: 'right', xl: 'center' } }}>
            <Typography variant='subtitleBold'>
              {getIndicatorThisYearData(impact, indicator, getNetOutcome)}
            </Typography>
          </Grid>
          <Grid item xs={12} xl={4} align='right'>
            <Typography variant='subtitle'>
              {getIndicatorThisYearData(impact, indicator, getTotalOutcome)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={1}>
          <Grid item xs={6} xl={4}>
            <Typography variant='subtitle'>5 year forecast:</Typography>
          </Grid>
          <Grid item xs={6} xl={4} sx={{ textAlign: { xs: 'right', xl: 'center' } }}>
            <Typography variant='subtitleBold'>
              {getIndicatorFiveYearData(impact, indicator, getNetOutcome)}
            </Typography>
          </Grid>
          <Grid item xs={12} xl={4} align='right'>
            <Typography variant='subtitle'>
              {getIndicatorFiveYearData(impact, indicator, getTotalOutcome)}
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationImpactPotentialCard);
