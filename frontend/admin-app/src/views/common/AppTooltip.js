import React, { memo } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@mui/material';

const AppTooltip = ({ children, iconStyles = {}, ...rest }) => {
  return (
    <Tooltip title={children} placement='top' {...rest}>
      <InfoOutlinedIcon sx={{ color: 'secondary.main', ...iconStyles }} />
    </Tooltip>
  );
};

export default memo(AppTooltip);
