import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dictionarySelectors, dictionaryThunks } from '../../store/ducks/dictionary';
import Loader from "shared-components/views/components/Loader";

const ScoringQuestionsContainer = ({ children }) => {
  const questions = useSelector(dictionarySelectors.getScoringQuestions());
  const geography = useSelector(dictionarySelectors.getGeography());
  const dispatch = useDispatch();

  useEffect(() => {
    if (Object.keys(questions).length === 0) {
      dispatch(dictionaryThunks.fetchScoringQuestions());
    }

    if (geography.length === 0) {
      dispatch(dictionaryThunks.fetchGeography());
    }
  }, []);


  return Object.keys(questions).length === 0 || geography.length === 0 ? <Loader /> : children;
};

export default memo(ScoringQuestionsContainer);
