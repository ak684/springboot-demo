import React, { memo } from 'react';
import { Box, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";
import { getBranding, isWhiteLabelEnabled } from 'shared-components/utils/branding';

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

const AuthLeftPart = () => {
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const companyName = branding.companyName;
  const isWhiteLabel = isWhiteLabelEnabled();

  // Determine headline and subline based on branding
  let headline;
  let subline;

  const quote = whiteLabel.authQuote;
  const attribution = whiteLabel.authQuoteAttribution;

  if (quote) {
    headline = quote;
    subline = attribution;
  } else {
    const greetings = [
      whiteLabel.authMessage1 || 'It is time we position impact at the core of any venture.',
      whiteLabel.authMessage2 || `Thank you for working with ${companyName}.`,
      whiteLabel.authMessage3 || 'Setting impact targets will increase your impact.',
    ];
    const greetingIndex = Math.floor(Math.random() * greetings.length);
    headline = greetings[greetingIndex];
    subline = `— The ${companyName} Team`;
  }

  const showBackLink = isWhiteLabel && Boolean(whiteLabel.authShowBackLink);
  const backLinkUrl = whiteLabel.authBackLinkUrl || '/';

  return (
    <CustomErrorBoundary>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          ...(isWhiteLabel && {
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
          }),
        }}
      >
        {showBackLink && (
          <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 4 } }}>
            <Link
              href={backLinkUrl}
              underline='none'
              sx={{
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              <ArrowBackIcon fontSize='small' />
              Back
            </Link>
          </Box>
        )}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 4, md: 8, lg: 10 },
            mt: 'auto',
            mb: '25%',
            maxWidth: 800,
          }}
        >
          <Typography
            color='white'
            variant='h1'
            sx={{
              fontSize: { xs: 28, md: 36, lg: 44 },
              lineHeight: 1.15,
              fontWeight: 700,
            }}
          >
            {headline}
          </Typography>
          {subline && (
            <Typography
              color='white'
              variant='subtitle'
              sx={{ display: 'block', mt: 3, opacity: 0.85 }}
            >
              {subline}
            </Typography>
          )}
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(AuthLeftPart);
