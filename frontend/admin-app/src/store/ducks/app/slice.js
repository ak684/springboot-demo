import { createSlice } from '@reduxjs/toolkit';
import { IMPACT_FILTER, PUBLIC_SORT } from "shared-components/utils/constants";

const initialFilter = Object.values(IMPACT_FILTER);

const appSlice = createSlice({
  name: 'appSlice',
  initialState: {
    impactFilter: [...initialFilter],
    publicSort: PUBLIC_SORT.BY_AGE_DESC,
    publicPeriod: 7,
    onboarding: {},
  },
  reducers: {
    toggleImpactFilter(state, action) {
      const filterItem = action.payload;

      if (state.impactFilter.includes(filterItem)) {
        state.impactFilter.splice(state.impactFilter.indexOf(filterItem), 1);
      } else {
        state.impactFilter.push(filterItem);
      }
    },
    setImpactFilterAll(state) {
      state.impactFilter = [...initialFilter];
    },
    setImpactSort(state, action) {
      state.impactSort = action.payload;
    },
    setPublicSort(state, action) {
      state.publicSort = action.payload;
    },
    setPublicPeriod(state, action) {
      state.publicPeriod = action.payload;
    },
    openOnboarding(state, action) {
      state.onboarding = action.payload;
    },
    closeOnboarding(state, action) {
      state.onboarding = {};
    }
  },
});

export const { toggleImpactFilter, setImpactFilterAll, setImpactSort, openOnboarding, closeOnboarding, setPublicSort, setPublicPeriod } = appSlice.actions;
export default appSlice.reducer;
