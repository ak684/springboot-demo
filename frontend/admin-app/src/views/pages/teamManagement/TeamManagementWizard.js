import React, { memo, useState } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import DoNotShowCheckbox from "../../common/stepper/DoNotShowCheckbox";
import { configThunks } from "store/ducks/config";
import { useDispatch } from "react-redux";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  height: `calc(100vh - ${HEADER_HEIGHT}px)`,
  padding: theme.spacing(21),
  backgroundImage: 'url(/images/background/team.jpg)',
  backgroundSize: 'cover',
}));

const TeamManagementWizard = () => {
  const [hide, setHide] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goToTeam = () => {
    if (hide) {
      dispatch(configThunks.updateUserConfig({ name: 'hideTeamManagementWizard', value: hide }));
    }
    navigate(`/team`);
  };

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        <Box sx={{ maxWidth: 700 }}>
          <Typography color='white' variant='display' sx={{ mb: 3 }}>Manage your team</Typography>
          <Typography color='white' variant='body'>
            For each active subscription and accessible portfolio, you can invite team members, coaches, and other
            collaborators to join your organization. Upon invitation, you can assign specific permissions, choosing
            between "editing" and "view only" access rights. These permissions can be adjusted or revoked any time.
          </Typography>
        </Box>
        <Box mt={4} display='flex' alignItems='center' gap={4}>
          <Button onClick={goToTeam} startIcon={<AddIcon />}>
            Manage your team
          </Button>
          <DoNotShowCheckbox value={hide} setValue={setHide} />
        </Box>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(TeamManagementWizard);
