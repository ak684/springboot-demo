import React, { memo, useState } from 'react';
import {
  Box,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  styled,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import QuantificationPrePostEvidenceDrawer from "./QuantificationPrePostEvidenceDrawer";
import ScoringQuestionsContainer from "../../../containers/ScoringQuestionsContainer";
import { isDefined } from "shared-components/utils/lo";
import useModal from "shared-components/hooks/useModal";
import AddIndicatorModal from "../../../common/AddIndicatorModal";
import MeasurementUnitSelector from "./MeasurementUnitSelector";
import { getTypography } from "shared-components/utils/typography";
import QuantificationImpactPotentialCard from "./QuantificationImpactPotentialCard";
import FormControlLabel from "@mui/material/FormControlLabel";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import WarningIcon from '@mui/icons-material/Warning';
import Tooltip from "@mui/material/Tooltip";
import { getRiskItem } from "shared-components/utils/quantification";
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

const isFilled = (val) => isDefined(val) && (val === 0 || val > 0);

const QuantificationPrePostInput = ({
                                      values,
                                      nextStep,
                                      impact,
                                      indicator,
                                      index,
                                      setFieldValue,
                                      isGlobal,
                                      preNotes,
                                      postNotes,
                                      fetchNotes
                                    }) => {
  const [drawerTab, setDrawerTab] = useState(null);
  const [indicatorModalOpen, editIndicator, closeIndicatorModal] = useModal();
  const type = values.indicators[index].quantificationType;
  const preNote = preNotes[indicator.id];
  const postNote = postNotes[indicator.id];

  const setValues = (prop, value) => {
    setFieldValue(`indicators[${index}].${prop}`, values.indicators[index][prop].map(val => ({
      ...val,
      value
    })));
  }

  const prePostUpdated = (e, type) => {
    const newValue = e.target.value;
    if (!isNaN(Number(e.target.value))) {
      setValues(type, newValue);
    }
  }

  const closeEvidenceDrawer = () => {
    setDrawerTab(null);
    fetchNotes(indicator);
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle sx={{ flexShrink: 1 }}>
            Please indicate the value of the indicator pre vs post intervention
          </StepperTitle>
          <Grid mt={4} container spacing={2}>
            <Grid item xs={8}>
              <Box>
                <Typography sx={{ mb: 1 }} variant='overline'>IMPACT (INDICATOR {index + 1})</Typography>
                <Typography variant='body'
                  onClick={editIndicator}
                  sx={{ cursor: 'pointer' }}>{indicator.name}</Typography>
              </Box>
              <Grid mt={2} container spacing={2}>
                <Grid item xs={6}>
                  <Typography>Calculate change of your indicator:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <FormikTextInput name={`indicators[${index}.quantificationType]`} select fullWidth>
                      {!isGlobal && <MenuItem value='PER_STAKEHOLDER'>Per stakeholder per year</MenuItem>}
                      <MenuItem value='PER_PRODUCT'>Per product/service/activity per year</MenuItem>
                    </FormikTextInput>
                  </Box>
                </Grid>
              </Grid>
              <Grid mt={2} container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography>Value of the indicator prior to intervention:</Typography>
                    <Box mt={2} display='flex' alignItems='center' gap={1} mb={4}>
                      {!getRiskItem(preNote) && (
                        <Tooltip title='This data is required' placement='top' arrow>
                          <WarningIcon sx={{ width: 16, height: 16, color: 'warning.main' }} />
                        </Tooltip>
                      )}
                      <Typography variant='bodyBold'>Evidence:</Typography>
                      <Link variant='bodyBold' sx={{ cursor: 'pointer' }} onClick={() => setDrawerTab('pre')}>
                        {
                          getRiskItem(preNote)
                            ? `${(100 - getRiskItem(preNote)?.risk || 0)}% estimate confidence`
                            : 'Provide'
                        }
                      </Link>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display='flex' gap={1}>
                    <FormikTextInput
                      sx={{ flexBasis: '50%', flexGrow: 1 }}
                      type='number'
                      name={`indicators[${index}].preInitial`}
                      inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                      InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                      onChange={e => prePostUpdated(e, 'pre')}
                      InputProps={{
                        startAdornment: !isFilled(values.indicators[index].preInitial) && (
                          <InputAdornment position="start">
                            <Tooltip title='This data is required' placement='top' arrow>
                              <WarningIcon sx={{ width: 16, height: 16, color: 'warning.main' }} />
                            </Tooltip>
                          </InputAdornment>
                        )
                      }}
                    />
                    <MeasurementUnitSelector
                      values={values}
                      setFieldValue={setFieldValue}
                      indicator={indicator}
                      sx={{ flexBasis: '50%', flexGrow: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
              <Grid mt={2} container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography>Value of the indicator after intervention:</Typography>
                    <Box mt={2} display='flex' alignItems='center' gap={1}>
                      {!getRiskItem(postNote, preNote) && (
                        <Tooltip title='This data is required' placement='top' arrow>
                          <WarningIcon sx={{ width: 16, height: 16, color: 'warning.main' }} />
                        </Tooltip>
                      )}
                      <Typography variant='bodyBold'>Evidence:</Typography>
                      <Link variant='bodyBold' sx={{ cursor: 'pointer' }} onClick={() => setDrawerTab('post')}>
                        {
                          getRiskItem(postNote, preNote)
                            ? `${(100 - getRiskItem(postNote, preNote)?.risk || 0)}% estimate confidence`
                            : 'Provide'
                        }
                      </Link>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display='flex' gap={1}>
                    <FormikTextInput
                      sx={{ flexBasis: '50%', flexGrow: 1 }}
                      type='number'
                      name={`indicators[${index}].postInitial`}
                      inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                      InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                      onChange={e => prePostUpdated(e, 'post')}
                      InputProps={{
                        startAdornment: !isFilled(values.indicators[index].postInitial) && (
                          <InputAdornment position="start">
                            <Tooltip title='This data is required' placement='top' arrow>
                              <WarningIcon sx={{ width: 16, height: 16, color: 'warning.main' }} />
                            </Tooltip>
                          </InputAdornment>
                        )
                      }}
                    />
                    <MeasurementUnitSelector
                      values={values}
                      setFieldValue={setFieldValue}
                      indicator={indicator}
                      sx={{ flexBasis: '50%', flexGrow: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={4}>
              <QuantificationImpactPotentialCard impact={values} indicator={values.indicators[index]} />
            </Grid>
          </Grid>
          <Box mb={2} ml={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={!values.indicators[index].stable}
                  onChange={() => setFieldValue(`indicators[${index}].stable`, !values.indicators[index].stable)}
                />
              }
              label="Provide indicator values on yearly basis"
              componentsProps={{ typography: getTypography('subtitle') }}
            />
          </Box>
          {!values.indicators[index].stable && (
            <QuantificationTable sx={{ mt: 4 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  {values.productsData.map(data => (
                    <TableCell component='th' key={data.year}>{data.year}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    Value of the
                    indicator <b>{type === 'PER_STAKEHOLDER' ? 'per stakeholder' : 'per product/service/activity'}</b> prior
                    to intervention
                  </TableCell>
                  {values.indicators[index].pre.map((data, i) => (
                    <TableCell key={data.year}>
                      <StyledFormikInput
                        name={`indicators[${index}].pre[${i}].value`}
                        InputProps={{ disableUnderline: true }} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>
                    Value of the
                    indicator <b>{type === 'PER_STAKEHOLDER' ? 'per stakeholder' : 'per product/service/activity'}</b>after
                    the intervention
                  </TableCell>
                  {values.indicators[index].post.map((data, i) => (
                    <TableCell key={data.year}>
                      <StyledFormikInput
                        name={`indicators[${index}].post[${i}].value`}
                        InputProps={{ disableUnderline: true }} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>
                    {impact.positive ? 'Improvement' : 'Change'} of the indicator per stakeholder per year
                  </TableCell>
                  {values.indicators[index].post.map((data, i) => (
                    <TableCell key={data.year} sx={{ opacity: 0.5 }}>
                      {Math.abs(values.indicators[index].post[i].value - values.indicators[index].pre[i].value)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </QuantificationTable>
          )}
          <StepperNextButton nextStep={nextStep} />
          {!!drawerTab && (
            <ScoringQuestionsContainer>
              <QuantificationPrePostEvidenceDrawer
                impact={impact}
                indicator={indicator}
                tab={drawerTab}
                setTab={setDrawerTab}
                onClose={closeEvidenceDrawer}
              />
            </ScoringQuestionsContainer>
          )}
          {indicatorModalOpen && <AddIndicatorModal open onClose={closeIndicatorModal} indicator={indicator} />}
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationPrePostInput);
