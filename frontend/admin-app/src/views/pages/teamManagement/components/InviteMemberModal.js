import React, { memo, useEffect, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { Form, withFormik } from 'formik';
import * as Yup from 'yup';
import messages from "shared-components/utils/messages";
import Box from '@mui/material/Box';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { Autocomplete, Avatar, Divider, Typography } from '@mui/material';
import store from 'store';
import { ventureThunks } from 'store/ducks/venture';
import MemberAccessRow from "./MemberAccessRow";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import TextField from "@mui/material/TextField";
import { getTeamAccessMap, NO_ACCESS } from "utils/team";
import { toast } from "react-toastify";
import ModalActions from "shared-components/views/components/modal/ModalActions";
import { v1 } from 'services/api';

const InviteMemberModal = ({ open, onClose, handleSubmit, ventures, portfolios, user, values, setFieldValue }) => {
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [grantableCompanies, setGrantableCompanies] = useState([]);
  const noAccessVentures = ventures.filter(v => values.ventureAccessMap[v.id].access === NO_ACCESS)
  const noAccessPortfolios = portfolios.filter(p => values.portfolioAccessMap[p.id].access === NO_ACCESS)

  useEffect(() => {
    let cancelled = false;
    const editablePortfolios = portfolios.filter(
      p => (p.access || p.members?.find(m => m.member?.id === (p.currentUserId)))
    );
    const fetchTargets = (portfolios.length ? portfolios : editablePortfolios);
    const loadCompanies = async () => {
      const results = [];
      for (const p of fetchTargets) {
        try {
          const res = await v1.get('/companies/lite', {
            params: { portfolioId: p.id, size: 500, fields: 'id,company_name,company_url' },
          });
          const content = res?.data?.content || [];
          content.forEach(c => {
            if (!results.find(r => r.id === c.id)) {
              results.push({
                id: c.id,
                name: c.company_name || c.name || `Company ${c.id}`,
                website: c.company_url || c.url || '',
              });
            }
          });
        } catch (err) {
          // Inviter has no access to this portfolio's companies - skip silently.
        }
      }
      if (!cancelled) {
        setGrantableCompanies(results);
      }
    };
    if (fetchTargets.length) {
      loadCompanies();
    }
    return () => {
      cancelled = true;
    };
  }, [portfolios]);

  const companyAccessMap = values.companyAccessMap || {};
  const noAccessCompanies = grantableCompanies.filter(
    c => (companyAccessMap[c.id]?.access || NO_ACCESS) === NO_ACCESS,
  );

  const companyAccessAdded = (company, prop) => {
    if (company) {
      const defaultAccess = prop === 'companyAccessMap'
        ? VENTURE_ACCESS.PUBLIC_PROFILE_ONLY
        : VENTURE_ACCESS.EDIT;
      setFieldValue(prop, { ...values[prop], [company.id]: { access: defaultAccess } });
      setInputValue('');
      setValue(null);
    }
  }

  const changeAccess = (company, access, prop) => {
    setFieldValue(prop, { ...values[prop], [company.id]: { access } });
  }

  const revokeAccess = (company, prop) => {
    setFieldValue(prop, { ...values[prop], [company.id]: { ...values[prop][company.id], access: NO_ACCESS } });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit member access' : 'Invite member'}
      actions={<ModalActions onClose={onClose} submitForm={handleSubmit} submitTitle='(Re)Send invitation' />}
    >
      <Box component={Form}>
        <FormikTextInput
          sx={{ mb: 2 }}
          name='name'
          placeholder='First name (optional)'
          inputProps={{ maxLength: 255 }}
          fullWidth
          disabled={!!user}
        />
        <FormikTextInput
          sx={{ mb: 2 }}
          name='lastName'
          placeholder='Last name (optional)'
          inputProps={{ maxLength: 255 }}
          fullWidth
          disabled={!!user}
        />
        <FormikTextInput
          sx={{ mb: 2 }}
          name='email'
          placeholder='Email'
          inputProps={{ maxLength: 255 }}
          fullWidth
          disabled={!!user}
        />
        <Divider sx={{ mt: 3 }} />
        <Typography align='center' variant='h5' sx={{ mt: 3, mb: 2 }}>Ventures</Typography>
        <Box display='flex' flexDirection='column' gap={2}>
          {Object.keys(values.ventureAccessMap)
            .filter(id => values.ventureAccessMap[id].access !== NO_ACCESS)
            .map(id => (
              <MemberAccessRow
                key={id}
                company={ventures.find(v => v.id === +id)}
                access={values.ventureAccessMap[id]}
                changeAccess={(company, access) => changeAccess(company, access, 'ventureAccessMap')}
                revokeAccess={(company) => revokeAccess(company, 'ventureAccessMap')}
              />
            ))}
          {noAccessVentures.length > 0 && (
            <Box display='flex' alignItems='center' gap={2} mt={2}>
              <Typography sx={{ width: 180 }}>Grant access to:</Typography>
              <Autocomplete
                value={value}
                inputValue={inputValue}
                onChange={(e, newValue) => companyAccessAdded(newValue, 'ventureAccessMap')}
                options={noAccessVentures}
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
                  <TextField {...params} variant='standard' placeholder='Name' autoComplete="off" />
                )}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                fullWidth
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ mt: 3 }} />
        <Typography align='center' variant='h5' sx={{ mt: 3, mb: 2 }}>Portfolios</Typography>
        <Box display='flex' flexDirection='column' gap={2}>
          {Object.keys(values.portfolioAccessMap)
            .filter(id => values.portfolioAccessMap[id].access !== NO_ACCESS)
            .map(id => (
              <MemberAccessRow
                key={id}
                company={portfolios.find(v => v.id === +id)}
                access={values.portfolioAccessMap[id]}
                changeAccess={(company, access) => changeAccess(company, access, 'portfolioAccessMap')}
                revokeAccess={(company) => revokeAccess(company, 'portfolioAccessMap')}
              />
            ))}
          {noAccessPortfolios.length > 0 && (
            <Box display='flex' alignItems='center' gap={2} mt={2}>
              <Typography sx={{ width: 180 }}>Grant access to:</Typography>
              <Autocomplete
                value={value}
                inputValue={inputValue}
                onChange={(e, newValue) => companyAccessAdded(newValue, 'portfolioAccessMap')}
                options={noAccessPortfolios}
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
                  <TextField {...params} variant='standard' placeholder='Name' autoComplete="off" />
                )}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                fullWidth
              />
            </Box>
          )}
        </Box>
        <Divider sx={{ mt: 3 }} />
        <Typography align='center' variant='h5' sx={{ mt: 3 }}>Companies</Typography>
        <Typography align='center' variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
          Grant the recipient editing access to one or more company public profiles only.
        </Typography>
        <Box display='flex' flexDirection='column' gap={2}>
          {Object.keys(companyAccessMap)
            .filter(id => companyAccessMap[id].access !== NO_ACCESS)
            .map(id => {
              const companyInfo = grantableCompanies.find(c => c.id === +id)
                || { id: +id, name: `Company ${id}` };
              return (
                <MemberAccessRow
                  key={id}
                  company={companyInfo}
                  access={companyAccessMap[id]}
                  changeAccess={(c, access) => changeAccess(c, access, 'companyAccessMap')}
                  revokeAccess={(c) => revokeAccess(c, 'companyAccessMap')}
                  accessMode='company'
                />
              );
            })}
          <Box display='flex' alignItems='center' gap={2}>
            <Typography sx={{ width: 180 }}>Grant access to:</Typography>
            <Autocomplete
              value={value}
              inputValue={inputValue}
              onChange={(e, newValue) => companyAccessAdded(newValue, 'companyAccessMap')}
              options={noAccessCompanies}
              getOptionLabel={(option) => option?.name || ''}
              noOptionsText={grantableCompanies.length === 0
                ? 'No companies available to grant access to'
                : 'No matches'}
              disabled={grantableCompanies.length === 0}
              renderOption={(props, option) => (
                <li {...props} style={{ fontSize: 20 }} key={option.id}>
                  <Box display='flex' alignItems='center' justifyContent='space-between' gap={2} width='100%'>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>{option.name.slice(0, 1)}</Avatar>
                      <Typography variant='subtitleBold'>{option.name}</Typography>
                    </Box>
                    <Typography variant='subtitle' noWrap color='secondary.main'>
                      {option.website}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant='standard'
                  placeholder={grantableCompanies.length === 0
                    ? 'No companies available'
                    : 'Company name (pick one or more)'}
                  autoComplete='off'
                />
              )}
              isOptionEqualToValue={(option, v) => option?.id === v?.id}
              fullWidth
            />
          </Box>
        </Box>
        {!user && (
          <FormikTextInput
            multiline
            sx={{ mt: 2 }}
            name='message'
            placeholder='Message to the recipient (optional)'
            fullWidth
          />
        )}
      </Box>
    </Modal>
  );
};

