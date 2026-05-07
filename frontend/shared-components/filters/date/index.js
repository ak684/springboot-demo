// toDO: Replace moment with something more modern and lightweight?
import moment from 'moment';

export default function (date, format = 'MMM D, YYYY') {
  if (!date) {
    return date;
  }

  const momentDate = moment(date);

  if (!format || !momentDate.isValid()) {
    return date;
  }

  return momentDate.format(format);
}
