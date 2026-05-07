import React, { memo, useRef, useState } from 'react';
import { Box, Button, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { appThunks } from "store/ducks/app";
import { useDispatch } from "react-redux";
import FieldLabel from "../FieldLabel";
import Loader from "../Loader";

const NoImagePlaceholder = ({ ...rest }) => (
  <Box
    width={278}
    height={160}
    display='flex'
    flexDirection='column'
    alignItems='center'
    justifyContent='center'
    gap={1}
    backgroundColor='secondary.subtle'
    sx={{ borderRadius: '4px', cursor: 'pointer' }}
    {...rest}
  >
    <AddIcon sx={{ color: 'secondary.main' }} />
    <Typography variant='overline' color='secondary.main'>Add image</Typography>
  </Box>
);

const PitchImageUpload = ({ image, updateImage, clearImage, showLabel = true, label = 'Background image', ...rest }) => {
  const [uploading, setUploading] = useState(false);
  const inputFile = useRef();
  const dispatch = useDispatch();

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      dispatch(appThunks.uploadImageRaw(file))
        .then(res => {
          updateImage(res.payload);
        })
        .finally(() => {
          setUploading(false);
        });
    }
  }

  return (
    <Box display='flex' flexDirection='column' gap={2} {...rest}>
      {showLabel && (
        <FieldLabel>{label}</FieldLabel>
      )}
      <Box display='flex' gap={2} alignItems='center'>
        {!image && <NoImagePlaceholder onClick={() => inputFile.current.click()} />}
        {image && (
          <Box
            width={278}
            height={160}
            component='img'
            src={image}
            alt='Slide background'
            sx={{ objectFit: 'cover' }}
          />
        )}
        {uploading && <Loader />}
      </Box>
      {image && (
        <Box display='flex' gap={1}>
          <Button variant='outlined' startIcon={<EditIcon />} onClick={() => inputFile.current.click()}>Edit</Button>
          <Button variant='outlined' startIcon={<DeleteIcon />} onClick={clearImage}>Delete</Button>
        </Box>
      )}
      <Box sx={{ position: 'absolute', visibility: 'hidden' }}>
        <input type='file' onChange={handleFileInputChange} accept='image/*' ref={inputFile} />
      </Box>
    </Box>
  );
};

export default memo(PitchImageUpload);
