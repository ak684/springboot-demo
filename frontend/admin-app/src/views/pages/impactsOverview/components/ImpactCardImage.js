import React, { memo } from 'react';
import { Box, IconButton, styled, Typography } from "@mui/material";
import useModal from "shared-components/hooks/useModal";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import UploadImageModal from "../../../common/UploadImageModal";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import { useDispatch, useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams } from "react-router-dom";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const NoImageBox = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.secondary.subtle,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  cursor: 'pointer',
}))

const ImageBox = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}))

const NoImage = ({ ...rest }) => (
  <NoImageBox {...rest} >
    <AddIcon sx={{ color: 'secondary.main' }} />
    <Typography variant='overline' color='secondary.main'>Add image</Typography>
  </NoImageBox>
);

const ImpactCardImage = ({ impact, ...rest }) => {
  const [imageModalOpen, uploadImage, closeImageModal] = useModal();
  const dispatch = useDispatch();
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  const upload = (image) => dispatch(ventureThunks.updateImpactField({
    impactId: impact.id,
    field: 'image',
    value: image
  }))
    .then(() => {
      closeImageModal();
    });

  const deleteImage = () => dispatch(ventureThunks.updateImpactField({
    impactId: impact.id,
    field: 'image',
    value: null
  }));

  return (
    <CustomErrorBoundary>
      <Box {...rest} display='flex' alignItems='center' sx={{ borderRadius: '8px', overflow: 'hidden' }} height={180}>
        {impact.image && (
          <Box position='relative' height={180} width='100%'>
            <ImageBox component='img' src={impact.image} alt={impact.name} />
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={uploadImage}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              <EditIcon sx={{ color: 'white' }} />
            </IconButton>
            <IconButton
              sx={{ position: 'absolute', bottom: 8, right: 8 }}
              onClick={deleteImage}
              disabled={access !== VENTURE_ACCESS.EDIT}
            >
              <DeleteIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        )}
        {!impact.image && <NoImage onClick={() => access === VENTURE_ACCESS.EDIT && uploadImage()} />}
        <UploadImageModal title='Upload impact image' upload={upload} open={imageModalOpen} onClose={closeImageModal} />
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(ImpactCardImage);
