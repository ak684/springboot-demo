import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { CssBaseline, ThemeProvider } from "@mui/material";
import store from './store';
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import router from './routes/router';
import theme from "shared-components/theme"
import AppDataContainer from "./views/containers/AppDataContainer";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppDataContainer>
          <RouterProvider router={router} />
        </AppDataContainer>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
