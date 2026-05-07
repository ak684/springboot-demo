import React, { memo, useState } from 'react';
import { Button, Divider, styled, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import DoNotShowCheckbox from "../../common/stepper/DoNotShowCheckbox";
import { useDispatch } from "react-redux";
import { configThunks } from "store/ducks/config";
import { useNavigate, useParams } from "react-router-dom";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/monitoring.jpg)',
  backgroundSize: 'cover',
}));

const MonitoringWizard = () => {
  const [hide, setHide] = useState(false);
  const dispatch = useDispatch();
  const { ventureId, impactId } = useParams();
  const navigate = useNavigate();

  const goToMonitoring = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideMonitoringWizard', value: hide }));
    }
    navigate(`/ventures/${ventureId}/impacts/${impactId}/monitoring?step=0`);
  };

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 800 }}>
          <Typography color='white' variant='display' sx={{ mb: 4 }}>Monitoring progress</Typography>
        </Box>
        <Box display='flex' flexDirection='column' gap={3} color='white' maxWidth={600}>
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Report actual number of products, services, activities
            </Typography>
            <Typography variant='caption'>
              How many products & services do you sell/deliver per year.
            </Typography>
          </Box>
          <Divider flexItem sx={{ borderColor: 'secondary.dark' }} />
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Report actual number of stakeholders reached
            </Typography>
            <Typography variant='caption'>
              Impact relies on the number of stakeholders reached (reported here) and how much change you generate for
              these stakeholders (see step 3).
            </Typography>
          </Box>
          <Divider flexItem sx={{ borderColor: 'secondary.dark' }} />
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              Report change achieved per stakeholder (or per product)
            </Typography>
            <Typography variant='caption'>
              Collect and report data to show proof of your pre vs. post intervention estimates for each indicator.
            </Typography>
          </Box>
          <Divider flexItem sx={{ borderColor: 'secondary.dark' }} />
          <Box display='flex' gap={1}>
            <InfoOutlinedIcon sx={{ color: 'secondary.main' }} />
            <Typography variant='caption' color='secondary.main'>
              We recommend to adapt your forecast, while entering actual values. This way, you constantly increase the
              prediction quality of your 5-year forecast.
            </Typography>
          </Box>
        </Box>

        <Box mt={4} display='flex' alignItems='center' gap={4}>
          <Button onClick={goToMonitoring} endIcon={<ChevronRightIcon />}>Next</Button>
          <DoNotShowCheckbox value={hide} setValue={setHide} />
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringWizard);
