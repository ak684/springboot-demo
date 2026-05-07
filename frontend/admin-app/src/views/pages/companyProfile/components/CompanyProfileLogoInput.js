import React, { memo, useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import api from 'services/api';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import useModal from "shared-components/hooks/useModal";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

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

const CompanyProfileLogoInput = ({ values, nextStep, setFieldValue, title = '' }) => {
  const [loading, setLoading] = useState(!values.socialLinksParsed && values.website);
  const [logoModalOpen, uploadLogo, closeLogoModal] = useModal(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (logo) => {
    setFieldValue('logoParsed', true);
    setFieldValue('logo', logo);
  }

  useEffect(() => {
    if (!values.logoParsed && values.twitter) {
      api.post('/scrape/logo', values.twitter, { 'Content-Type': 'text/plain' })
        .then(res => {
          setFieldValue('logoParsed', true);
          setFieldValue('logo', res.payload);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Upload your company's logo here</StepperTitle>
          <StepperDescription>
            We try to fetch the logo automatically if you have indicated your twitter address in the previous step
          </StepperDescription>
          {loading && <Loader />}
          {!loading && (
            <Box>
              <Box display='flex' gap={2} alignItems='center'>
                {!values.logo && <NoImagePlaceholder onClick={uploadLogo} />}
                {values.logo && (
                  <Box
                    width={278}
                    height={278}
                    component='img'
                    src={values.logo}
                    alt='Logo'
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                {uploading && <Loader />}
              </Box>
              {values.logo && (
                <Box display='flex' gap={1} mt={2}>
                  <Button variant='outlined' startIcon={<EditIcon />} onClick={uploadLogo}>Edit</Button>
                </Box>
              )}
              <StepperNextButton nextStep={nextStep} />
            </Box>
          )}
          {logoModalOpen && (
            <ImageUploadModal
              onClose={closeLogoModal}
              handleSave={handleUpload}
              title='Upload company logo'
              disableShape
            />
          )}
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileLogoInput);
