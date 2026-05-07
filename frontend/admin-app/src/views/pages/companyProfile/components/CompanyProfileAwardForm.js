import React, { memo } from 'react';
import { Box, Button, Card, Grid, MenuItem } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { Formik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import moment from "moment";
import TextInput from "shared-components/views/form/TextInput";
import CompanyProfileCurrencyTooltip from "./CompanyProfileCurrencyTooltip";
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import FieldLabel from "shared-components/views/components/FieldLabel";
import FormikDatepicker from "shared-components/views/form/FormikDatepicker";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  name: Yup.string().required(messages.errors.validation.required),
  date: Yup.date().nullable(true).required(messages.errors.validation.required),
  amount: Yup.number(messages.errors.validation.number).required(messages.errors.validation.required),
  company: Yup.string().required(messages.errors.validation.required),
  address: Yup.string(),
  city: Yup.string(),
  region: Yup.string(),
  zipCode: Yup.string(),
  country: Yup.object().nullable(true),
  lat: Yup.number().nullable(true),
  lng: Yup.number().nullable(true),
});

const CompanyProfileAwardForm = ({ values, award, closeForm }) => {
  const dispatch = useDispatch();
  const { ventureId } = useParams();

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
            ...award,
            name: award?.name || '',
            date: award?.date ? moment(award.date) : null,
            amount: award?.amount || '',
            company: award?.company || '',
            address: award?.address || '',
            city: award?.city || '',
            region: award?.region || '',
            zipCode: award?.zipCode || '',
            country: award?.country || null,
            lat: award?.lat || null,
            lng: award?.lng || null,
          }}
          onSubmit={(values) => {
            if (values.id) {
              dispatch(ventureThunks.editAward({ ventureId, data: values })).then(closeForm);
            } else {
              dispatch(ventureThunks.addAward({ ventureId, data: values })).then(closeForm);
            }
          }}
          validationSchema={schema}
        >
          {formik => (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FieldLabel>Name</FieldLabel>
                <FormikTextInput name='name' fullWidth />
              </Grid>
              <Grid item xs={4}>
                <FieldLabel>Provided by</FieldLabel>
                <FormikTextInput name='company' fullWidth />
              </Grid>
              <Grid item xs={4}>
                <FieldLabel>Location</FieldLabel>
                <GoogleMapsAutocomplete values={formik.values} setFieldValue={formik.setFieldValue} />
              </Grid>
              <Grid item xs={4}>
                <FieldLabel>Amount</FieldLabel>
                <FormikTextInput name='amount' type='number' fullWidth />
              </Grid>
              <Grid item xs={4}>
                <FieldLabel>Currency</FieldLabel>
                <Box display='flex' gap={1} alignItems='center'>
                  <TextInput select fullWidth value={values.currency.isoCode} disabled>
                    <MenuItem value={values.currency.isoCode}>{values.currency.isoCode}</MenuItem>
                  </TextInput>
                  <CompanyProfileCurrencyTooltip />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <FieldLabel>Date</FieldLabel>
                <FormikDatepicker name='date' format='MMM D, YYYY' inputProps={{ fullWidth: true }} />
              </Grid>
              <Grid item xs={4}>
                <Button variant='outlined' onClick={formik.submitForm}>Save</Button>
              </Grid>
            </Grid>
          )}
        </Formik>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAwardForm);
