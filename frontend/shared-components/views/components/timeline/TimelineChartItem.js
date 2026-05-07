import React, { memo } from 'react';
import { Avatar, Box, Typography } from "@mui/material";
import { isDefined } from "shared-components/utils/lo";
import filters from "shared-components/filters";
import moment from "moment";

const TimelineChartItem = ({ from, to, color, name, investors = [], ...rest }) => {
  const duration = isDefined(to) ? `${filters.date(from)} - ${filters.date(to)}` : moment(from).format('MMM, YYYY');

  return (
    <Box position='absolute' sx={{ overflowX: 'visible' }} zIndex={20} {...rest}>
      <Box display='flex' alignItems='flex-start' gap={0.5} sx={{ overflowX: 'visible' }}>
        <Box sx={{ overflowX: 'visible' }}>
          <Typography variant='captionBold' noWrap>{name}</Typography>
          <Typography sx={{ fontSize: 10, mt: 0.25 }} noWrap>{duration}</Typography>
        </Box>
        <Box display='flex'>
          {investors.map((investor, index) => (
            <Avatar
              key={index}
              sx={{ width: 24, height: 24, position: 'relative', left: -index * 12 }}
              src={investor.avatar}
              alt={investor.name}
            />
          ))}
        </Box>
      </Box>
      <Box mt={1} position='relative'>
        <Box
          position='absolute'
          left={0}
          width={8}
          height={8}
          backgroundColor={`${color}.main`}
          sx={{ borderRadius: '50%' }}
          zIndex={1}
        />
        {to && <Box position='absolute' height={8} width='100%' backgroundColor={`${color}.subtle`} />}
        {to && (
          <Box
            position='absolute'
            right={0}
            width={8}
            height={8}
            backgroundColor={`${color}.main`}
            sx={{ borderRadius: '50%' }}
            zIndex={1}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(TimelineChartItem);
