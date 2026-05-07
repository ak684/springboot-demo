import React, { memo } from 'react';
import { Chip, styled } from '@mui/material';
import { getTypography } from "shared-components/utils/typography";

const StyledChip = styled(Chip)(({ theme }) => ({
  background: theme.palette.background.fade,
  borderRadius: 4,
  textTransform: 'uppercase',
  ...getTypography('caption'),
  fontWeight: 'bold',
  '.MuiChip-label': {
    padding: theme.spacing(0.5, 1),
  }
}));

const AppLabel = ({ children, ...rest }) => {
  return (
    <StyledChip size='small' label={children} variant='outlined' color='secondary' {...rest} />
  );
};

export default memo(AppLabel);
