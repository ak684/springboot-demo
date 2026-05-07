import React, { memo } from 'react';
import DashboardChartCard from '../components/DashboardChartCard';
import { clone } from 'shared-components/utils/lo';
import chartConfig from '../chart/donutChart';
import { Box, MenuItem, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import TextInput from "shared-components/views/form/TextInput";
import useChart from "shared-components/hooks/useChart";
import { reportSelectors } from "store/ducks/report";
import { arraySum } from "shared-components/utils/helpers";
import DashboardFollowerChartItem from "../components/DashboardFollowerChartItem";
import { socialMedia, VENTURE_ACCESS } from "shared-components/utils/constants";
import filters from "shared-components/filters";
import { useNavigate, useParams } from "react-router-dom";
import { ventureSelectors } from "store/ducks/venture";

const getChartData = (followers) => {
  const config = clone(chartConfig);

  config.series[0].data = followers.map(item => ({
    name: socialMedia[item.type.toLowerCase()].label,
    value: item.value,
    itemStyle: {
      color: socialMedia[item.type.toLowerCase()].color,
    },
  }));

  return config;
};

const InternetPresenceChart = ({ period, setPeriod }) => {
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const theme = useTheme();
  const navigate = useNavigate();
  const followers = useSelector(reportSelectors.getFollowers());
  const totalFollowers = arraySum(followers.map(val => val.value));
  const totalChange = arraySum(followers.map(val => val.change));

  useChart('internet-presence-chart', getChartData, totalFollowers > 0, followers);

  const periodSelector = (
    <TextInput
      select
      onChange={(e) => setPeriod(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      value={period}
      variant='outlined'
      size='small'
    >
      <MenuItem value={0}>All</MenuItem>
      <MenuItem value={7}>Last 7 days</MenuItem>
      <MenuItem value={30}>Last 30 days</MenuItem>
      <MenuItem value={90}>Last 90 days</MenuItem>
      <MenuItem value={365}>Last 365 days</MenuItem>
    </TextInput>
  );

  return (
    <DashboardChartCard
      empty={totalFollowers === 0}
      title='Social media'
      controls={periodSelector}
      sx={{ cursor: 'pointer', '&:hover': { outline: `2px solid ${theme.palette.primary.main}` } }}
      onClick={() => access === VENTURE_ACCESS.EDIT && navigate(`/ventures/${ventureId}/profile-wizard?goto=social`)}
    >
      <Box p={2} display='flex' justifyContent='space-between' alignItems='center' gap={4}>
        <Box>
          {followers.map(val => (
            <DashboardFollowerChartItem key={val.id} item={val} />
          ))}
        </Box>
        <Box position='relative'>
          <Box id='internet-presence-chart' width={220} height={220} />
          <Box align='center' position='absolute' left='50%' top='50%' sx={{ transform: 'translate(-50%,-50%)' }}>
            <Typography variant='caption'>Followers</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{filters.number(totalFollowers)}</Typography>
            {totalChange !== 0 && (
              <Typography variant='captionBold' color={totalChange > 0 ? 'success.main' : 'error.main'}>
                ({totalChange > 0 ? '+' : ''}{filters.number(totalChange)})
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </DashboardChartCard>
  );
};

export default memo(InternetPresenceChart);
