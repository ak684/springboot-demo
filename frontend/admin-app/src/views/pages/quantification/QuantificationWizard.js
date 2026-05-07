import React, { memo, useState } from 'react';
import { Button, Divider, styled, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import DoNotShowCheckbox from "../../common/stepper/DoNotShowCheckbox";
import { useDispatch } from "react-redux";
import { configThunks } from "store/ducks/config";
import { useNavigate, useParams } from "react-router-dom";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/quantification.jpg)',
  backgroundSize: 'cover',
}));

const QuantificationWizard = () => {
  const [hide, setHide] = useState(false);
  const dispatch = useDispatch();
  const { ventureId, impactId } = useParams();
  const navigate = useNavigate();

  const goToQuantificaition = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideQuantificationWizard', value: hide }));
    }
    navigate(`/ventures/${ventureId}/impacts/${impactId}/quantification?step=0`);
  };

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 800 }}>
          <Typography color='white' variant='display' sx={{ mb: 4 }}>Quantifying your impact</Typography>
        </Box>
        <Box display='flex' flexDirection='column' gap={3} color='white' maxWidth={600}>
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Number of products, services sold, activities
            </Typography>
            <Typography variant='caption'>
              How many products & services do you sell/deliver per year.
            </Typography>
          </Box>
          <Divider flexItem sx={{ borderColor: 'secondary.dark' }} />
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Number of stakeholders reached
            </Typography>
            <Typography variant='caption'>
              How many stakeholders do you reach with these products/services.
            </Typography>
          </Box>
          <Divider flexItem sx={{ borderColor: 'secondary.dark' }} />
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Change achieved per stakeholder
            </Typography>
            <Typography variant='caption'>
              Value of your indicator pre vs. post your intervention.
            </Typography>
          </Box>
        </Box>

        <Box mt={4} display='flex' alignItems='center' gap={4}>
          <Button onClick={goToQuantificaition} endIcon={<ChevronRightIcon />}>Next</Button>
          <DoNotShowCheckbox value={hide} setValue={setHide} />
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationWizard);
