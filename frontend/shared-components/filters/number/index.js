import currencyConfig from './currencyConfig';
import store from 'store';

export default function (value, decimalPlaces = 0, isCurrency = false) {
  const currency = store.getState().venture.current?.data?.currency;
  // toDO: If needed, update according to the currencyConfig
  let decimalSeparator = '.';
  let thousandSeparator = ',';
  let prefixed = false;
  let symbol;

  if (currency) {
    symbol = currency.symbol;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "number") {
    value = value.toFixed(10);
  }

  const numberParts = value.toString().split(".");
  const isNegative = numberParts[0].trim().startsWith("-");
  let wholePart = numberParts[0].replace(/\D/g, "");
  let decimalPart = "";

  if (wholePart.length === 0) {
    return "";
  }

  if (numberParts.length > 1) {
    decimalPart = (numberParts[1] || "").replace(/\D/g, "").replace(/0+$/, "");

    if (decimalPlaces === 0 || decimalPlaces > 0) {
      const roundedNumber = parseFloat(`${wholePart}.${decimalPart}`).toFixed(decimalPlaces);
      const roundedNumberParts = roundedNumber.split(".");
      wholePart = roundedNumberParts[0];
      decimalPart = (roundedNumberParts[1] || "").replace(/0+$/, "");
    }
  }

  const numOfThousandSeparators = Math.ceil(wholePart.length / 3) - 1;
  for (let i = 0; i < numOfThousandSeparators; i++) {
    wholePart = `${wholePart.slice(0, wholePart.length - (i + 1) * 3 - i)}${thousandSeparator}${wholePart.slice(
      wholePart.length - (i + 1) * 3 - i
    )}`;
  }

  let result = (isNegative ? "-" : "") + wholePart;

  if (decimalPart.length > 0) {
    result += `${decimalSeparator}${decimalPart}`;
  }

  if (isCurrency && currency) {
    if (prefixed) {
      result = `${symbol}${result}`;
    } else {
      result = `${result}${symbol}`;
    }
  }

  return result;
};
