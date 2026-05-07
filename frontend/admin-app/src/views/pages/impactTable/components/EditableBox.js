import React, { useState } from 'react';
import { Autocomplete, Box, IconButton, styled, Typography, useTheme } from '@mui/material';
import TextInput from "shared-components/views/form/TextInput";
import { getTypography } from "shared-components/utils/typography";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import { useParams } from "react-router-dom";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

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

const EditableBox = (
  {
    defaultValue,
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
    impactNameRef,
    ...rest
  }
) => {
  const theme = useTheme();
  const [value, setValue] = useState(defaultValue);
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  const handleClick = () => {
    if (access === VENTURE_ACCESS.EDIT) {
      setValue(defaultValue);
      edit();
    }
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
  }

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
        ref={impactNameRef}
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
        {edited && options.length === 0 && (
          <TextInput
            inputProps={{ style: { ...getTypography('subtitle') }, maxLength }}
            value={value}
            multiline
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            autoFocus
          />
        )}
        {edited && options.length > 0 && (
          <Autocomplete
            selectOnFocus
            options={options}
            freeSolo
            value={value}
            onChange={autocompleteOnChange}
            renderInput={(params) => (
              <TextInput
                {...params}
                multiline
                value={params.inputProps.value}
                variant='standard'
                inputProps={{ ...params.inputProps, maxLength: 100 }}
                autoFocus
              />
            )}
            onKeyDown={handleKeyDown}
          />
        )}
        {HoverIcon && (
          <StyledIconButton onClick={hoverIconClick} size='small' disabled={access !== VENTURE_ACCESS.EDIT}>
            <HoverIcon fontSize='small' />
          </StyledIconButton>
        )}
      </StyledBox>
    </CustomErrorBoundary>
  );
};

export default EditableBox;
