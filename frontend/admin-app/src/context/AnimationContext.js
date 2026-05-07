import React from 'react';

export const AnimationContext = React.createContext();

export const AnimationContextProvider = (props) => {
  return <AnimationContext.Provider value={true} {...props} />;
};
