import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import theme from 'shared-components/theme';
import { Box, Button, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import store from './store';
import { Provider } from 'react-redux';
import UserContainer from './views/containers/UserContainer';
import 'react-toastify/dist/ReactToastify.css';
import { Integrations } from '@sentry/tracing';
import * as Sentry from '@sentry/react';
import AppDataContainer from './views/containers/AppDataContainer';
import { RouterProvider } from 'react-router-dom';
import router from './routes/router';
import ErrorPage from 'shared-components/views/pages/error/ErrorPage';
import Toaster from 'shared-components/views/components/Toaster';

const container = document.getElementById('root');

if (!window.__BRANDING__) {
  const fallbackMessage = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 6, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <Typography variant='h4' sx={{ mb: 2 }}>Unable to start application</Typography>
        <Typography variant='body1' sx={{ mb: 4 }}>
          Branding configuration could not be loaded. Please ensure the backend is running and refresh the page.
        </Typography>
        <Button variant='contained' onClick={() => window.location.reload()}>Reload</Button>
      </Box>
    </ThemeProvider>
  );

  ReactDOM.createRoot(container).render(fallbackMessage);
  throw new Error('Branding configuration missing. Aborting startup.');
}

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],
    environment: window.location.hostname,
    tracesSampleRate: 0.05,
    normalizeDepth: 10
  });
}

ReactDOM.createRoot(container).render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Sentry.ErrorBoundary fallback={<ErrorPage />}>
        <Box>
          <UserContainer>
            <AppDataContainer>
              <RouterProvider router={router} />
            </AppDataContainer>
          </UserContainer>
          <Toaster />
        </Box>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </Provider>
);

reportWebVitals();
