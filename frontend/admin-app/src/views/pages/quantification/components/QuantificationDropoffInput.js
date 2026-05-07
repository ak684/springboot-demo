import React, { memo } from 'react';
import {
  Box,
  Grid,
  InputAdornment,
  styled,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import QuantificationNetOutcomeChart from "./QuantificationNetOutcomeChart";
import InfoAlert from "../../../common/InfoAlert";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import { getTypography } from "shared-components/utils/typography";
import QuantificationImpactPotentialCard from "./QuantificationImpactPotentialCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledFormikInput = styled(FormikTextInput)(({ theme }) => ({
  padding: 0,
  '.MuiInputBase-root': {
    minHeight: 'unset',
  },
  '.MuiInputBase-input': {
    padding: 0,
    textAlign: 'center',
    ...getTypography('caption'),
  },
  '.MuiFormHelperText-root': {
    margin: 0,
  }
}));

const QuantificationDropoffInput = ({ values, index, impact, indicator, nextStep }) => {
  const theme = useTheme();
  const dropoff = values.indicators[index].dropoff;
  const showComment = dropoff.some(d => d > 0);

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Drop-off</StepperTitle>
          <StepperDescription>
            Explain if and how much impact is reduced over time (e.g. efficiency losses).
          </StepperDescription>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              {dropoff.length === 0 && (
                <InfoAlert>
                  Drop-off is not applicable to you because duration of your impact does not exceed one year
                </InfoAlert>
              )}
              {dropoff.length > 0 && (
                <Table>
                  <TableBody>
                    {dropoff.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell align='center' sx={{ px: 2, py: 1, background: theme.palette.secondary.subtle }}>
                          <Typography variant='captionBold'>Year {i + 2}</Typography>
                        </TableCell>
                        <TableCell align='center' sx={{ px: 2, py: 1 }}>
                          <StyledFormikInput
                            sx={{ width: 40 }}
                            name={`indicators[${index}].dropoff[${i}]`}
                            InputProps={{
                              disableUnderline: true,
                              endAdornment:
                                <InputAdornment position="end"
                                  disableTypography
                                  sx={{ fontSize: 12 }}>%</InputAdornment>
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {showComment > 0 && (
                <Box mt={4}>
                  <FormikTextInput
                    fullWidth
                    name={`indicators[${index}].dropoffComment`}
                    placeholder='Please explain here'
                    multiline
                    inputProps={{ maxLength: 250 }}
                    letterCounter
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={4}>
              <QuantificationNetOutcomeChart values={values} index={index} />
            </Grid>
            <Grid item xs={4}>
              <QuantificationImpactPotentialCard impact={values} indicator={values.indicators[index]} />
            </Grid>
          </Grid>

          <Box>
            <StepperNextButton nextStep={nextStep} last={index === values.indicators.length - 1}>
              <StepperNotesButton screen='dropoff' impact={impact} indicator={indicator} />
            </StepperNextButton>
          </Box>
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationDropoffInput);
