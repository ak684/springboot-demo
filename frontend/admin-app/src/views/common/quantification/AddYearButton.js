import React, { memo } from 'react';
import { Box, Typography } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const AddYearButton = ({ onClick, ...rest }) => {
  return (
    <Box mb={1} {...rest}>
      <Box
        display='inline-flex'
        gap={0.5}
        alignItems='center'
        sx={{ cursor: 'pointer' }}
        onClick={onClick}
      >
        <AddCircleIcon sx={{ color: 'primary.main', width: 16 }} />
        <Typography variant='subtitle' color='primary.main' sx={{ textDecoration: 'underline' }}>
          Add year
        </Typography>
      </Box>
    </Box>
  );
};

export default memo(AddYearButton);
