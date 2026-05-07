import React, { memo, useState } from 'react';
import { Avatar, Box, Card, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import filters from "shared-components/filters";
import moment from "moment";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileFundingCard = ({ values, funding, edit }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();

  const { ventureId } = useParams();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box flexGrow={1} display='flex' flexDirection='column' gap={2}>
          <Box display='flex' gap={2}>
            <FieldLabel sx={{ width: 130, flexGrow: 0, flexShrink: 0 }} noWrap>Funding source</FieldLabel>
            <Box display='flex' gap={2} flexGrow={1}>
              <FieldLabel sx={{ width: '40%', flexGrow: 0, flexShrink: 0 }} noWrap>Investor</FieldLabel>
              <FieldLabel noWrap>Location</FieldLabel>
              <FieldLabel sx={{ flexGrow: 1 }} noWrap align='right'>Amount raised</FieldLabel>
            </Box>
          </Box>
          <Divider />
          <Box display='flex' gap={2}>
            <Box width={130} flexGrow={0} flexShrink={0}>
              <Typography variant='subtitleBold'>{funding.type.label}</Typography>
              <Typography sx={{ mt: 0.25 }} variant='caption'>
                {moment(funding.date).format('MMM, YYYY')}
              </Typography>
            </Box>
            <Box flexGrow={1} display='flex' flexDirection='column' gap={2}>
              {funding.investors.map(((investor, index) => (
                <Box flexGrow={1} key={index} display='flex' alignItems='center' gap={2}>
                  <Box display='flex' gap={1} width='40%'>
                    <Avatar src={investor.avatar} sx={{ width: 32, height: 32 }} />
                    <Box>
                      <Typography variant='subtitleBold'>{investor.name}</Typography>
                      <Typography sx={{ mt: 0.25 }} variant='caption'>{investor.company}</Typography>
                    </Box>
                  </Box>
                  <Typography variant='subtitle'>
                    {investor.city ? investor.city + ', ' : ''}{investor.country?.title}
                  </Typography>
                  {investor.amount > 0 && (
                    <Typography sx={{ flexGrow: 1 }} variant='subtitle' align='right'>
                      {filters.number(investor.amount)} {values.currency.isoCode}
                    </Typography>
                  )}
                </Box>
              )))}
            </Box>
          </Box>
          <Divider />
          <Box display='flex' justifyContent='space-between'>
            <Typography variant='subtitleBold'>Total</Typography>
            <Typography variant='subtitle'>
              {filters.number(funding.amount)} {values.currency.isoCode}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => edit(funding)}>Edit</MenuItem>
          <MenuItem onClick={() => dispatch(ventureThunks.removeFundingRound({ ventureId, data: funding }))}>
            Delete
          </MenuItem>
        </Menu>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileFundingCard);
