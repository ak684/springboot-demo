import React, { memo } from 'react';
import { useField } from 'formik';
import { clone } from 'shared-components/utils/lo';
import SdgItem from 'views/common/SdgItem';

const FormikSdgItem = ({ goal, selectable, onClick, ...rest }) => {
  const [, { value }, { setValue }] = useField('goals');

  const handleClick = () => {
    if (!selectable) {
      return;
    }

    if (value.find(v => v.goal.name === goal.name)) {
      const newGoals = clone(value.filter(v => v.goal.name !== goal.name));
      newGoals.forEach((g, index) => {
        g.rate = index === newGoals.length - 1 ? 100 : 0;
      });

      setValue(newGoals);
      onClick && onClick(newGoals);
    } else {
      if (value.length < 3) {
        const newGoals = clone(value);
        newGoals.forEach(g => g.rate = 0);
        newGoals.push({ goal, rate: 100 });
        setValue(newGoals);
        onClick && onClick(newGoals);
      }
    }
  };

  return (
    <SdgItem
      goal={goal}
      onClick={selectable ? handleClick : null}
      selectable={selectable}
      selected={selectable && value.find(v => v.goal.name === goal.name)}
      {...rest}
    />
  );
};

export default memo(FormikSdgItem);
