import React, { memo } from 'react';
import { Box, Card, styled, Typography, useMediaQuery, useTheme } from '@mui/material';

const StyledIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: theme.spacing(5),
  height: theme.spacing(5),
  borderRadius: theme.spacing(),
  background: theme.palette.secondary.subtle,
}));

const PublicProfileStatItem = ({ icon, label, value, ...rest }) => {
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Card
      sx={{
        display: 'flex',
        p: 2,
        gap: 2,
        border: `1px solid ${theme.palette.border}`,
        cursor: 'pointer',
        '&:hover': {
          transform: `scale(${isMobileView ? 1.05 : 1.1})`,
          outline: `2px solid ${theme.palette.primary.main}`,
          borderColor: 'transparent',
        },
        transition: '400ms all',
      }}
      {...rest}
    >
      <StyledIconWrapper>
        <Box component='img' width={26} height={26} src={icon} alt={label} />
      </StyledIconWrapper>
      <Box>
        <Typography variant='caption' color='text.secondary'>{label}</Typography>
        <Typography variant='bodyBold'>{value}</Typography>
      </Box>
    </Card>
  );
};

export default memo(PublicProfileStatItem);
