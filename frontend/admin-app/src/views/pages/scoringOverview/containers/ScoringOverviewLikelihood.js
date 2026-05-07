import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import ScoringOverviewChartLine from "../components/ScoringOverviewChartLine";
import ScoringOverviewCard from "../components/ScoringOverviewCard";
import { arraySum } from "shared-components/utils/helpers";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { description } from "shared-components/utils/scoring";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const propAverage = (impacts, prop, canBeNegative) =>
  (arraySum(impacts.map(i => i.scoring.at(-1)[prop + (canBeNegative && !i.positive ? 'Negative' : '')]?.score || 0))
    / impacts.length || 0).toFixed(1);

const indicatorPropAverage = (impacts, prop) => {
  const values = impacts.flatMap(i => i.scoring.at(-1).indicatorScores).map(is => is[prop]?.score || 0);
  return (arraySum(values) / values.length || 0).toFixed(1);
};

const ScoringOverviewLikelihood = ({ selected }) => {
  const questions = useSelector(dictionarySelectors.getScoringQuestions());

  return (
    <CustomErrorBoundary>
      <ScoringOverviewCard>
        <Box display='flex' flexDirection='column' gap={2}>
          <Box>
            <Typography variant='subtitleBold' align='center'>Impact Likelihood</Typography>
            <Typography variant='caption' align='center' noWrap>
              Average across {selected.length} impact areas
            </Typography>
          </Box>
          <ScoringOverviewChartLine
            left={propAverage(selected, 'previousEvidence', true)}
            right={5}
            text='Previous evidence'
            progress={propAverage(selected, 'previousEvidence', true) / 5 * 100}
            tooltipQuestion={description.previousEvidence.positive}
            tooltipAnswers={questions.previousEvidence}
          />
          <ScoringOverviewChartLine
            left={propAverage(selected, 'proximity')}
            right={5}
            text='Proximity'
            progress={propAverage(selected, 'proximity') / 5 * 100}
            tooltipQuestion={description.proximity.positive}
            tooltipAnswers={questions.proximity}
          />
          <ScoringOverviewChartLine
            left={indicatorPropAverage(selected, 'noisiness')}
            right={5}
            text='Indicator noisiness'
            progress={indicatorPropAverage(selected, 'noisiness') / 5 * 100}
            tooltipQuestion={description.noisiness.positive}
            tooltipAnswers={questions.noisiness}
          />
          <ScoringOverviewChartLine
            left={indicatorPropAverage(selected, 'validation')}
            right={5}
            text='Own validation'
            progress={indicatorPropAverage(selected, 'validation') / 5 * 100}
            tooltipQuestion={description.validation.positive}
            tooltipAnswers={questions.validation}
          />
          <Box display='flex' justifyContent='space-between'>
            <Typography variant='caption'>Low</Typography>
            <Typography variant='caption'>High</Typography>
          </Box>
        </Box>
      </ScoringOverviewCard>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverviewLikelihood);
