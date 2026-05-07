import React, { memo, useEffect } from 'react';
import { Button } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useDispatch, useSelector } from "react-redux";
import { noteActions, noteSelectors, noteThunks } from "store/ducks/note";

const StepperNotesButton = ({ screen, impact, indicator }) => {
  const dispatch = useDispatch();
  const note = useSelector(noteSelectors.getNote());

  useEffect(() => {
    dispatch(noteThunks.fetchNote({ screen, impact, indicator }));
  }, [screen, impact, indicator]);

  const onClick = () => {
    dispatch(noteActions.openDrawer({ screen, impact, indicator }))
  }

  const numberOfItems = note ? ((note?.files?.length || 0) + (note?.links?.length || 0)) || 1 : 0;

  return (
    <Button variant='outlined' onClick={onClick} startIcon={<DescriptionOutlinedIcon />}>
      Show notes ({numberOfItems})
    </Button>
  );
};

export default memo(StepperNotesButton);
