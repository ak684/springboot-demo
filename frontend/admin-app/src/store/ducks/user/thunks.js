import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { v1 } from 'services/api';
import { loadingFinished } from './slice';
import { toast } from 'react-toastify';
import router from 'routes/router';
import { userSelectors } from "./index";
import { getBranding } from 'shared-components/utils/branding';

const fetchUser = createAsyncThunk('user/fetchCurrent', async (_, { dispatch }) => {
  return api.get('/auth/current')
    .then((res) => {
      setTimeout(() => {
        dispatch(loadingFinished());
      }, 0);
      return res;
    }).catch((err) => {
      if (err?.response?.status === 401) {
        v1.deleteToken();
      }

      dispatch(loadingFinished());
    });
});

const login = createAsyncThunk('user/login', async (data) => {
  return api.post('/auth/login', data);
});

const register = createAsyncThunk('user/register', async (data) => {
  return api.post('/auth/register', data);
});

const logout = createAsyncThunk('user/logout', (_, { dispatch }) => {
  v1.deleteToken();
  dispatch({ type: 'logout/LOGOUT' });
  const branding = getBranding();
  window.location.assign(branding.marketingSiteUrl);
});

const fetchSubscriptionDetails = createAsyncThunk('user/subscriptionDetails', async () => {
  return api.get('/users/subscriptions');
});

const goToCustomerPortal = createAsyncThunk('user/portal/link', async (subscriptionId) => {
  return api.get(`/users/portal/link/${subscriptionId}`).then(res => {
    if (res) {
      window.location.assign(res);
    }
  });
});

const forgotPassword = createAsyncThunk('user/forgotPassword', async (data) => {
  return api.post('/auth/forgot', data).then(() => {
    toast.success('We have sent password reset instruction to your email');
  });
});

const resetPassword = createAsyncThunk('user/resetPassword', async (data) => {
  return api.post('/auth/reset', data).then(() => {
    toast.success('Your password has been changed successfully. You can now log in using your new password');
    router.navigate('/login');
  });
});

const changePassword = createAsyncThunk('user/changePassword', async ({ data, callback }) => {
  return api.post('/users/change', data).then(() => {
    toast.success('Your password has been changed successfully.');
    callback && callback();
  });
});

const uploadAvatarUrl = createAsyncThunk('user/uploadAvatar', async (data, { dispatch }) => {
  return api.put('/users/avatar', data, { 'Content-Type': 'text/plain' }).then(() => {
    dispatch(fetchUser());
  });
});

const updateProfile = createAsyncThunk('user/updateProfile', async (data) => {
  return api.put('/users/profile', data);
});

const fetchUserIntroDetails = createAsyncThunk('user/intro', (token) => {
  return api.get(`/auth/intro/${token}`);
});

const fetchUserIntroBySession = createAsyncThunk('user/introBySession', (sessionId) => {
  return api.get(`/auth/intro/session/${sessionId}`);
});

const createProfile = createAsyncThunk('user/createProfile', ({ data, token }) => {
  return api.post(`/auth/profile/${token}`, data)
    .then(() => {
      return api.get('/ventures/subscriptionSlots')
        .then(slotsPresent => {
          if (slotsPresent) {
            router.navigate('/creation-steps');
          } else {
            router.navigate('/');
          }
        });
    });
});

const connectGoogle = createAsyncThunk('user/connectGoogle', (_, { dispatch }) => {
  return api.get(`/oauth/google`)
    .then(res => {
      const authWindow = window.open(res, '_blank', 'width=500,height=600');
      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        toast.warn('Google authorization window was blocked. Please disable your pop-up blocker and try again.');
      }
      window.postAuth = function () {
        if (authWindow) {
          authWindow.close();
        }
        dispatch(fetchUser());
      }
    });
});

const deleteProfile = createAsyncThunk('user/deleteProfile', async (_, { dispatch }) => {
  return api.delete('/users/profile').then(() => {
    toast.success('Your account has been deactivated. You will now be redirected to the service website');
    setTimeout(() => {
      dispatch(logout());
    }, 3000);
  });
});

const purchaseNewSubscription = createAsyncThunk('user/newSubscription', async ({ period, type, newVenture }, { getState }) => {
  return api.post('/users/subscriptions', { period, type, newVenture })
    .then((url) => {
      if (url) {
        window.location.href = url;
      }
    });
});

export default {
  fetchUser,
  login,
  register,
  logout,
  fetchSubscriptionDetails,
  goToCustomerPortal,
  forgotPassword,
  resetPassword,
  changePassword,
  uploadAvatarUrl,
  updateProfile,
  fetchUserIntroDetails,
  fetchUserIntroBySession,
  createProfile,
  connectGoogle,
  deleteProfile,
  purchaseNewSubscription,
};
