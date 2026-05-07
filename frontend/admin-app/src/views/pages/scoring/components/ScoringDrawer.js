import React, { Fragment, memo, useCallback } from 'react';
import { Box, Divider, Drawer, styled, Toolbar, Typography, useTheme } from '@mui/material';
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import { GLOBAL_COMMUNITY_INPUT, HEADER_HEIGHT } from "shared-components/utils/constants";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { ReactComponent as BeneficiaryIcon } from 'theme/icons/beneficiary.svg';
import { ReactComponent as ChangeIcon } from 'theme/icons/change.svg';
import { ReactComponent as IndicatorIcon } from 'theme/icons/indicator.svg';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { isDefined } from 'shared-components/utils/lo';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(60),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(60),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const StyledDrawerSectionName = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  flexBasis: theme.spacing(8),
  flexDirection: 'column',
  flexGrow: 0,
  flexShrink: 0,
  gap: theme.spacing(),
  padding: theme.spacing(3),
  alignItems: 'center',
}));

const ScoringDrawer = ({ values, impact, highlight, goToStep, stepName }) => {
  const theme = useTheme();
  const questions = useSelector(dictionarySelectors.getScoringQuestions());
  const goals = useSelector(dictionarySelectors.getGoals());
  const geography = useSelector(dictionarySelectors.getGeography());

  const getAnswerValue = useCallback((values, field, impact, canBeNegative = false, indicatorIndex) => {
    if (!impact) {
      return null;
    }
    const fieldName = canBeNegative && !impact.positive ? `${field}Negative` : field;
    const answer = isDefined(indicatorIndex) ? values.indicatorScores[indicatorIndex][field] : values[fieldName];
    return answer?.score / questions[fieldName].length;
  }, [questions]);

  return (
    <StyledDrawer variant='permanent' open>
      <Toolbar sx={{ height: HEADER_HEIGHT }} />
      <CustomErrorBoundary>
        <Box p={4}>
          <Box display='flex' alignItems='center' gap={1}>
            <FiberManualRecordIcon
              sx={{ color: impact.positive ? theme.palette.success.main : theme.palette.error.main, width: 16 }}
            />
            <Typography variant='h5'>{impact.name}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <StyledDrawerSectionName>
              <Box component='img' src='/images/icons/scoring/what.svg' alt='What?' />
              <Typography variant='subtitleBold'>What</Typography>
            </StyledDrawerSectionName>
            <Box flexGrow={1} flexShrink={1}>
              <StepperDrawerItem
                primary='Change (impact)'
                secondary={impact.change}
                icon={ChangeIcon}
                active={(highlight || []).includes('change')}
                grey={!(highlight || []).includes('change')}
              />
              <StepperDrawerItem
                sx={{ mt: 1 }}
                primary='Primary SDGs addressed'
                secondary={
                  values.goals
                    .map(goal => ({ ...goals.find(g => g.name === goal.goal), ...goal }))
                    .map(g => `${g.shortName} (${g.rate}%)`).join(', ')
                }
                active={stepName === 'sdg'}
                onClick={() => goToStep('sdg')}
              />
              <StepperDrawerItem
                primary='Problem importance for stakeholder'
                secondary={
                  impact?.positive ? values.problemImportance?.shortName : values.problemImportanceNegative?.shortName
                }
                active={stepName === 'problemImportance'}
                onClick={() => goToStep('problemImportance')}
                pieValue={getAnswerValue(values, 'problemImportance', impact, true)}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <StyledDrawerSectionName>
              <Box component='img' src='/images/icons/scoring/who.svg' alt='Who?' />
              <Typography variant='subtitleBold'>Who</Typography>
            </StyledDrawerSectionName>
            <Box flexGrow={1} flexShrink={1}>
              <StepperDrawerItem
                primary='Beneficiary'
                secondary={impact.stakeholders}
                icon={BeneficiaryIcon}
                active={(highlight || []).includes('stakeholders')}
                grey={!(highlight || []).includes('stakeholders')}
              />
              <StepperDrawerItem
                sx={{ mt: 1 }}
                primary='Stakeholder situation'
                secondary={
                  impact?.positive ? values.stakeholderSituation?.shortName : values.stakeholderSituationNegative?.shortName
                }
                active={stepName === 'stakeholderSituation'}
                onClick={() => goToStep('stakeholderSituation')}
                pieValue={getAnswerValue(values, 'stakeholderSituation', impact, true)}
              />
              <StepperDrawerItem
                sx={{ mt: 1 }}
                primary='Geographic boundary'
                secondary={
                  [...values.geography.map(v => v.title), ...values.geographyCustom].join(', ')
                }
                active={stepName === 'geography'}
                onClick={() => goToStep('geography')}
                tooltip={
                  impact?.stakeholders === GLOBAL_COMMUNITY_INPUT ?
                    'To edit this value, indicate specific stakeholder in Impact logic wizard' :
                    ''
                }
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <StyledDrawerSectionName>
              <Box component='img' src='/images/icons/scoring/how_much.svg' alt='How much?' />
              <Typography variant='subtitleBold'>How much</Typography>
            </StyledDrawerSectionName>
            <Box flexGrow={1} flexShrink={1}>
              <StepperDrawerItem
                primary='Depth (Degree of change)'
                secondary={`${values.degreeOfChange}% involvement [${values.degreeOfChange}/100]`}
                active={stepName === 'degreeOfChange'}
                onClick={() => goToStep('degreeOfChange')}
                pieValue={values.degreeOfChange / 100}
              />
              <StepperDrawerItem
                primary='Scalability'
                secondary={
                  impact?.positive ? values.sizeOfStakeholders?.shortName : values.sizeOfStakeholdersNegative?.shortName
                }
                active={stepName === 'sizeOfStakeholders'}
                onClick={() => goToStep('sizeOfStakeholders')}
                pieValue={getAnswerValue(values, 'sizeOfStakeholders', impact, true)}
              />
              <StepperDrawerItem
                primary='Duration'
                secondary={
                  impact?.positive ? values.duration?.shortName : values.durationNegative?.shortName
                }
                active={stepName === 'duration'}
                onClick={() => goToStep('duration')}
                pieValue={getAnswerValue(values, 'duration', impact, true)}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <StyledDrawerSectionName>
              <Box component='img' src='/images/icons/scoring/contr.svg' alt='Contribution?' />
              <Typography variant='subtitleBold'>Contr.</Typography>
            </StyledDrawerSectionName>
            <Box flexGrow={1} flexShrink={1}>
              <StepperDrawerItem
                primary='Enterprise contribution'
                secondary={`${values.contribution}% contribution [${values.contribution}/100]`}
                active={stepName === 'contribution'}
                onClick={() => goToStep('contribution')}
                pieValue={values.contribution / 100}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <StyledDrawerSectionName>
              <Box component='img' src='/images/icons/scoring/risk.svg' alt='Risk?' />
              <Typography variant='subtitleBold'>Risk</Typography>
            </StyledDrawerSectionName>
            <Box flexGrow={1} flexShrink={1}>
              <StepperDrawerItem
                primary='Previous evidence'
                secondary={
                  impact?.positive ? values.previousEvidence?.shortName : values.previousEvidenceNegative?.shortName
                }
                active={stepName === 'previousEvidence'}
                onClick={() => goToStep('previousEvidence')}
                pieValue={getAnswerValue(values, 'previousEvidence', impact, true)}
              />
              {impact?.positive && (
                <StepperDrawerItem
                  sx={{ mb: 1 }}
                  primary='Proximity'
                  secondary={values.proximity?.shortName}
                  active={stepName === 'proximity'}
                  onClick={() => goToStep('proximity')}
                  pieValue={getAnswerValue(values, 'proximity', impact)}
                />
              )}
              {impact?.positive && impact?.indicators.map((indicator, index) => (
                <Fragment key={indicator.id}>
                  <StepperDrawerItem
                    primary={`Indicator ${index + 1}`}
                    secondary={indicator.name}
                    icon={IndicatorIcon}
                    active={
                      (highlight || []).includes(`noisiness[${index}]`) ||
                      (highlight || []).includes(`validation[${index}]`)
                    }
                    grey={
                      !(highlight || []).includes(`noisiness[${index}]`) &&
                      !(highlight || []).includes(`validation[${index}]`)
                    }
                  />
                  <StepperDrawerItem
                    sx={{ mt: 1 }}
                    primary='Indicator noisiness'
                    secondary={values.indicatorScores[index]?.noisiness?.shortName}
                    active={stepName === 'noisiness'}
                    onClick={() => goToStep(`noisiness[${index}]`)}
                    pieValue={getAnswerValue(values, 'noisiness', impact, false, index)}
                  />
                  <StepperDrawerItem
                    sx={{ mb: 1 }}
                    primary='Validation'
                    secondary={values.indicatorScores[index]?.validation?.shortName}
                    active={stepName === 'validation'}
                    onClick={() => goToStep(`validation[${index}]`)}
                    pieValue={getAnswerValue(values, 'validation', impact, false, index)}
                  />
                </Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(ScoringDrawer);
