import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import Loader from "shared-components/views/components/Loader";

const UserContainer = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelectors.getCurrentUser());
  const loading = useSelector(userSelectors.initialUserLoading()) && !user;

  useEffect(() => {
    dispatch(userThunks.fetchUser());
  }, [dispatch]);

  return loading ? <Loader /> : children;
};

export default memo(UserContainer);
