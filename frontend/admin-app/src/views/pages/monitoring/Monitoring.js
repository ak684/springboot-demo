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
import MonitoringDrawer from "./components/MonitoringDrawer";
import {
  emptyIndicatorYearlyData,
  emptyYearlyData,
  findFirstErrorMessage,
  harmonizeYears,
  initialYearlyData,
  nullMonthsToEmptyStrings,
  nullValuesToEmptyStrings,
  sortByYear
} from "shared-components/utils/quantification";
import { toast } from "react-toastify";
import { ventureThunks } from "store/ducks/venture";
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
  productsDataActual: Yup.array().of(Yup.object().shape({
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
  stakeholdersDataActual: Yup.array().of(Yup.object().shape({
    year: Yup.number(messages.errors.validation.number),
    ...MONTHS.reduce((acc, month) => {
      acc[month] = Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0));
      return acc;
    }, {})
  })),
  indicators: Yup.array().of(Yup.object().shape({
    quantificationType: Yup.string(),
    pre: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      value: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    })),
    preActual: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      ...MONTHS.reduce((acc, month) => {
        acc[month] = Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0));
        return acc;
      }, {})
    })),
    post: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      value: Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0)),
    })),
    postActual: Yup.array().of(Yup.object().shape({
      year: Yup.number(messages.errors.validation.number),
      ...MONTHS.reduce((acc, month) => {
        acc[month] = Yup.number(messages.errors.validation.number).min(0, messages.errors.validation.minValue(0));
        return acc;
      }, {})
    })),
  })),
});

const getInitialProductsData = (impact) => impact.productsData.length > 0
  ? sortByYear(nullMonthsToEmptyStrings(impact.productsData))
  : clone(initialYearlyData('PRODUCTS'));

const Monitoring = ({ impact }) => {
  const [stepForward, setStepForward] = useState(true);
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isGlobal = impact.stakeholders === GLOBAL_COMMUNITY_INPUT;
  const { ventureId, impactId } = useParams();
  const units = useSelector(dictionarySelectors.getUnits());

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
      indicators: impact.indicators.map(i => ({
        ...i,
        quantificationType: isGlobal ? 'PER_PRODUCT' : i.quantificationType || 'PER_STAKEHOLDER',
        pre: nullValuesToEmptyStrings(harmonizeYears(i.pre, getInitialProductsData(impact), emptyIndicatorYearlyData, 'PRE')),
        preActual: nullMonthsToEmptyStrings(harmonizeYears(i.preActual, getInitialProductsData(impact), emptyYearlyData, 'PRE_ACTUAL')),
        post: nullValuesToEmptyStrings(harmonizeYears(i.post, getInitialProductsData(impact), emptyIndicatorYearlyData, 'POST')),
        postActual: nullMonthsToEmptyStrings(harmonizeYears(i.postActual, getInitialProductsData(impact), emptyYearlyData, 'POST_ACTUAL')),
      })),
    },
    enableReinitialize: true,
    validationSchema: schema,
  });

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
            navigate(`/ventures/${ventureId}/impacts/${impact.id}/monitoring/finish`);
          }
        }))
          .finally(() => formikContext.setSubmitting(false));
      } else {
        if (err.productsDataActual) {
          const messageItem = err.productsDataActual.find(i => isDefined(i));
          const key = Object.keys(messageItem).find(key => isDefined(messageItem[key]));
          toast.error(messageItem[key]);
          goToStep('products');
        } else if (err.stakeholdersDataActual) {
          const messageItem = err.stakeholdersDataActual.find(i => isDefined(i));
          const key = Object.keys(messageItem).find(key => isDefined(messageItem[key]));
          toast.error(messageItem[key]);
          goToStep('stakeholders');
        } else if (err.indicators) {
          const index = err.indicators.findIndex(i => isDefined(i));

          if (index > -1) {
            const errorItem = err.indicators[index];
            toast.error(findFirstErrorMessage(errorItem));
            goToStep(`indicators[${index}].prepost`);
          }
        }
        formikContext.setSubmitting(false);
      }
    });
  };

  useEffect(() => {
    if (isNaN(step) || step < 0 || step >= stepComponents.length || !isDefined(step)) {
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
          <MonitoringDrawer
            impact={impact}
            values={values}
            stepName={stepName}
            goToStep={goToStep}
            isGlobal={isGlobal}
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
            <Box sx={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 108px)` }}>
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

export default memo(Monitoring);
