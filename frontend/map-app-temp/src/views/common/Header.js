import * as React from 'react';
import { memo } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Link as RouterLink } from 'react-router-dom';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import Logo from 'shared-components/views/components/Logo';
import Breadcrumbs from 'shared-components/views/components/Breadcrumbs';

const Header = (props) => {
  return (
    <Box display='flex'>
      <AppBar component='nav' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar disableGutters sx={{ height: HEADER_HEIGHT, px: { xs: 2, sm: 4 }, gap: 2 }}>
          <Logo component={RouterLink} to='/' sx={{ textDecoration: 'none' }} />
          <Breadcrumbs display={{ xs: 'none', sm: 'flex' }} />
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default memo(Header);
