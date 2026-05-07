import React from 'react';
import { ToastContainer } from 'react-toastify';

// toDO: Replace with Material UI native toast message?
const Toaster = () => {
  return (
    <ToastContainer
      position='top-right'
      autoClose={10000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      draggable
      pauseOnHover
      theme='light'
    />
  );
};

export default Toaster;
