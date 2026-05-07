import * as reducers from './ducks';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createReduxEnhancer } from '@sentry/react';

const appReducer = combineReducers(reducers);

const rootReducer = (state, action) => {
  if (action.type === 'logout/LOGOUT') {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

const sentryReduxEnhancer = createReduxEnhancer();

export default configureStore({
  reducer: rootReducer,
  devTools: true,
  middleware: getDefaultMiddleware => getDefaultMiddleware(),
  enhancers: [sentryReduxEnhancer],
});
