import React, { memo, useEffect, useMemo, useState } from 'react';
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, FormikProvider, useFormik } from "formik";
import queryString from "query-string";
import { getSteps } from "./data/steps";
import { clone, isDefined } from "shared-components/utils/lo";
import { Box } from "@mui/material";
import { GLOBAL_COMMUNITY_INPUT, HEADER_HEIGHT, MONTHS } from "shared-components/utils/constants";
import { AnimationContextProvider } from "context/AnimationContext";
import StepperControls from "../../common/stepper/StepperControls";
import QuantificationDrawer from "./components/QuantificationDrawer";
import QuantificationSummary from "./components/QuantificationSummary";
import { toast } from "react-toastify";
import { ventureThunks } from "store/ducks/venture";
import {
  emptyIndicatorYearlyData,
  emptyYearlyData,
  harmonizeYears,
  initialYearlyData,
  nullMonthsToEmptyStrings,
  nullValuesToEmptyStrings,
  sortByYear
} from "shared-components/utils/quantification";
import NotesDrawer from "../../common/notes/NotesDrawer";
import { dictionarySelectors, dictionaryThunks } from "../../../store/ducks/dictionary";
import { noteThunks } from "../../../store/ducks/note";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  id: Yup.number().nullable(true),
  productsData: Yup.array().of(Yup.object().shape({
    year: Yup.number(messages.errors.validation.number),
    ...MONTHS.reduce((acc, month) => {
      acc[month] = Yup.number().min(0, messages.errors.validation.minValue(0));
      return acc;
    }, {})
  })),
  stakeholdersData: Yup.array().of(Yup.object().shape({
    year: Yup.number(messages.errors.validation.number),
    ...MONTHS.reduce((acc, month) => {
      acc[month] = Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0));
      return acc;
    }, {})
  })),
  impactCalculationTotal: Yup.boolean(),
  indicators: Yup.array().of(Yup.object().shape({
    quantificationType: Yup.string(),
    preInitial: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    postInitial: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    pre: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      value: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    })),
    post: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      value: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    })),
    deadweight: Yup.number(messages.errors.validation.number)
      .min(0, messages.errors.validation.minValue(0))
      .max(100, messages.errors.validation.maxValue(100)),
    deadweightComment: Yup.string(),
    displacement: Yup.number(messages.errors.validation.number)
      .min(0, messages.errors.validation.minValue(0))
      .max(100, messages.errors.validation.maxValue(100)),
    displacementComment: Yup.string(),
    attribution: Yup.number(messages.errors.validation.number)
      .min(0, messages.errors.validation.minValue(0))
      .max(100, messages.errors.validation.maxValue(100)),
    attributionComment: Yup.string(),
    dropoff: Yup.array().of(Yup.number(messages.errors.validation.number)
      .min(0, messages.errors.validation.minValue(0))
      .max(100, messages.errors.validation.maxValue(100))),
    dropoffComment: Yup.string(),
    duration: Yup.number(messages.errors.validation.number),
    stable: Yup.boolean()
  })),
});

const getInitialProductsData = (impact) => impact.productsData.length > 0
  ? sortByYear(nullMonthsToEmptyStrings(impact.productsData))
  : clone(initialYearlyData('PRODUCTS'));

