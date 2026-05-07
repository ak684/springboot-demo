import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import filters from "shared-components/filters";
import { socialMedia } from "shared-components/utils/constants";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const DashboardFollowerChartItem = ({ item }) => {
  const type = item.type.toLowerCase();

  return (
    <CustomErrorBoundary>
      <Box display='flex' gap={2} mb={2} alignItems='center'>
        <Box component='img' width={24} height={24} src={`/images/icons/social/${type}.svg`} />
        <Box>
          <Box display='flex' gap={1} alignItems='center'>
            <Box width={8} height={8} backgroundColor={socialMedia[type].color} />
            <Typography variant='captionBold'>{socialMedia[type].label}</Typography>
          </Box>
          <Box mt={0.25} display='flex' alignItems='center' gap={0.5}>
            <Typography variant='caption'>{filters.number(item.value)} followers</Typography>
            {item.change !== 0 && (
              <Typography variant='captionBold' color={item.change > 0 ? 'success.main' : 'error.main'}>
                ({item.change > 0 ? '+' : ''}{filters.number(item.change)})
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardFollowerChartItem);
