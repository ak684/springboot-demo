import React, { memo, useState } from 'react';
import { Box, styled, Switch, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import {
  addYearAfter,
  addYearBefore,
  deleteYearAfter,
  deleteYearBefore,
  getInputOffset,
  yearTotal
} from "shared-components/utils/quantification";
import { capitalize } from "shared-components/utils/helpers";
import { GLOBAL_COMMUNITY_INPUT, MONTHS } from "shared-components/utils/constants";
import { clone, isDefined } from "shared-components/utils/lo";
import FormControlLabel from "@mui/material/FormControlLabel";
import InfoAlert from "../../../common/InfoAlert";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import MonitoringChartCard from "./MonitoringChartCard";
import MonitoringAchievementChart from "./MonitoringAchievementChart";
import MonitoringPerformanceChart from "./MonitoringPerformanceChart";
import theme from "shared-components/theme";
import moment from "moment";
import QuantificationTableInput from "../../../common/quantification/QuantificationTableInput";
import chartConfig from "../chart/gaugeChart";
import smartRound from "shared-components/filters/smartRound";
import MonitoringGaugeChart from "./MonitoringGaugeChart";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import useModal from "shared-components/hooks/useModal";
import ConfirmDeleteYearModal from "../../../common/quantification/ConfirmDeleteYearModal";
import AddYearButton from "../../../common/quantification/AddYearButton";
import DeleteYearIcon from "../../../common/quantification/DeleteYearIcon";
import { getTypography } from "shared-components/utils/typography";
import QuantificationCopyDataModal from "../../quantification/components/QuantificationCopyDataModal";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledPointerLine = styled(Box)(({ theme, element }) => ({
  position: 'absolute',
  width: 2,
  height: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  top: -16,
  left: getInputOffset(element),
}));

const globalCommunityAlternativeView = (
  <Box
    display='flex'
    alignItems='center'
    justifyContent='center'
    flexDirection='column'
    gap={0.5}
    height={110}
    backgroundColor={theme.palette.secondary.subtle}
    borderRadius='8px'
  >
    <Box component='img' src='/images/icons/quantification/global.svg' alt={GLOBAL_COMMUNITY_INPUT} />
    <Typography variant='overline' color='secondary.main'>Global community</Typography>
  </Box>
)

const getGaugeChartData = (values, index) => {
  const config = clone(chartConfig);
  const currentYear = moment().year();
  const currentYearIndex = values.stakeholdersData.findIndex(d => d.year === currentYear);
  const calcMonths = currentYearIndex === index ? MONTHS.slice(0, moment().month() + 1) : MONTHS;

  const forecast = calcMonths.reduce((total, mon) => total + (values.stakeholdersData[index][mon] || 0), 0);
  const actual = calcMonths.reduce((total, mon) => total + (values.stakeholdersDataActual[index][mon] || 0), 0);

  config.series[0].data = [{
    value: actual / forecast || 0,
    name: smartRound(actual),
  }]

  return config;
}

const MonitoringStakeholdersInput = ({ impact, values, setFieldValue, nextStep, isGlobal }) => {
  const [yearlyForecast, setYearlyForecast] = useState(values.stakeholdersData.map(d => yearTotal(d)));
  const [yearlyActual, setYearlyActual] = useState(values.stakeholdersDataActual.map(d => yearTotal(d)));
  const [showProducts, setShowProducts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [deleteFirstModalOpen, deleteFirstYear, closeDeleteFirstModal] = useModal();
  const [deleteLastModalOpen, deleteLastYear, closeDeleteLastModal] = useModal();
  const productYearlyValues = values.productsDataActual.map(d => yearTotal(d));
  const yearIndex = isDefined(selectedIndex)
    ? selectedIndex
    : values.stakeholdersDataActual.findIndex(v => +v.year === moment().year());

  const inputFocused = (e, index, isActual) => {
    setSelectedIndex(index);
    setSelectedElement(e.target);
    if (isActual) {
      setPreviousValue(yearlyActual[index]);
    } else {
      setPreviousValue(yearlyForecast[index]);
    }

  };

  const inputBlurred = (e, index, isActual) => {
    const newValue = +e.target.value;
    if (newValue !== previousValue && (newValue > 0 || newValue === 0)) {
      const monthlyValue = Math.floor(newValue / 12);
      const lastMonthDiff = newValue - monthlyValue * 12;
      for (let i = 0; i < 11; i++) {
        setFieldValue(`stakeholdersData${isActual ? 'Actual' : ''}[${index}].${MONTHS[i]}`, monthlyValue);
      }
      setFieldValue(`stakeholdersData${isActual ? 'Actual' : ''}[${index}].dec`, monthlyValue + lastMonthDiff);
    }

    setPreviousValue(null);
  };

  const yearlyValueChanged = (newValue, index, isActual) => {
    if (isActual) {
      yearlyActual.splice(index, 1, newValue);
      setYearlyActual([...yearlyActual]);
    } else {
      yearlyForecast.splice(index, 1, newValue);
      setYearlyForecast([...yearlyForecast]);
    }
  }

  const monthBlurred = (e, isActual) => {
    yearlyValueChanged(yearTotal(values[isActual ? 'stakeholdersDataActual' : 'stakeholdersData'][selectedIndex]), selectedIndex, isActual);
  }

  const addFirstYear = () => {
    setYearlyForecast(['', ...yearlyForecast]);
    setYearlyActual(['', ...yearlyActual]);
    addYearBefore(values, setFieldValue);
  }

  const addLastYear = () => {
    setYearlyForecast([...yearlyForecast, '']);
    setYearlyActual([...yearlyActual, '']);
    addYearAfter(values, setFieldValue);
  }

  const confirmDeleteFirstYear = () => {
    closeDeleteFirstModal();
    setYearlyForecast(yearlyForecast.slice(1));
    setYearlyActual(yearlyActual.slice(1));
    deleteYearBefore(values, setFieldValue);
  }

  const confirmDeleteLastYear = () => {
    closeDeleteLastModal();
    setYearlyForecast(yearlyForecast.slice(0, yearlyForecast.length - 1));
    setYearlyActual(yearlyActual.slice(0, yearlyActual.length - 1));
    deleteYearAfter(values, setFieldValue);
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <Box display='flex' gap={2} mb={4}>
            <MonitoringChartCard
              name='achievement'
              title={'Stakeholders (' + values.productsData[yearIndex].year + ')'}
              chart={<MonitoringAchievementChart values={values} prop='stakeholdersData' index={selectedIndex} />}
              alternative={isGlobal && globalCommunityAlternativeView}
              tooltip={impact.outputUnits}
            />
            <MonitoringChartCard
              name='performance'
              title={'Projection vs. performance (per month) (' + values.productsData[yearIndex].year + ')'}
              chart={<MonitoringPerformanceChart values={values} prop='stakeholdersData' index={selectedIndex} />}
              alternative={isGlobal && globalCommunityAlternativeView}
            />
            <MonitoringChartCard
              name='gauge'
              title={'Achievement (' + values.stakeholdersData[yearIndex].year + ')'}
              chart={<MonitoringGaugeChart values={values} getData={getGaugeChartData} index={yearIndex} />}
              alternative={isGlobal && globalCommunityAlternativeView}
            />
          </Box>
          <StepperTitle>{impact.stakeholders || 'Number of stakeholders'}</StepperTitle>
          {isGlobal && (
            <InfoAlert sx={{ mt: 3 }}>
              Not applicable to this impact chain because stakeholders are {GLOBAL_COMMUNITY_INPUT}
            </InfoAlert>
          )}
          {!isGlobal && (
            <Box mt={4}>
              <Box display='flex' justifyContent='space-between'>
                <AddYearButton onClick={addFirstYear} />
                <AddYearButton onClick={addLastYear} />
              </Box>
              <Typography sx={{ mb: 1 }} variant='subtitleBold'>Forecast</Typography>
              <Box display='flex' gap={1}>
                <QuantificationTable>
                  <TableHead>
                    <TableRow>
                      {values.stakeholdersData.map((data, index) => (
                        <TableCell
                          component='th'
                          key={data.year}
                          sx={{ position: 'relative', '&:hover .delete-year-icon': { display: 'inline-flex' } }}
                        >
                          <Box>{data.year}</Box>
                          {data.year < moment().year() && index === 0 && <DeleteYearIcon onClick={deleteFirstYear} />}
                          {data.year > moment().year() + 4 && index === values.stakeholdersData.length - 1 &&
                            <DeleteYearIcon onClick={deleteLastYear} />
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {values.stakeholdersData.map((data, index) => (
                        <TableCell
                          key={data.year}
                          className={data.year === values.stakeholdersData[selectedIndex]?.year ? 'cell-selected' : ''}
                        >
                          <QuantificationTableInput
                            onFocus={(e) => inputFocused(e, index, false)}
                            onBlur={(e) => inputBlurred(e, index, false)}
                            value={yearlyForecast[index]}
                            onChange={(e) => yearlyValueChanged(e.target.value, index, false)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </QuantificationTable>
              </Box>
              {isDefined(selectedIndex) && (
                <Box mt={2} position='relative'>
                  <StyledPointerLine element={selectedElement} />
                  <QuantificationTable highlighted>
                    <TableHead>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell component='th' key={month}>{capitalize(month)}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell key={month}>
                            <QuantificationTableInput
                              name={`stakeholdersData[${selectedIndex}].${month}`}
                              onBlur={(e) => monthBlurred(e, false)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </QuantificationTable>
                </Box>
              )}
              <Typography sx={{ mb: 1, mt: 3 }} variant='subtitleBold'>Actual</Typography>
              <Box display='flex' gap={1}>
                <QuantificationTable>
                  <TableHead>
                    <TableRow>
                      {values.stakeholdersDataActual.map(data => (
                        <TableCell component='th' key={data.year}>{data.year}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {values.stakeholdersDataActual.map((data, index) => (
                        <TableCell
                          key={data.year}
                          className={data.year === values.stakeholdersDataActual[selectedIndex]?.year ? 'cell-selected' : ''}
                        >
                          <QuantificationTableInput
                            onFocus={(e) => inputFocused(e, index, true)}
                            onBlur={(e) => inputBlurred(e, index, true)}
                            value={yearlyActual[index]}
                            onChange={(e) => yearlyValueChanged(e.target.value, index, true)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </QuantificationTable>
              </Box>
              {isDefined(selectedIndex) && (
                <Box mt={2} position='relative'>
                  <StyledPointerLine element={selectedElement} />
                  <QuantificationTable highlighted>
                    <TableHead>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell component='th' key={month}>{capitalize(month)}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell key={month}>
                            <QuantificationTableInput
                              name={`stakeholdersDataActual[${selectedIndex}].${month}`}
                              onBlur={(e) => monthBlurred(e, true)}
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
          {!isGlobal && (
            <Box my={2} ml={1}>
              <FormControlLabel
                control={<Switch checked={showProducts} onChange={() => setShowProducts(!showProducts)} />}
                label="Show products/services/activities"
                componentsProps={{ typography: getTypography('subtitle') }}
              />
            </Box>
          )}
          {showProducts && (
            <>
              <Box display='flex' gap={1}>
                <QuantificationTable sx={{ opacity: 0.5 }}>
                  <TableHead>
                    <TableRow>
                      {values.productsDataActual.map(data => (
                        <TableCell component='th' key={data.year}>{data.year}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {values.productsDataActual.map((data, index) => (
                        <TableCell
                          key={data.year}
                          className={data.year === values.productsDataActual[selectedIndex]?.year ? 'cell-selected' : ''}
                        >
                          {productYearlyValues[index]}&nbsp;
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </QuantificationTable>
              </Box>
              {isDefined(selectedIndex) && (
                <Box mt={2} position='relative'>
                  <StyledPointerLine element={selectedElement} />
                  <QuantificationTable highlighted sx={{ opacity: 0.5 }}>
                    <TableHead>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell component='th' key={month}>{capitalize(month)}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {MONTHS.map(month => (
                          <TableCell key={month}>
                            {values.productsData[selectedIndex][month]}&nbsp;
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </QuantificationTable>
                </Box>
              )}
            </>
          )}
          <StepperNextButton nextStep={nextStep} last={impact.indicators.length === 0}>
            <StepperNotesButton screen='stakeholders' impact={impact} />
          </StepperNextButton>
          <QuantificationCopyDataModal
            impact={impact}
            values={values}
            setFieldValue={setFieldValue}
            setYearlyValues={setYearlyActual}
            copyProp='stakeholdersDataActual'
            compareProp='stakeholders'
            data='stakeholders'
            isForecast={false}
          />
          <ConfirmDeleteYearModal
            open={deleteFirstModalOpen}
            onClose={closeDeleteFirstModal}
            confirm={confirmDeleteFirstYear}
            year={values.productsData[0].year}
          />
          <ConfirmDeleteYearModal
            open={deleteLastModalOpen}
            onClose={closeDeleteLastModal}
            confirm={confirmDeleteLastYear}
            year={values.productsData.at(-1).year}
          />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(MonitoringStakeholdersInput);
