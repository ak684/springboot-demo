import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { userSelectors } from '../../store/ducks/user';

const SuperAdminCheck = ({ children }) => {
  const isSuperAdmin = useSelector(userSelectors.isSuperAdmin());
  
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default SuperAdminCheck;