import React, { memo } from 'react';
import { InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TextInput from "shared-components/views/form/TextInput";

const SearchInput = ({ ...rest }) => {
  return (
    <TextInput
      size='small'
      variant='outlined'
      placeholder='Search'
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ '.MuiInputBase-root': { backgroundColor: 'white' } }}
      {...rest}
    />
  );
};

export default memo(SearchInput);
