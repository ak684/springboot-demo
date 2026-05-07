import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { userSelectors } from 'store/ducks/user';

const AuthCheck = ({ children, condition = true }) => {
  const user = useSelector(userSelectors.getCurrentUser());

  if (!user) {
    return <Navigate to='/login' replace />;
  } else {
    if (condition) {
      return children;
    } else {
      return <Navigate to='/' replace />;
    }
  }
};

export default AuthCheck;
