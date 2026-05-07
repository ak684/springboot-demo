import React, { memo, useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { userSelectors } from 'store/ducks/user';
import CompanyPublicProfileCard from './components/CompanyPublicProfileCard';

const ManagePublicProfile = () => {
  const user = useSelector(userSelectors.getCurrentUser());
  const companies = useMemo(
    () => user?.publicProfileOnlyCompanies || [],
    [user],
  );

  return (
    <Box data-testid='manage-public-profile-page'>
      <Typography variant='h4'>Public Profile Access</Typography>
      <Typography
        variant='body'
        color='text.secondary'
        sx={{ mt: 1, mb: 2, display: 'block' }}
      >
        Companies you can edit the public profile of.
      </Typography>
      {companies.length === 0 ? (
        <Typography color='text.secondary'>
          You don&apos;t have any public profiles to manage yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} sm={4} key={company.id}>
              <CompanyPublicProfileCard company={company} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default memo(ManagePublicProfile);
