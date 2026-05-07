import { get } from 'shared-components/utils/lo';

const loadDataExtraReducer = (builder, thunk, statePath, overrides = {}) => {
  builder.addCase(thunk.pending,
    overrides.pending ||
    (state => {
      get(state, statePath).isLoading = true;
    }));
  builder.addCase(thunk.fulfilled, overrides.fulfilled ||
    ((state, action) => {
      get(state, statePath).isLoading = false;
      get(state, statePath).data = action.payload;
      get(state, statePath).error = null;
    }));
  builder.addCase(thunk.rejected, overrides.rejected ||
    ((state, action) => {
      get(state, statePath).isLoading = false;
      get(state, statePath).error = action.error;
    }));
};

export default loadDataExtraReducer;
