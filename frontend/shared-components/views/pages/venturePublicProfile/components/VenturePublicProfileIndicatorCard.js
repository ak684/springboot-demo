import React, { memo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  getAverageChange,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome,
  getRiskItem
} from "shared-components/utils/quantification";
import { useSelector } from "react-redux";
import { publicProfileSelectors } from "store/ducks/publicProfile";
import { isDefined } from "shared-components/utils/lo";
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';

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

const VenturePublicProfileIndicatorCard = ({ impact, indicator, preNote, postNote }) => {
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
    <Box
      key={indicator.id}
      sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Typography variant='subtitle'>{view.description}:</Typography>
      <Box display='flex' alignItems='center' justifyContent='center' gap={1}>
        <Typography sx={{ fontSize: 28, fontWeight: 700 }} noWrap title={value}>{value}</Typography>
        {showChange && change > 0 && (
          <Box p={1} backgroundColor={changeColor + '.subtle'} sx={{ borderRadius: '50%' }} height={20}>
            <ArrowUpwardOutlinedIcon sx={{ color: changeColor + '.main', width: 20, height: 20 }} />
          </Box>
        )}
        {showChange && change < 0 && (
          <Box p={1} backgroundColor={changeColor + '.subtle'} sx={{ borderRadius: '50%' }} height={20}>
            <ArrowDownwardOutlinedIcon sx={{ color: changeColor + '.main', width: 20, height: 20 }} />
          </Box>
        )}
      </Box>
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
      <Typography variant='caption'>{indicator.name}</Typography>
    </Box>
  );
};

export default memo(VenturePublicProfileIndicatorCard);
