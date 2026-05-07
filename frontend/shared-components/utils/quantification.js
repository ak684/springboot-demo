import { GLOBAL_COMMUNITY_INPUT, MONTHS } from "./constants";
import { arraySum } from "./helpers";
import moment from "moment/moment";
import { clone, sortBy } from "./lo";
import filters from "../filters";
import smartRound from "../filters/smartRound";
import theme from "../theme";
import stackedBarChartConfig from "../chart/stackedBarChart";
import roundedNumber from "../filters/roundedNumber";

export const arrayRange = (from, number) => [...Array(number).keys()].map((key, index) => from + index);
const initialYears = () => arrayRange(moment().year() - 2, 8);

export const emptyYearlyData = (year, type) => ({
  year,
  ...MONTHS.reduce((acc, m) => {
    acc[m] = '';
    return acc;
  }, {}),
  type
});

export const emptyIndicatorYearlyData = (year, type) => ({
  year,
  value: '',
  type
})

export const initialYearlyData = (type) => initialYears().map(val => emptyYearlyData(val, type));

export const indicatorYearlyData = (type) => initialYears().map(val => emptyIndicatorYearlyData(val, type));

export const nullValuesToEmptyStrings = (data) => data.map(el => ({
  ...el,
  value: el.value === null ? '' : el.value,
}));

export const nullMonthsToEmptyStrings = (data) => data.map(el => ({
  ...el,
  ...MONTHS.reduce((acc, m) => {
    if (el[m] === null) {
      acc[m] = '';
    } else {
      acc[m] = el[m];
    }
    return acc;
  }, {}),
}));

export const calculateYearlyTotals = (data, impactCalculationTotal) =>
  impactCalculationTotal ? data.map(d => roundedNumber(yearTotal(d) / 12)) : data.map(d => yearTotal(d));

export const yearTotal = yearData => {
  if (!yearData) {
    return 0;
  }

  const result = MONTHS.reduce((acc, m) => acc + +yearData[m], 0);
  return (result > 0 || result === 0) ? result : '';
}

export const yearAverage = yearData => {
  const result = MONTHS.reduce((acc, m) => acc + +yearData[m], 0) / 12;
  return (result > 0 || result === 0) ? result : '';
}

export const yearToDate = yearData => {
  const currentMonth = moment().format('MMM').toLowerCase();
  const monthIndex = MONTHS.indexOf(currentMonth) + 1;
  return MONTHS.slice(0, monthIndex).reduce((acc, month) => acc + (yearData[month] || 0), 0);
}

export const getInputOffset = (inputElement) => {
  let offset = inputElement.offsetLeft;
  let parentElement = inputElement.parentNode;

  while (parentElement?.classList && !parentElement.classList.contains('MuiTableCell-root')) {
    offset += parentElement.offsetLeft;
    parentElement = parentElement.parentNode;
  }
  return offset + inputElement.clientWidth / 2;
}

export const getCalcProp = (indicator, impact) => indicator.quantificationType === 'PER_STAKEHOLDER' && impact.stakeholders !== GLOBAL_COMMUNITY_INPUT
  ? 'stakeholdersData'
  : 'productsData'

export const getYearOutcome = (values, indicator) => values[getCalcProp(indicator, values)]
  .map((val, i) =>
    yearTotal(val) * Math.abs(sortByYear(indicator.post)[i]?.value - sortByYear(indicator.pre)[i]?.value)
  )
  .map(val => values.impactCalculationTotal ? val / 12 : val);
export const getContinuedOutcome = (values, indicator) => getYearOutcome(values, indicator)
  .map((val, i, arr) =>
    arraySum(arr.slice(Math.max(i - indicator.duration + 1, 0), i))
  );
export const getTotalOutcome = (values, indicator) => {
  if (values.indicators.length === 0) {
    return [];
  }

  const yearOutcome = getYearOutcome(values, indicator);
  const continuedOutcome = getContinuedOutcome(values, indicator);
  return yearOutcome.map((v, i) => v + continuedOutcome[i]);
}

export const getNetOutcome = (values, indicator) => {
  if (values.indicators.length === 0) {
    return [];
  }

  const totalOutcome = getTotalOutcome(values, indicator);
  const { deadweight, displacement, attribution } = indicator;
  const dropoff = getDropoffValues(values, indicator);
  const counterfactuals = (deadweight || 0) + (displacement || 0) + (attribution || 0);
  return totalOutcome.map((v, i) => v * (100 - counterfactuals) / 100 - dropoff[i]);
}

