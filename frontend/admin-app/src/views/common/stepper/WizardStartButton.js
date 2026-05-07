import React, { memo } from 'react';
import { Box, Button } from '@mui/material';
import EastIcon from '@mui/icons-material/East';

const WizardStartButton = ({ onClick, ...rest }) => {
  return (
    <Box>
      <Button onClick={onClick} endIcon={<EastIcon />} {...rest} >
        Start
      </Button>
    </Box>
  );
};

export default memo(WizardStartButton);
