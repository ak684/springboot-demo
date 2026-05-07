import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import queryString from 'query-string';
import { getSteps } from './data/steps';
import { clone, isDefined } from 'shared-components/utils/lo';
import { portfolioSelectors, portfolioThunks } from 'store/ducks/portfolio';
import { Form, FormikProvider, useFormik } from 'formik';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { AnimationContextProvider } from 'context/AnimationContext';
import StepperControls from 'views/common/stepper/StepperControls';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import CompanyProfileDrawer from './components/PortfolioProfileDrawer';
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import moment from 'moment';
import { LoadScriptNext } from "@react-google-maps/api";
import PortfolioProfileAutofillModal from "./components/PortfolioProfileAutofillModal";
import useModal from "shared-components/hooks/useModal";
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

const usdObject = {
  name: 'UNITED_STATES_DOLLAR',
  label: "United States Dollar",
  isoCode: "USD",
  symbol: "$",
  type: "MeasurementUnit"
}

const PortfolioProfile = () => {
  const [stepForward, setStepForward] = useState(true);
  const [aiModalOpen, openAiModal, closeAiModal] = useModal(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const geography = useSelector(dictionarySelectors.getGeography());
  const industries = useSelector(dictionarySelectors.getIndustries());
  const { portfolioId } = useParams();
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
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
      ...(portfolio || {}),
      id: portfolio?.id || null,
      name: portfolio?.name || '',
      country: portfolio?.country || null,
      formationDate: portfolio?.formationDate ? moment(portfolio.formationDate) : null,
      profitOrientation: portfolio?.profitOrientation || '',
      legalForm: portfolio?.legalForm || '',
      address: portfolio?.address || '',
      city: portfolio?.city || '',
      region: portfolio?.region || '',
      zipCode: portfolio?.zipCode || '',
      lat: portfolio?.lat || null,
      lng: portfolio?.lng || null,
      phone: portfolio?.phone || '',
      logo: portfolio?.logo || '',
      employees: isDefined(portfolio?.employees) ? portfolio.employees : '',
      volunteers: isDefined(portfolio?.volunteers) ? portfolio.volunteers : '',
      website: portfolio?.website || '',
      instagram: portfolio?.instagram || '',
      twitter: portfolio?.twitter || '',
      linkedin: portfolio?.linkedin || '',
      youtube: portfolio?.youtube || '',
      facebook: portfolio?.facebook || '',
      addressParsed: portfolio?.address || portfolio?.city || portfolio?.region || portfolio?.zipCode,
      socialLinksParsed: portfolio?.website || portfolio?.instagram || portfolio?.twitter || portfolio?.linkedin || portfolio?.youtube || portfolio?.facebook,
      logoParsed: portfolio?.website || portfolio?.logo,
      reportingPeriod: portfolio?.reportingPeriod || '',
      currency: portfolio?.currency || usdObject,
      hashtags: portfolio?.hashtags || ['', ''],
      description: portfolio?.description || '',
      mission: portfolio?.mission || '',
      team: portfolio?.team || [],
      streetImage: portfolio?.streetImage || '',
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
  const stepComponents = useMemo(getSteps, [values.legalEntityFormed]);
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
          dispatch(portfolioThunks.editPortfolio({ data: updatedValues, interim }))
            .finally(() => formikContext.setSubmitting(false));
        } else {
          dispatch(portfolioThunks.createPortfolio({ data: updatedValues, step: nextStep }))
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

  useEffect(() => {
    if (!portfolioId) {
      openAiModal();
    }
  }, []);

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
                {StepComponent &&
                  <StepComponent
                    key={step}
                    nextStep={nextStep}
                    values={values}
                    setFieldValue={formikContext.setFieldValue}
                    openAiModal={openAiModal}
                    {...stepComponents[step]?.props}
                  />
                }
              </AnimationContextProvider>
            </Box>
            <StepperControls
              next={nextStep}
              previous={previousStep}
              step={step}
              last={step === stepComponents.length - 1}
              onSkip={customOnSubmit}
            />
            <PortfolioProfileAutofillModal
              open={aiModalOpen}
              onClose={closeAiModal}
              values={values}
              setFieldValue={formikContext.setFieldValue}
            />
          </Box>
        </LoadScriptNext>
      </FormikProvider>
    </CustomErrorBoundary>
  );
};

export default memo(PortfolioProfile);
