import React, { memo, useState } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import filters from "shared-components/filters";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileAccelerationCard = ({ values, acceleration, edit }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const { ventureId } = useParams();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box flexGrow={1} display='flex'>
          <Box flexBasis='40%' flexGrow={0}>
            <FieldLabel>Name</FieldLabel>
            <Typography variant='subtitle' sx={{ mt: 1 }}>{acceleration.name}</Typography>
          </Box>
          <Box flexBasis='20%' flexGrow={0}>
            <FieldLabel>Start</FieldLabel>
            <Typography variant='subtitle' sx={{ mt: 1 }}>{filters.date(acceleration.start)}</Typography>
          </Box>
          <Box flexBasis='20%' flexGrow={0}>
            <FieldLabel>Finish</FieldLabel>
            <Typography variant='subtitle' sx={{ mt: 1 }}>{filters.date(acceleration.finish)}</Typography>
          </Box>
          <Box flexBasis='20%' flexGrow={0}>
            <FieldLabel align='right'>Location</FieldLabel>
            <Typography variant='subtitle' sx={{ mt: 1 }} align='right'>
              {acceleration.city ? acceleration.city + ', ' : ''}{acceleration.country?.title}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => edit(acceleration)}>Edit</MenuItem>
          <MenuItem onClick={() => dispatch(ventureThunks.removeAcceleration({ ventureId, data: acceleration }))}>
            Delete
          </MenuItem>
        </Menu>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAccelerationCard);
