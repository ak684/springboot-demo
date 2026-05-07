import React, { memo } from 'react';
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";

const DeleteYearIcon = ({ onClick, ...rest }) => {
  return (
    <IconButton
      sx={{ position: 'absolute', top: 3, right: 0, display: 'none' }}
      size='small'
      onClick={onClick} {...rest}
      className='delete-year-icon'
    >
      <DeleteIcon sx={{ width: 14, height: 14 }} />
    </IconButton>
  );
};

export default memo(DeleteYearIcon);
