import React, { memo } from 'react';
import { Box, Button, styled, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { GLOBAL_COMMUNITY_INPUT, HEADER_HEIGHT } from "shared-components/utils/constants";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { yearTotal } from "shared-components/utils/quantification";
import { useSelector } from "react-redux";
import { userSelectors } from "../../../store/ducks/user";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledPieChart = styled(Box)(({ theme, percent }) => ({
  position: 'relative',
  display: 'inline-grid',
  placeContent: 'center',
  width: theme.spacing(25),
  height: theme.spacing(25),
  marginBottom: theme.spacing(8),
  marginLeft: 'auto',
  marginRight: 'auto',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${theme.palette.primary.main} calc(${percent} * 1%), ${theme.palette.primary.subtle} 0)`,
    mask: `radial-gradient(farthest-side, #0000 calc(99% - 20px), #000 calc(100% - 20px))`,
  }
}));

const getIndicatorCompletion = (indicator) => {
  let result = 3; // duration, stable, dropoff are considered to be always "completed"
  result += indicator.preInitial > 0;
  result += indicator.postInitial > 0;
  result += indicator.deadweight === 0 || indicator.deadweight > 0;
  result += indicator.displacement === 0 || indicator.displacement > 0;
  result += indicator.attribution === 0 || indicator.attribution > 0;
  return result;
}

const getQuantificationCompletion = (impact) => {
  let result = 0;
  const total = 2 + impact.indicators.length * 8;
  result += impact.productsData.some(v => yearTotal(v) > 0);
  result += impact.stakeholders === GLOBAL_COMMUNITY_INPUT ||
    impact.stakeholdersData.some(v => yearTotal(v) > 0);
  impact.indicators.forEach(i => {
    result += getIndicatorCompletion(i);
  });
  return Math.round(result / total * 100);
};

const QuantificationFinish = ({ impact }) => {
  const { ventureId } = useParams();
  const percentCompletion = getQuantificationCompletion(impact);
  const user = useSelector(userSelectors.getCurrentUser());

  return (
    <CustomErrorBoundary>
      <Box display='flex'
        justifyContent='center'
        alignItems='center'
        sx={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <Box width={900} display='flex' flexDirection='column' alignItems='center'>
          <StyledPieChart percent={percentCompletion}>
            <Typography align='center' sx={{ fontSize: 28, fontWeight: 'bold' }}>{percentCompletion}%</Typography>
            <Typography align='center' variant='caption' sx={{ mt: 0.5 }}>Quantification<br /> completeness</Typography>
          </StyledPieChart>
          <Typography variant='h1' sx={{ mb: 4 }}>
            {percentCompletion >= 100 && `Congratulations, ${user.name}!`}
            {percentCompletion >= 50 && percentCompletion <= 99 && `Good, ${user.name}`}
            {percentCompletion < 50 && `Still a bit of work to do here, ${user.name}`}
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: 24, lineHeight: '32px' }} align='center'>
            {
              percentCompletion >= 50 &&
              'You can always go back and adjust your forecasts, as your venture evolves over time!'
            }
            {
              percentCompletion < 50 &&
              'Quantifying your impact, which includes setting targets and forecasting future impact will help you ' +
              'improve the impact of your venture! We recommend that you continue on this step later.'
            }
          </Typography>
          <Typography color='text.secondary' sx={{ my: 4, fontSize: 24, lineHeight: '32px' }}>
            Hit next to return to scoring overview of your venture
          </Typography>
          <Button
            component={Link}
            to={`/ventures/${ventureId}/scoring-wizard`}
            sx={{ my: 1 }}
            endIcon={<ChevronRightIcon />}
          >
            Next
          </Button>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationFinish);
