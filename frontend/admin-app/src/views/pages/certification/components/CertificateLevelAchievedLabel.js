import React, { memo } from 'react';
import { Button, useTheme } from "@mui/material";
import DoneIcon from '@mui/icons-material/Done';

const CertificateLevelAchievedLabel = () => {
  const theme = useTheme();

  return (
    <Button
      color='success'
      variant='outlined'
      sx={{ backgroundColor: theme.palette.success.subtle, border: 'none', pointerEvents: 'none' }}
      endIcon={<DoneIcon sx={{ color: 'success.main' }} />}
    >
      Achieved
    </Button>
  );
};

export default memo(CertificateLevelAchievedLabel);
