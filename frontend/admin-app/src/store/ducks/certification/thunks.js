import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { toast } from "react-toastify";

const fetchCertificationCriteria = createAsyncThunk('certification/fetchCriteria', async (_, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.get(`/certifications/${ventureId}/criteria`);
});

const getCertificateForLevel = createAsyncThunk('certification/getForLevel', async (level, { getState }) => {
  const ventureId = getState().venture.current.data.id;
  return api.post(`/certifications/${ventureId}/level/${level}`)
    .then((res) => {
      toast.success('You have successfully applied for a certification');
      return res;
    })
});

export default {
  fetchCertificationCriteria,
  getCertificateForLevel,
};
