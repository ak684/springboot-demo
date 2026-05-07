import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { userThunks } from "../user";

const updateUserConfig = createAsyncThunk('config/user/update', async ({ name, value }, { dispatch }) => {
  return api.put('/config/user', { name, value })
    .then(() => {
      dispatch(userThunks.fetchUser());
    });
});

export default {
  updateUserConfig
};
