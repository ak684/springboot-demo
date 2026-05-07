import React, { memo } from 'react';
import AttachmentIcon from '@mui/icons-material/Attachment';
import StyledItemCard from "./StyledItemCard";
import { Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { downloadFile, formatFileSize } from "shared-components/utils/helpers";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import api from "services/api";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const FileCard = ({ file, onDelete, editMode, allowDownload, ...rest }) => {
  const handleDownload = () => {
    if (file.id) {
      api.get(`/notes/download/${file.id}`, {}, {
        responseType: 'blob',
      })
        .then((res) => {
          downloadFile(res, file.name);
        });
    }
  }

  return (
    <CustomErrorBoundary>
      <StyledItemCard {...rest}>
        <Box
          display='flex'
          alignItems='center'
          minWidth={0}
          sx={{ cursor: 'pointer' }}
          onClick={(allowDownload || file.downloadable) ? handleDownload : null}
        >
          <AttachmentIcon sx={{ mr: 1 }} />
          <Typography noWrap variant='subtitleBold' title={file.name}>{file.name}</Typography>&nbsp;
          <Typography variant='subtitle' sx={{ whiteSpace: 'nowrap' }}>({formatFileSize(file.size)})</Typography>
        </Box>
        {editMode && <IconButton onClick={onDelete}><DeleteIcon /></IconButton>}
        {!editMode && (allowDownload || file.downloadable) &&
          <IconButton onClick={handleDownload}><FileDownloadIcon /></IconButton>
        }
      </StyledItemCard>
    </CustomErrorBoundary>
  );
};

export default memo(FileCard);
