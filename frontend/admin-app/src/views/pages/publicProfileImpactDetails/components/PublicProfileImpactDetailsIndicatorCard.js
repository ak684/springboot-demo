import React, { memo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import {
  getAverageChange,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome,
  getRiskItem
} from "shared-components/utils/quantification";
import { isDefined } from "shared-components/utils/lo";
import { useSelector } from "react-redux";
import { publicProfileSelectors } from "store/ducks/publicProfile";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getValue = (impact, indicator, view) => {
  if (view.name === 'ABSOLUTE_IMPROVEMENT') {
    return getAverageChange(impact, indicator)[2];
  } else if (view.name === 'PERCENTAGE_IMPROVEMENT') {
    let change = getAverageChange(impact, indicator)[3];
    if (change !== 'No data') {
      change += '%';
    }
    return change;
  } else if (view.name === 'NET_IMPACT_INCEPTION') {
    return getIndicatorInceptionData(impact, indicator, getNetOutcome);
  } else if (view.name === 'NET_IMPACT_CURRENT') {
    return getIndicatorThisYearData(impact, indicator, getNetOutcome);
  } else if (view.name === 'YEAR') {
    return indicator.year;
  }

  return null;
}

const PublicProfileImpactDetailsIndicatorCard = ({ impact, indicator, preNotes, postNotes }) => {
  const preNote = preNotes[indicator.id];
  const postNote = postNotes[indicator.id];
  const preRisk = getRiskItem(preNote)?.risk;
  const postRisk = getRiskItem(postNote, preNote)?.risk;
  const risk = (preRisk + postRisk) / (isDefined(preRisk) + isDefined(postRisk));
  const indicatorViews = useSelector(publicProfileSelectors.getIndicatorViews());
  const view = indicator.publicView || indicatorViews[0];
  const value = getValue(impact, indicator, view);
  const change = indicator.postInitial - indicator.preInitial;
  const showChange = indicator.publicView?.name !== 'YEAR' && value !== 'No data';
  const changeColor = impact.positive ? 'success' : 'error';

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box display='flex' flexDirection='column' gap={3} sx={{ textAlign: 'center' }}>
          <Typography variant='subtitle'>{view.description}:</Typography>
          <Box display='flex' alignItems='center' justifyContent='center' gap={1}>
            <Typography sx={{ fontSize: 70, fontWeight: 700 }} noWrap title={value}>{value}</Typography>
            {showChange && change > 0 && (
              <Box p={1} backgroundColor={changeColor + '.main'} sx={{ borderRadius: '50%' }} width={36} height={36}>
                <ArrowUpwardOutlinedIcon sx={{ color: 'white', width: 20, height: 20 }} />
              </Box>
            )}
            {showChange && change < 0 && (
              <Box p={1} backgroundColor={changeColor + '.main'} sx={{ borderRadius: '50%' }} height={36}>
                <ArrowDownwardOutlinedIcon sx={{ color: 'white', width: 20, height: 20 }} />
              </Box>
            )}
          </Box>
          <Typography variant='subtitle'>{indicator.name}</Typography>
          {!isNaN(risk) && (
            <Tooltip
              title={(
                <Box>
                  {isDefined(preRisk) && !isNaN(preRisk) &&
                    <Typography variant='subtitle'>Pre value risk: {preRisk}%</Typography>
                  }
                  {isDefined(postRisk) && !isNaN(postRisk) &&
                    <Typography variant='subtitle'>Post value risk: {postRisk}%</Typography>
                  }
                </Box>
              )}
            >
              <Box display='flex' alignItems='center' justifyContent='center' gap={1}>
                <Box component='img' src='/images/icons/scoring/risk.svg' alt='Risk' />
                <Typography variant='caption'>{risk}% Evidence risk</Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(PublicProfileImpactDetailsIndicatorCard);
