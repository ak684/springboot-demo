import React, { memo } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledButton = styled(Button,
  { shouldForwardProp: prop => !['success'].includes(prop) })
(({ theme, success, selected }) => ({
  flex: '1 0',
  display: 'flex',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'white',
  borderRadius: 16,
  color: success ? theme.palette.success.main : theme.palette.error.main,
  textTransform: 'unset',
  boxShadow: selected ?
    `inset 0 0 0 2px ${success ? theme.palette.success.main : theme.palette.error.main}` : theme.shadows[1],
}));

const StyledIcon = styled(Box, { shouldForwardProp: prop => !['success'].includes(prop) })(({ theme, success }) => ({
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  backgroundColor: success ? theme.palette.success.subtle : theme.palette.error.subtle,
  color: success ? theme.palette.success.main : theme.palette.error.main,
  borderRadius: 8,
  ...getTypography('h4'),
}));

const ImpactTypeSelect = ({ nextStep, values, setFieldValue }) => {
  const positive = values.positive;

  const setValue = (val) => {
    setFieldValue('positive', val);
    nextStep();
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle
            tooltip='Every innovation has positive and negative impacts. We recommend starting with identifying your 3-5 most important impact areas, followed by your most important 1-2 areas where your innovation will have negative impact for stakeholders.'
          >
            Impact type
          </StepperTitle>
          <Box display='flex' gap={2} mt={4}>
            <StyledButton onClick={() => setValue(true)} selected={positive} success variant='text'>
              <StyledIcon success><AddIcon /></StyledIcon>
              <Typography variant='bodyBold'>Positive</Typography>
            </StyledButton>
            <StyledButton onClick={() => setValue(false)} selected={!positive} variant='text'>
              <StyledIcon><RemoveIcon /></StyledIcon>
              <Typography variant='bodyBold'>Negative</Typography>
            </StyledButton>
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactTypeSelect);
