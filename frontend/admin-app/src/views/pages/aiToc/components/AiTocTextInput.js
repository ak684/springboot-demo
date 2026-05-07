import React, { memo } from 'react';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { getTypography } from "shared-components/utils/typography";
import ReplayIcon from '@mui/icons-material/Replay';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const AiTocTextInput = ({ nextStep, values, setTouched, name, title, description, required, reset, ...rest }) => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  const goToNextStep = () => {
    if (required && !values[name]) {
      setTouched(name, true);
    } else {
      nextStep();
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      goToNextStep();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box {...rest} display='flex' flexDirection='column' justifyContent='space-between' gap={2}>
          <Box>
            <StepperTitle>{title}</StepperTitle>
            <StepperDescription>{description}</StepperDescription>
            <FormikTextInput
              name={name}
              placeholder='Answer here...'
              inputProps={{ style: { ...getTypography('h4') } }}
              InputLabelProps={{ style: { ...getTypography('h4') } }}
              onKeyDown={handleKeyDown}
              autoFocus
              multiline
              fullWidth
            />
          </Box>
          <Box
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems='center'
            justifyContent='space-between'
            gap={2}
          >
            <StepperNextButton nextStep={goToNextStep}>
              {!required && (
                <Button
                  onClick={goToNextStep}
                  variant='outlined'
                  endIcon={<SkipNextIcon />}
                  fullWidth={isMobileView}
                >
                  Skip
                </Button>
              )}
            </StepperNextButton>
            <Button
              sx={{ mt: { xs: 0, sm: 4 } }}
              onClick={reset}
              variant='outlined'
              startIcon={<ReplayIcon />}
              fullWidth={isMobileView}
            >
              Start over
            </Button>
          </Box>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocTextInput);
