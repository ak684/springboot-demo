import React, { memo } from 'react';
import { Box, Card, Typography, useMediaQuery, useTheme } from "@mui/material";
import moment from "moment";
import { clone } from "shared-components/utils/lo";
import { arrayRange } from "shared-components/utils/quantification";
import TimelineChartRow from "./TimelineChartRow";
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';

const noDataView = (
  <Box
    display='flex'
    alignItems='center'
    justifyContent='center'
    flexDirection='column'
    gap={2}
    backgroundColor='secondary.subtle'
    height={360}
  >
    <FindInPageOutlinedIcon sx={{ width: 26, height: 26, color: 'secondary.main' }} />
    <Typography variant='overline' color='secondary.main'>No data</Typography>
  </Box>
);

const itemsOverlap = (item1, item2) => moment(item1.start).isBefore(moment(item2.finish)) &&
  moment(item1.finish).isAfter(moment(item2.start));

const assignRows = (items) => {
  let rows = [];

  items.forEach(item => {
    let placed = false;

    for (let i = 0; i < rows.length && !placed; i++) {
      const overlap = rows[i].some(rowEvent => itemsOverlap(item, rowEvent));
      if (!overlap) {
        rows[i].push(item);
        placed = true;
      }
    }

    if (!placed) {
      rows.push([item]);
    }
  });

  return rows;
}

const TimelineChart = ({ venture, ...rest }) => {
  const awards = clone(venture.awards).sort((r1, r2) => moment(r1.date) - moment(r2.date));
  const accelerations = clone(venture.acceleration).sort((r1, r2) => moment(r1.start) - moment(r2.start));
  const fundingRounds = clone(venture.funding).sort((r1, r2) => moment(r1.date) - moment(r2.date));
  const dataPresent = awards.length > 0 || accelerations.length > 0 || fundingRounds.length > 0;
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletView = useMediaQuery(theme.breakpoints.down('lg'));
  // Defines hom many percents of chart width one yearly column takes
  const widthFactor = isMobileView ? 33.3 : isTabletView ? 25 : 20;

  const itemYears = [
    ...awards.map(a => moment(a.date).year()),
    ...accelerations.map(a => moment(a.start).year()),
    ...fundingRounds.map(f => moment(f.date).year()),
    moment().year() - 3
  ]

  const minYear = Math.min(...itemYears);
  const maxYear = moment().year() + 2;

  const years = arrayRange(minYear, maxYear - minYear + 1);
  const accelerationRows = assignRows(accelerations);

  return (
    <Card sx={{ p: 2, border: 1, borderColor: 'border' }} {...rest}>
      {!dataPresent && noDataView}
      {dataPresent && (
        <Box width='100%' sx={{ overflowX: 'auto', overflowY: 'visible' }}>
          <Box
            position='relative'
            borderBottom={1}
            borderTop={1}
            borderColor='border'
            width={`${(years.length - 1) * widthFactor}%`}
            mb={4}
          >
            <TimelineChartRow
              years={years}
              items={awards}
              color='warning'
              getFrom={item => item.date}
              getTo={() => null}
              getName={item => item.name}
            />
            {accelerationRows.map((row, index) => (
              <TimelineChartRow
                key={index}
                years={years}
                items={row}
                color='success'
                getFrom={item => item.start}
                getTo={item => item.finish}
                getName={item => item.name}
              />
            ))}
            <TimelineChartRow
              years={years}
              items={fundingRounds}
              color='primary'
              getFrom={item => item.date}
              getTo={() => null}
              getName={item => item.type.label}
            />

            {/* Vertical axis lines */}
            {years.map((year, index) => (
              <Box
                key={year}
                position='absolute'
                left={`${100 / (years.length - 1) * index}%`}
                top={0}
                bottom={0}
                width='1px'
                backgroundColor='border'
                zIndex={10}
              />
            ))}

            {/* X Axis legend */}
            {years.map((year, index) => (
              <Box key={year}
                position='absolute'
                bottom={-24}
                left={`${100 / (years.length - 1) * index}%`}
                sx={{ transform: 'translateX(-14px)' }}>
                <Typography variant='caption' color='text.tetriary'>{year}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Box mt={4} display='flex' justifyContent='center' gap={4}>
        <Box display='flex' alignItems='center' gap={1}>
          <Box width={12} height={12} backgroundColor='primary.main' sx={{ borderRadius: '50%' }} />
          <Typography variant='subtitle'>Funding</Typography>
        </Box>
        <Box display='flex' alignItems='center' gap={1}>
          <Box width={12} height={12} backgroundColor='success.main' sx={{ borderRadius: '50%' }} />
          <Typography variant='subtitle'>Accelerations</Typography>
        </Box>
        <Box display='flex' alignItems='center' gap={1}>
          <Box width={12} height={12} backgroundColor='warning.main' sx={{ borderRadius: '50%' }} />
          <Typography variant='subtitle'>Awards</Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default memo(TimelineChart);
