import React, { memo } from 'react';
import { styled } from "@mui/material";
import TextField from "@mui/material/TextField";
import { getTypography } from "shared-components/utils/typography";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const inputStyles = ({ theme }) => ({
  padding: 0,

  '.MuiInputBase-root': {
    minHeight: 'unset !important',
  },
  '.MuiInputBase-input': {
    padding: 0,
    ...getTypography('caption'),
    textAlign: 'center',
  },
})

const StyledTextField = styled(TextField)(inputStyles);
const StyledFormikTextField = styled(FormikTextInput)(inputStyles);

const QuantificationTableInput = ({ name, disableArrowNavigation, ...rest }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const focusableElements = Array.from(document.getElementsByTagName("input"));
      const index = focusableElements.indexOf(e.target);

      if (index > -1) {
        const nextIndex = (index + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (e.target.name) {
        const index = Number(e.target.name.match(/\[(\d+)\]/)?.[1]);
        const focusableElements = Array.from(document.querySelectorAll(".MuiTable-root input"));
        if (index > -1 && focusableElements.length >= index - 1) {
          focusableElements[index].focus();
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!e.target.name) {
        const monthlyInputs = Array.from(document.querySelectorAll("input[name]"));
        monthlyInputs[0]?.focus();
      }
    }
  };

  return name ? (
    <CustomErrorBoundary>
      <StyledFormikTextField
        inputProps={{ min: 0 }}
        type='number'
        name={name}
        InputProps={{ disableUnderline: true }}
        onKeyDown={disableArrowNavigation ? null : handleKeyDown}
        {...rest}
      />
    </CustomErrorBoundary>
  ) : (
    <CustomErrorBoundary>
      <StyledTextField
        inputProps={{ min: 0 }}
        type='number'
        variant='standard'
        InputProps={{ disableUnderline: true }}
        onKeyDown={disableArrowNavigation ? null : handleKeyDown}
        {...rest}
      />
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationTableInput);
