import React, { memo, useRef, useState } from 'react';
import Box from "@mui/material/Box";
import { useDispatch } from "react-redux";
import { appThunks } from "store/ducks/app";
import { Button, Grid, Slider } from "@mui/material";
import AvatarEditor from "react-avatar-editor";
import Modal from "shared-components/views/components/modal/Modal";
import ModalActions from "shared-components/views/components/modal/ModalActions";

const UploadImageModal = ({ title, upload, open, onClose }) => {
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

  const handleSave = () => {
    const base64 = editor?.getImageScaledToCanvas().toDataURL();

    if (!base64) {
      return;
    }

    setUploading(true);
    dispatch(appThunks.uploadImage(base64))
      .then(res => upload(res.payload))
      .finally(() => {
        setUploading(false);
      });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={<ModalActions onClose={onClose} closeTitle='Close' submitForm={handleSave} saveDisabled={uploading} />}
      maxWidth='md'
      fullWidth
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
              width={836}
              height={470}
              border={0}
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

export default memo(UploadImageModal);
