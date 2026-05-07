import React, { memo } from 'react';
import { Box, Checkbox, Divider, Drawer, FormControlLabel, Typography } from '@mui/material';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const DimensionsDrawer = ({ open, close, collapsed, setCollapsed, impacts, collapsedImpacts, setCollapsedImpacts }) => {
  const toggleCollapse = (e) => {
    const column = e.target.name;

    if (collapsed.includes(column)) {
      setCollapsed(collapsed.filter(c => c !== column));
    } else {
      setCollapsed([...collapsed, column]);
    }
  };

  const toggleCollapseImpact = (e) => {
    const column = +e.target.name;

    if (collapsedImpacts.includes(column)) {
      setCollapsedImpacts(collapsedImpacts.filter(c => c !== column));
    } else {
      setCollapsedImpacts([...collapsedImpacts, column]);
    }
  };

  const impactItems = impacts.map(i => (
    <FormControlLabel
      key={i.id}
      sx={{ px: 4, py: 1 }}
      control={<Checkbox name={String(i.id)}
        checked={!collapsedImpacts.includes(i.id)}
        onChange={toggleCollapseImpact} />}
      label={i.name}
    />
  ));

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={close}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
      PaperProps={{ sx: { width: 420 } }}
    >
      <CustomErrorBoundary>
        <Typography variant='h5' sx={{ p: 2 }}>Scoring overview settings</Typography>
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2 }}>Impact chains</Typography>
        {impactItems}
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/images/icons/scoring/what.svg' alt='What?' />
          What
        </Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='sdgs' checked={!collapsed.includes('sdgs')} onChange={toggleCollapse} />}
          label='Primary SDGs addressed'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='change' checked={!collapsed.includes('change')} onChange={toggleCollapse} />}
          label='Stakeholder change'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='problemImportance'
              checked={!collapsed.includes('problemImportance')}
              onChange={toggleCollapse}
            />
          }
          label='Problem importance for stakeholder'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/images/icons/scoring/who.svg' alt='Who?' />
          Who
        </Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='stakeholders'
              checked={!collapsed.includes('stakeholders')}
              onChange={toggleCollapse}
            />
          }
          label='Who is the stakeholder?'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='geography' checked={!collapsed.includes('geography')} onChange={toggleCollapse} />}
          label='Stakeholders geography'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='stakeholderSituation'
              checked={!collapsed.includes('stakeholderSituation')}
              onChange={toggleCollapse}
            />
          }
          label='Stakeholder situation'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/images/icons/scoring/how_much.svg' alt='How much?' />
          How much
        </Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox name='degreeOfChange' checked={!collapsed.includes('degreeOfChange')} onChange={toggleCollapse} />
          }
          label='Depth'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='sizeOfStakeholders'
              checked={!collapsed.includes('sizeOfStakeholders')}
              onChange={toggleCollapse}
            />
          }
          label='Scalability'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='duration' checked={!collapsed.includes('duration')} onChange={toggleCollapse} />}
          label='Duration'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/images/icons/scoring/contr.svg' alt='Contribution?' />
          Contribution
        </Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='contribution'
              checked={!collapsed.includes('contribution')}
              onChange={toggleCollapse}
            />
          }
          label='Contribution'
        />
        <Divider />
        <Typography variant='bodyBold' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component='img' src='/images/icons/scoring/risk.svg' alt='Risk?' />
          Risk
        </Typography>
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={
            <Checkbox
              name='previousEvidence'
              checked={!collapsed.includes('previousEvidence')}
              onChange={toggleCollapse}
            />
          }
          label='Previous evidence'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='proximity' checked={!collapsed.includes('proximity')} onChange={toggleCollapse} />}
          label='Proximity'
        />
        <FormControlLabel
          sx={{ px: 4, py: 1 }}
          control={<Checkbox name='indicators' checked={!collapsed.includes('indicators')} onChange={toggleCollapse} />}
          label='Indicators'
        />
        <Divider />
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(DimensionsDrawer);
