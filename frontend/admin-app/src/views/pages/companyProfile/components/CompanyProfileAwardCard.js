import React, { memo, useState } from 'react';
import { Box, Card, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import filters from "shared-components/filters";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileAwardCard = ({ values, award, edit }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const { ventureId } = useParams();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box flexGrow={1}>
          <Box display='flex'>
            <FieldLabel sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }}>Name</FieldLabel>
            <FieldLabel sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }}>Provided by</FieldLabel>
            <FieldLabel sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }}>Location</FieldLabel>
            <FieldLabel sx={{ flexBasis: '19%', flexGrow: 0, flexShrink: 0 }} align='right'>Amount</FieldLabel>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display='flex'>
            <Box sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }}>
              <Typography variant='subtitleBold'>{award.name}</Typography>
              <Typography variant='subtitle' sx={{ mt: 0.25 }}>{filters.date(award.date)}</Typography>
            </Box>
            <Typography sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }} variant='subtitle'>
              {award.company}
            </Typography>
            <Typography sx={{ flexBasis: '27%', flexGrow: 0, flexShrink: 0 }} variant='subtitle'>
              {award.city ? award.city + ', ' : ''}{award.country?.title}
            </Typography>
            <Typography sx={{ flexBasis: '19%', flexGrow: 0, flexShrink: 0 }} variant='subtitle' align='right'>
              {filters.number(award.amount)} {values.currency.isoCode}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => edit(award)}>Edit</MenuItem>
          <MenuItem onClick={() => dispatch(ventureThunks.removeAward({ ventureId, data: award }))}>
            Delete
          </MenuItem>
        </Menu>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAwardCard);
