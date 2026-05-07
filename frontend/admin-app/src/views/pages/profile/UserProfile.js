import React, { memo, useEffect } from 'react';
import { Avatar, Box, Button, Card, Divider, Grid, Link, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import filters from "shared-components/filters";
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import ReactCountryFlag from 'react-country-flag';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import useModal from "shared-components/hooks/useModal";
import ChangePasswordModal from './components/ChangePasswordModal';
import { smallerImage } from "shared-components/utils/helpers";
import EditProfileModal from "./components/EditProfileModal";
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";
import ImageUploadModal from "./components/ImageUploadModal";
import AppLabel from "../../common/AppLabel";
import { toast } from "react-toastify";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const knownCardTypes = ['visa', 'mastercard', 'amex'];

const intervalOptions = {
  month: "Monthly",
  year: "Yearly",
}

const UserProfile = () => {
  const [passwordModalOpen, changePassword, closePasswordModal] = useModal();
  const [avatarModalOpen, uploadAvatar, closeAvatarModal] = useModal();
  const [editModalOpen, editProfile, closeEditModal] = useModal();
  const [deleteModalOpen, deleteProfile, closeDeleteModal] = useModal();
  const dispatch = useDispatch();
  const user = useSelector(userSelectors.getCurrentUser());
  const subscriptions = useSelector(userSelectors.getSubscriptionDetails());
  const subscriptionDetailsLoading = useSelector(userSelectors.subscriptionDetailsLoading());
  const geography = useSelector(dictionarySelectors.getGeography());

  useEffect(() => {
    dispatch(userThunks.fetchSubscriptionDetails());

    if (geography.length === 0) {
      dispatch(dictionaryThunks.fetchGeography());
    }
  }, []);

  const goToCustomerPortal = (subscription) => {
    dispatch(userThunks.goToCustomerPortal(subscription));
  };

  const confirmDeleteProfile = () => {
    closeDeleteModal();
    dispatch(userThunks.deleteProfile())
      .then(() => {
        toast.success('Your account has been deactivated');
        setTimeout(() => {
          dispatch(userThunks.logout());
        }, 3000)
      });
  }

  const handleSaveAvatar = (avatar) => {
    dispatch(userThunks.uploadAvatarUrl(avatar));
  };

  if (geography.length === 0) {
    return <Loader />
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Typography variant='h3' sx={{ mb: 3 }}>My profile</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 2 }}>
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Avatar onClick={uploadAvatar} sx={{ cursor: 'pointer' }} src={smallerImage(user.avatar)} />
                <Typography component={Link} sx={{ cursor: 'pointer' }} onClick={editProfile}>
                  Edit profile data
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>First name</Typography>
                <Typography variant='bodyBold'>{user.name}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Last name</Typography>
                <Typography variant='bodyBold'>{user.lastName}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Organization</Typography>
                <Typography variant='bodyBold'>{user.company}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Job title</Typography>
                <Typography variant='bodyBold'>{user.position}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Joined</Typography>
                <Typography variant='bodyBold'>{filters.date(user.createdAt)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Country of residence</Typography>
                <Box display='flex' alignItems='center' gap={1}>
                  <ReactCountryFlag countryCode={user.country?.code} svg />
                  <Typography variant='bodyBold'>
                    {user.country?.title}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Email</Typography>
                <Typography variant='bodyBold'>{user.email}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Password</Typography>
                <Link sx={{ cursor: 'pointer' }} variant='body' onClick={changePassword}>Change password</Link>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body'>Deactivate account</Typography>
                <Link color='error' sx={{ cursor: 'pointer' }} variant='body' onClick={deleteProfile}>
                  Deactivate your account
                </Link>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            {subscriptionDetailsLoading && <Loader />}
            {!subscriptionDetailsLoading && (subscriptions || []).map(subscription => (
              <Card key={subscription.subscriptionId} sx={{ mb: 2, p: 2 }}>
                <Typography sx={{ mb: 1 }} variant='bodyBold'>
                  Subscription - {subscription.product}
                </Typography>
                {subscription.venture && (
                  <Typography sx={{ mb: 1 }} variant='subtitle' color='text.secondary'>
                    Venture: {subscription.venture}
                  </Typography>
                )}
                {!subscription.venture && <AppLabel sx={{ mb: 1 }}>Vacant</AppLabel>}
                {intervalOptions[subscription.interval] && (
                  <Typography sx={{ mb: 1 }} variant='subtitle' color='text.secondary'>
                    Payment: {intervalOptions[subscription.interval]}
                  </Typography>
                )}
                <Typography variant='subtitle' color='text.secondary'>
                  Next billing date: {filters.date(new Date(subscription.subscriptionEnd * 1000))}
                </Typography>
                <Box display='flex' gap={1} mt={1}>
                  <Typography variant='subtitle' color='text.secondary'>Auto-renewal status:</Typography>
                  <Typography variant='subtitleBold' color={subscription.renew ? 'success.main' : 'error.main'}>
                    {subscription.renew ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                {(subscription.cardType || subscription.last4) && (
                  <>
                    <Box display='flex' alignItems='center' gap={2}>
                      <Typography variant='body'>Card:</Typography>
                      {
                        knownCardTypes.includes(subscription.cardType) &&
                        <Box component='img' src={`/images/payment/${subscription.cardType}.svg`} width={36} />
                      }
                      {
                        subscription.cardType && !knownCardTypes.includes(subscription.cardType) &&
                        <CreditCardIcon sx={{ width: 36, height: 36 }} />
                      }
                      {subscription.last4 && (
                        <Typography variant='bodyBold'>
                          •••• {subscription.last4}
                        </Typography>
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                <Button color='secondary' fullWidth onClick={() => goToCustomerPortal(subscription.subscriptionId)}>
                  Manage subscription
                </Button>
              </Card>
            ))}
          </Grid>
        </Grid>
        <ChangePasswordModal open={passwordModalOpen} onClose={closePasswordModal} />
        <EditProfileModal open={editModalOpen} onClose={closeEditModal} />
        {avatarModalOpen &&
          <ImageUploadModal onClose={closeAvatarModal} handleSave={handleSaveAvatar} title='Upload your avatar' />
        }
        <ConfirmModal
          open={deleteModalOpen}
          onClose={closeDeleteModal}
          confirm={confirmDeleteProfile}
          confirmTitle='Deactivate'
          title='Deactivating your account'
          primary='Are you sure you want to deactivate your account? This will remove all your personal data from the system and revoke your access from all ventures. If you are an account owner, all of your ventures will be disabled as well'
          secondary='This action cannot be undone'
        />
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(UserProfile);
