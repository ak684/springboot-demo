import React, { memo, useEffect, useRef, useState } from 'react';
import { Autocomplete, Avatar, Box, Button, Card, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { Formik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import moment from "moment";
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import TextField from "@mui/material/TextField";
import FieldLabel from "shared-components/views/components/FieldLabel";
import FormikDatepicker from "shared-components/views/form/FormikDatepicker";
import useDebounce from "shared-components/hooks/useDebounce";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  name: Yup.string().required(messages.errors.validation.required),
  website: Yup.string(),
  start: Yup.date().nullable(true).required(messages.errors.validation.required),
  finish: Yup.date().nullable(true)
    .required(messages.errors.validation.required)
    .min(Yup.ref('start'), messages.errors.validation.dateOrder),
  address: Yup.string(),
  city: Yup.string(),
  region: Yup.string(),
  zipCode: Yup.string(),
  country: Yup.object().nullable(true),
  lat: Yup.number().nullable(true),
  lng: Yup.number().nullable(true),
});

const CompanyProfileAccelerationForm = ({ acceleration, closeForm }) => {
  const [foundAccelerations, setFoundAccelerations] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const dispatch = useDispatch();
  const finishRef = useRef();

  const { ventureId } = useParams();

  const debouncedInputValue = useDebounce(inputValue, 800);

  useEffect(() => {
    if (inputValue.length >= 1) {
      dispatch(ventureThunks.searchAccelerations(inputValue))
        .then(res => setFoundAccelerations(res.payload));
    }
  }, [debouncedInputValue]);

  const handleInputChange = (newValue, setFieldValue) => {
    setInputValue(newValue);
    setFieldValue('name', newValue);
  }

  const handleChange = (newValue, setFieldValue) => {
    setInputValue(newValue.name);
    setFieldValue('name', newValue.name);
    setFieldValue('website', newValue.website);
    setFieldValue('address', newValue.address);
    setFieldValue('city', newValue.city);
    setFieldValue('region', newValue.region);
    setFieldValue('zipCode', newValue.zipCode);
    setFieldValue('country', newValue.country);
    setFieldValue('lat', newValue.lat);
    setFieldValue('lng', newValue.lng);
  }

  const goToFinish = () => {
    finishRef.current?.focus();
  }

  return (
    <CustomErrorBoundary>
      <Card
        sx={{
          mt: 2,
          p: 2,
          border: 1,
          borderColor: 'border',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Formik
          initialValues={{
            ...acceleration,
            name: acceleration?.name || '',
            website: acceleration?.website || '',
            start: acceleration?.start ? moment(acceleration.start) : null,
            finish: acceleration?.finish ? moment(acceleration?.finish) : null,
            address: acceleration?.address || '',
            city: acceleration?.city || '',
            region: acceleration?.region || '',
            zipCode: acceleration?.zipCode || '',
            country: acceleration?.country || null,
            lat: acceleration?.lat || null,
            lng: acceleration?.lng || null,
          }}
          onSubmit={(values) => {
            if (values.id) {
              dispatch(ventureThunks.editAcceleration({ ventureId, data: values })).then(closeForm);
            } else {
              dispatch(ventureThunks.addAcceleration({ ventureId, data: values })).then(closeForm);
            }
          }}
          validationSchema={schema}
        >
          {formik => (
            <Box display='flex' flexDirection='column' gap={2}>
              <Box>
                <FieldLabel>Name</FieldLabel>
                <Autocomplete
                  inputValue={inputValue}
                  onInputChange={(e, newVal) => handleInputChange(newVal, formik.setFieldValue)}
                  onChange={(e, newValue) => handleChange(newValue, formik.setFieldValue)}
                  sx={{ '.MuiInputBase-root': { height: 40 } }}
                  options={foundAccelerations}
                  getOptionLabel={(option) => option?.name || ''}
                  renderOption={(props, option) => (
                    <li {...props} style={{ fontSize: 20 }} key={option.name}>
                      <Box display='flex' alignItems='center' justifyContent='space-between' gap={2} width='100%'>
                        <Box display='flex' alignItems='center' gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }} src={option.logo}>{option.name.slice(0, 1)}</Avatar>
                          <Typography variant='subtitleBold'>{option.name}</Typography>
                        </Box>
                        <Typography variant='subtitle' noWrap color='secondary.main'>
                          {option.website}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField{...params} variant='standard' placeholder='Name' />
                  )}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  freeSolo
                  fullWidth
                />
              </Box>
              <Box>
                <FieldLabel>Website</FieldLabel>
                <FormikTextInput name='website' placeholder='Website' fullWidth />
              </Box>
              <Box>
                <FieldLabel>Location</FieldLabel>
                <GoogleMapsAutocomplete values={formik.values} setFieldValue={formik.setFieldValue} />
              </Box>
              <Box display='flex' gap={3}>
                <Box flexGrow={1}>
                  <FieldLabel>Start</FieldLabel>
                  <FormikDatepicker
                    name='start'
                    format='MMM D, YYYY'
                    inputProps={{ fullWidth: true }}
                    closeOnSelect
                    onChange={goToFinish}
                  />
                </Box>
                <Box flexGrow={1}>
                  <FieldLabel>Finish</FieldLabel>
                  <FormikDatepicker
                    name='finish'
                    format='MMM D, YYYY'
                    inputProps={{ fullWidth: true }}
                    closeOnSelect
                    ref={finishRef}
                  />
                </Box>
              </Box>
              <Button variant='outlined' onClick={formik.submitForm} sx={{ alignSelf: 'flex-start' }}>
                Save
              </Button>
            </Box>
          )}
        </Formik>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAccelerationForm);
