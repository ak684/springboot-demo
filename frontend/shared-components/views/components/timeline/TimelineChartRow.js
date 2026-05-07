import React, { memo } from 'react';
import { Box } from "@mui/material";
import TimelineChartItem from "./TimelineChartItem";
import moment from "moment";

const getItemLeft = (years, date) => {
  const year = moment(date).year();
  const yearIndex = years.indexOf(year);
  return 100 / (years.length - 1) * yearIndex + moment(date).dayOfYear() / 365 * 100 / (years.length - 1) + '%';
}

const getItemWidth = (years, from, to) => {
  if (!to) {
    return null;
  }

  return moment(to).diff(moment(from), 'days') / 365 * 100 / (years.length - 1) + '%';
}

const TimelineChartRow = ({ years, color, items = [], getFrom, getTo, getName }) => {
  return (
    <Box height={64} position='relative'>
      {items.map(item => (
        <TimelineChartItem
          key={item.id}
          bottom={4}
          left={getItemLeft(years, getFrom(item))}
          width={getItemWidth(years, getFrom(item), getTo(item))}
          name={getName(item)}
          color={color}
          investors={item.investors}
          from={getFrom(item)}
          to={getTo(item)}
        />
      ))}
    </Box>
  );
};

export default memo(TimelineChartRow);
