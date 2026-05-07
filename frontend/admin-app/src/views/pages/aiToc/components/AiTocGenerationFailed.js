import React, { memo } from 'react';
import { Box, Button, Link, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import { getBranding } from "shared-components/utils/branding";

const AiTocGenerationFailed = ({ reset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const branding = getBranding();
  const supportEmail = branding.supportEmail;

  const goBack = () => {
    navigate(`${location.pathname}?step=3`)
  }

  return (
    <CustomErrorBoundary>
      <Box
        width='100%'
        p={4}
        border={1}
        borderColor='border'
        display='flex'
        flexDirection='column'
        alignItems='center'
        gap={2}
        sx={{ borderRadius: '16px' }}
      >
        <Typography>
          It seems our AI does not have enough information to work with. Please make sure you provide more information
          in the answers to the questions in the steps before. Or contact us and we will make sure you get the result
          you expected!
        </Typography>
        <Box display='flex' justifyContent='center' gap={2} flexWrap='wrap' width='100%'>
          <Button onClick={goBack} fullWidth={isMobileView}>Go back</Button>
          <Button onClick={() => reset(false)} fullWidth={isMobileView}>Start over</Button>
          <Button
            component={Link}
            href={supportEmail ? `mailto:${supportEmail}` : '#'}
            variant='outlined'
            fullWidth={isMobileView}
          >
            Contact us
          </Button>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocGenerationFailed);
