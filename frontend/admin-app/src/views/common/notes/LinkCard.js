import React, { memo } from 'react';
import StyledItemCard from "./StyledItemCard";
import { Box, IconButton, styled, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import Link from "@mui/material/Link";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledLink = styled(Box)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.text.primary,
}));

const LinkCard = ({ link, onDelete, editMode, ...rest }) => {
  const openLink = () => {
    window.open(link.link, "_blank");
  }

  return (
    <CustomErrorBoundary>
      <StyledItemCard {...rest}>
        <StyledLink component={Link} display='flex' alignItems='center' minWidth={0} href={link.link} target='_blank'>
          <LinkIcon sx={{ mr: 1 }} />
          <Typography noWrap variant='subtitleBold' title={link.text}>{link.text}</Typography>
        </StyledLink>
        {editMode && <IconButton onClick={onDelete}><DeleteIcon /></IconButton>}
        {!editMode && <IconButton onClick={openLink}><OpenInNewIcon /></IconButton>}
      </StyledItemCard>
    </CustomErrorBoundary>
  );
};

export default memo(LinkCard);
