import { createAsyncThunk } from '@reduxjs/toolkit';
import api from 'services/api';
import { ventureThunks } from "../venture";
import { isDefined } from "shared-components/utils/lo";

const fetchPitchVenture = createAsyncThunk('pitch/fetchVenture', async (uuid) => {
  return api.get(`/pitch/${uuid}`);
});

const fetchPitchVentureAuth = createAsyncThunk('pitch/fetchVentureAuth', async (id) => {
  return api.get(`/pitch/${id}/auth`);
});

const updatePitchSettings = createAsyncThunk('pitch/updateSettings', async ({ venture, step, skipFetch }, { dispatch }) => {
  const body = { ...venture, country: undefined, industries: undefined };
  const stepName = step.name.split('[')[0];
  const impactIdMatch = step.name.match(/\[(\d+)\]/);
  const impactId = impactIdMatch ? parseInt(impactIdMatch[1], 10) : null;

  return api.put(`/pitch/ventures/${venture.id}/settings?slide=${stepName}${isDefined(impactId) ? `&impactId=${impactId}` : ''}`, body)
    .then((res) => {
      if (!skipFetch) {
        dispatch(ventureThunks.fetchCurrentVenture(venture.id));
        dispatch(fetchPitchVentureAuth(venture.id));
      }
      return res;
    });
});

const updatePitchVisibility = createAsyncThunk('pitch/updateVisibility', async ({ venture, share, allowDownloadFiles }, { dispatch }) => {
  return api.put(`/pitch/ventures/${venture.id}/share`, { share, allowDownloadFiles })
    .then((res) => {
      dispatch(ventureThunks.fetchCurrentVenture(venture.id));
      return res;
    });
});

const regenerateGptText = createAsyncThunk('pitch/regenerateGptText', async ({ venture, name, impact }, { dispatch }) => {
  return api.put(`/pitch/ventures/${venture.id}/regenerate?name=${name}`, impact);
});

const fetchIndicatorViews = createAsyncThunk('pitch/fetchIndicatorViews', async () => {
  return api.get(`/dictionaries/indicator-pitch-view`);
});

export default {
  fetchPitchVenture,
  fetchPitchVentureAuth,
  updatePitchSettings,
  updatePitchVisibility,
  regenerateGptText,
  fetchIndicatorViews,
};
