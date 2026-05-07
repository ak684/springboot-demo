import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ventureSelectors, ventureThunks } from 'store/ducks/venture';
import { useLocation, useParams } from 'react-router-dom';
import Loader from "shared-components/views/components/Loader";

const VentureContainer = ({ reload = false, forceRefresh = false, children }) => {
  const dispatch = useDispatch();
  const { ventureId } = useParams();
  const loading = useSelector(ventureSelectors.currentVentureLoading(ventureId));
  const location = useLocation();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  useEffect(() => {
    if (!venture || reload) {
      dispatch(ventureThunks.fetchCurrentVenture(ventureId));
    }
  }, [dispatch, location.pathname, reload]);

  useEffect(() => {
    localStorage.setItem('latestView', 'venture');
  }, []);

  if (!venture || (loading && forceRefresh)) {
    return <Loader />;
  } else {
    return children;
  }
};

export default memo(VentureContainer);
