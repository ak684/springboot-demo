import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import { Form, withFormik } from 'formik';
import { ventureThunks } from 'store/ducks/venture';
import { AnimationContextProvider } from 'context/AnimationContext';
import ImpactDrawer from './components/ImpactDrawer';
import { getSteps } from './data/steps';
import StepperControls from 'views/common/stepper/StepperControls';
import { clone, isDefined } from 'shared-components/utils/lo';
import { useDispatch } from 'react-redux';
import { GLOBAL_COMMUNITY_INPUT, HEADER_HEIGHT } from "shared-components/utils/constants";
import { useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import { impactThunks } from "store/ducks/impact";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AddImpact = ({ impact, values, setFieldValue, setFieldTouched, validateForm, isSubmitting, setSubmitting }) => {
  const [stepForward, setStepForward] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    dispatch(impactThunks.fetchImpactAutofillValues());
  }, []);

  const step = Number(queryString.parse(location.search).step);
  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const nextStep = () => {
    setStepForward(true);
    setStep(step + 1);
    customOnSubmit(null, true);
  };

  const previousStep = () => {
    setStepForward(false);
    setStep(step - 1);
    customOnSubmit(null, true);
  };

  const goToStep = (name) => {
    customOnSubmit(null, true);
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);
  };

  const stepComponents = useMemo(getSteps(
    values.indicators, values.specificStakeholder, values.positive
  ), [values.indicators, values.specificStakeholder, values.positive]);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const customOnSubmit = (e, interim = false) => {
    e && e.preventDefault();

    if (isSubmitting || (!impact && interim)) {
      return;
    }

    setSubmitting(true);
    const updatedValues = clone(values);
    updatedValues.indicators = values.indicators.filter(i => i.name || i.year);

    validateForm(updatedValues).then(err => {
      if (Object.keys(err).length === 0) {
        dispatch(ventureThunks.createEditImpact({ impact: updatedValues, interim }))
          .finally(() => setSubmitting(false));
      } else if (err.indicators) {
        setFieldTouched('indicators', values.indicators.map(() => ({ name: true, year: true })), true);
        setStep(
          (err.indicators[Object.keys(err.indicators)[0]].name ? 6 : 7) +
          values.specificStakeholder +
          Number(Object.keys(err.indicators)[0] * 2)
        );
        setSubmitting(false);
      }
    });
  };

  useEffect(() => {
    if (isNaN(step) || step < 0 || step >= stepComponents.length || !isDefined(step)) {
      setStep(0);
    }
  }, [step]);

  if (isNaN(step)) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box component={Form} onSubmit={customOnSubmit}>
          <ImpactDrawer values={values} stepName={stepName} goToStep={goToStep} setFieldValue={setFieldValue} />
          <Box
            ml={60}
            mr={20}
            display='flex'
            flexDirection='column'
            alignItems='stretch'
            justifyContent='center'
            sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 115px)`, overflowY: 'hidden' }}
          >
            <AnimationContextProvider value={stepForward}>
              {StepComponent && <StepComponent
                key={step}
                nextStep={nextStep}
                previousStep={previousStep}
                values={values}
                setFieldValue={setFieldValue}
                submit={customOnSubmit}
                {...stepComponents[step]?.props}
              />}
            </AnimationContextProvider>
          </Box>
          <StepperControls
            next={nextStep}
            previous={previousStep}
            step={step}
            last={step === stepComponents.length - 1}
            onSkip={customOnSubmit}
          />
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

const schema = Yup.object().shape({
  name: Yup.string().required(() => messages.errors.validation.required),
  statusQuo: Yup.string().nullable(true),
  innovation: Yup.string().nullable(true),
  stakeholders: Yup.string().nullable(true),
  change: Yup.string().nullable(true),
  outputUnits: Yup.string().nullable(true),
  indicators: Yup.array().of(Yup.object().shape({
    name: Yup.string().required(() => messages.errors.validation.required),
    year: Yup.number().required(() => messages.errors.validation.required),
  })),
  positive: Yup.boolean(),
});

export default memo(withFormik({
  mapPropsToValues: ({ impact }) => ({
    ...impact,
    id: impact?.id || null,
    name: impact?.name || '',
    statusQuo: impact?.statusQuo || '',
    innovation: impact?.innovation || '',
    stakeholders: impact?.stakeholders || '',
    change: impact?.change || '',
    outputUnits: impact?.outputUnits || '',
    indicators: impact?.indicators?.length > 0 ? impact.indicators : [{
      name: '',
      year: '',
    }],
    positive: impact ? impact.positive : true,
    specificStakeholder: impact?.stakeholders ? impact.stakeholders !== GLOBAL_COMMUNITY_INPUT : null,
  }),
  validationSchema: schema,
})(AddImpact));
