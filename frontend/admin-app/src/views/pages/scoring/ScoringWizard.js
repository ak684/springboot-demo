import React, { memo, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import WizardStartButton from 'views/common/stepper/WizardStartButton';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import DoNotShowCheckbox from "../../common/stepper/DoNotShowCheckbox";
import { useDispatch } from "react-redux";
import { configThunks } from "store/ducks/config";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/darts.jpg)',
  backgroundSize: 'cover',
}));

const ScoringWizard = () => {
  const navigate = useNavigate();
  const { ventureId, impactId } = useParams();
  const [hide, setHide] = useState(false);
  const dispatch = useDispatch();

  const goToScoring = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideScoringWizard', value: hide }));
    }
    navigate(`/ventures/${ventureId}/impacts/${impactId}/scoring?step=0`);
  };

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 700 }}>
          <Typography color='white' variant='display' sx={{ mb: 3 }}>Welcome to the scoring wizard</Typography>
          <Typography color='white' variant='body'>
            We will help you measure the changes your impact might bring to the stakeholders.
          </Typography>
          <Box mt={4} display='flex' alignItems='center' gap={4}>
            <WizardStartButton onClick={goToScoring} />
            <DoNotShowCheckbox value={hide} setValue={setHide} />
          </Box>
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringWizard);
