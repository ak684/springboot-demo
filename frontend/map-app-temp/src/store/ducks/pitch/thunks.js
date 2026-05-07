import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';

const regenerateGptText = createAsyncThunk('pitch/regenerateGptText', async ({ venture, name, impact }, { dispatch }) => {
  return api.put(`/pitch/ventures/${venture.id}/regenerate?name=${name}`, impact);
});

export default {
  regenerateGptText,
};
