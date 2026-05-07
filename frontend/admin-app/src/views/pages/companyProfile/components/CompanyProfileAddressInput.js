import React, { memo, useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import { GoogleMap } from "@react-google-maps/api";
import { useSelector } from "react-redux";
import api from "services/api";
import { dictionarySelectors } from "store/ducks/dictionary";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import Card from "@mui/material/Card";
import EditIcon from "@mui/icons-material/Edit";
import UploadImageModal from "../../../common/UploadImageModal";
import useModal from "shared-components/hooks/useModal";
import GoogleMapMarker from "shared-components/views/components/GoogleMapMarker";
import Loader from "shared-components/views/components/Loader";
import { getVentureAddress } from "shared-components/utils/venture";
import { mapOptions } from "shared-components/utils/maps";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileAddressInput = ({ values, setFieldValue, nextStep }) => {
  const [loading, setLoading] = useState(!values.addressParsed && values.website);
  const [imageModalOpen, uploadImage, closeImageModal] = useModal();
  const geography = useSelector(dictionarySelectors.getGeography());

  useEffect(() => {
    if (!values.addressParsed && values.website) {
      api.post('/scrape/address', values.website, { 'Content-Type': 'text/plain' })
        .then(res => {
          if (res.address) {
            setFieldValue('address', res.address);
          }

          if (res.city) {
            setFieldValue('city', res.city);
          }

          if (res.region) {
            setFieldValue('region', res.region);
          }

          if (res.zipCode) {
            setFieldValue('zipCode', res.zipCode);
          }

          if (res.lat) {
            setFieldValue('lat', res.lat);
          }

          if (res.lng) {
            setFieldValue('lng', res.lng);
          }

          if (res.country) {
            const countryObj = geography.find(c => c.code === res.country);
            if (countryObj) {
              setFieldValue('country', countryObj);
            }
          }
        })
        .finally(() => {
          setTimeout(() => {
            setFieldValue('addressParsed', true);
            setLoading(false);
          }, 50);

        });
    }
  }, []);

  const mapStyles = {
    height: "300px",
    width: "100%"
  };

  const showMap = values.lat && values.lng;
  const venturePosition = { lat: values.lat, lng: values.lng };
  const googleStreetView = `https://maps.googleapis.com/maps/api/streetview?size=520x260&location=${values.lat},${values.lng}&key=${process.env.REACT_APP_GOOGLE_MAP_API_KEY}`;

  const updateStreetView = (image) => {
    setFieldValue('streetImage', image);
    closeImageModal();
  }

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          {loading && <Loader />}
          {!loading && (
            <Box>
              <StepperTitle>Company headquarters address</StepperTitle>
              <StepperDescription>Please provide the address of your company's headquarters below</StepperDescription>
              <GoogleMapsAutocomplete values={values} setFieldValue={setFieldValue} label="Address" />
              {showMap && (
                <Box mt={2} position='relative'>
                  <GoogleMap mapContainerStyle={mapStyles} zoom={15} center={venturePosition} options={mapOptions}>
                    <GoogleMapMarker position={venturePosition} />
                  </GoogleMap>
                  <Card
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: 16,
                      maxWidth: 300,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      zIndex: 1,
                      border: 1,
                      borderColor: 'border'
                    }}
                  >
                    <Typography variant='bodyBold'>Our headquarters</Typography>
                    <Box position='relative'>
                      <Box
                        component='img'
                        src={values.streetImage || googleStreetView}
                        width='100%'
                        height={130}
                        sx={{ objectFit: 'cover' }}
                        alt='Headquarters location'
                      />
                      <IconButton sx={{ position: 'absolute', right: 4, top: 4 }} onClick={uploadImage}>
                        <EditIcon sx={{ color: 'white' }} />
                      </IconButton>
                    </Box>
                    <Box display='flex' gap={1}>
                      <LocationOnOutlinedIcon />
                      <Typography variant='subtitle'>{getVentureAddress(values)}</Typography>
                    </Box>
                    <UploadImageModal
                      title='Upload headquarter street view'
                      upload={updateStreetView}
                      open={imageModalOpen}
                      onClose={closeImageModal}
                    />
                  </Card>
                </Box>
              )}
              <StepperNextButton nextStep={nextStep} />
            </Box>
          )}
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAddressInput);
