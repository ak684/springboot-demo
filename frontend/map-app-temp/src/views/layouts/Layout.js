import React from 'react';
import { Box } from '@mui/material';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import Header from "../common/Header";


const Layout = ({ disablePadding, children }) => {
  return (
    <Box>
      <Header />
      <Box sx={{ height: HEADER_HEIGHT }} />
      <Box p={disablePadding ? 0 : 4}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
