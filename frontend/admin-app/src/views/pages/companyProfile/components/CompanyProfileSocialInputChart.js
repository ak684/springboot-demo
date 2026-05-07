import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { clone } from "shared-components/utils/lo";
import { socialMedia } from "shared-components/utils/constants";
import chartConfig from '../chart/donutChart';
import { arraySum } from "shared-components/utils/helpers";
import filters from "shared-components/filters";
import useChart from "shared-components/hooks/useChart";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const getChartData = (followers) => {
  const data = Object.keys(followers)
    .filter(key => followers[key] > 0)
    .map(key => ({
      name: socialMedia[key].label,
      value: followers[key],
      color: socialMedia[key].color,
    }))

  const config = clone(chartConfig);
  config.series[0].data = data;
  config.series[0].color = data.map(i => i.color);

  return config;
};

const CompanyProfileSocialInputChart = ({ followers }) => {
  useChart('social-followers-chart', getChartData, Object.keys(followers).length > 0, followers);

  const totalFollowers = arraySum(Object.values(followers));

  return (
    <CustomErrorBoundary>
      <Box flexGrow={0} flexShrink={0}>
        <Box
          height={235}
          width={totalFollowers > 0 ? 235 : 0}
          sx={{ position: 'relative' }}
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <Box id='social-followers-chart' sx={{ position: 'absolute', width: '100%', height: '100%' }} />
          {totalFollowers > 0 && (
            <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
              <Typography sx={{ fontWeight: 700, fontSize: 28 }}>{filters.number(totalFollowers)}</Typography>
              <Typography variant='caption'>Followers</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileSocialInputChart);
