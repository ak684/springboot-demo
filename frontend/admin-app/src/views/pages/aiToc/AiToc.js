import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import * as Yup from 'yup';
import { Form, FormikProvider, useFormik } from 'formik';
import { AnimationContextProvider } from 'context/AnimationContext';
import AiTocDrawer from './components/AiTocDrawer';
import { getSteps } from './data/steps';
import StepperControls from 'views/common/stepper/StepperControls';
import { isDefined } from 'shared-components/utils/lo';
import { useSelector } from 'react-redux';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import queryString from 'query-string';
import useModal from "shared-components/hooks/useModal";
import AiTocSaveModal from "./components/AiTocSaveModal";
import AiTocResult from "./components/AiTocResult";
import api from "services/api";
import { toast } from "react-toastify";
import AiTocLoading from "./components/AiTocLoading";
import { ventureSelectors } from "store/ducks/venture";
import { userSelectors } from "store/ducks/user";
import messages from "shared-components/utils/messages";
import AiTocFooter from "./components/AiTocFooter";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  name: Yup.string().required(messages.errors.validation.required),
  url: Yup.string(),
  activities: Yup.string(),
  geography: Yup.string(),
  website: Yup.string(),
  questions: Yup.array().of(Yup.string()),
  answer1: Yup.string(),
  answer2: Yup.string(),
  answer3: Yup.string(),
  toc: Yup.array(),
  instructions: Yup.string(),
});

