import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { ventureSelectors } from 'store/ducks/venture';
import { useParams } from 'react-router-dom';
import Loader from "shared-components/views/components/Loader";

const ImpactContainer = ({ children }) => {
  const { impactId } = useParams();
  const impact = useSelector(ventureSelectors.getImpact(impactId));

  // Required for Formik fields autofill when editing the impact logic
  const childrenWithProps = React.Children.map(
    children,
    (child) => React.isValidElement(child) ? React.cloneElement(child, { impact }) : child
  );

  return impact ? childrenWithProps : <Loader />;
};

export default memo(ImpactContainer);
