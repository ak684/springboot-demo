import React, { memo } from 'react';
import { Checkbox, Divider, Drawer, FormControlLabel, Typography } from '@mui/material';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const ImpactTableDrawer = ({ open, close, collapsed, setCollapsed }) => {
  const toggleCollapse = (e) => {
    const column = e.target.name;

    if (collapsed.includes(column)) {
      setCollapsed(collapsed.filter(c => c !== column));
    } else {
      setCollapsed([...collapsed, column]);
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={close}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      PaperProps={{ sx: { width: 420 } }}
    >
      <CustomErrorBoundary>
        <Typography variant='h5' sx={{ p: 2 }}>Impact logic overview settings</Typography>
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2 }}>Our actions...</Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='statusQuo' checked={!collapsed.includes('statusQuo')} onChange={toggleCollapse} />}
          label='Status quo'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='innovation'
              checked={!collapsed.includes('innovation')}
              onChange={toggleCollapse}
            />
          }
          label='What we do differently'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2 }}>Lead to change...</Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='stakeholders'
              checked={!collapsed.includes('stakeholders')}
              onChange={toggleCollapse}
            />
          }
          label='We affect'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox name='change' checked={!collapsed.includes('change')} onChange={toggleCollapse} />
          }
          label='We improve'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='outputUnits'
            checked={!collapsed.includes('outputUnits')}
            onChange={toggleCollapse} />}
          label='Products/services/activities'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2 }}>And we provide evidence!</Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='indicators' checked={!collapsed.includes('indicators')} onChange={toggleCollapse} />}
          label='Measured by indicators'
        />
        <Divider />
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(ImpactTableDrawer);
