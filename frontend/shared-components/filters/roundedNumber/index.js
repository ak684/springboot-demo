import { isDefined } from "../../utils/lo";

export default function (value, decimals = 2) {
  if (!isDefined(value) || isNaN(value)) {
    return value;
  }

  return Number(value.toFixed(decimals));
}
