import React, { memo } from 'react';
import { Avatar, Box, Button, Card, IconButton, Typography } from "@mui/material";
import { Formik } from "formik";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import useModal from "shared-components/hooks/useModal";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import { useParams } from "react-router-dom";
import CloseIcon from '@mui/icons-material/Close';
import { portfolioThunks } from "store/ducks/portfolio";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  avatar: Yup.string(),
  name: Yup.string().required(() => messages.errors.validation.required),
  lastName: Yup.string(),
  email: Yup.string().email(() => messages.errors.validation.email),
  position: Yup.string().required(() => messages.errors.validation.required),
  linkedin: Yup.string(),
});

const CompanyProfileTeamMemberForm = ({ member, closeForm, isPortfolio }) => {
  const [avatarModalOpen, editAvatar, closeAvatarModal] = useModal(false);
  const dispatch = useDispatch();
  const { ventureId, portfolioId } = useParams();

  return (
    <CustomErrorBoundary>
      <Card sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Formik
          initialValues={{
            ...member,
            avatar: member?.avatar || '',
            name: member?.name || '',
            lastName: member?.lastName || '',
            email: member?.email || '',
            position: member?.position || '',
            linkedin: member?.linkedin || '',
          }}
          onSubmit={(values) => {
            if (isPortfolio) {
              if (values.id) {
                dispatch(portfolioThunks.editTeamMember({ portfolioId, data: values })).then(closeForm);
              } else {
                dispatch(portfolioThunks.addTeamMember({ portfolioId, data: values })).then(closeForm);
              }
            } else {
              if (values.id) {
                dispatch(ventureThunks.editTeamMember({ ventureId, data: values })).then(closeForm);
              } else {
                dispatch(ventureThunks.addTeamMember({ ventureId, data: values })).then(closeForm);
              }
            }
          }}
          validationSchema={schema}
        >
          {(formik) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                <Box>
                  <Typography sx={{
                    fontSize: 10,
                    color: 'secondary.dark',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Add avatar image
                  </Typography>
                  <Box mt={1} display='flex' alignItems='center' gap={2}>
                    {formik.values.avatar && <Avatar sx={{ width: 40, height: 40 }} src={formik.values.avatar} />}
                    <Button variant='outlined' size='small' onClick={editAvatar}>Browse image</Button>
                  </Box>
                </Box>
                <IconButton onClick={closeForm}><CloseIcon /></IconButton>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: 'secondary.dark', fontWeight: 600, textTransform: 'uppercase' }}>
                  Name
                </Typography>
                <FormikTextInput name='name' fullWidth />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: 'secondary.dark', fontWeight: 600, textTransform: 'uppercase' }}>
                  Last name
                </Typography>
                <FormikTextInput name='lastName' fullWidth />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: 'secondary.dark', fontWeight: 600, textTransform: 'uppercase' }}>
                  Position
                </Typography>
                <FormikTextInput name='position' fullWidth />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: 'secondary.dark', fontWeight: 600, textTransform: 'uppercase' }}>
                  Linkedin profile
                </Typography>
                <FormikTextInput name='linkedin' fullWidth />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: 'secondary.dark', fontWeight: 600, textTransform: 'uppercase' }}>
                  Email
                </Typography>
                <FormikTextInput name='email' fullWidth />
              </Box>
              {avatarModalOpen && (
                <ImageUploadModal
                  onClose={closeAvatarModal}
                  handleSave={(avatar) => formik.setFieldValue('avatar', avatar)}
                  title='Upload user avatar'
                />
              )}
              <Button sx={{ alignSelf: 'flex-start' }} variant='outlined' onClick={formik.submitForm}>
                Save
              </Button>
            </Box>
          )}
        </Formik>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileTeamMemberForm);
