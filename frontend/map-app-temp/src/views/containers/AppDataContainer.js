import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import Loader from "shared-components/views/components/Loader";

const AppDataContainer = ({ children }) => {
  const dispatch = useDispatch();
  const goals = useSelector(dictionarySelectors.getGoals());

  useEffect(() => {
    if (goals.length === 0) {
      dispatch(dictionaryThunks.fetchGoals());
    }
  }, [dispatch]);

  return goals.length === 0 ? <Loader /> : children;
};

export default memo(AppDataContainer);
