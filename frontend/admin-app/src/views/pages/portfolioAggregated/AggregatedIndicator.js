import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { portfolioAggregatedThunks } from 'store/ducks/portfolioAggregated';
import { portfolioSelectors, portfolioThunks } from 'store/ducks/portfolio';
import { toast } from 'react-toastify';
import CustomErrorBoundary from '../../containers/CustomErrorBoundary';
import { HEADER_HEIGHT } from "shared-components/utils/constants";

import { AnimationContextProvider } from 'context/AnimationContext';
import AggregatedIndicatorDrawer from './components/AggregatedIndicatorDrawer';
import { getSteps } from './data/steps';
import { CircularProgress } from '@mui/material';

const schema = Yup.object().shape({
  name: Yup.string().required('Indicator name is required'),
  category: Yup.string(),
  ventures: Yup.array().min(1, 'At least one venture must be selected'),
  timePeriod: Yup.string().required('Time period is required'),
  aggregationType: Yup.string().required('Aggregation type is required'),
  unit: Yup.string()
});

const AggregatedIndicator = ({ editMode = false }) => {
  const { portfolioId, indicatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [stepForward, setStepForward] = useState(true);
  const [isLoading, setIsLoading] = useState(editMode);

  const step = Number(queryString.parse(location.search).step) || 0;
  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const ventures = useSelector(portfolioSelectors.getPortfolioVentures()) || [];

  const formikContext = useFormik({
    initialValues: {
      name: '',
      nameSlovak: '',
      category: '',
      ventures: [],
      timePeriod: '',
      timePeriodEnglish: '',
      timePeriodSlovak: '',
      selectedYears: [],
      aggregationType: '',
      unit: '',
      unitSlovak: '',
      indicatorType: '',
      parentIndicatorId: '',
      hoverSlot: 1,
      continuousCounter: false
    },
    validationSchema: schema,
    onSubmit: () => {}
  });

  useEffect(() => {
    if (portfolioId) {
      dispatch(portfolioThunks.fetchPortfolioVentures(portfolioId));
    }
  }, [dispatch, portfolioId]);

  // Load existing indicator data when in edit mode
  useEffect(() => {
    if (editMode && indicatorId && portfolioId && ventures.length > 0) {
      dispatch(portfolioAggregatedThunks.fetchAggregatedIndicator({ portfolioId, indicatorId }))
        .unwrap()
        .then((data) => {
          // Map venture IDs to actual venture objects
          const selectedVentures = (data.ventureIds || []).map(ventureId => {
            return ventures.find(v => (v.venture?.id || v.id) === ventureId);
          }).filter(Boolean); // Remove any undefined values

          console.log('🔍 Edit mode - mapping ventures:', {
            ventureIds: data.ventureIds,
            availableVentures: ventures.length,
            selectedVentures: selectedVentures.length
          });

          // Set form values with loaded data
          formikContext.setValues({
            ...formikContext.values,
            name: data.name || '',
            nameSlovak: data.nameSlovak || '',
            category: data.category || '',
            unit: data.unit || '',
            unitSlovak: data.unitSlovak || '',
            timePeriod: data.timePeriod || '',
            timePeriodEnglish: data.timePeriodEnglish || '',
            timePeriodSlovak: data.timePeriodSlovak || '',
            selectedYears: data.selectedYears || [],
            aggregationType: data.aggregationType || '',
            ventureIds: data.ventureIds || [],
            ventures: selectedVentures,
            dataSources: data.dataSources || [],
            indicatorType: data.isMain ? 'main' : 'hover',
            parentIndicatorId: data.parentIndicatorId || '',
            hoverSlot: data.hoverSlot || 1,
            continuousCounter: data.continuousCounter || false
          });
          setIsLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load indicator data');
          navigate(`/portfolios/${portfolioId}/aggregated-indicators`);
        });
    }
  }, [editMode, indicatorId, portfolioId, dispatch, ventures]);

  const values = formikContext.values;
  const stepComponents = useMemo(() => getSteps(), []);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const goToStep = (name) => {
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);
  };

  const nextStep = () => {
    setStepForward(true);
    setStep(step + 1);
  };

  const previousStep = () => {
    if (step > 0) {
      setStepForward(false);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('🔥 handleSubmit called!');
    console.log('📋 Current form values:', JSON.stringify(values, null, 2));
    console.log('⚡ isSubmitting:', formikContext.isSubmitting);

    if (formikContext.isSubmitting) {
      console.log('❌ Already submitting, returning early');
      return;
    }

    console.log('✅ Setting submitting to true');
    formikContext.setSubmitting(true);

    try {
      console.log('🔍 Starting form validation...');
      const errors = await formikContext.validateForm(values);

      console.log('📊 Validation results:');
      console.log('  - Errors found:', Object.keys(errors).length);
      console.log('  - Error details:', JSON.stringify(errors, null, 2));

      if (Object.keys(errors).length === 0) {
        console.log('✅ Validation passed! Preparing data...');

        const indicatorData = {
          ...values,
          ventureIds: Array.isArray(values.ventures) ? values.ventures.map(v => v.venture?.id || v.id || v) : []
        };

        console.log('📤 Final data being sent to backend:');
        console.log('  - Name:', indicatorData.name);
        console.log('  - Category:', indicatorData.category);
        console.log('  - Unit:', indicatorData.unit);
        console.log('  - Time Period:', indicatorData.timePeriod);
        console.log('  - Selected Years:', indicatorData.selectedYears);
        console.log('  - Aggregation Type:', indicatorData.aggregationType);
        console.log('  - Venture IDs:', indicatorData.ventureIds);
        console.log('📤 Full payload:', JSON.stringify(indicatorData, null, 2));

        if (editMode) {
          const result = await dispatch(portfolioAggregatedThunks.updateAggregatedIndicator({
            portfolioId,
            indicatorId,
            data: indicatorData
          })).unwrap();
          console.log('🎉 Successfully updated indicator!');
          console.log('📊 Backend response:', JSON.stringify(result, null, 2));
          navigate(`/portfolios/${portfolioId}/aggregated-indicators`);
        } else {
          const result = await dispatch(portfolioAggregatedThunks.createAggregatedIndicator({
            portfolioId,
            data: indicatorData
          })).unwrap();
          console.log('🎉 Successfully created indicator!');
          console.log('📊 Backend response:', JSON.stringify(result, null, 2));
          toast.success('Aggregated indicator created successfully!');
          navigate(`/portfolios/${portfolioId}/aggregated-indicators`);
        }
      } else {
        console.log('❌ Validation failed!');
        // Show validation errors to user
        const errorMessages = Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
        toast.error(`Please fix the following errors: ${errorMessages.join(', ')}`);
      }
    } catch (error) {
      console.error('💥 Submit error:', error);
      console.error('💥 Error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to create aggregated indicator');
    } finally {
      console.log('🏁 Setting submitting to false');
      formikContext.setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <CustomErrorBoundary>
      <FormikProvider value={formikContext}>
        <form onSubmit={(e) => {
          e.preventDefault();
          console.log('📝 Form onSubmit triggered!');
          handleSubmit();
        }}>
          <Box>
            <AggregatedIndicatorDrawer
              values={values}
              stepName={stepName}
              goToStep={goToStep}
              ventures={ventures}
            />
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
                  values={values}
                  setFieldValue={formikContext.setFieldValue}
                  ventures={ventures}
                  onSubmit={handleSubmit}
                  editMode={editMode}
                  {...stepComponents[step]?.props}
                />}
              </AnimationContextProvider>
            </Box>
          </Box>
        </form>
      </FormikProvider>
    </CustomErrorBoundary>
  );
};

export default memo(AggregatedIndicator);
