import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dictionarySelectors, dictionaryThunks } from 'store/ducks/dictionary';
import { ventureThunks } from "../../store/ducks/venture";
import { userSelectors } from "../../store/ducks/user";
import Loader from "shared-components/views/components/Loader";
import StudentAccessDialog from "../components/StudentAccessDialog";

const AppDataContainer = ({ children }) => {
  const dispatch = useDispatch();
  const goals = useSelector(dictionarySelectors.getGoals());
  const user = useSelector(userSelectors.getCurrentUser());
  const [showStudentDialog, setShowStudentDialog] = useState(false);

  useEffect(() => {
    if (goals.length === 0) {
      dispatch(dictionaryThunks.fetchGoals());
    }
  }, [dispatch]);

  // Disable editing values in number inputs with the scroll functionality
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'number') {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(ventureThunks.fetchVenturesAccess());
    }
  }, [dispatch, user]);

  // Listen for student access dialog events
  useEffect(() => {
    const handleShowStudentDialog = () => {
      setShowStudentDialog(true);
    };

    window.addEventListener('showStudentAccessDialog', handleShowStudentDialog);

    return () => {
      window.removeEventListener('showStudentAccessDialog', handleShowStudentDialog);
    };
  }, []);

  if (goals.length === 0) {
    return <Loader />;
  }

  return (
    <>
      {children}
      <StudentAccessDialog 
        open={showStudentDialog} 
        onClose={() => setShowStudentDialog(false)} 
      />
    </>
  );
};

export default memo(AppDataContainer);
