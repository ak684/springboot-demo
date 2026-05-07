import number from "../number";
import { isDefined } from "../../utils/lo";

export default function (value, bigNumbersRoundFactor = 0, unit) {
  if (!isDefined(value) || isNaN(value)) {
    return value;
  }

  const roundFactor = value === 0
    ? 0
    : Math.abs(value) <= 1
    ? Math.abs(value) < 0.1 ? 3 : 2
    : Math.abs(value) <= 10 ? 1 : bigNumbersRoundFactor;

  if (value >= 1000) {
    return number(value) + (unit ? ' ' + unit.symbol : '');
  } else {
    return Number(value).toFixed(roundFactor) + (unit ? ' ' + unit.symbol : '');
  }
}