const AiToc = () => {
  const [stepForward, setStepForward] = useState(true);
  const [refining, setRefining] = useState(false);
  const [saveModalOpen, saveToc, closeSaveModal] = useModal();
  const [loadingMessage, setLoadingMessage] = useState('');
  const user = useSelector(userSelectors.getCurrentUser());

  const navigate = useNavigate();
  const location = useLocation();
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  const step = Number(queryString.parse(location.search).step);
  const setStep = (newStep) => navigate(`${location.pathname}?step=${newStep}`);

  const nextStep = () => {
    if (step === 3) {
      firstAnswer();
    } else if (step === 6) {
      secondAnswer();
    } else if (step === 7) {
      refineToc();
    }

    setStepForward(true);
    setStep(step + 1);
  };

  const previousStep = () => {
    setStepForward(false);
    setStep(step - 1);
  };

  const goToStep = (name) => {
    const stepIndex = stepComponents.findIndex(s => s.name === name);
    setStepForward(stepIndex >= step);
    setStep(stepIndex);
  };

  const stepComponents = getSteps(refining);
  const StepComponent = stepComponents[step]?.component;
  const stepName = stepComponents[step]?.name;

  const onSubmit = (e) => {
    e && e.preventDefault();
  };

  const pageState = JSON.parse(localStorage.getItem("AI_TOC") || "{}");
  const formikContext = useFormik({
    initialValues: {
      name: pageState?.name || venture?.name || '',
      url: pageState.url || venture?.website || '',
      activities: pageState.activities || '',
      geography: pageState.geography || '',
      website: pageState.website || '',
      questions: pageState.questions || [],
      answer1: pageState.answer1 || '',
      answer2: pageState.answer2 || '',
      answer3: pageState.answer3 || '',
      toc: pageState.toc || [],
      instructions: pageState.instructions || '',
    },
    onSubmit,
    validationSchema: schema,
  });

  useEffect(() => {
    if (step >= stepComponents.length) {
      setStep(7);
    } else if (isNaN(step) || !isDefined(step)) {
      if (pageState.toc?.length) {
        setStep(7);
      } else {
        setStep(0);
      }
    } else if (step < 0) {
      setStep(0);
    }
  }, [step]);

  const firstAnswer = () => {
    setLoadingMessage('AI is generating clarifying questions... Please wait');
    api.post('/ai-toc/website-data', formikContext.values.url, { 'Content-Type': 'text/plain' })
      .then(content => {
        formikContext.setFieldValue('website', content);
        api.post('/ai-toc/1', {
          name: formikContext.values.name,
          website: content,
          activities: formikContext.values.activities
        })
          .then(res => {
            formikContext.setFieldValue('questions', res);
            setStep(4);
          })
          .catch(() => {
            toast.error('Something went wrong');
            setStep(0);
          })
          .finally(() => {
            setLoadingMessage('');
          });
      })
      .catch(() => {
        toast.error('Something went wrong');
        setStep(0);
        setLoadingMessage('');
      });
  }

  const secondAnswer = () => {
    setLoadingMessage('Generating theory of change... Please wait, this may take up to 3 minutes');
    api.post('/ai-toc/2', {
      name: formikContext.values.name,
      website: formikContext.values.website,
      activities: formikContext.values.activities,
      questions: formikContext.values.questions,
      answer1: formikContext.values.answer1,
      answer2: formikContext.values.answer2,
      answer3: formikContext.values.answer3,
    }, {}, { timeout: 600000 })
      .then(res => {
        formikContext.setFieldValue('toc', res);
        setStep(7 + refining);
      })
      .catch(() => {
        toast.error('Something went wrong');
        setStep(4);
      })
      .finally(() => {
        setLoadingMessage('');
      })
  }

  const refine = () => {
    setRefining(true);
    setStep(7);
  };

  const refineToc = () => {
    setLoadingMessage('Generating theory of change... Please wait, this may take up to 3 minutes');
    formikContext.setFieldValue('instructions', '');
    api.post('/ai-toc/3', {
      name: formikContext.values.name,
      website: formikContext.values.website,
      activities: formikContext.values.activities,
      questions: formikContext.values.questions,
      answer1: formikContext.values.answer1,
      answer2: formikContext.values.answer2,
      answer3: formikContext.values.answer3,
      toc: formikContext.values.toc,
      instructions: formikContext.values.instructions,
    }, {}, { timeout: 600000 })
      .then(res => {
        formikContext.setFieldValue('toc', res);
        setStep(8);
      })
      .catch(() => {
        toast.error('Something went wrong');
        setStep(7);
      })
      .finally(() => {
        setLoadingMessage('');
      })
  }

  const confirmReset = (goToLanding) => {
    localStorage.removeItem("AI_TOC");
    setStep(0);
    const newValues = {
      name: venture?.name || '',
      url: venture?.website || '',
      activities: '',
      geography: '',
      website: '',
      questions: [],
      answer1: '',
      answer2: '',
      answer3: '',
      toc: [],
      instructions: '',
    }
    Object.keys(newValues).forEach(key => {
      formikContext.setFieldValue(key, newValues[key], false);
    });
    if (!ventureId && goToLanding) {
      navigate('/ai-toc/start');
    }
  }

  const resetPage = (goToLanding = true) => {
    if (user || !goToLanding) {
      confirmReset(goToLanding);
    } else {
      let tries = localStorage.getItem("AI_TOC_TRIES");
      if (!tries || tries < 4) {
        tries = (tries || 0) + 1;
        localStorage.setItem("AI_TOC_TRIES", tries);
        confirmReset(goToLanding);
      } else {
        toast.error('Create an account to get unlimited Theory of change generation tries');
      }
    }
  }

  useEffect(() => {
    serializePageState();
  }, [formikContext.values.questions, formikContext.values.toc]);

  const serializePageState = () => {
    const pageState = {
      step,
      name: formikContext.values.name,
      url: formikContext.values.url,
      website: formikContext.values.website,
      activities: formikContext.values.activities,
      geography: formikContext.values.geography,
      questions: formikContext.values.questions,
      answer1: formikContext.values.answer1,
      answer2: formikContext.values.answer2,
      answer3: formikContext.values.answer3,
      toc: formikContext.values.toc,
      instructions: formikContext.values.instructions,
    };
    localStorage.setItem("AI_TOC", JSON.stringify(pageState));
  }

  if (isNaN(step)) {
    return <Loader />;
  } else if (loadingMessage) {
    return <AiTocLoading message={loadingMessage} />
  } else if (step >= 7 + refining) {
    return (
      <Box>
        <AiTocResult
          values={formikContext.values}
          refine={refine}
          reset={resetPage}
          saveToc={saveToc}
        />
        {saveModalOpen && (
          <AiTocSaveModal
            onClose={closeSaveModal}
            toc={formikContext.values.toc}
            geography={formikContext.values.geography}
          />
        )}
      </Box>
    );
  }

  return (
    <CustomErrorBoundary>
      <Box mb={{ xs: 9, sm: 12 }}>
        <FormikProvider value={formikContext}>
          <Box component={Form} onSubmit={onSubmit}>
            <AiTocDrawer values={formikContext.values} stepName={stepName} goToStep={goToStep} refining={refining} />
            <Box
              py={2}
              ml={{ xs: 7, sm: 45, lg: 60 }}
              mr={{ xs: 3, lg: 20 }}
              display='flex'
              flexDirection='column'
              alignItems='stretch'
              justifyContent={{ xs: 'flex-start', sm: 'center' }}
              sx={{
                minHeight: {
                  xs: `calc(100vh - ${HEADER_HEIGHT}px - 110px)`,
                  sm: `calc(100vh - ${HEADER_HEIGHT}px - 140px)`
                },
                overflowY: 'hidden'
              }}
            >
              <AnimationContextProvider value={stepForward}>
                {StepComponent && <StepComponent
                  flexGrow={{ xs: 1, sm: 0 }}
                  key={step}
                  nextStep={nextStep}
                  values={formikContext.values}
                  setTouched={formikContext.setFieldTouched}
                  reset={resetPage}
                  {...stepComponents[step]?.props}
                />}
              </AnimationContextProvider>
            </Box>
            <StepperControls
              next={formikContext.isValid ? nextStep : null}
              previous={previousStep}
              step={step}
              last={step === stepComponents.length - 1}
              backAllowed={step <= 3 || (step > 4 && step <= 6)}
            />
            {!user && <AiTocFooter values={formikContext.values} />}
          </Box>
        </FormikProvider>
      </Box>
    </CustomErrorBoundary>
  );
};

export default AiToc;
