import React, { memo } from 'react';
import { Box, FormControlLabel, Switch, Tooltip, Typography } from "@mui/material";

const QuantificationCalculationTypeSwitch = ({ values, setFieldValue }) => {
  const updateCalculationType = (e) => {
    setFieldValue('impactCalculationTotal', e.target.checked);
  };

  return (
    <Tooltip
      title={(
        <Box>
          <Typography>
            "Sum mode" (default): Is the standard setting and works for most cases. It sums up all
            output/services/activities or stakeholders over time
          </Typography>
          <Typography sx={{ mt: 1 }}>
            "Total mode": Shows the total value of output/services/activities or stakeholders at a given time.
            This mode works well when you want to communicate e.g. the total subscribers to a SaaS solution,
            total apartments under management etc.
          </Typography>
        </Box>
      )}
    >
      <FormControlLabel
        sx={{ ml: 0, mb: 2, mr: 0 }}
        control={<Switch checked={values.impactCalculationTotal} onChange={updateCalculationType} size='small' />}
        label="Total mode"
        componentsProps={{ typography: { variant: 'caption' } }}
      />
    </Tooltip>
  );
};

export default memo(QuantificationCalculationTypeSwitch);
