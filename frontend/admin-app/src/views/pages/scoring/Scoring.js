import React, { memo, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { Box } from '@mui/material';
import { ventureSelectors } from 'store/ducks/venture';
import { Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { AnimationContextProvider } from 'context//AnimationContext';
import ScoringDrawer from './components/ScoringDrawer';
import ScoringSummary from './components/ScoringSummary';
import { getSteps } from './data/steps';
import messages from "shared-components/utils/messages";
import StepperControls from 'views/common/stepper/StepperControls';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import queryString from 'query-string';
import { isDefined } from 'shared-components/utils/lo';
import { scoringThunks } from 'store/ducks/scoring';
import { getInitialScoringValues } from "shared-components/utils/scoring";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  goals: Yup.array().of(Yup.object().shape({
    goal: Yup.object().required(() => messages.errors.validation.required),
    rate: Yup.number().required(() => messages.errors.validation.required),
  })),
  problemImportance: Yup.object().nullable(true),
  problemImportanceNegative: Yup.object().nullable(true),
  problemImportanceExplanation: Yup.string(),
  degreeOfChange: Yup.number().nullable(true),
  degreeOfChangeExplanation: Yup.string(),
  duration: Yup.object().nullable(true),
  durationNegative: Yup.object().nullable(true),
  durationExplanation: Yup.string(),
  contribution: Yup.number().nullable(true),
  contributionExplanation: Yup.string(),
  previousEvidence: Yup.object().nullable(true),
  previousEvidenceNegative: Yup.object().nullable(true),
  previousEvidenceExplanation: Yup.string(),
  proximity: Yup.object().nullable(true),
  proximityExplanation: Yup.string(),
  sizeOfStakeholders: Yup.object().nullable(true),
  sizeOfStakeholdersNegative: Yup.object().nullable(true),
  sizeOfStakeholdersExplanation: Yup.string(),
  stakeholderSituation: Yup.object().nullable(true),
  stakeholderSituationNegative: Yup.object().nullable(true),
  stakeholderSituationExplanation: Yup.string(),
  indicatorScores: Yup.array().of(Yup.object().shape({
    indicator: Yup.object(),
    noisiness: Yup.object().nullable(true),
    noisinessExplanation: Yup.string(),
    validation: Yup.object().nullable(true),
    validationExplanation: Yup.string(),
  })),
  geography: Yup.array().of(Yup.object()),
  geographyCustom: Yup.array().of(Yup.string()),
});

const Scoring = () => {
  const [stepForward, setStepForward] = useState(true);
  const [interimSubmission, setInterimSubmission] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const step = Number(queryString.parse(location.search).step);
  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const dispatch = useDispatch();
  const { impactId } = useParams();
  const questions = useSelector(dictionarySelectors.getScoringQuestions());
  const impact = useSelector(ventureSelectors.getImpact(impactId));

  const formikContext = useFormik({
    initialValues: getInitialScoringValues(impact),
    validationSchema: schema,
    onSubmit: (data, helpers, other) => {
      dispatch(scoringThunks.scoreImpact({ impactId, data, interim: interimSubmission }))
        .finally(() => helpers.setSubmitting(false));
      setInterimSubmission(false);
    },
  });

  const customOnSubmit = () => {
    setInterimSubmission(true);
    formikContext.handleSubmit();
  };

  const stepComponents = useMemo(
    getSteps(impact, questions, formikContext.values.goals),
    [impact, questions, formikContext.values.goals]
  );
  const stepName = stepComponents[step]?.name;

  useEffect(() => {
    if (isNaN(step) || step < 0 || step > stepComponents.length || !isDefined(step)) {
      setStep(0);
    }
  }, [step]);

  if (isNaN(step)) {
    return <Loader />;
  }

  const StepComponent = stepComponents[step].component;

  const nextStep = () => {
    setStepForward(true);
    setStep(step + 1);
    customOnSubmit();
  };

  const previousStep = () => {
    setStepForward(false);
    setStep(step - 1);
    customOnSubmit();
  };

  const goToStep = (name) => {
    customOnSubmit();
    const stepIndex = stepComponents.findIndex(s => s.name === name);

    if (stepIndex > -1) {
      setStepForward(stepIndex >= step);
      setStep(stepIndex);
    }
  };

  return (
    <CustomErrorBoundary>
      <Box>
        <FormikProvider value={formikContext}>
          <Box component={Form}>
            <ScoringDrawer
              impact={impact}
              highlight={stepComponents[step].highlight}
              values={formikContext.values}
              stepName={stepName}
              goToStep={goToStep}
            />
            <Box ml={60} sx={{ overflowY: 'hidden' }}>
              <ScoringSummary sx={{ mr: 2 }} values={formikContext.values} stepName={stepName} />
              <Box
                display='flex'
                flexDirection='column'
                alignItems='stretch'
                justifyContent='center'
                sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 380px)` }}
                mr={2}
              >
                <AnimationContextProvider value={stepForward}>
                  <StepComponent
                    key={step}
                    step={step}
                    nextStep={nextStep}
                    previousStep={previousStep}
                    values={formikContext.values}
                    setFieldValue={formikContext.setFieldValue}
                    isSubmitting={formikContext.isSubmitting}
                    {...stepComponents[step].props}
                  />
                </AnimationContextProvider>
              </Box>
              <StepperControls
                next={nextStep}
                previous={previousStep}
                step={step}
                last={
                  step === stepComponents.length - 1 ||
                  (step === stepComponents.length - 2 && formikContext.values.goals.length === 0)
                }
                onSkip={formikContext.handleSubmit}
              />
            </Box>
          </Box>
        </FormikProvider>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(Scoring);
