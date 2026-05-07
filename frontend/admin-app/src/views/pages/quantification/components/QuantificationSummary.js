import React, { memo, useState } from 'react';
import { Box, MenuItem, Typography } from '@mui/material';
import QuantificationChartCard from "./QuantificationChartCard";
import { clone } from "shared-components/utils/lo";
import barChartConfig from "../chart/barChart";
import { getIndicatorNetOutcomeChartData, yearTotal } from "shared-components/utils/quantification";
import theme from "shared-components/theme";
import { GLOBAL_COMMUNITY_INPUT } from "shared-components/utils/constants";
import TextField from "@mui/material/TextField";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import roundedNumber from "shared-components/filters/roundedNumber";

const getTotalsChartData = (values, impactCalculationTotal) => {
  const config = clone(barChartConfig);
  config.xAxis.data = values.map(v => '\'' + String(v.year).slice(-2));
  config.series[0].data = impactCalculationTotal
    ? values.map(v => roundedNumber(yearTotal(v) / 12))
    : values.map(v => yearTotal(v));
  return config;
};

const globalCommunityAlternativeView = (
  <Box
    display='flex'
    alignItems='center'
    justifyContent='center'
    flexDirection='column'
    gap={0.5}
    height={110}
    backgroundColor={theme.palette.secondary.subtle}
    borderRadius='8px'
  >
    <Box component='img' src='/images/icons/quantification/global.svg' alt={GLOBAL_COMMUNITY_INPUT} />
    <Typography variant='overline' color='secondary.main'>Global community</Typography>
  </Box>
)

const QuantificationSummary = ({ values, stepName, isGlobal, impact, ...rest }) => {
  const [indicator, setIndicator] = useState(0);

  return (
    <CustomErrorBoundary>
      <Box display='flex' gap={2} {...rest}>
        <QuantificationChartCard
          name='products'
          title='Products/services/activities'
          selected={stepName === 'products'}
          chartParams={[values.productsData, values.impactCalculationTotal]}
          getChartData={getTotalsChartData}
          tooltip={impact.outputUnits}
        />
        <QuantificationChartCard
          name='stakeholders'
          title='Stakeholders'
          selected={stepName === 'stakeholders'}
          chartParams={[values.stakeholdersData, values.impactCalculationTotal]}
          getChartData={getTotalsChartData}
          alternative={isGlobal && globalCommunityAlternativeView}
          tooltip={impact.stakeholders}
        />
        {values.indicators.length > 0 && (
          <QuantificationChartCard
            name='outcome'
            title='Outcome:'
            selected={!['products', 'stakeholders'].includes(stepName)}
            chartParams={[values, values.indicators[indicator]]}
            getChartData={getIndicatorNetOutcomeChartData}
            titleActions={(
              <TextField variant='standard'
                select
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                inputProps={{ sx: { p: 0, ...getTypography('subtitle') } }}
              >
                {impact.indicators.map((i, index) =>
                  <MenuItem key={i.id} value={index}>Indicator {index + 1}</MenuItem>
                )}
              </TextField>
            )}
            tooltip={impact.indicators[indicator]?.name}
          />
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationSummary);
