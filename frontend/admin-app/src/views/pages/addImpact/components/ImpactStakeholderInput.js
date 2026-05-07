import React, { memo } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import PersonIcon from '@mui/icons-material/Person';
import LanguageIcon from '@mui/icons-material/Language';
import InfoAlert from 'views/common/InfoAlert';
import { GLOBAL_COMMUNITY_INPUT } from "shared-components/utils/constants";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledButton = styled(Button)(({ theme, selected }) => ({
  flex: '1 0',
  display: 'flex',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: 'white',
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
  const setGlobalCommunity = () => {
    setFieldValue('stakeholders', GLOBAL_COMMUNITY_INPUT);
    setFieldValue('specificStakeholder', false);
    nextStep();
  };

  const setSpecific = () => {
    setFieldValue('specificStakeholder', true);
    nextStep();
  };

  const specific = values.specificStakeholder;

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>
            {values.positive ? 'Who benefits? (Stakeholders)' : 'Who is negatively impacted? (Stakeholders)'}
          </StepperTitle>
          <StepperDescription>
            {
              values.positive ?
                'Who are the stakeholders benefiting from the change?' :
                'Who are the stakeholders who might be negatively impacted by your innovation?'
            }
          </StepperDescription>
          <Box display='flex' gap={2}>
            <StyledButton onClick={setSpecific} selected={specific === true} variant='text'>
              <StyledIcon selected={specific === true}><PersonIcon /></StyledIcon>
              <Typography>Specific stakeholder</Typography>
            </StyledButton>
            <StyledButton onClick={setGlobalCommunity} selected={specific === false} variant='text'>
              <StyledIcon selected={specific === false}><LanguageIcon /></StyledIcon>
              <Typography>Global community / the planet</Typography>
            </StyledButton>
          </Box>
          <InfoAlert title='Suggestion' sx={{ mt: 4 }}>
            {values.positive && (
              <>
                <Box>
                  Whenever possible, please name individuals belonging to a specific stakeholder group, such as
                  individuals suffering from Alzheimer disease, unemployed in the USA, families below the poverty line
                  in South America
                  etc.
                </Box>
                <Box>
                  Choose global community, if identifying a specific stakeholder group is difficult, such as effects of
                  carbon emissions (hard to name a specific stakeholder group), or preserving rain forest, wildlife etc.
                </Box>
              </>
            )}
            {!values.positive && (
              <>
                <Box>
                  Whenever possible, please name individuals belonging to a specific stakeholder group, such individuals
                  disadvantaged as they do not benefit from your service.
                </Box>
                <Box>
                  Choose global community, if identifying a specific stakeholder group is difficult, such as effects of
                  carbon emissions (hard to name a specific stakeholder group).
                </Box>
              </>
            )}
          </InfoAlert>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactStakeholderInput);
