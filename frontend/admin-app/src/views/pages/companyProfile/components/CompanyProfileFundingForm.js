import React, { memo } from 'react';
import { Autocomplete, Avatar, Box, Button, Card, Grid, IconButton, Link, MenuItem, Typography } from '@mui/material';
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { dictionarySelectors } from "store/ducks/dictionary";
import { Formik } from "formik";
import * as Yup from "yup";
import messages from "shared-components/utils/messages";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import useModal from "shared-components/hooks/useModal";
import { clone, distinctBy } from 'shared-components/utils/lo';
import { ventureThunks } from "store/ducks/venture";
import TextField from "@mui/material/TextField";
import moment from "moment/moment";
import { arraySum } from "shared-components/utils/helpers";
import TextInput from "shared-components/views/form/TextInput";
import CompanyProfileCurrencyTooltip from "./CompanyProfileCurrencyTooltip";
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import ImageUploadModal from "../../profile/components/ImageUploadModal";
import FieldLabel from "shared-components/views/components/FieldLabel";
import FormikDatepicker from "shared-components/views/form/FormikDatepicker";
import FormikAutocomplete from "shared-components/views/form/FormikAutocomplete";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const schema = Yup.object().shape({
  type: Yup.object().nullable(true).required(messages.errors.validation.required),
  date: Yup.object().nullable(true).required(messages.errors.validation.required),
  amount: Yup
    .number(messages.errors.validation.number)
    .required(messages.errors.validation.required)
    .test(
      'total-amount-check',
      'Total amount raised cannot be smaller than contribution of all investors',
      function (value) {
        const investors = this.parent.investors || [];
        const totalInvestorAmount = arraySum(investors.map(i => i.amount || 0));
        return value >= totalInvestorAmount;
      }
    ),
  investors: Yup.array().of(Yup.object().shape({
    name: Yup.string().required(messages.errors.validation.required),
    avatar: Yup.string(),
    company: Yup.string(),
    amount: Yup.number(messages.errors.validation.number),
    address: Yup.string(),
    city: Yup.string(),
    region: Yup.string(),
    zipCode: Yup.string(),
    country: Yup.object().nullable(true),
    lat: Yup.number().nullable(true),
    lng: Yup.number().nullable(true),
  })).required(() => messages.errors.validation.required),
});

const emptyInvestor = {
  name: '',
  avatar: '',
  company: '',
  amount: '',
}

