import React, { memo } from 'react';
import { Checkbox, FormControlLabel, styled, useTheme } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";

const StyledCheckbox = styled(Checkbox)(() => ({
  color: 'white',
  "& .MuiSvgIcon-root": {
    fill: "white",
    "&:hover": {
      backgroundColor: "white"
    }
  },
}))

const DoNotShowCheckbox = ({ value, setValue }) => {
  const theme = useTheme();

  return (
    <FormControlLabel
      sx={{ color: 'white' }}
      componentsProps={{ typography: getTypography('caption') }}
      control={<StyledCheckbox checked={value} onChange={() => setValue(!value)} />}
      label='Do not show this page in the future'
    />
  );
};

export default memo(DoNotShowCheckbox);
