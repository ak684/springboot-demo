import { createSlice } from '@reduxjs/toolkit';
import { PUBLIC_SORT } from 'shared-components/utils/constants';

const appSlice = createSlice({
  name: 'appSlice',
  initialState: {
    publicSort: PUBLIC_SORT.BY_AGE_DESC,
    publicPeriod: 7,
  },
  reducers: {
    setPublicSort(state, action) {
      state.publicSort = action.payload;
    },
    setPublicPeriod(state, action) {
      state.publicPeriod = action.payload;
    },
  },
});

export const { setPublicSort, setPublicPeriod } = appSlice.actions;
export default appSlice.reducer;