export const getDropoffValues = (values, indicator) => {
  if (values.indicators.length === 0) {
    return [];
  }

  const yearOutcome = getYearOutcome(values, indicator);
  const { duration, deadweight, displacement, attribution, dropoff } = indicator;
  const counterfactuals = (deadweight || 0) + (displacement || 0) + (attribution || 0);
  const result = [];

  for (let i = 0; i < yearOutcome.length; i++) {
    let yearDropoff = 0;

    for (let j = 0; j < Math.min(duration - 1, i); j++) {
      const netOutcomeBeforeDropoff = yearOutcome[i - j - 1] * (100 - counterfactuals) / 100;
      let netOutcomeAfterDropoff = netOutcomeBeforeDropoff;

      for (let k = 0; k <= j; k++) {
        netOutcomeAfterDropoff = netOutcomeAfterDropoff * (100 - dropoff[k]) / 100;
      }

      yearDropoff += netOutcomeBeforeDropoff - netOutcomeAfterDropoff;
    }

    result.push(yearDropoff);
  }

  return result;
}

export const findFirstErrorMessage = (obj) => {
  if (typeof obj === 'string') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      let result = findFirstErrorMessage(obj[i]);
      if (result) return result;
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        let result = findFirstErrorMessage(obj[key]);
        if (result) return result;
      }
    }
  }

  return null;
}

export const sortByYear = (arr) => [...arr].sort((v1, v2) => v1.year - v2.year);

export const findByYear = (collection, year) => collection.find(v => v.year === year);

export const addYearBefore = (values, setFieldValue) => {
  const firstYear = sortByYear(values.productsData)[0].year;
  setFieldValue('productsData', [emptyYearlyData(firstYear - 1, 'PRODUCTS'), ...values.productsData]);
  setFieldValue('productsDataActual', [emptyYearlyData(firstYear - 1, 'PRODUCTS_ACTUAL'), ...values.productsDataActual]);
  setFieldValue('stakeholdersData', [emptyYearlyData(firstYear - 1, 'STAKEHOLDERS'), ...values.stakeholdersData]);
  setFieldValue('stakeholdersDataActual', [emptyYearlyData(firstYear - 1, 'STAKEHOLDERS_ACTUAL'), ...values.stakeholdersDataActual]);
  values.indicators.forEach((indicator, index) => {
    setFieldValue(`indicators[${index}].pre`, [emptyIndicatorYearlyData(firstYear - 1, 'PRE'), ...values.indicators[index].pre]);
    setFieldValue(`indicators[${index}].preActual`, [emptyYearlyData(firstYear - 1, 'PRE_ACTUAL'), ...values.indicators[index].preActual]);
    setFieldValue(`indicators[${index}].post`, [emptyIndicatorYearlyData(firstYear - 1, 'POST'), ...values.indicators[index].post]);
    setFieldValue(`indicators[${index}].postActual`, [emptyYearlyData(firstYear - 1, 'POST_ACTUAL'), ...values.indicators[index].postActual]);
  });
}

export const deleteYearBefore = (values, setFieldValue) => {
  setFieldValue('productsData', values.productsData.filter((_, index) => index !== 0));
  setFieldValue('productsDataActual', values.productsDataActual.filter((_, index) => index !== 0));
  setFieldValue('stakeholdersData', values.stakeholdersData.filter((_, index) => index !== 0));
  setFieldValue('stakeholdersDataActual', values.stakeholdersDataActual.filter((_, index) => index !== 0));
  values.indicators.forEach((indicator, index) => {
    setFieldValue(`indicators[${index}].pre`, values.indicators[index].pre.filter((_, i) => i !== 0));
    setFieldValue(`indicators[${index}].preActual`, values.indicators[index].preActual.filter((_, i) => i !== 0));
    setFieldValue(`indicators[${index}].post`, values.indicators[index].post.filter((_, i) => i !== 0));
    setFieldValue(`indicators[${index}].postActual`, values.indicators[index].postActual.filter((_, i) => i !== 0));
  });
}

