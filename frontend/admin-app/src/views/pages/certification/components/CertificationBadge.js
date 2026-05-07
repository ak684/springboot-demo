import React, { memo } from 'react';
import { Box, styled, Typography } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import { getBranding } from 'shared-components/utils/branding';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 116,
  height: 116,
  backgroundColor: theme.palette.secondary.light,
  color: theme.palette.secondary.main,
  ...getTypography('captionBold'),
  borderRadius: '50%',
}))

const CertificationBadge = ({ venture, ...rest }) => {
    const companyName = getBranding().companyName;
    return (
      <Box>
        {venture.certification < 1 && (
          <StyledBox {...rest}>
            <Typography variant='captionBold' align='center' sx={{ maxWidth: 64 }}>
              Your certificate here
            </Typography>
          </StyledBox>
        )}
        {venture.certification >= 1 && (
          <Box
            component='img'
            width={116}
            height={116}
            src={`/images/certification/level${venture.certification}.png`}
            alt={`${companyName} certification badge`}
          />
        )}
      </Box>
    );
  }
;

export default memo(CertificationBadge);
