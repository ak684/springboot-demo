import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import apiService from '../../services/api/apiService';

const OwnerCheck = ({ children }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      try {
        const response = await apiService.get('/api/v1/users/is-superadmin');
        setIsSuperAdmin(response);
      } catch (error) {
        console.error('Failed to check superadmin status:', error);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdminStatus();
  }, []);

  if (isSuperAdmin === null) {
    return <div>Loading...</div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OwnerCheck;