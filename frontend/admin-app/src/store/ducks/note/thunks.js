import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from 'react-toastify';
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

const createNote = createAsyncThunk('note/create', async ({ note, details, showMessage = true }) => {
  const body = new FormData();
  const data = { ...note, ...details };

  body.append('note', JSON.stringify(data));

  if (note.newFiles.length > 0) {
    for (let i = 0; i < note.newFiles.length; i++) {
      body.append('newFiles', note.newFiles[i].file);
    }
  }

  return api.post('/notes', body, { 'Content-Type': 'multipart/form-data' })
    .then((res) => {
      if (showMessage) {
        toast.success('Your note has been saved');
      }
      return res;
    });
});

export default {
  fetchNote,
  createNote,
};
