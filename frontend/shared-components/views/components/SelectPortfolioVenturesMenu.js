import React, { memo, useState } from 'react';
import { Avatar, Box, Checkbox, Divider, InputAdornment, Menu, Typography } from "@mui/material";
import TextInput from "../form/TextInput";
import SearchIcon from "@mui/icons-material/Search";

const SelectPortfolioVenturesMenu = (
  { ventures, anchorEl, close, toggle, toggleAll, ventureGetter, ventureHidden }
) => {
  const [search, setSearch] = useState('');
  const filteredVentures = ventures.filter(a => !search || ventureGetter(a).name.toLowerCase().includes(search.toLowerCase()));
  const shownVentures = ventures.filter(v => !ventureHidden(v)).length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={close}
      slotProps={{ paper: { style: { width: anchorEl?.clientWidth } } }}
    >
      <Box py={1} px={2}>
        <TextInput
          placeholder='Search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Divider />
      <Box p={1} display='flex' alignItems='center' gap={1}>
        <Checkbox
          checked={shownVentures === ventures.length}
          indeterminate={shownVentures > 0 && shownVentures < ventures.length}
          onChange={toggleAll}
        />
        <Typography variant='subtitleBold'>All ventures</Typography>
      </Box>
      {filteredVentures.map(venture => (
        <Box key={venture.id}>
          <Divider />
          <Box p={1} display='flex' alignItems='center' gap={1}>
            <Checkbox checked={!ventureHidden(venture)} onChange={() => toggle(venture)} />
            <Avatar sx={{ width: 32, height: 32 }} src={ventureGetter(venture).logo}>
              {ventureGetter(venture).name.slice(0, 1)}
            </Avatar>
            <Typography variant='subtitleBold' noWrap>{ventureGetter(venture).name}</Typography>
          </Box>
        </Box>
      ))}
    </Menu>
  );
};

export default memo(SelectPortfolioVenturesMenu);
