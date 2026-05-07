import React, { memo } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, styled, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomErrorBoundary from "admin-app/src/views/containers/CustomErrorBoundary";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiDialog-paper': {
    width: `calc(100% - ${theme.spacing(2)})`,
    margin: theme.spacing(2),
    backgroundColor: 'white',
    borderRadius: 16,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${theme.spacing(4)})`,
      margin: theme.spacing(4),
    }
  }
}));

const StyledActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'white',
}));

const Modal = ({ open, onClose, title, children, actions, maxWidth = 'sm', fullWidth = false, ...rest }) => {
  return (
    <StyledDialog onClose={onClose} open={open} maxWidth={maxWidth} fullWidth={fullWidth} {...rest}>
      <CustomErrorBoundary>
        {
          title &&
          <DialogTitle component='div' sx={{ p: 2 }}>
            <Typography variant='h5'>{title}</Typography>
          </DialogTitle>
        }
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <DialogContent dividers sx={{ p: 4, fontSize: 16 }}>{children}</DialogContent>
        {actions && <StyledActions>{actions}</StyledActions>}
      </CustomErrorBoundary>
    </StyledDialog>
  );
};

export default memo(Modal);
