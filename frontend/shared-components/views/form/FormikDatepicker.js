import React, { forwardRef, memo, useState } from 'react';
import { useField } from 'formik';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { FormHelperText, useTheme } from "@mui/material";
import moment from "moment";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import TextInput from "./TextInput";
import { isDefined } from "../../utils/lo";

const FormikDatepicker = forwardRef(({ name, inputProps = {}, onChange, ...rest }, ref) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [{ onChange: formikOnChange, value, ...field }, state, { setValue }] = useField(name);
  const theme = useTheme();

  const setDate = (date) => {
    let newValue = date === null ? null : moment.utc(date).startOf('day');
    if (newValue && !value) {
      newValue = newValue.add(12, 'hours');
    }
    setValue(newValue);
    setTimeout(() => {
      onChange && onChange(newValue);
    });
  };

  const inputFocused = () => {
    setPopupOpen(true);
  }

  const inputBlurred = () => {
    setPopupOpen(false);
  }

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DesktopDatePicker
          {...field}
          open={popupOpen}
          value={isDefined(value) ? moment(value).add(12, 'hours') : value}
          onChange={setDate}
          onOpen={() => setPopupOpen(true)}
          onClose={() => setPopupOpen(false)}
          slots={{
            textField: (params) =>
              <TextInput
                {...params}
                placeholder="Select date"
                {...inputProps}
                onFocus={inputFocused}
                onBlur={inputBlurred}
                InputProps={{ ...params.InputProps, readOnly: true }}
                inputRef={ref}
              />
          }}
          {...rest}
        />
      </LocalizationProvider>
      {!!state.error && state.touched && (
        <FormHelperText sx={{ color: theme.palette.error.main }}>
          {state.touched && state.error}
        </FormHelperText>
      )}
    </>
  );
});

export default memo(FormikDatepicker);
