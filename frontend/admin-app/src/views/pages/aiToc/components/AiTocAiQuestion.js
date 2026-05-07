import React, { memo } from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import { getTypography } from "shared-components/utils/typography";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ReplayIcon from "@mui/icons-material/Replay";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const AiTocAiQuestionInput = ({ nextStep, setTouched, values, index, reset, ...rest }) => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      nextStep();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box {...rest} display='flex' flexDirection='column' justifyContent='space-between' gap={2}>
          <Box>
            <Typography variant='overline' color='secondary.dark'>AI question #{index + 1}</Typography>
            <Typography variant='subtitleBold'>{values.questions[index]}</Typography>
            <FormikTextInput
              name={`answer${index + 1}`}
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
            <StepperNextButton nextStep={nextStep}>
              <Button onClick={nextStep}
                variant='outlined'
                endIcon={<SkipNextIcon />}
                fullWidth={isMobileView}
              >
                Skip
              </Button>
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

export default memo(AiTocAiQuestionInput);
