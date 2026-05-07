import React, { memo } from 'react';
import { Box, InputAdornment, useTheme } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import TagIcon from '@mui/icons-material/Tag';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileHashtags = ({ nextStep }) => {
  const theme = useTheme();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Hashtags</StepperTitle>
          <StepperDescription>Please provide 2 hashtags describing your company's key activities</StepperDescription>
          <FormikTextInput
            name='hashtags[0]'
            placeholder='software'
            inputProps={{ maxLength: 250, style: { ...getTypography('h2') } }}
            InputLabelProps={{ style: { ...getTypography('h5') } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TagIcon />
                </InputAdornment>
              ),
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
          />
          <FormikTextInput
            sx={{ my: 2 }}
            name='hashtags[1]'
            placeholder='saas'
            inputProps={{ maxLength: 250, style: { ...getTypography('h2') } }}
            InputLabelProps={{ style: { ...getTypography('h5') } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TagIcon />
                </InputAdornment>
              ),
            }}
            onKeyDown={handleKeyDown}
            fullWidth
          />
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileHashtags);
