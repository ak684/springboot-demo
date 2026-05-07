import React, { memo } from 'react';
import { Box, Button, useMediaQuery } from '@mui/material';

const ModalActions = ({ onClose, submitForm, submitTitle = 'Save', closeTitle = 'Cancel', saveDisabled = false }) => {
  const mobileView = useMediaQuery(theme => theme.breakpoints.down('sm'));

  return (
    <Box
      display='flex'
      justifyContent='flex-end'
      flexDirection={mobileView ? 'column' : 'row'}
      flexWrap='wrap'
      width='100%'
      gap={2}
    >
      <Button fullWidth={mobileView} onClick={onClose} color='secondary'>{closeTitle}</Button>
      {submitForm && (
        <Button
          fullWidth={mobileView}
          onClick={submitForm}
          disabled={saveDisabled}
        >
          {submitTitle}
        </Button>
      )}
    </Box>
  );
};

export default memo(ModalActions);
