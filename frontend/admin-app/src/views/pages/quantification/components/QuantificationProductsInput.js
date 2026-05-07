import React, { memo, useState } from 'react';
import { Box, styled, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import { arraySum, capitalize } from "shared-components/utils/helpers";
import { MONTHS } from "shared-components/utils/constants";
import {
  addYearAfter,
  addYearBefore,
  calculateYearlyTotals,
  deleteYearAfter,
  deleteYearBefore,
  getInputOffset,
  yearTotal
} from "shared-components/utils/quantification";
import moment from "moment";
import { isDefined } from "shared-components/utils/lo";
import QuantificationCopyDataModal from "./QuantificationCopyDataModal";
import QuantificationTable from "../../../common/quantification/QuantificationTable";
import QuantificationTableInput from "../../../common/quantification/QuantificationTableInput";
import StepperNotesButton from "../../../common/stepper/StepperNotesButton";
import AddYearButton from "../../../common/quantification/AddYearButton";
import useModal from "shared-components/hooks/useModal";
import ConfirmDeleteYearModal from "../../../common/quantification/ConfirmDeleteYearModal";
import DeleteYearIcon from "../../../common/quantification/DeleteYearIcon";
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

const QuantificationProductsInput = ({ impact, values, setFieldValue, nextStep }) => {
  const [yearlyValues, setYearlyValues] = useState(calculateYearlyTotals(values.productsData, values.impactCalculationTotal));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [deleteFirstModalOpen, deleteFirstYear, closeDeleteFirstModal] = useModal();
  const [deleteLastModalOpen, deleteLastYear, closeDeleteLastModal] = useModal();

  const currentYearIndex = values.productsData.findIndex(i => i.year === moment().year());
  const forecast = values.impactCalculationTotal
    ? yearlyValues.at(-1)
    : arraySum(yearlyValues.slice(currentYearIndex, currentYearIndex + 5));

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
          setFieldValue(`productsData[${index}].${MONTHS[i]}`, newValue);
        }
      } else {
        const monthlyValue = Math.floor(newValue / 12);
        const lastMonthDiff = newValue - monthlyValue * 12;
        for (let i = 0; i < 11; i++) {
          setFieldValue(`productsData[${index}].${MONTHS[i]}`, monthlyValue);
        }
        setFieldValue(`productsData[${index}].dec`, monthlyValue + lastMonthDiff);
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
      yearlyValueChanged(roundedNumber(yearTotal(values.productsData[selectedIndex]) / 12), selectedIndex);
    } else {
      yearlyValueChanged(yearTotal(values.productsData[selectedIndex]), selectedIndex);
    }
  }

  const addFirstYear = () => {
    setYearlyValues(['', ...yearlyValues]);
    addYearBefore(values, setFieldValue);
  }

  const addLastYear = () => {
    setYearlyValues([...yearlyValues, '']);
    addYearAfter(values, setFieldValue);
  }

  const confirmDeleteFirstYear = () => {
    closeDeleteFirstModal();
    setYearlyValues(yearlyValues.slice(1));
    deleteYearBefore(values, setFieldValue);
  }

  const confirmDeleteLastYear = () => {
    closeDeleteLastModal();
    setYearlyValues(yearlyValues.slice(0, yearlyValues.length - 1));
    deleteYearAfter(values, setFieldValue);
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>{impact.outputUnits || 'Number of products/services/activities'}</StepperTitle>
          <StepperDescription>
            Please indicate the number of products/services/activities that you deliver per year, that contribute
            to the impact you are measuring
          </StepperDescription>
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
                      <TableCell component='th'
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
                          onBlur={(e) => monthBlurred(e, month)}
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
            setYearlyValues={setYearlyValues}
            copyProp='productsData'
            compareProp='outputUnits'
            data='Products/services/activities'
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

export default memo(QuantificationProductsInput);
