import React, { memo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, Grid, Slider } from '@mui/material';
import AvatarEditor from 'react-avatar-editor';
import { appThunks } from 'store/ducks/app';
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";

const ImageUploadModal = ({ onClose, handleSave, title, disableShape }) => {
  const [image, setImage] = useState(null);
  const [editor, setEditor] = useState(null);
  const [scale, setScale] = useState(1);
  const [uploading, setUploading] = useState(false);
  const inputFile = useRef();
  const dispatch = useDispatch();

  const handleFileInputChange = e => {
    const file = e.target.files[0];
    setImage(file);
  };

  const saveImage = () => {
    setUploading(true);
    const base64 = editor.getImageScaledToCanvas().toDataURL();
    dispatch(appThunks.uploadImage(base64))
      .then(res => {
        setUploading(false);
        handleSave(res.payload);
        onClose();
      });
  };

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth='xs'
      title={title}
      actions={<ModalActions onClose={onClose} submitForm={saveImage} saveDisabled={!image || uploading} />}
    >
      <Box sx={{ position: 'absolute', visibility: 'hidden' }}>
        <input type='file' onChange={handleFileInputChange} accept='image/*' ref={inputFile} />
      </Box>
      <Grid container spacing={2} justify='center'>
        <Grid item xs={12}>
          <Button fullWidth onClick={() => inputFile.current.click()}>Upload image</Button>
        </Grid>
        {image && (
          <Grid item xs={12}>
            <AvatarEditor
              ref={setEditor}
              image={image}
              width={380}
              height={380}
              border={0}
              borderRadius={disableShape ? 0 : 200}
              color={[255, 255, 255, 0.6]}
              scale={scale}
              rotate={0}
            />
          </Grid>
        )}
        {image && (
          <Grid item xs={12}>
            <Slider
              value={scale}
              min={1}
              max={10}
              step={0.1}
              onChange={(e, value) => setScale(value)}
            />
          </Grid>
        )}
      </Grid>
    </Modal>
  );
};

export default memo(ImageUploadModal);
