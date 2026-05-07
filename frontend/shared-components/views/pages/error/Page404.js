import React, { memo } from 'react';
import ErrorPage from './ErrorPage';

const Page404 = (props) => {
  return (
    <ErrorPage
      title='This page does not exist'
      message='It appears the link you followed is broken, or the page may have been removed.'
      {...props}
    />
  );
};

export default memo(Page404);