const CompanyProfileFundingForm = ({ values, funding, closeForm }) => {
  const [avatarModalOpen, editAvatar, closeAvatarModal, avatarInvestor] = useModal(false);
  const dispatch = useDispatch();
  const fundingRoundTypes = useSelector(dictionarySelectors.getFundingRoundTypes());

  const { ventureId } = useParams();

  const investorOptions = values.funding
    .flatMap(f => f.investors)
    .map(i => ({
      name: i.name,
      avatar: i.avatar,
      company: i.company,
      address: i.address,
      city: i.city,
      region: i.region,
      country: i.country,
      zipCode: i.zipCode
    }))
    .filter(distinctBy('name'));

  const handleInvestorChange = (e, newValue, index, setFieldValue) => {
    if (typeof newValue === "object") {
      setFieldValue(`investors[${index}].name`, newValue.name);
      setFieldValue(`investors[${index}].company`, newValue.company);
      setFieldValue(`investors[${index}].avatar`, newValue.avatar);
      setFieldValue(`investors[${index}].address`, newValue.address || '');
      setFieldValue(`investors[${index}].city`, newValue.city || '');
      setFieldValue(`investors[${index}].region`, newValue.region || '');
      setFieldValue(`investors[${index}].country`, newValue.country || null);
      setFieldValue(`investors[${index}].zipCode`, newValue.zipCode || '');
    } else {
      setFieldValue(`investors[${index}].name`, newValue);
      setFieldValue(`investors[${index}].company`, '');
      setFieldValue(`investors[${index}].avatar`, '');
    }
  }

  const handleInvestorBlur = (e, index, setFieldValue) => {
    setFieldValue(`investors[${index}].name`, e.target.value);
    setFieldValue(`investors[${index}].company`, '');
    setFieldValue(`investors[${index}].avatar`, '');
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
            ...funding,
            type: funding?.type || null,
            date: funding?.date ? moment(funding.date) : null,
            amount: funding?.amount || '',
            investors: funding?.investors?.length > 0 ? funding.investors.map(investor => ({
              ...investor,
              name: investor?.name || '',
              avatar: investor?.avatar || '',
              company: investor?.company || '',
              amount: investor?.amount || '',
              address: investor?.address || '',
              city: investor?.city || '',
              region: investor?.region || '',
              zipCode: investor?.zipCode || '',
              country: investor?.country || null,
              lat: investor?.lat || null,
              lng: investor?.lng || null,
            })) : [],
          }}
          onSubmit={(values) => {
            if (values.id) {
              dispatch(ventureThunks.editFundingRound({ ventureId, data: values })).then(closeForm);
            } else {
              dispatch(ventureThunks.addFundingRound({ ventureId, data: values })).then(closeForm);
            }
          }}
          validationSchema={schema}
        >
          {formik => (
            <Box display='flex' flexDirection='column' gap={2}>
              {JSON.stringify(formik.errors)}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FieldLabel>Funding source</FieldLabel>
                  <FormikAutocomplete
                    sx={{ '.MuiInputBase-root': { height: 40 } }}
                    name='type'
                    options={fundingRoundTypes}
                    getOptionLabel={(option) => option?.label || null}
                    renderOption={(props, option) => (
                      <li {...props} key={option.name}>
                        <Typography>{option.label}</Typography>
                      </li>
                    )}
                    renderInput={(params) => <TextField {...params} variant='standard' placeholder='Type' />}
                    isOptionEqualToValue={(option, value) => option.name === value.name}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FieldLabel>Date raised</FieldLabel>
                  <FormikDatepicker name='date' format='MMM YYYY' inputProps={{ fullWidth: true }} />
                </Grid>
                <Grid item xs={6}>
                  <FieldLabel>Total raised</FieldLabel>
                  <FormikTextInput name='amount' type='number' fullWidth />
                </Grid>
                <Grid item xs={6}>
                  <FieldLabel>Currency</FieldLabel>
                  <Box display='flex' gap={1} alignItems='center'>
                    <TextInput select fullWidth value={values.currency.isoCode} disabled>
                      <MenuItem value={values.currency.isoCode}>{values.currency.isoCode}</MenuItem>
                    </TextInput>
                    <CompanyProfileCurrencyTooltip />
                  </Box>
                </Grid>
              </Grid>
              <Box
                display='flex'
                alignItems='center'
                gap={0.5}
                alignSelf='flex-start'
                sx={{ cursor: 'pointer' }}
                onClick={() => formik.setFieldValue('investors', [...formik.values.investors, clone(emptyInvestor)])}
              >
                <AddCircleIcon sx={{ width: 16, height: 16, color: 'primary.main' }} />
                <Link>Add investor</Link>
              </Box>
              {formik.values.investors.map((investor, index) => (
                <Card
                  key={index}
                  sx={{
                    p: 2,
                    backgroundColor: 'secondary.subtle',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                  }}
                >
                  <Box>
                    <Avatar src={investor.avatar} onClick={() => editAvatar(investor)} sx={{ cursor: 'pointer' }}>
                      {!investor.avatar && <PersonAddAlt1Icon />}
                    </Avatar>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FieldLabel>Investor's name</FieldLabel>
                      <Autocomplete
                        sx={{ mr: 0.25 }}
                        selectOnFocus
                        options={investorOptions}
                        freeSolo
                        value={formik.values.investors[index]}
                        getOptionLabel={val => val?.name || ''}
                        onChange={(e, newVal) => handleInvestorChange(e, newVal, index, formik.setFieldValue)}
                        onBlur={(e) => handleInvestorBlur(e, index, formik.setFieldValue)}
                        renderInput={(params) => <TextInput {...params} />}
                        renderOption={(props, option) => (
                          <li {...props} style={{ fontSize: 20, padding: 0 }} key={option.name}>
                            <Box
                              py={1}
                              px={2}
                              display='flex'
                              gap={1}
                              width='100%'
                              borderBottom={props['data-option-index'] < investorOptions.length - 1 ? 1 : 0}
                              borderColor='border'
                            >
                              <Avatar src={option.avatar} sx={{ width: 32, height: 32 }} />
                              <Box>
                                <Typography variant='subtitleBold'>{option.name}</Typography>
                                <Typography sx={{ mt: 0.25 }} variant='caption'>{option.company}</Typography>
                              </Box>
                            </Box>
                          </li>
                        )}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FieldLabel>Company</FieldLabel>
                      <FormikTextInput name={`investors[${index}].company`} fullWidth />
                    </Grid>
                    <Grid item xs={6}>
                      <FieldLabel>Funding amount</FieldLabel>
                      <FormikTextInput name={`investors[${index}].amount`} type='number' fullWidth />
                    </Grid>
                    <Grid item xs={6}>
                      <FieldLabel>Location</FieldLabel>
                      <GoogleMapsAutocomplete
                        values={formik.values.investors[index]}
                        setFieldValue={(name, value) => formik.setFieldValue(`investors[${index}].${name}`, value)}
                      />
                    </Grid>
                  </Grid>
                  <IconButton
                    onClick={() => formik.setFieldValue('investors', formik.values.investors.filter((_, i) => index !== i))}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Card>
              ))}
              <Button sx={{ alignSelf: 'flex-start' }} variant='outlined' onClick={formik.submitForm}>Save</Button>
              {avatarModalOpen && (
                <ImageUploadModal
                  onClose={closeAvatarModal}
                  handleSave={(avatar) => formik.setFieldValue(`investors[${formik.values.investors.indexOf(avatarInvestor)}].avatar`, avatar)}
                  title='Upload investor avatar'
                />
              )}
            </Box>
          )}
        </Formik>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileFundingForm);
