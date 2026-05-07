import React, { memo, useEffect, useState } from 'react';
import { Box, Card, Grid, styled, Typography, useTheme } from '@mui/material';
import ScoringChart from './ScoringChart';
import { scoringSelectors, scoringThunks } from 'store/ducks/scoring';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ScoringActiveQuestionIndicator from './ScoringActiveQuestionIndicator';
import { alpha } from '@mui/material/styles';
import useDebounce from "shared-components/hooks/useDebounce";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
}));

const magnitudeQuestions = [
  'problemImportance',
  'stakeholderSituation',
  'degreeOfChange',
  'sizeOfStakeholders',
  'duration',
  'contribution'
];
const likelihoodQuestions = ['previousEvidence', 'proximity', 'noisiness', 'validation'];

const ScoringSummary = ({ values, stepName, ...rest }) => {
  const theme = useTheme();
  const [count, setCount] = useState(0);
  const { impactId } = useParams();
  const dispatch = useDispatch();

  const debouncedValues = useDebounce(values, 800);

  useEffect(() => {
    dispatch(scoringThunks.fetchScoring({ data: values, impactId, showDiff: count > 0 }));
    setCount(c => c + 1);
  }, [debouncedValues]);

  const details = useSelector(scoringSelectors.getScoringDetails());

  return (
    <CustomErrorBoundary>
      <StyledCard {...rest}>
        <Typography variant='subtitleBold'>This impact chain</Typography>
        <Grid container spacing={2} alignItems='center' my={2}>
          <Grid item width='30%'>
            <Box display='flex' justifyContent='center'>
              <ScoringChart
                value={details.magnitude || 0}
                name='magnitude'
                colors={[theme.palette.success.main, alpha(theme.palette.success.main, 0.1)]}
                label={`${details.magnitude?.toFixed(0) || 0}/100`}
              />
            </Box>
            <ScoringActiveQuestionIndicator mt={4} filled={magnitudeQuestions.includes(stepName)} />
          </Grid>
          <Grid item xs>
            <Typography align='center' variant='h5' sx={{ mb: 3.5 }}>*</Typography>
          </Grid>
          <Grid item width='30%'>
            <Box display='flex' justifyContent='center'>
              <ScoringChart
                value={details.likelihood || 0}
                name='likelihood'
                colors={[theme.palette.success.main, alpha(theme.palette.success.main, 0.1)]}
                label={`${details.likelihood?.toFixed(0) || 0}%`}
              />
            </Box>
            <ScoringActiveQuestionIndicator mt={4} filled={likelihoodQuestions.some(q => stepName.startsWith(q))} />
          </Grid>
          <Grid item xs>
            <Typography align='center' variant='h5' sx={{ mb: 3.5 }}>=</Typography>
          </Grid>
          <Grid item width='30%'>
            <Box display='flex' justifyContent='center'>
              <ScoringChart
                value={details.score || 0}
                name='score'
                colors={[theme.palette.primary.main, theme.palette.primary.subtle]}
                label={`${details.score?.toFixed(0) || 0}/100`}
              />
            </Box>
            <ScoringActiveQuestionIndicator transparent mt={4} />
          </Grid>
        </Grid>
      </StyledCard>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringSummary);
