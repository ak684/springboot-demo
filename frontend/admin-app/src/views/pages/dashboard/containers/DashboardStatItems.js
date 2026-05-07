import React, { memo } from 'react';
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { getVentureNegativeValues, getVenturePositiveValues, getVentureTotalScore } from "shared-components/utils/scoring";
import { arraySum } from "shared-components/utils/helpers";
import DashboardStatItem from "../components/DashboardStatItem";
import { Box, Typography } from "@mui/material";
import filters from "shared-components/filters";
import { VENTURE_ACCESS } from "shared-components/utils/constants";

const DashboardStatItems = () => {
    const { ventureId } = useParams();
    const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
    const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
    const indicators = venture.impacts
      .filter(i => !i.draft)
      .map(i => i.indicators.length)
      .reduce((acc, curr) => acc + curr, 0);
    const positiveIndicators = venture.impacts
      .filter(i => !i.draft)
      .filter(i => i.positive)
      .map(i => i.indicators.length)
      .reduce((acc, curr) => acc + curr, 0);
    const negativeIndicators = venture.impacts
      .filter(i => !i.draft)
      .filter(i => !i.positive)
      .map(i => i.indicators.length)
      .reduce((acc, curr) => acc + curr, 0);
    const totalScore = getVentureTotalScore(venture);
    const positiveScore = arraySum(getVenturePositiveValues(venture)).toFixed(0);
    const negativeScore = arraySum(getVentureNegativeValues(venture)).toFixed(0);
    const totalFunding = arraySum(venture.funding.map(f => f.amount));

    const stats = [{
      icon: '/images/icons/checks.svg',
      label: 'Impact chains',
      value: venture.impacts.filter(i => !i.draft).length,
      positive: venture.impacts.filter(i => !i.draft).filter(i => i.positive).length,
      negative: venture.impacts.filter(i => !i.draft).filter(i => !i.positive).length,
      url: `/ventures/${ventureId}/table`,
    }, {
      icon: '/images/icons/bulb.svg',
      label: 'Indicators',
      value: indicators,
      positive: positiveIndicators,
      negative: negativeIndicators,
      url: `/ventures/${ventureId}/indicators`,
    }, {
      icon: '/images/icons/star.svg',
      label: 'Impact potential score',
      value: `${totalScore} / 500`,
      positive: positiveScore,
      negative: `${negativeScore > 0 ? '-' : ''}${negativeScore}`,
      url: `/ventures/${ventureId}/scoring-wizard`,
    }];

    if (venture.employees > 0 || venture.volunteers > 0) {
      stats.push({
        icon: '/images/icons/employees.svg',
        label: 'Number of employees',
        value: venture.employees,
        children: (
          <Box display='flex' gap={4}>
            <Box>
              <Typography variant='subtitle' color='text.secondary'>Employees</Typography>
              <Typography component='h3' sx={{ fontWeight: 'bold', fontSize: 28 }}>{venture.employees || 0}</Typography>
            </Box>
            <Box>
              <Typography variant='subtitle' color='text.secondary'>Volunteers</Typography>
              <Typography component='h3' sx={{ fontWeight: 'bold', fontSize: 28 }}>{venture.volunteers || 0}</Typography>
            </Box>
          </Box>
        ),
        url: `/ventures/${ventureId}/profile-wizard?goto=employees`,
        disabled: access !== VENTURE_ACCESS.EDIT,
      });
    }

    if (totalFunding > 0) {
      stats.push({
        icon: '/images/icons/public/money.svg',
        label: 'Total funding amount',
        value: `${filters.number(totalFunding)} ${venture.currency.isoCode}`,
        url: `/ventures/${ventureId}/profile-wizard?goto=funding`,
        disabled: access !== VENTURE_ACCESS.EDIT,
      });
    }

    return stats.map(s => <DashboardStatItem {...s} key={s.label} />);
  }
;

export default memo(DashboardStatItems);
