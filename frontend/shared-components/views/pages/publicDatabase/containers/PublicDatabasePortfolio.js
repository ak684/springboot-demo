import React, { memo } from 'react';
import { Box, Grid, Typography } from "@mui/material";
import PublicDatabaseSdgChart from "../components/PublicDatabaseSdgChart";
import PublicDatabasePortfolioCard from "../components/PublicDatabasePortfolioCard";
import moment from 'moment';
import filters from "shared-components/filters";
import { arraySum } from "shared-components/utils/helpers";
import PublicDatabaseSearchInfo from "../components/PublicDatabaseSearchInfo";
import { useSelector } from "react-redux";
import { appSelectors } from "store/ducks/app";
import smartRound from "shared-components/filters/smartRound";

const getChangeForPeriod = (arr, period) => {
  const daysAgo = moment().subtract(period, 'days');
  const increase = arr.filter(item => moment(item.createdAt).isAfter(daysAgo)).length;
  const lastPeriodData = arr.length - increase;
  if (lastPeriodData > 0) {
    return filters.number(increase / lastPeriodData * 100);
  } else {
    return increase > 0 ? 100 : 0;
  }
}

const PublicDatabasePortfolio = ({ ventures, totalVentures, ...rest }) => {
  const period = useSelector(appSelectors.getPublicPeriod());
  const jobs = arraySum(ventures.map(v => v.employees || 0));
  const impacts = ventures.flatMap(v => v.impacts)
    .filter(i => !i.draft)
    .filter(i => i.scoring.at(-1)?.score > 0);
  const positiveImpacts = impacts.filter(i => i.positive);
  const positiveImpactsChange = getChangeForPeriod(positiveImpacts, period);
  const negativeImpacts = impacts.filter(i => !i.positive);
  const negativeImpactsChange = getChangeForPeriod(negativeImpacts, period);
  const positiveIndicators = positiveImpacts.flatMap(i => i.indicators);
  const positiveIndicatorsChange = getChangeForPeriod(positiveIndicators, period);
  const negativeIndicators = negativeImpacts.flatMap(i => i.indicators);
  const negativeIndicatorsChange = getChangeForPeriod(negativeIndicators, period);
  const totalFollowers = arraySum(ventures.map(v => v.aux.followers));
  const followersChange = arraySum(ventures.map(v => v.aux.followerChange));
  // Approved by Ingo - we treat amounts in USD as amounts in EUR multiplied by 1.1
  // We do not account for any other currencies and expect all statistics to be either in USD or EUR
  // toDO: Rework when more companies are shown in a public database
  const capitalRaised = arraySum(
    ventures.flatMap(v => v.funding.map(f => v.currency.isoCode === "EUR" ? f.amount * 1.1 : f.amount))
  );
  const newCapital = arraySum(
    ventures
      .flatMap(v => v.funding)
      .filter(f => moment().diff(moment(f.createdAt), 'days') <= period)
      .map(f => f.amount)
  );
  const capitalChange = capitalRaised > 0 ? (newCapital / capitalRaised * 100) : 0;

  return (
    <Box {...rest}>
      <PublicDatabaseSearchInfo shownVentures={ventures.length} totalVentures={totalVentures} mb={2} showPeriod />
      <Typography variant='bodyBold'>Economic growth</Typography>
      <Grid mt={0} container spacing={2}>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard label='Jobs created' value={jobs} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='Social media + growth'
            value={totalFollowers}
            change={smartRound(totalFollowers > 0 ? followersChange / totalFollowers : 0)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='Capital raised'
            value={capitalRaised}
            change={capitalChange}
            currency='USD'
          />
        </Grid>
      </Grid>
      <Typography sx={{ mt: 3 }} variant='bodyBold'>Sustainability impact</Typography>
      <Grid mt={0} container spacing={2}>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='# Positive impact areas'
            value={positiveImpacts.length}
            change={positiveImpactsChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='# Negative impact areas'
            value={negativeImpacts.length}
            change={negativeImpactsChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='# Positive indicators'
            value={positiveIndicators.length}
            change={positiveIndicatorsChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PublicDatabasePortfolioCard
            label='# Negative indicators'
            value={negativeIndicators.length}
            change={negativeIndicatorsChange}
          />
        </Grid>
      </Grid>
      <PublicDatabaseSdgChart ventures={ventures} sx={{ mt: 2 }} />
    </Box>
  );
};

export default memo(PublicDatabasePortfolio);
