import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import queryString from 'query-string';
import { getSteps } from './data/steps';
import { clone, isDefined } from 'shared-components/utils/lo';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { Form, FormikProvider, useFormik } from 'formik';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { AnimationContextProvider } from 'context/AnimationContext';
import StepperControls from 'views/common/stepper/StepperControls';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import CompanyProfileDrawer from './components/CompanyProfileDrawer';
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import moment from 'moment';
import { LoadScriptNext } from "@react-google-maps/api";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  id: Yup.number().nullable(true),
  name: Yup.string().required(() => messages.errors.validation.required),
  legalEntityFormed: Yup.boolean(),
  country: Yup.object().nullable(true),
  formationDate: Yup.object().nullable(true),
  profitOrientation: Yup.string(),
  legalForm: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  region: Yup.string(),
  zipCode: Yup.string(),
  lat: Yup.number().nullable(true),
  lng: Yup.number().nullable(true),
  phone: Yup.string(),
  logo: Yup.string(),
  employees: Yup.number().min(0),
  volunteers: Yup.number().min(0),
  website: Yup.string(),
  instagram: Yup.string(),
  twitter: Yup.string(),
  linkedin: Yup.string(),
  youtube: Yup.string(),
  facebook: Yup.string(),
  reportingPeriod: Yup.string(),
  currency: Yup.object().required(messages.errors.validation.required),
  industries: Yup.array().of(Yup.string()),
  hashtags: Yup.array().of(Yup.string()),
  description: Yup.string(),
  acceleration: Yup.array().of(Yup.object()),
  funding: Yup.array().of(Yup.object()),
  awards: Yup.array().of(Yup.object()),
  streetImage: Yup.string(),
});

const libraries = ["places"];

// toDO: Use the one fetched from the server instead of hardcoding it here?
const usdObject = {
  name: 'UNITED_STATES_DOLLAR',
  label: "United States Dollar",
  isoCode: "USD",
  symbol: "$",
  type: "MeasurementUnit"
}

const CompanyProfile = () => {
  const [stepForward, setStepForward] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const geography = useSelector(dictionarySelectors.getGeography());
  const industries = useSelector(dictionarySelectors.getIndustries());
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const units = useSelector(dictionarySelectors.getUnits());
  const fundingRoundTypes = useSelector(dictionarySelectors.getFundingRoundTypes());

  useEffect(() => {
    if (geography.length === 0) {
      dispatch(dictionaryThunks.fetchGeography());
    }

    if (industries.length === 0) {
      dispatch(dictionaryThunks.fetchIndustries());
    }

    if (units.length === 0) {
      dispatch(dictionaryThunks.fetchUnits());
    }

    if (fundingRoundTypes.length === 0) {
      dispatch(dictionaryThunks.fetchFundingRoundTypes());
    }
  }, []);

  const formikContext = useFormik({
    initialValues: {
      ...(venture || {}),
      id: venture?.id || null,
      name: venture?.name || '',
      legalEntityFormed: venture?.legalEntityFormed || false,
      country: venture?.country || null,
      formationDate: venture?.formationDate ? moment(venture.formationDate) : null,
      profitOrientation: venture?.profitOrientation || '',
      legalForm: venture?.legalForm || '',
      address: venture?.address || '',
      city: venture?.city || '',
      region: venture?.region || '',
      zipCode: venture?.zipCode || '',
      lat: venture?.lat || null,
      lng: venture?.lng || null,
      phone: venture?.phone || '',
      logo: venture?.logo || '',
      employees: isDefined(venture?.employees) ? venture.employees : '',
      volunteers: isDefined(venture?.volunteers) ? venture.volunteers : '',
      website: venture?.website || '',
      instagram: venture?.instagram || '',
      twitter: venture?.twitter || '',
      linkedin: venture?.linkedin || '',
      youtube: venture?.youtube || '',
      facebook: venture?.facebook || '',
      addressParsed: venture?.address || venture?.city || venture?.region || venture?.zipCode,
      socialLinksParsed: venture?.website || venture?.instagram || venture?.twitter || venture?.linkedin || venture?.youtube || venture?.facebook,
      logoParsed: venture?.website || venture?.logo,
      reportingPeriod: venture?.reportingPeriod || '',
      currency: venture?.currency || usdObject,
      industries: venture?.industries.map(i => i.name) || [],
      hashtags: venture?.hashtags || ['', ''],
      description: venture?.description || '',
      team: venture?.team || [],
      acceleration: venture?.acceleration || [],
      funding: venture?.funding || [],
      awards: venture?.awards || [],
      streetImage: venture?.streetImage || '',
    },
    validationSchema: schema,
  });

  const step = Number(queryString.parse(location.search).step);
  const goTo = queryString.parse(location.search).goto;
  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const nextStep = () => {
    setStepForward(true);
    setStep(step + 1);
    customOnSubmit(null, true, step + 1);
  };

  const previousStep = () => {
    setStepForward(false);
    setStep(step - 1);
    customOnSubmit(null, true, step - 1);
  };

  const values = formikContext.values;
  const stepComponents = useMemo(getSteps(values.legalEntityFormed), [values.legalEntityFormed]);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const goToStep = (name, submitData = true) => {
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);

    if (submitData) {
      customOnSubmit(null, true, stepIndex);
    }
  };

  const customOnSubmit = (e, interim = false, nextStep) => {
    e && e.preventDefault();
    const updatedValues = clone(values);

    if (formikContext.isSubmitting) {
      return;
    }

    formikContext.setSubmitting(true);

    formikContext.validateForm(updatedValues).then(err => {
      if (Object.keys(err).length === 0) {
        if (updatedValues.formationDate) {
          updatedValues.formationDate = updatedValues.formationDate.valueOf();
        }

        if (updatedValues.employees === "") {
          delete updatedValues.employees;
        }

        if (updatedValues.volunteers === "") {
          delete updatedValues.volunteers;
        }

        if (updatedValues.id) {
          dispatch(ventureThunks.editVenture({ data: updatedValues, interim }))
            .finally(() => formikContext.setSubmitting(false));
        } else {
          dispatch(ventureThunks.createVenture({ data: updatedValues, step: nextStep }))
            .finally(() => formikContext.setSubmitting(false));
        }
      } else {
        goToStep('name', false);
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

  if (isNaN(step)) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <FormikProvider value={formikContext}>
        <LoadScriptNext
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAP_API_KEY}
          libraries={libraries}
          language="en"
        >
          <Box component={Form} onSubmit={customOnSubmit}>
            <CompanyProfileDrawer values={values} stepName={stepName} goToStep={goToStep} />
            <Box
              ml={46}
              mr={4}
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
                  values={values}
                  setFieldValue={formikContext.setFieldValue}
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
        </LoadScriptNext>
      </FormikProvider>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfile);
