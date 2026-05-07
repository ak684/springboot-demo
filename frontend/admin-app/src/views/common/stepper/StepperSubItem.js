import React, { memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StepperSubItem = ({ item, activeItem, sx = {}, helperText, ...rest }) => {
  const theme = useTheme();

  const itemOnClick = (e, item) => {
    e.stopPropagation();
    item.onClick();
  }

  return (
    <CustomErrorBoundary>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        p={1}
        sx={{
          backgroundColor: activeItem === item.name ? theme.palette.secondary.subtle : 'transparent',
          borderRadius: '2px',
          cursor: item.onClick ? 'pointer' : 'default',
          ...sx
        }}
        key={item.name}
        onClick={(e) => item.onClick ? itemOnClick(e, item) : null}
        {...rest}
      >
        <Typography
          variant='caption'
          sx={{ color: activeItem === item.name ? theme.palette.primary.main : theme.palette.text.primary }}
        >
          {item.label}
        </Typography>
        <Box display='flex' alignItems='center' gap={1}>
          {helperText && <Typography variant='caption'>{helperText}</Typography>}
          {activeItem === item.name && <RadioButtonCheckedIcon sx={{ color: 'primary.main', width: 13 }} />}
          {activeItem !== item.name && !!item.completed && (
            <CheckCircleIcon sx={{ color: 'primary.main', width: 13 }} />
          )}
          {activeItem !== item.name && !item.completed && (
            <RadioButtonUncheckedIcon sx={{ color: 'secondary.main', width: 13 }} />
          )}
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(StepperSubItem);