const schema = Yup.object().shape({
  name: Yup.string(),
  lastName: Yup.string(),
  email: Yup.string().required(messages.errors.validation.required).email(messages.errors.validation.email),
  message: Yup.string(),
});

export default memo(withFormik({
  mapPropsToValues: ({ user, ventures, portfolios }) => ({
    name: user?.name || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    message: '',
    ventureAccessMap: getTeamAccessMap(ventures, user),
    portfolioAccessMap: getTeamAccessMap(portfolios, user),
    companyAccessMap: {},
  }),
  validationSchema: schema,
  enableReinitialize: true,
  handleSubmit: (data, helpers) => {
    if (helpers.props.user) {
      store.dispatch(ventureThunks.updateUserAccess({
        user: helpers.props.user,
        allVentures: helpers.props.ventures,
        ventureAccessMap: data.ventureAccessMap,
        allPortfolios: helpers.props.portfolios,
        portfolioAccessMap: data.portfolioAccessMap,
      }));
      helpers.resetForm();
      helpers.props.onClose();
    } else {
      const hasVentureOrPortfolio = Object.values(data.ventureAccessMap)
          .some(a => [VENTURE_ACCESS.VIEW, VENTURE_ACCESS.EDIT].includes(a.access))
        || Object.values(data.portfolioAccessMap)
          .some(a => [VENTURE_ACCESS.VIEW, VENTURE_ACCESS.EDIT].includes(a.access));
      const hasCompanyAccess = Object.values(data.companyAccessMap || {})
        .some(a => a.access === VENTURE_ACCESS.PUBLIC_PROFILE_ONLY);
      if (hasVentureOrPortfolio || hasCompanyAccess) {
        store.dispatch(ventureThunks.inviteUser(data));
        helpers.resetForm();
        helpers.props.onClose();
      } else {
        toast.error("You need to add at least one venture, portfolio, or company to invite a user");
      }
    }
  },
})(InviteMemberModal));
