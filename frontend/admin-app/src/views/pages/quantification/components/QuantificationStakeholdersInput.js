import React, { memo, useRef, useState } from 'react';
import { Box, Button, styled, Switch, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import {
  addYearAfter,
  addYearBefore,
  calculateYearlyTotals,
  deleteYearAfter,
  deleteYearBefore,
  getInputOffset,
  yearTotal
} from "shared-components/utils/quantification";
import { arraySum, capitalize } from "shared-components/utils/helpers";
import moment from "moment/moment";
import { GLOBAL_COMMUNITY_INPUT, MONTHS } from "shared-components/utils/constants";
import { clone, isDefined } from "shared-components/utils/lo";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import InfoAlert from "../../../common/InfoAlert";
import QuantificationCopyDataModal from "./QuantificationCopyDataModal";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import QuantificationTableInput from "../../../common/quantification/QuantificationTableInput";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import AddYearButton from "../../../common/quantification/AddYearButton";
import DeleteYearIcon from "../../../common/quantification/DeleteYearIcon";
import useModal from "shared-components/hooks/useModal";
import ConfirmDeleteYearModal from "../../../common/quantification/ConfirmDeleteYearModal";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import QuantificationCalculationTypeSwitch from "./QuantificationCalculationTypeSwitch";
import roundedNumber from "shared-components/filters/roundedNumber";

const StyledPointerLine = styled(Box)(({ theme, element }) => ({
  position: 'absolute',
  width: 2,
  height: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  top: -16,
  left: getInputOffset(element),
}));

const QuantificationStakeholdersInput = ({ impact, values, setFieldValue, nextStep, isGlobal }) => {
  const [showProducts, setShowProducts] = useState(false);
  const [yearlyValues, setYearlyValues] = useState(calculateYearlyTotals(values.stakeholdersData, values.impactCalculationTotal));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const calcRef = useRef(null);
  const [productYearlyValues, setProductYearlyValues] = useState(calculateYearlyTotals(values.productsData, values.impactCalculationTotal));
  const [deleteFirstModalOpen, deleteFirstYear, closeDeleteFirstModal] = useModal();
  const [deleteLastModalOpen, deleteLastYear, closeDeleteLastModal] = useModal();

  const currentYearIndex = values.stakeholdersData.findIndex(i => i.year === moment().year());
  const forecast = values.impactCalculationTotal
    ? yearlyValues.at(-1)
    : arraySum(yearlyValues.slice(currentYearIndex, currentYearIndex + 5));
  const productsForecast = arraySum(
    MONTHS.flatMap(month =>
      values.productsData
        .slice(currentYearIndex, currentYearIndex + 5)
        .flatMap(val => val[month])
    )
  );

  const multiplyProducts = () => {
    const multiplicator = Number(calcRef.current.value);
    if (multiplicator > 0) {
      const updatedData = clone(values.stakeholdersData);
      for (let i = 0; i < values.productsData.length; i++) {
        MONTHS.forEach(month => {
          updatedData[i][month] = Math.round(values.productsData[i][month] * multiplicator)
        });
      }
      setFieldValue('stakeholdersData', updatedData);
      setYearlyValues(calculateYearlyTotals(updatedData, values.impactCalculationTotal));
    }
  }

  const inputFocused = (e, index) => {
    setSelectedIndex(index);
    setSelectedElement(e.target);
    setPreviousValue(yearlyValues[index]);
  };

  const inputBlurred = (e, index) => {
    const newValue = +e.target.value;
    if (newValue !== previousValue && (newValue > 0 || newValue === 0)) {
      if (values.impactCalculationTotal) {
        for (let i = 0; i < 12; i++) {
          setFieldValue(`stakeholdersData[${index}].${MONTHS[i]}`, newValue);
        }
      } else {
        const monthlyValue = Math.floor(newValue / 12);
        const lastMonthDiff = newValue - monthlyValue * 12;
        for (let i = 0; i < 11; i++) {
          setFieldValue(`stakeholdersData[${index}].${MONTHS[i]}`, monthlyValue);
        }
        setFieldValue(`stakeholdersData[${index}].dec`, monthlyValue + lastMonthDiff);
      }
    }

    setPreviousValue(null);
  };

  const yearlyValueChanged = (newValue, index) => {
    yearlyValues.splice(index, 1, newValue);
    setYearlyValues([...yearlyValues]);
  }

  const monthBlurred = () => {
    if (values.impactCalculationTotal) {
      yearlyValueChanged(Number((yearTotal(values.stakeholdersData[selectedIndex]) / 12).toFixed(2)), selectedIndex);
    } else {
      yearlyValueChanged(yearTotal(values.stakeholdersData[selectedIndex]), selectedIndex);
    }
  }

  const addFirstYear = () => {
    setYearlyValues(['', ...yearlyValues]);
    setProductYearlyValues(['', ...productYearlyValues]);
    addYearBefore(values, setFieldValue);
  }

  const addLastYear = () => {
    setYearlyValues([...yearlyValues, '']);
    setProductYearlyValues([...productYearlyValues, '']);
    addYearAfter(values, setFieldValue);
  }

  const confirmDeleteFirstYear = () => {
    closeDeleteFirstModal();
    setYearlyValues(yearlyValues.slice(1));
    setProductYearlyValues(productYearlyValues.slice(1));
    deleteYearBefore(values, setFieldValue);
  }

  const confirmDeleteLastYear = () => {
    closeDeleteLastModal();
    setYearlyValues(yearlyValues.slice(0, yearlyValues.length - 1));
    setProductYearlyValues(productYearlyValues.slice(0, productYearlyValues.length - 1));
    deleteYearAfter(values, setFieldValue);
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Number of stakeholders</StepperTitle>
          {isGlobal && (
            <InfoAlert sx={{ mt: 3 }}>
              Not applicable to this impact chain because stakeholders are {GLOBAL_COMMUNITY_INPUT}
            </InfoAlert>
          )}
          {!isGlobal && (
            <Box>
              <Box display='flex' alignItems='center' gap={3} my={5}>
                <Typography variant='body' sx={{ maxWidth: 350 }}>
                  Average number of stakeholders reached <b>per product/service/activity</b>:
                </Typography>
                <TextField variant='standard' inputRef={calcRef} type='number' inputProps={{ min: 1 }} />
                <Button onClick={multiplyProducts}>Calculate</Button>
              </Box>
              <Box mb={2} ml={1}>
                <FormControlLabel
                  control={<Switch checked={showProducts} onChange={() => setShowProducts(!showProducts)} />}
                  label="Show products/services/activities"
                  componentsProps={{ typography: getTypography('subtitle') }}
                />
              </Box>
              {showProducts && (
                <>
                  <Box display='flex' gap={1}>
                    <QuantificationTable sx={{ opacity: 0.5 }}>
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
                              {productYearlyValues[index]}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </QuantificationTable>
                    <QuantificationTable sx={{ flex: '0 0 120px', opacity: 0.5 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell component='th'>5 years forecast</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{productsForecast > 0 ? productsForecast : 0}</TableCell>
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
                                {values.productsData[selectedIndex][month]}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </QuantificationTable>
                    </Box>
                  )}
                </>
              )}
              <Box mt={4}>
                <Typography sx={{ mb: 2 }} variant='subtitle'>
                  <b>Stakeholders:</b> {impact.stakeholders}
                </Typography>
                <Box display='flex' gap={1} alignItems='flex-end'>
                  <Box>
                    <Box display='flex' justifyContent='space-between'>
                      <AddYearButton onClick={addFirstYear} />
                      <AddYearButton onClick={addLastYear} />
                    </Box>
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
                              {data.year < moment().year() && index === 0 &&
                                <DeleteYearIcon onClick={deleteFirstYear} />}
                              {data.year > moment().year() + 4 && index === values.productsData.length - 1 &&
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
                                onFocus={(e) => inputFocused(e, index)}
                                onBlur={(e) => inputBlurred(e, index)}
                                value={yearlyValues[index]}
                                onChange={(e) => yearlyValueChanged(e.target.value, index)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </QuantificationTable>
                  </Box>
                  <Box>
                    <QuantificationCalculationTypeSwitch setFieldValue={setFieldValue} values={values} />
                    <QuantificationTable sx={{ flex: '0 0 120px' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell component='th'>
                            <Typography noWrap variant='captionBold'>5 years forecast</Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{forecast > 0 ? forecast : 0}</TableCell>
                        </TableRow>
                      </TableBody>
                    </QuantificationTable>
                  </Box>
                </Box>
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
                              onBlur={(e) => monthBlurred(e, month)}
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
          <StepperNextButton nextStep={nextStep} last={impact.indicators.length === 0}>
            <StepperNotesButton screen='stakeholders' impact={impact} />
          </StepperNextButton>
          <QuantificationCopyDataModal
            impact={impact}
            values={values}
            setFieldValue={setFieldValue}
            setYearlyValues={setYearlyValues}
            copyProp='stakeholdersData'
            compareProp='stakeholders'
            data='stakeholders'
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

export default memo(QuantificationStakeholdersInput);
