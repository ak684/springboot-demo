import React, { memo } from 'react';
import ScoringOverviewCard from "../components/ScoringOverviewCard";
import { Box, Typography } from "@mui/material";
import ScoringOverviewChartLine from "../components/ScoringOverviewChartLine";
import { arraySum } from "shared-components/utils/helpers";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { description } from "shared-components/utils/scoring";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const propAverage = (impacts, prop, canBeNegative) =>
  (arraySum(impacts.map(i => i.scoring.at(-1)[prop + (canBeNegative && !i.positive ? 'Negative' : '')]?.score || 0))
    / impacts.length || 0).toFixed(1);

const arrayAverage = (arr) => (arraySum(arr) / arr.length || 0).toFixed(1);

const ScoringOverviewMagnitude = ({ selected }) => {
  const questions = useSelector(dictionarySelectors.getScoringQuestions());

  return (
    <CustomErrorBoundary>
      <ScoringOverviewCard>
        <Box display='flex' flexDirection='column' gap={2}>
          <Box>
            <Typography variant='subtitleBold' align='center'>Magnitude</Typography>
            <Typography variant='caption' align='center' noWrap>
              Average across {selected.length} impact areas
            </Typography>
          </Box>
          <ScoringOverviewChartLine
            left={propAverage(selected, 'stakeholderSituation', true)}
            right={5}
            text='Stakeholder underservedness'
            progress={propAverage(selected, 'stakeholderSituation', true) / 5 * 100}
            tooltipQuestion={description.stakeholderSituation.positive}
            tooltipAnswers={questions.stakeholderSituation}
          />
          <ScoringOverviewChartLine
            left={propAverage(selected, 'problemImportance', true)}
            right={5}
            text='Problem importance'
            progress={propAverage(selected, 'problemImportance', true) / 5 * 100}
            tooltipQuestion={description.problemImportance.positive}
            tooltipAnswers={questions.problemImportance}
          />
          <ScoringOverviewChartLine
            left={arrayAverage(selected.map(i => i.scoring.at(-1).degreeOfChange))}
            right={100}
            text='Degree of change'
            progress={arrayAverage(selected.map(i => i.scoring.at(-1).degreeOfChange))}
            tooltipQuestion={description.degreeOfChange.positive}
            tooltipAnswers={questions.degreeOfChange}
          />
          <ScoringOverviewChartLine
            left={propAverage(selected, 'sizeOfStakeholders', true)}
            right={10}
            text='Scalability'
            progress={propAverage(selected, 'sizeOfStakeholders', true) / 10 * 100}
            tooltipQuestion={description.sizeOfStakeholders.positive}
            tooltipAnswers={questions.sizeOfStakeholders}
          />
          <ScoringOverviewChartLine
            left={propAverage(selected, 'duration', true)}
            right={5}
            text='Duration'
            progress={propAverage(selected, 'duration', true) / 5 * 100}
            tooltipQuestion={description.duration.positive}
            tooltipAnswers={questions.duration}
          />
          <ScoringOverviewChartLine
            left={arrayAverage(selected.map(i => i.scoring.at(-1).contribution))}
            right={100}
            text='Enterprise contribution'
            progress={arrayAverage(selected.map(i => i.scoring.at(-1).contribution))}
            tooltipQuestion={description.contribution.positive}
            tooltipAnswers={questions.contribution}
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

export default memo(ScoringOverviewMagnitude);
