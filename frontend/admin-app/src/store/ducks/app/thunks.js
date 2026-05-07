import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from 'react-toastify';

const sendFeedback = createAsyncThunk('app/sendFeedback', async (data) => {
  return api.post('/feedbacks', { entry: data })
    .then(() => {
      toast.success('Thank you! We have received your message');
    });
});

const uploadImage = createAsyncThunk('app/uploadImage', async (data) => {
  return api.post('/uploads/base64', { content: data });
});

const uploadImageRaw = createAsyncThunk('app/uploadImageRaw', async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads', formData, {
    'Content-Type': 'multipart/form-data'
  });
});

export default {
  sendFeedback,
  uploadImage,
  uploadImageRaw,
};
