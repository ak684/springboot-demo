import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getBranding } from '../../utils/branding';

const Logo = ({ sx = {}, ...rest }) => {
  const branding = getBranding();
  const logoPrimary = branding?.logo?.primaryText;
  const logoSecondary = branding?.logo?.secondaryText;
  const logoImageUrl = branding?.logo?.imageUrl;
  const logoImageHeight = branding?.logo?.imageHeight || 32;
  const logoImageAlt = branding?.logo?.imageAlt || branding?.companyName || '';

  const primaryText = logoPrimary || branding?.companyName || '';

  let secondaryText = logoSecondary || null;
  if (!secondaryText && branding?.companyShortName && branding.companyShortName !== primaryText) {
    secondaryText = branding.companyShortName;
  }
  if (secondaryText && secondaryText === primaryText) {
    secondaryText = null;
  }

  const [imageFailed, setImageFailed] = useState(false);

  if (logoImageUrl && !imageFailed) {
    return (
      <Box {...rest} sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', ...sx }}>
        <Box
          component='img'
          src={logoImageUrl}
          alt={logoImageAlt}
          onError={() => setImageFailed(true)}
          sx={{ height: logoImageHeight, width: 'auto', display: 'block' }}
        />
      </Box>
    );
  }

  if (!primaryText && !secondaryText) {
    return <Box {...rest} sx={{ ...sx }} />;
  }

  return (
    <Box {...rest} sx={{ whiteSpace: 'nowrap', textDecoration: 'none', ...sx }}>
      <Typography component='span' variant='h5' color='text.primary'>
        {primaryText}
      </Typography>
      {secondaryText && (
        <Typography component='span' variant='h5' color='secondary.main'>
          {secondaryText}
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
