import React, { memo, useState } from 'react';
import { Box, styled, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { capitalize } from "shared-components/utils/helpers";
import { MONTHS } from "shared-components/utils/constants";
import {
  addYearAfter,
  addYearBefore,
  deleteYearAfter,
  deleteYearBefore,
  getInputOffset,
  yearTotal
} from "shared-components/utils/quantification";
import { clone, isDefined } from "shared-components/utils/lo";
import QuantificationTableInput from "../../../common/quantification/QuantificationTableInput";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import MonitoringChartCard from "./MonitoringChartCard";
import MonitoringAchievementChart from "./MonitoringAchievementChart";
import MonitoringPerformanceChart from "./MonitoringPerformanceChart";
import moment from "moment/moment";
import MonitoringGaugeChart from "./MonitoringGaugeChart";
import chartConfig from "../chart/gaugeChart";
import smartRound from "shared-components/filters/smartRound";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import useModal from "shared-components/hooks/useModal";
import ConfirmDeleteYearModal from "../../../common/quantification/ConfirmDeleteYearModal";
import AddYearButton from "../../../common/quantification/AddYearButton";
import DeleteYearIcon from "../../../common/quantification/DeleteYearIcon";
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

const getGaugeChartData = (values, index) => {
  const config = clone(chartConfig);
  const currentYear = moment().year();
  const currentYearIndex = values.productsData.findIndex(d => d.year === currentYear);
  const calcMonths = currentYearIndex === index ? MONTHS.slice(0, moment().month() + 1) : MONTHS;

  const forecast = calcMonths.reduce((total, mon) => total + (values.productsData[index][mon] || 0), 0);
  const actual = calcMonths.reduce((total, mon) => total + (values.productsDataActual[index][mon] || 0), 0);

  config.series[0].data = [{
    value: actual / forecast || 0,
    name: smartRound(actual),
  }]

  return config;
}

const MonitoringProductsInput = ({ impact, values, setFieldValue, nextStep }) => {
  const [yearlyForecast, setYearlyForecast] = useState(values.productsData.map(d => yearTotal(d)));
  const [yearlyActual, setYearlyActual] = useState(values.productsDataActual.map(d => yearTotal(d)));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [deleteFirstModalOpen, deleteFirstYear, closeDeleteFirstModal] = useModal();
  const [deleteLastModalOpen, deleteLastYear, closeDeleteLastModal] = useModal();
  const yearIndex = isDefined(selectedIndex)
    ? selectedIndex
    : values.productsData.findIndex(v => +v.year === moment().year());

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
        setFieldValue(`productsData${isActual ? 'Actual' : ''}[${index}].${MONTHS[i]}`, monthlyValue);
      }
      setFieldValue(`productsData${isActual ? 'Actual' : ''}[${index}].dec`, monthlyValue + lastMonthDiff);
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
    yearlyValueChanged(yearTotal(values[isActual ? 'productsDataActual' : 'productsData'][selectedIndex]), selectedIndex, isActual);
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
              title={'Products/services/activities (' + values.productsData[yearIndex].year + ')'}
              chart={<MonitoringAchievementChart values={values} prop='productsData' index={selectedIndex} />}
              tooltip={impact.outputUnits}
            />
            <MonitoringChartCard
              name='performance'
              title={'Projection vs. performance (per month) (' + values.productsData[yearIndex].year + ')'}
              chart={<MonitoringPerformanceChart values={values} prop='productsData' index={selectedIndex} />}
            />
            <MonitoringChartCard
              name='gauge'
              title={'Achievement (' + values.productsData[yearIndex].year + ')'}
              chart={<MonitoringGaugeChart values={values} getData={getGaugeChartData} index={yearIndex} />}
            />
          </Box>
          <StepperTitle>{impact.outputUnits || 'Number of products/services/activities'}</StepperTitle>
          <StepperDescription>
            Please indicate the number of products/services/activities that you deliver per year, that contribute
            to the impact you are measuring
          </StepperDescription>
          <Box>
            <Box display='flex' justifyContent='space-between'>
              <AddYearButton onClick={addFirstYear} />
              <AddYearButton onClick={addLastYear} />
            </Box>
            <Typography sx={{ mb: 1 }} variant='subtitleBold'>Forecast</Typography>
            <QuantificationTable>
              <TableHead>
                <TableRow>
                  {values.productsData.map((data, index) => (
                    <TableCell
                      component='th'
                      key={data.year}
                      sx={{ position: 'relative', '&:hover .delete-year-icon': { display: 'inline-flex' } }}
                    >
                      <Box>{data.year}</Box>
                      {data.year < moment().year() && index === 0 && <DeleteYearIcon onClick={deleteFirstYear} />}
                      {data.year > moment().year() + 4 && index === values.productsData.length - 1 &&
                        <DeleteYearIcon onClick={deleteLastYear} />
                      }
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {values.productsData.map((data, index) => (
                    <TableCell
                      key={data.year}
                      className={data.year === values.productsData[selectedIndex]?.year ? 'cell-selected' : ''}
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
                          name={`productsData[${selectedIndex}].${month}`}
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
                  {values.productsData.map(data => (
                    <TableCell component='th' key={data.year}>{data.year}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {values.productsData.map((data, index) => (
                    <TableCell
                      key={data.year}
                      className={data.year === values.productsData[selectedIndex]?.year ? 'cell-selected' : ''}
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
                          name={`productsDataActual[${selectedIndex}].${month}`}
                          onBlur={(e) => monthBlurred(e, true)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </QuantificationTable>
            </Box>
          )}
          <StepperNextButton nextStep={nextStep}>
            <StepperNotesButton screen='products' impact={impact} />
          </StepperNextButton>
          <QuantificationCopyDataModal
            impact={impact}
            values={values}
            setFieldValue={setFieldValue}
            setYearlyValues={setYearlyActual}
            copyProp='productsDataActual'
            compareProp='outputUnits'
            data='Products/services/activities'
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

export default memo(MonitoringProductsInput);
