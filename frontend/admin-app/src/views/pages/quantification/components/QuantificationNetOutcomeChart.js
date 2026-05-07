import React, { memo } from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { getDropoffValues, getNetOutcome, getTotalOutcome } from "shared-components/utils/quantification";
import { arraySum } from "shared-components/utils/helpers";
import Card from "@mui/material/Card";
import filters from "shared-components/filters";
import smartRound from "shared-components/filters/smartRound";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const QuantificationNetOutcomeChart = ({ values, index }) => {
  const theme = useTheme();

  const indicator = values.indicators[index];
  const totalOutcome = arraySum(getTotalOutcome(values, indicator));
  const netOutcome = arraySum(getNetOutcome(values, indicator));
  const dropoff = arraySum(getDropoffValues(values, indicator)) / totalOutcome * 100;
  const netOutcomePercent = 100 - smartRound((totalOutcome - netOutcome) / totalOutcome * 100);

  return (
    <CustomErrorBoundary>
      <Card
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}
      >
        <Box>
          <Box height={20} backgroundColor='primary.main' />
          <Typography sx={{ mt: 0.5 }} variant='captionBold'>Outcome - 100%</Typography>
        </Box>
        {indicator.deadweight > 0 && (
          <Box>
            <Tooltip title={indicator.deadweightComment}>
              <Box position='relative' sx={{ height: 20 }} backgroundColor='secondary.subtle'>
                <Box position='absolute'
                  left={0}
                  top={0}
                  height={20}
                  width={`${indicator.deadweight}%`}
                  backgroundColor='secondary.main'
                  zIndex={1}
                />
              </Box>
            </Tooltip>
            <Typography sx={{ mt: 0.5 }} variant='captionBold'>Deadweight - {indicator.deadweight}%</Typography>
          </Box>
        )}
        {indicator.displacement > 0 && (
          <Box>
            <Tooltip title={indicator.displacementComment}>
              <Box position='relative' sx={{ height: 20 }} backgroundColor='secondary.subtle'>
                <Box position='absolute'
                  left={`${indicator.deadweight || 0}%`}
                  top={0}
                  height={20}
                  width={`${indicator.displacement}%`}
                  backgroundColor='secondary.main'
                  zIndex={1}
                />
              </Box>
            </Tooltip>
            <Typography sx={{ mt: 0.5 }} variant='captionBold'>Displacement - {indicator.displacement}%</Typography>
          </Box>
        )}
        {indicator.attribution > 0 && (
          <Box>
            <Tooltip title={indicator.attributionComment}>
              <Box position='relative' sx={{ height: 20 }} backgroundColor='secondary.subtle'>
                <Box position='absolute'
                  left={`${(indicator.deadweight || 0) + (indicator.displacement || 0)}%`}
                  top={0}
                  height={20}
                  width={`${indicator.attribution}%`}
                  backgroundColor='secondary.main'
                  zIndex={1}
                />
              </Box>
            </Tooltip>
            <Typography sx={{ mt: 0.5 }} variant='captionBold'>Attribution - {indicator.attribution}%</Typography>
          </Box>
        )}
        {dropoff > 0 && (
          <Box>
            <Tooltip title={indicator.dropoffComment}>
              <Box position='relative' sx={{ height: 20 }} backgroundColor='secondary.subtle'>
                <Box position='absolute'
                  left={`${(indicator.deadweight || 0) + (indicator.displacement || 0) + (indicator.attribution || 0)}%`}
                  top={0}
                  height={20}
                  width={`${dropoff}%`}
                  backgroundColor='secondary.main'
                  zIndex={1}
                />
              </Box>
            </Tooltip>
            <Typography sx={{ mt: 0.5 }} variant='captionBold'>Dropoff - {filters.smartRound(dropoff)}%</Typography>
          </Box>
        )}
        {netOutcomePercent > 0 && (
          <Box>

            <Box position='relative' sx={{ height: 20 }} backgroundColor='secondary.subtle'>
              <Box position='absolute'
                left={`${100 - netOutcomePercent}%`}
                right={0}
                top={0}
                height={20}
                backgroundColor='success.main'
                zIndex={1}
              />
            </Box>
            <Typography sx={{ mt: 0.5 }} variant='captionBold'>Net impact - {netOutcomePercent}%</Typography>
          </Box>
        )}
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationNetOutcomeChart);
