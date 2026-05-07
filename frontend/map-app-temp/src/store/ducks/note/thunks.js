import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import queryString from "query-string";

const fetchNote = createAsyncThunk('note/fetch', async (data) => {
  if (!data.screen) {
    return;
  }

  const params = {
    screen: data.screen,
    impactId: data.impact?.id,
    indicatorId: data.indicator?.id,
  };

  return api.get(`/notes?${queryString.stringify(params)}`);
});

export default {
  fetchNote,
};
