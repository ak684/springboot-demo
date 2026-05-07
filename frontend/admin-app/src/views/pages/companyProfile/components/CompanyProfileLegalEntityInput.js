import React, { memo } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import BusinessIcon from '@mui/icons-material/Business';
import BlockIcon from '@mui/icons-material/Block';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledButton = styled(Button)(({ theme, selected }) => ({
  flex: '1 0',
  display: 'flex',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'white',
  borderRadius: 16,
  color: theme.palette.text.primary,
  textTransform: 'unset',
  boxShadow: selected ? `inset 0 0 0 2px ${theme.palette.primary.main}` : `inset 0 0 0 1px ${theme.palette.border}`,
}));

const StyledIcon = styled(Box)(({ theme, selected }) => ({
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  backgroundColor: selected ? theme.palette.primary.subtle : theme.palette.secondary.subtle,
  color: selected ? theme.palette.primary.main : theme.palette.secondary.main,
  borderRadius: theme.shape.borderRadius,
  ...getTypography('h4'),
}));

const ImpactStakeholderInput = ({ nextStep, values, setFieldValue }) => {
  const setValue = (val) => {
    setFieldValue('legalEntityFormed', val);
    nextStep();
  };

  const legalEntityFormed = values.legalEntityFormed;

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>
            Did you already create a legal entity?
          </StepperTitle>
          <Box display='flex' gap={2} mt={4}>
            <StyledButton onClick={() => setValue(true)} selected={legalEntityFormed === true} variant='text'>
              <StyledIcon selected={legalEntityFormed === true}><BusinessIcon /></StyledIcon>
              <Typography>Yes</Typography>
            </StyledButton>
            <StyledButton onClick={() => setValue(false)} selected={legalEntityFormed === false} variant='text'>
              <StyledIcon selected={legalEntityFormed === false}><BlockIcon /></StyledIcon>
              <Typography>No</Typography>
            </StyledButton>
          </Box>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactStakeholderInput);
