import React, { memo } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PublicProfileImpactDetailsText = ({ venture, title, text }) => {
  const user = venture.organization.users[0];

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box display='flex' flexDirection='column' gap={3}>
          <Typography varaint='h5' color='secondary.dark'>{title}</Typography>
          <Typography sx={{ fontSize: 44 }}><q>{text}</q></Typography>
          <Box display='flex' gap={2}>
            <Avatar sx={{ width: 64, height: 64 }} src={user.avatar} />
            <Box>
              <Typography sx={{ fontSize: 24 }}>{user.name} {user.lastName}</Typography>
              <Typography variant='body'>{user.position}</Typography>
            </Box>
          </Box>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(PublicProfileImpactDetailsText);
