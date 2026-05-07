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
  backgroundImage: 'url(/images/background/darts.jpg)', // Using darts.jpg like scoring wizard
  backgroundSize: 'cover',
}));

const AggregatedIndicatorWizard = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hide, setHide] = useState(false);

  const goToCreation = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideAggregatedIndicatorWizard', value: hide }));
    }
    navigate(`/portfolios/${portfolioId}/aggregated-indicator/create?step=0`);
  };
  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 700 }}>
          <Typography color='white' variant='display' sx={{ mb: 3 }}>Welcome to the aggregated indicator wizard</Typography>
          <Typography color='white' variant='body'>
            We will help you create portfolio-wide indicators by aggregating data across multiple ventures
            in your portfolio to track collective impact and performance.
          </Typography>
          <Box mt={4} display='flex' alignItems='center' gap={4}>
            <WizardStartButton onClick={goToCreation} />
            <DoNotShowCheckbox value={hide} setValue={setHide} />
          </Box>
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(AggregatedIndicatorWizard);
