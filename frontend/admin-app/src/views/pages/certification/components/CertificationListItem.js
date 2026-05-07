import React, { memo } from 'react';
import ListItem from "@mui/material/ListItem";
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { ListItemIcon } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

const CertificationListItem = ({ text, checked }) => {
  return (
    <ListItem>
      <ListItemIcon sx={{ minWidth: 34 }}>
        {checked
          ? <CheckCircleRoundedIcon sx={{ width: 16, color: 'primary.main' }} />
          : <RadioButtonUncheckedRoundedIcon sx={{ width: 16 }} />
        }
      </ListItemIcon>
      <ListItemText primary={text} primaryTypographyProps={{ variant: 'subtitle' }} />
    </ListItem>
  );
};

export default memo(CertificationListItem);