export const addYearAfter = (values, setFieldValue) => {
  const lastYear = sortByYear(values.productsData).at(-1).year;
  setFieldValue('productsData', [...values.productsData, emptyYearlyData(lastYear + 1, 'PRODUCTS')]);
  setFieldValue('productsDataActual', [...values.productsDataActual, emptyYearlyData(lastYear + 1, 'PRODUCTS_ACTUAL')]);
  setFieldValue('stakeholdersData', [...values.stakeholdersData, emptyYearlyData(lastYear + 1, 'STAKEHOLDERS')]);
  setFieldValue('stakeholdersDataActual', [...values.stakeholdersDataActual, emptyYearlyData(lastYear + 1, 'STAKEHOLDERS_ACTUAL')]);
  values.indicators.forEach((indicator, index) => {
    setFieldValue(`indicators[${index}].pre`, [...values.indicators[index].pre, emptyIndicatorYearlyData(lastYear + 1, 'PRE')]);
    setFieldValue(`indicators[${index}].preActual`, [...values.indicators[index].preActual, emptyYearlyData(lastYear + 1, 'PRE_ACTUAL')]);
    setFieldValue(`indicators[${index}].post`, [...values.indicators[index].post, emptyIndicatorYearlyData(lastYear + 1, 'POST')]);
    setFieldValue(`indicators[${index}].postActual`, [...values.indicators[index].postActual, emptyYearlyData(lastYear + 1, 'POST_ACTUAL')]);
  });
}

export const deleteYearAfter = (values, setFieldValue) => {
  setFieldValue('productsData', values.productsData.filter((_, index) => index !== values.productsData.length - 1));
  setFieldValue('productsDataActual', values.productsDataActual.filter((_, index) => index !== values.productsDataActual.length - 1));
  setFieldValue('stakeholdersData', values.stakeholdersData.filter((_, index) => index !== values.stakeholdersData.length - 1));
  setFieldValue('stakeholdersDataActual', values.stakeholdersDataActual.filter((_, index) => index !== values.stakeholdersDataActual.length - 1));
  values.indicators.forEach((indicator, index) => {
    setFieldValue(`indicators[${index}].pre`, values.indicators[index].pre.filter((_, i) => i !== values.indicators[index].pre.length - 1));
    setFieldValue(`indicators[${index}].preActual`, values.indicators[index].preActual.filter((_, i) => i !== values.indicators[index].preActual.length - 1));
    setFieldValue(`indicators[${index}].post`, values.indicators[index].post.filter((_, i) => i !== values.indicators[index].post.length - 1));
    setFieldValue(`indicators[${index}].postActual`, values.indicators[index].postActual.filter((_, i) => i !== values.indicators[index].postActual.length - 1));
  });
}

const tooltipItem = (label, value, color) => `
<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <div style="flex: 0 0 10px; height: 10px; border-radius: 50%; background-color: ${color};"></div>
    <div>${label}:</div>
  </div>
  <div><b>${filters.number(value)}</b></div>
</div>
`

export const getIndicatorNetOutcomeChartData = (values, indicator) => {
  const config = clone(stackedBarChartConfig);

  if (values.indicators.length === 0) {
    return config;
  }

  const totalOutcome = getTotalOutcome(values, indicator);
  const netOutcome = getNetOutcome(values, indicator);
  config.legend.show = false;
  config.grid.y = 16;
  config.xAxis.data = values.productsData.map(v => '\'' + String(v.year).slice(-2));
  config.series[0].data = netOutcome;
  config.series[1].data = totalOutcome.map((v, i) => v - netOutcome[i]);

  const { deadweight, displacement, attribution } = indicator;
  const dropoffValues = getDropoffValues(values, indicator);
  config.tooltip.position = (point) => [point[0] - 150, point[1] + 20];
  config.tooltip.formatter = (params) => {
    const index = params[0].dataIndex;
    const totalValue = totalOutcome[index];

    return `
      <div>
        <div><b>${values.productsData[index].year}</b></div>
        ${tooltipItem('Total outcome', totalValue, theme.palette.secondary.main)}
        ${tooltipItem('Net outcome', netOutcome[index], theme.palette.primary.main)}
        ${tooltipItem('Deadweight', totalValue * deadweight / 100, theme.palette.success.main)}
        ${tooltipItem('Displacement', totalValue * displacement / 100, theme.palette.error.main)}
        ${tooltipItem('Attribution', totalValue * attribution / 100, '#FDB713')}
        ${tooltipItem('Drop-off', dropoffValues[index], '#00AED9')}
      </div>
    `
  }
  return config;
};

