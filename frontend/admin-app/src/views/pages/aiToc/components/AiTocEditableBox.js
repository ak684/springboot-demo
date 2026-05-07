import React, { useState } from 'react';
import { Autocomplete, Box, IconButton, styled, Typography, useTheme } from '@mui/material';
import TextInput from "shared-components/views/form/TextInput";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import CloseIcon from '@mui/icons-material/Close';

const StyledBox = styled(Box)(() => ({
  '&:hover .MuiIconButton-root': {
    display: 'block'
  }
}));

const StyledIconButton = styled(IconButton)(() => ({
  display: 'none',
  position: 'absolute',
  top: -6,
  right: -8,
}));

const AiTocEditableBox = ({
  defaultValue = '',  // Ensure defaultValue is never undefined
  placeholder,
  edit,
  edited,
  cancel,
  confirm,
  prefix,
  maxLength = 60,
  typography = {},
  HoverIcon,
  hoverAction,
  options = [],
  ...rest
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(defaultValue);

  const handleClick = () => {
    setValue(defaultValue);
    edit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      cancel();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      confirm(e.target.value);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const hoverIconClick = (e) => {
    e.stopPropagation();
    hoverAction && hoverAction();
  };

  const autocompleteOnChange = (e, value) => {
    if (value !== null) {
      confirm(value);
    }
  };

  return (
    <CustomErrorBoundary>
      <StyledBox
        sx={{ cursor: 'pointer', position: 'relative' }}
        onClick={handleClick}
        minHeight={defaultValue ? 16 : 30}
        {...rest}
      >
        {!edited && defaultValue &&
          <Typography variant='subtitle' sx={{ ...typography }}>{prefix ?? ''}{defaultValue}</Typography>
        }
        {!edited && !defaultValue && placeholder && (
          <Typography
            variant='subtitle'
            sx={{ pb: 1, borderBottom: `2px solid ${theme.palette.secondary.main}` }}
            color='text.tetriary'
          >
            {placeholder}
          </Typography>
        )}
        {edited && (
          <Autocomplete
            selectOnFocus
            options={options.length > 0 ? options : []}
            freeSolo
            value={value}
            onChange={autocompleteOnChange}
            clearOnBlur={false}
            disableClearable={false}
            renderInput={(params) => (
              <TextInput
                {...params}
                multiline
                value={params.inputProps.value}
                variant='standard'
                inputProps={{
                  ...params.inputProps,
                  maxLength: options.length > 0 ? 100 : maxLength,
                  style: { ...getTypography('body') }
                }}
                autoFocus
              />
            )}
            onKeyDown={handleKeyDown}
          />
        )}
        {HoverIcon && (
          <StyledIconButton onClick={hoverIconClick} size='small'>
            <HoverIcon fontSize='small' />
          </StyledIconButton>
        )}
      </StyledBox>
    </CustomErrorBoundary>
  );
};

export default AiTocEditableBox;
