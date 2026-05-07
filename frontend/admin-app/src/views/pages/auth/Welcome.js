import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import { getAuthBackground, getBranding } from 'shared-components/utils/branding';

const WAVE_SVG =
  `"data:image/svg+xml;utf8,` +
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800' preserveAspectRatio='none'>` +
  `<g fill='none' stroke='white' stroke-opacity='0.12' stroke-width='1.2'>` +
  `<path d='M720 -100 Q 500 200 620 400 T 540 900'/>` +
  `<path d='M680 -100 Q 460 220 580 420 T 500 900'/>` +
  `<path d='M640 -100 Q 420 240 540 440 T 460 900'/>` +
  `<path d='M600 -100 Q 380 260 500 460 T 420 900'/>` +
  `<path d='M560 -100 Q 340 280 460 480 T 380 900'/>` +
  `<path d='M520 -100 Q 300 300 420 500 T 340 900'/>` +
  `<path d='M480 -100 Q 260 320 380 520 T 300 900'/>` +
  `<path d='M440 -100 Q 220 340 340 540 T 260 900'/>` +
  `<path d='M400 -100 Q 180 360 300 560 T 220 900'/>` +
  `<path d='M360 -100 Q 140 380 260 580 T 180 900'/>` +
  `</g></svg>"`;

const Welcome = () => {
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const headline = whiteLabel.welcomeHeadline || `Welcome to the ${branding.companyName} service!`;
  const subtext = whiteLabel.welcomeSubtext
    || 'Your account is being activated. This might take a few moments.';
  const buttonLabel = whiteLabel.welcomeButtonLabel || 'Start';

  return (
    <CustomErrorBoundary>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: getAuthBackground(),
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-25%',
            left: '-25%',
            width: '150%',
            height: '150%',
            backgroundImage: `url(${WAVE_SVG})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'rotate(-30deg)',
            transformOrigin: 'center center',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 4, md: 10, lg: 14 },
            maxWidth: 900,
          }}
        >
          <Typography
            variant='h1'
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: 32, md: 48, lg: 56 },
              mb: 2,
            }}
          >
            {headline}
          </Typography>
          <Typography
            variant='body'
            sx={{ color: 'white', opacity: 0.9, display: 'block', mb: 4 }}
          >
            {subtext}
          </Typography>
          <Button
            component={RouterLink}
            to='/'
            endIcon={<ArrowForwardIcon />}
            sx={{ px: 4, py: 1.25 }}
          >
            {buttonLabel}
          </Button>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(Welcome);
