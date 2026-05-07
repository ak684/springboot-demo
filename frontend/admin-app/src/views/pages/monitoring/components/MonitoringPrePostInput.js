import React, { memo, useState } from 'react';
import {
  Box,
  Grid,
  Link,
  MenuItem,
  styled,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import { capitalize } from "shared-components/utils/helpers";
import { MONTHS } from "shared-components/utils/constants";
import { getInputOffset, getRiskItem, yearAverage, yearTotal } from "shared-components/utils/quantification";
import { isDefined } from "shared-components/utils/lo";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import MonitoringChartCard from "./MonitoringChartCard";
import moment from "moment";
import FormControlLabel from "@mui/material/FormControlLabel";
import QuantificationTableInput from "../../../common/quantification/QuantificationTableInput";
import TextInput from "shared-components/views/form/TextInput";
import MonitoringGaugeChart from "./MonitoringGaugeChart";
import MonitoringAreaChart from "./MonitoringAreaChart";
import smartRound from "shared-components/filters/smartRound";
import useModal from "shared-components/hooks/useModal";
import AddIndicatorModal from "../../../common/AddIndicatorModal";
import { getTypography } from "shared-components/utils/typography";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import QuantificationImpactPotentialCard from "../../quantification/components/QuantificationImpactPotentialCard";
import MeasurementUnitSelector from "../../quantification/components/MeasurementUnitSelector";
import Tooltip from "@mui/material/Tooltip";
import WarningIcon from "@mui/icons-material/Warning";
import ScoringQuestionsContainer from "../../../containers/ScoringQuestionsContainer";
import QuantificationPrePostEvidenceDrawer from "../../quantification/components/QuantificationPrePostEvidenceDrawer";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledPointerLine = styled(Box)(({ theme, element }) => ({
  position: 'absolute',
  width: 2,
  height: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  top: -16,
  left: getInputOffset(element),
}));

const getAbsoluteImprovement = (pre, post) => smartRound(Math.abs(pre - post));
const getRelativeImprovement = (pre, post) => smartRound(Math.abs(pre - post) / pre * 100);

const ImprovementItem = ({ value }) => (
  <Box
    py={0.5}
    px={1}
    sx={{
      borderRadius: '40px',
      background: theme => theme.palette.success.main,
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12
    }}
  >
    {value}%
  </Box>
);

const MonitoringPrePostInput = (
  { impact, values, setFieldValue, nextStep, indicator, index, isGlobal, preNotes, postNotes, fetchNotes }
) => {
  const theme = useTheme();
  const indicatorData = values.indicators[index];
  const [yearlyPre, setYearlyPre] = useState(indicatorData.preActual.map(d => smartRound(yearAverage(d), 1)));
  const [yearlyPost, setYearlyPost] = useState(indicatorData.postActual.map(d => smartRound(yearAverage(d), 1)));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [indicatorModalOpen, editIndicator, closeIndicatorModal, editedIndicator] = useModal();
  const type = indicatorData.quantificationType;
  const currentYearIndex = indicatorData.preActual.findIndex(d => d.year === moment().year());
  const [drawerTab, setDrawerTab] = useState(null);
  const preNote = preNotes[indicator.id];
  const postNote = postNotes[indicator.id];

  const inputFocused = (e, index, collection) => {
    setSelectedIndex(index);
    setSelectedElement(e.target);
    setPreviousValue(collection[index]);
  };

  const inputBlurred = (e, ind, prop) => {
    const newValue = +e.target.value;
    if (newValue !== previousValue && (newValue > 0 || newValue === 0)) {
      MONTHS.forEach(mon => {
        setFieldValue(`indicators[${index}].${prop}[${ind}].${mon}`, newValue);
      });
    }

    setPreviousValue(null);
  };

  const yearlyValueChanged = (newValue, index, collection, setter) => {
    collection.splice(index, 1, +newValue);
    setter([...collection]);
  }

  const monthBlurred = (e, prop, collection, setter) => {
    const average = yearAverage(values.indicators[index][prop][selectedIndex])
    yearlyValueChanged(average, selectedIndex, collection, setter);
  }

  const closeEvidenceDrawer = () => {
    setDrawerTab(null);
    fetchNotes(indicator);
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <Box display='flex' gap={2} mb={4}>
            <MonitoringChartCard
              name='achievement'
              title={'Outcome (' + values.indicators[index].preActual[isDefined(selectedIndex) ? selectedIndex : currentYearIndex].year + ')'}
              chart={<MonitoringGaugeChart values={values} index={index} />}
              tooltip={impact.outputUnits}
            />
            <MonitoringChartCard
              sx={{ flexBasis: '66%' }}
              name='performance'
              title='Projection vs. performance (per month)'
              chart={<MonitoringAreaChart values={values} index={index} />}
            />
          </Box>
          <StepperTitle sx={{ flexShrink: 1 }}>
            Please indicate the value of the indicator pre vs post intervention ({moment().year()})
          </StepperTitle>
          <Grid mt={4} container spacing={2}>
            <Grid item xs={8} display='flex' flexDirection='column' gap={3}>
              <Box>
                <Typography sx={{ mb: 1 }} variant='overline'>IMPACT (INDICATOR {index + 1})</Typography>
                <Typography variant='body'
                  onClick={editIndicator}
                  sx={{ cursor: 'pointer' }}>{indicator.name}</Typography>
              </Box>
              <Grid container spacing={2}>
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
              <Grid container spacing={2}>
                <Grid item xs={6} />
                <Grid item xs={2}>
                  <FieldLabel>Forecast</FieldLabel>
                </Grid>
                <Grid item xs={2}>
                  <FieldLabel>Actual</FieldLabel>
                </Grid>
                <Grid item xs={2}>
                  <FieldLabel>Units (optional)</FieldLabel>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography sx={{ mb: 4 }}>
                    Value of the
                    indicator <b>{type === 'PER_STAKEHOLDER' ? 'per stakeholder' : 'per product/service/activity'} per
                    year</b> prior to intervention:
                  </Typography>
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
                </Grid>
                <Grid item xs={2}>
                  <FormikTextInput
                    type='number'
                    name={`indicators[${index}].pre[${currentYearIndex}].value`}
                    inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                    InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextInput
                    type='number'
                    inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                    InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                    value={yearlyPre[currentYearIndex]}
                    onChange={e => yearlyValueChanged(e.target.value, currentYearIndex, yearlyPre, setYearlyPre)}
                    onFocus={(e) => inputFocused(e, currentYearIndex, yearlyPre)}
                    onBlur={(e) => inputBlurred(e, currentYearIndex, 'preActual')}
                  />
                </Grid>
                <Grid item xs={2}>
                  <MeasurementUnitSelector values={values} setFieldValue={setFieldValue} indicator={indicator} />
                </Grid>
              </Grid>
              <Grid container alignItems='flex-start' spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    Value of the
                    indicator <b>{type === 'PER_STAKEHOLDER' ? 'per stakeholder' : 'per product/service/activity'} per
                    year</b> after intervention:
                  </Typography>
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
                </Grid>
                <Grid item xs={2}>
                  <FormikTextInput
                    type='number'
                    name={`indicators[${index}].post[${currentYearIndex}].value`}
                    inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                    InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextInput
                    type='number'
                    inputProps={{ style: { ...getTypography('bodyBold') }, sx: { p: 0, height: 46 } }}
                    InputLabelProps={{ style: { ...getTypography('bodyBold') } }}
                    value={yearlyPost[currentYearIndex]}
                    onChange={e => yearlyValueChanged(e.target.value, currentYearIndex, yearlyPost, setYearlyPost)}
                    onFocus={(e) => inputFocused(e, currentYearIndex, yearlyPost)}
                    onBlur={(e) => inputBlurred(e, currentYearIndex, 'postActual')}
                  />
                </Grid>
                <Grid item xs={2}>
                  <MeasurementUnitSelector values={values} setFieldValue={setFieldValue} indicator={indicator} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={4}>
              <QuantificationImpactPotentialCard impact={values} indicator={values.indicators[index]} />
            </Grid>
          </Grid>

          <Box my={2} ml={1}>
            <FormControlLabel
              control={<Switch checked={showDetails} onChange={() => setShowDetails(!showDetails)} />}
              label="Report actual values per month or for past years"
              componentsProps={{ typography: getTypography('subtitle') }}
            />
          </Box>
          {showDetails && (
            <Box>
              <QuantificationTable>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    {values.productsData.map(data => (
                      <TableCell component='th' key={data.year}>{data.year}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {type === 'PER_PRODUCT' && (
                    <TableRow>
                      <TableCell sx={{ textAlign: 'right !important' }}># of products/services/activities:</TableCell>
                      {values.productsDataActual.map((data, i) => (
                        <TableCell key={data.year}>
                          {yearTotal(values.productsDataActual[i])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                  {type === 'PER_STAKEHOLDER' && (
                    <TableRow>
                      <TableCell sx={{ textAlign: 'right !important' }}># of stakeholders:</TableCell>
                      {values.stakeholdersDataActual.map((data, i) => (
                        <TableCell key={data.year}>
                          {yearTotal(values.stakeholdersDataActual[i])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ textAlign: 'right !important' }}>
                      Forecast: indicator prior to intervention
                    </TableCell>
                    {values.productsData.map((data, i) => (
                      <TableCell key={data.year}>
                        <QuantificationTableInput name={`indicators[${index}].pre[${i}].value`} />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'right !important' }}>
                      Forecast: indicator after the intervention
                    </TableCell>
                    {values.productsData.map((data, i) => (
                      <TableCell key={data.year}>
                        <QuantificationTableInput name={`indicators[${index}].post[${i}].value`} />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'right !important' }}>
                      Indicator prior to intervention:
                    </TableCell>
                    {values.productsData.map((data, i) => (
                      <TableCell
                        key={data.year}
                        className={data.year === values.stakeholdersData[selectedIndex]?.year && selectedElement.name === 'preActual' ? 'cell-selected' : ''}
                      >
                        <QuantificationTableInput
                          onFocus={(e) => inputFocused(e, i, yearlyPre)}
                          onBlur={(e) => inputBlurred(e, i, 'preActual')}
                          value={yearlyPre[i]}
                          onChange={(e) => yearlyValueChanged(e.target.value, i, yearlyPre, setYearlyPre)}
                          inputProps={{ name: 'preActual' }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'right !important' }}>
                      Indicator after the intervention:
                    </TableCell>
                    {values.productsData.map((data, i) => (
                      <TableCell
                        key={data.year}
                        className={data.year === values.productsData[selectedIndex]?.year && selectedElement.name === 'postActual' ? 'cell-selected' : ''}
                      >
                        <QuantificationTableInput
                          onFocus={(e) => inputFocused(e, i, yearlyPost)}
                          onBlur={(e) => inputBlurred(e, i, 'postActual')}
                          value={yearlyPost[i]}
                          onChange={(e) => yearlyValueChanged(e.target.value, i, yearlyPost, setYearlyPost)}
                          inputProps={{ name: 'postActual' }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </QuantificationTable>

              {isDefined(selectedIndex) && (
                <Box mt={2} position='relative'>
                  <StyledPointerLine element={selectedElement} />
                  <QuantificationTable highlighted>
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        {MONTHS.map(month => (
                          <TableCell component='th' key={month}>{capitalize(month)}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {type === 'PER_PRODUCT' && (
                        <TableRow>
                          <TableCell sx={{ textAlign: 'right !important' }}># of
                            products/services/activities:</TableCell>
                          {MONTHS.map(month => (
                            <TableCell key={month}>{values.productsDataActual[selectedIndex][month]}</TableCell>
                          ))}
                        </TableRow>
                      )}
                      {type === 'PER_STAKEHOLDER' && (
                        <TableRow>
                          <TableCell sx={{ textAlign: 'right !important' }}># of stakeholders:</TableCell>
                          {MONTHS.map(month => (
                            <TableCell key={month}>{values.stakeholdersDataActual[selectedIndex][month]}</TableCell>
                          ))}
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell sx={{ textAlign: 'right !important' }}>Indicator prior to intervention:</TableCell>
                        {MONTHS.map(month => (
                          <TableCell key={month}>
                            <QuantificationTableInput
                              name={`indicators[${index}].preActual[${selectedIndex}].${month}`}
                              onBlur={(e) => monthBlurred(e, 'preActual', yearlyPre, setYearlyPre)}
                              disableArrowNavigation
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ textAlign: 'right !important' }}>Indicator after the intervention:</TableCell>
                        {MONTHS.map(month => (
                          <TableCell key={month}>
                            <QuantificationTableInput
                              name={`indicators[${index}].postActual[${selectedIndex}].${month}`}
                              onBlur={(e) => monthBlurred(e, 'postActual', yearlyPost, setYearlyPost)}
                              disableArrowNavigation
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </QuantificationTable>
                </Box>
              )}
            </Box>
          )}
          <StepperNextButton nextStep={nextStep} last={index === impact.indicators.length - 1} />
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

export default memo(MonitoringPrePostInput);
