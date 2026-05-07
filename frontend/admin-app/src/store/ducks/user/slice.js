import { createSlice } from '@reduxjs/toolkit';
import thunks from './thunks';
import loadDataInitialState from 'store/utils/loadDataInitialState';
import loadDataExtraReducer from 'store/utils/loadDataExtraReducer';

const initialState = (userLoading = true) => ({
  current: loadDataInitialState(null, true),
  intro: loadDataInitialState(null, true),
  initialLoading: userLoading,
  subscriptionDetails: loadDataInitialState(null, true),
});

const userSlice = createSlice({
  name: 'userSlice',
  initialState: initialState(),
  reducers: {
    loadingFinished(state) {
      state.initialLoading = false;
    },
    toggleVentureDraft(state, action) {
      const ventureId = +action.payload;
      const draftVentures = state.current.data.draftVentures;

      if (draftVentures.includes(ventureId)) {
        draftVentures.splice(draftVentures.indexOf(ventureId), 1);
      } else {
        draftVentures.push(ventureId);
      }
    },
  },
  extraReducers: (builder) => {
    loadDataExtraReducer(builder, thunks.fetchUser, 'current');
    loadDataExtraReducer(builder, thunks.login, 'current');
    loadDataExtraReducer(builder, thunks.register, 'current');
    loadDataExtraReducer(builder, thunks.updateProfile, 'current');
    loadDataExtraReducer(builder, thunks.fetchSubscriptionDetails, 'subscriptionDetails');
    loadDataExtraReducer(builder, thunks.fetchUserIntroDetails, 'intro');
    loadDataExtraReducer(builder, thunks.fetchUserIntroBySession, 'intro');
    loadDataExtraReducer(builder, thunks.createProfile, 'current');
  },
});

export const { loadingFinished, toggleVentureDraft } = userSlice.actions;
export default userSlice.reducer;
