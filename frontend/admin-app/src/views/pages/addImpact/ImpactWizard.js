import React, { memo, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import WizardStartButton from 'views/common/stepper/WizardStartButton';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import DoNotShowCheckbox from "../../common/stepper/DoNotShowCheckbox";
import { configThunks } from "store/ducks/config";
import { useDispatch } from "react-redux";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/wizard.jpg)',
  backgroundSize: 'cover',
}));

const ImpactWizard = () => {
  const navigate = useNavigate();
  const { ventureId } = useParams();
  const [hide, setHide] = useState(false);
  const dispatch = useDispatch();

  const goToCreation = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideImpactWizard', value: hide }));
    }
    navigate(`/ventures/${ventureId}/impacts/add?step=0`);
  };

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 700 }}>
          <Typography color='white' variant='display' sx={{ mb: 3 }}>Welcome to the impact logic builder</Typography>
          <Typography color='white' variant='body'>
            We will help you identify how our actions (innovations) lead to positive changes for stakeholders and how
            you
            can measure it.
          </Typography>
        </Box>
        <Box mt={4} display='flex' alignItems='center' gap={4}>
          <WizardStartButton onClick={goToCreation} />
          <DoNotShowCheckbox value={hide} setValue={setHide} />
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactWizard);
