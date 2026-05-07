import React, { useContext } from 'react';
import { Slide } from '@mui/material';
import { AnimationContext } from 'context/AnimationContext';

const StepperAnimation = (props) => {
  const animationForward = useContext(AnimationContext);

  return (
    <Slide direction={animationForward ? 'up' : 'down'} in mountOnEnter unmountOnExit timeout={800} {...props} />
  );
};

export default StepperAnimation;