const Quantification = ({ impact }) => {
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const [stepForward, setStepForward] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const units = useSelector(dictionarySelectors.getUnits());
  const isGlobal = impact.stakeholders === GLOBAL_COMMUNITY_INPUT;
  const { ventureId } = useParams();

  const fetchNotes = (indicator) => {
    dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
      .then(res => {
        setPreNotes(val => ({ ...val, [indicator.id]: res.payload }));
      });
    dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
      .then(res => {
        setPostNotes(val => ({ ...val, [indicator.id]: res.payload }));
      });
  }

  useEffect(() => {
    impact.indicators.forEach(fetchNotes);
  }, []);

  const formikContext = useFormik({
    initialValues: {
      ...impact,
      id: impact.id,
      productsData: getInitialProductsData(impact),
      productsDataActual: nullMonthsToEmptyStrings(harmonizeYears(impact.productsDataActual, getInitialProductsData(impact), emptyYearlyData, 'PRODUCTS_ACTUAL')),
      stakeholdersData: nullMonthsToEmptyStrings(harmonizeYears(impact.stakeholdersData, getInitialProductsData(impact), emptyYearlyData, 'STAKEHOLDERS')),
      stakeholdersDataActual: nullMonthsToEmptyStrings(harmonizeYears(impact.stakeholdersDataActual, getInitialProductsData(impact), emptyYearlyData, 'STAKEHOLDERS_ACTUAL')),
      productsDataCopied: false,
      stakeholdersDataCopied: false,
      impactCalculationTotal: !!impact.impactCalculationTotal,
      indicators: impact.indicators.map(i => ({
        ...i,
        quantificationType: isGlobal ? 'PER_PRODUCT' : i.quantificationType || 'PER_STAKEHOLDER',
        preInitial: isDefined(i.preInitial) ? i.preInitial : '',
        postInitial: isDefined(i.postInitial) ? i.postInitial : '',
        pre: nullValuesToEmptyStrings(harmonizeYears(i.pre, getInitialProductsData(impact), emptyIndicatorYearlyData, 'PRE')),
        preActual: nullMonthsToEmptyStrings(harmonizeYears(i.preActual, getInitialProductsData(impact), emptyYearlyData, 'PRE_ACTUAL')),
        post: nullValuesToEmptyStrings(harmonizeYears(i.post, getInitialProductsData(impact), emptyIndicatorYearlyData, 'POST')),
        postActual: nullMonthsToEmptyStrings(harmonizeYears(i.postActual, getInitialProductsData(impact), emptyYearlyData, 'POST_ACTUAL')),
        deadweight: isDefined(i.deadweight) ? i.deadweight : '',
        deadweightComment: i.deadweightComment || '',
        displacement: isDefined(i.displacement) ? i.displacement : '',
        displacementComment: i.displacementComment || '',
        attribution: isDefined(i.attribution) ? i.attribution : '',
        attributionComment: i.attributionComment || '',
        dropoff: i.dropoff.length > 0 ? i.dropoff : [],
        dropoffComment: i.dropoffComment || '',
        duration: i.duration || 1,
        stable: isDefined(i.stable) ? i.stable : true,
        unit: i.unit || null,
      })),
    },
    enableReinitialize: true,
    validationSchema: schema,
  });

  const step = Number(queryString.parse(location.search).step);
  const goTo = queryString.parse(location.search).goto;
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

  const values = formikContext.values;
  const stepComponents = useMemo(getSteps(impact), [impact]);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const goToStep = (name, submitData = true) => {
    if (submitData) {
      customOnSubmit(null, true);
    }
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);
  };

  const customOnSubmit = (e, interim = false) => {
    e && e.preventDefault();

    if (formikContext.isSubmitting) {
      return;
    }

    formikContext.setSubmitting(true);

    formikContext.validateForm(values).then(err => {
      if (Object.keys(err).length === 0) {
        dispatch(ventureThunks.quantifyImpact({
          impact: values,
          interim,
          callback: () => {
            navigate(`/ventures/${ventureId}/impacts/${impact.id}/quantification/finish`);
          }
        }))
          .finally(() => formikContext.setSubmitting(false))
      } else {
        if (err.productsData) {
          const messageItem = err.productsData.find(i => isDefined(i));
          const key = Object.keys(messageItem).find(key => isDefined(messageItem[key]));
          toast.error(messageItem[key]);
          goToStep('products', false);
        } else if (err.stakeholdersData) {
          const messageItem = err.stakeholdersData.find(i => isDefined(i));
          const key = Object.keys(messageItem).find(key => isDefined(messageItem[key]));
          toast.error(messageItem[key]);
          goToStep('stakeholders', false);
        } else if (err.indicators) {
          const index = err.indicators.findIndex(i => isDefined(i));
          const errorItem = err.indicators[index];

          if (errorItem.preInitial || errorItem.postInitial) {
            goToStep(`indicators[${index}].prepost`, false);
          } else if (errorItem.pre || errorItem.post) {
            goToStep(`indicators[${index}].duration`, false);
          } else if (errorItem.deadweight) {
            goToStep(`indicators[${index}].deadweight`, false);
          } else if (errorItem.displacement) {
            goToStep(`indicators[${index}].displacement`, false);
          } else if (errorItem.attribution) {
            goToStep(`indicators[${index}].attribution`, false);
          } else if (errorItem.dropoff) {
            goToStep(`indicators[${index}].dropoff`, false);
          }
        }
        formikContext.setSubmitting(false);
      }
    });
  };

  useEffect(() => {
    if (goTo) {
      goToStep(goTo, false);
    } else if (isNaN(step) || step < 0 || step >= stepComponents.length || !isDefined(step)) {
      setStep(0);
    }
  }, [step]);

  useEffect(() => {
    if (units.length === 0) {
      dispatch(dictionaryThunks.fetchUnits());
    }
  }, []);

  if (isNaN(step)) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <FormikProvider value={formikContext}>
        <Box component={Form} onSubmit={customOnSubmit}>
          <QuantificationDrawer
            impact={impact}
            values={values}
            stepName={stepName}
            goToStep={goToStep}
            isGlobal={isGlobal}
            preNotes={preNotes}
            postNotes={postNotes}
          />
          <Box
            ml={46}
            display='flex'
            flexDirection='column'
            alignItems='stretch'
            justifyContent='flex-start'
            sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 115px)` }}
            gap={4}
          >
            <QuantificationSummary
              values={formikContext.values}
              stepName={stepName}
              isGlobal={isGlobal}
              impact={impact}
            />
            <Box sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 320px)` }}>
              <AnimationContextProvider value={stepForward}>
                {StepComponent && <StepComponent
                  key={step}
                  nextStep={nextStep}
                  values={values}
                  impact={impact}
                  setFieldValue={formikContext.setFieldValue}
                  isGlobal={isGlobal}
                  preNotes={preNotes}
                  postNotes={postNotes}
                  fetchNotes={fetchNotes}
                  {...stepComponents[step]?.props}
                />}
              </AnimationContextProvider>
            </Box>
          </Box>
          <StepperControls
            next={nextStep}
            previous={previousStep}
            step={step}
            last={step === stepComponents.length - 1}
            onSkip={customOnSubmit}
            forwardOnEnter={false}
          />
          <NotesDrawer />
        </Box>
      </FormikProvider>
    </CustomErrorBoundary>
  );
};

export default memo(Quantification);