export const getAverageChange = (impact, indicator) => {
  const calcProp = getCalcProp(indicator, impact);
  const data = sortByYear(impact[calcProp]);
  const totalData = arraySum(data.map(yearTotal));
  const totalPre = arraySum(sortByYear(indicator.pre).map((val, i) => val.value * yearTotal(data[i]) || 0));
  const totalPost = arraySum(sortByYear(indicator.post).map((val, i) => val.value * yearTotal(data[i]) || 0));
  const averagePre = totalPre / totalData;
  const averagePost = totalPost / totalData;
  const improvement = Math.abs(averagePre - averagePost);
  const improvementPercent = improvement / averagePre * 100;

  return [
    smartRound(averagePre) || 'No data',
    smartRound(averagePost) || 'No data',
    smartRound(improvement) || 'No data',
    smartRound(improvementPercent) || 'No data'
  ];
};

export const dataFilled = (data) => data && MONTHS.some(m => data[m] > 0);

export const getMonthlyForecastForYear = (impact, indicator, year) => MONTHS.map((mon) =>
  findByYear(impact[getCalcProp(indicator, impact)], year)?.[mon] * Math.abs(findByYear(indicator.post, year)?.value - findByYear(indicator.pre, year)?.value)
);

export const getForecastForYear = (impact, indicator, year) => arraySum(getMonthlyForecastForYear(impact, indicator, year));

export const getMonthlyActualForYear = (impact, indicator, year) => MONTHS.map((mon) =>
  findByYear(impact[getCalcProp(indicator, impact) + 'Actual'], year)?.[mon] * Math.abs(findByYear(indicator.postActual, year)?.[mon] - findByYear(indicator.preActual, year)?.[mon])
);

export const getActualForYear = (impact, indicator, year) => arraySum(getMonthlyActualForYear(impact, indicator, year));

export const harmonizeYears = (collection, productsData, emptyYearFunc, type) => {
  const result = collection.filter(data => productsData.some(pd => data.year === pd.year));
  const newYears = productsData
    .filter(pd => !collection.some(data => data.year === pd.year))
    .map(pd => emptyYearFunc(pd.year, type));
  result.push(...newYears)
  return sortByYear(result);
}

export const getIndicatorInceptionData = (impact, indicator, outcomeGetter) => {
  const currentYearIndex = impact.productsData.findIndex(d => d.year === moment().year());
  const outcome = outcomeGetter(impact, indicator);
  return filters.smartRound(arraySum(outcome.slice(0, currentYearIndex + 1)), 0, indicator.unit) || 0;
}

export const getIndicatorThisYearData = (impact, indicator, outcomeGetter) => {
  const currentYearIndex = impact.productsData.findIndex(d => d.year === moment().year());
  const outcome = outcomeGetter(impact, indicator);
  return filters.smartRound(outcome[currentYearIndex], 0, indicator.unit) || 0;
}

export const getIndicatorFiveYearData = (impact, indicator, outcomeGetter) => {
  const currentYearIndex = impact.productsData.findIndex(d => d.year === moment().year());
  const outcome = outcomeGetter(impact, indicator);
  return filters.smartRound(arraySum(outcome.slice(currentYearIndex, currentYearIndex + 5)), 0, indicator.unit) || 0;
}

export const getRiskItem = (note, preNote) => {
  const source = note?.same ? preNote : note;
  return sortBy([...(source?.links || []), ...(source?.files || [])], 'risk')[0];
};

export const getVentureYtdProgress = (impacts) => {
  const year = moment().year();

  let ventureAverage = 0;

  impacts.forEach(impact => {
    const indicatorCompletions = [];

    impact.indicators.forEach((indicator, index) => {
      const monthlyForecast = getMonthlyForecastForYear(impact, indicator, year);
      const forecast = arraySum(monthlyForecast.slice(0, moment().month() + 1));
      const monthlyActual = getMonthlyActualForYear(impact, indicator, year)
      const actual = arraySum(monthlyActual.slice(0, moment().month() + 1));

      if (forecast > 0) {
        indicatorCompletions.push(actual / forecast * 100 - 100);
      }
    });

    if (indicatorCompletions.length > 0) {
      ventureAverage += Math.round(arraySum(indicatorCompletions) / indicatorCompletions.length);
    }
  });

  ventureAverage /= impacts.length;
  return ventureAverage;
};
