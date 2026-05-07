import React, { memo } from 'react';
import { Box, Button, Divider, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Tooltip from "@mui/material/Tooltip";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const OnboardingTooltip = ({ placement = 'top', title, subtitle, position, open, onClose, next, last }) => {
  return (
    <CustomErrorBoundary>
      <Tooltip
        open={open}
        arrow
        placement={placement}
        title={(
          <Box p={2} color='white' backgroundColor='primary.main' sx={{ borderRadius: '8px' }} id='onboarding-tooltip'>
            <Box display='flex' alignItems='flex-start'>
              <Box>
                <Typography variant='bodyBold'>{title}</Typography>
                <Typography variant='caption' sx={{ mt: 1 }}>{subtitle}</Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ p: 0 }}><CloseIcon sx={{ color: 'white' }} /></IconButton>
            </Box>
            {next && (
              <Box sx={{ textAlign: 'right' }}>
                <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
                <Button variant='ghost' onClick={last ? onClose : next} endIcon={last ? null : <SkipNextIcon />}>
                  {last ? 'Close' : 'Next'}
                </Button>
              </Box>
            )}
          </Box>
        )}
        PopperProps={{
          sx: {
            '.MuiTooltip-tooltip': {
              padding: 0,
              borderRadius: '8px',
            },
            '.MuiTooltip-arrow': {
              color: 'primary.main',
            }
          }
        }}
      >
        <Box position='absolute' {...position} sx={{ pointerEvents: 'none' }} />
      </Tooltip>
    </CustomErrorBoundary>
  );
};

export default memo(OnboardingTooltip);
